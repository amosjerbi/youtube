const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const sanitize = require('sanitize-filename');
const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 3000;

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
try {
    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
        console.log('Downloads directory created');
    }
} catch (err) {
    console.error('Error creating downloads directory:', err);
    // Use /tmp as fallback on Railway
    const tmpDir = '/tmp/downloads';
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }
}

// Clean up old files (older than 1 hour)
setInterval(() => {
    if (!fs.existsSync(downloadsDir)) return;
    
    const files = fs.readdirSync(downloadsDir);
    const now = Date.now();
    files.forEach(file => {
        const filePath = path.join(downloadsDir, file);
        try {
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > 3600000) { // 1 hour
                fs.unlinkSync(filePath);
                console.log(`Cleaned up old file: ${file}`);
            }
        } catch (err) {
            console.error(`Error cleaning up file ${file}:`, err.message);
        }
    });
}, 600000); // Check every 10 minutes

// Get video info endpoint
app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log('Getting info for:', url);

        // Try with ytdl-core first
        try {
            if (!ytdl.validateURL(url)) {
                throw new Error('Invalid YouTube URL');
            }

            const info = await ytdl.getInfo(url);
            const videoDetails = {
                title: info.videoDetails.title,
                duration: info.videoDetails.lengthSeconds,
                thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
                author: info.videoDetails.author.name,
                videoId: info.videoDetails.videoId
            };

            console.log('Successfully got video info with ytdl-core');
            res.json(videoDetails);
        } catch (ytdlError) {
            console.log('ytdl-core failed, trying youtube-dl-exec fallback...');
            
            // Fallback to youtube-dl-exec
            const info = await youtubedl(url, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                addHeader: ['referer:youtube.com', 'user-agent:googlebot']
            });

            const videoDetails = {
                title: info.title || 'Unknown Title',
                duration: info.duration || 0,
                thumbnail: info.thumbnail || '',
                author: info.uploader || 'Unknown',
                videoId: info.id || ''
            };

            console.log('Successfully got video info with youtube-dl-exec');
            res.json(videoDetails);
        }
    } catch (error) {
        console.error('Error getting video info:', error.message);
        res.status(500).json({ 
            error: 'Failed to get video information. Please check the URL and try again.',
            details: error.message 
        });
    }
});

// Convert and download endpoint
app.post('/api/convert', async (req, res) => {
    try {
        const { url, quality = '192', format = 'mp3' } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Converting: ${url} to ${format} at ${quality}kbps`);

        // Set bitrate based on quality
        const bitrates = {
            '128': '128k',
            '192': '192k',
            '320': '320k'
        };
        const bitrate = bitrates[quality] || '192k';

        let videoTitle = 'download';
        let outputPath;

        try {
            // Try ytdl-core first
            if (!ytdl.validateURL(url)) {
                throw new Error('Invalid URL for ytdl-core');
            }

            // Get video info for title
            const info = await ytdl.getInfo(url);
            videoTitle = sanitize(info.videoDetails.title) || 'download';
            const filename = `${videoTitle}.${format}`;
            outputPath = path.join(downloadsDir, filename);

            console.log('Downloading with ytdl-core...');
            
            // Download video with audio
            const stream = ytdl(url, {
                quality: 'highestaudio',
                filter: 'audioonly'
            });

            // Convert to desired format using ffmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(stream)
                    .audioBitrate(bitrate)
                    .audioCodec(format === 'mp3' ? 'libmp3lame' : format === 'm4a' ? 'aac' : 'pcm_s16le')
                    .format(format === 'wav' ? 'wav' : format)
                    .on('end', resolve)
                    .on('error', reject)
                    .save(outputPath);
            });

            console.log('Conversion complete with ytdl-core');

        } catch (ytdlError) {
            console.log('ytdl-core failed, using youtube-dl-exec fallback...');
            
            // Fallback to youtube-dl-exec
            const info = await youtubedl(url, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true
            });

            videoTitle = sanitize(info.title) || 'download';
            const filename = `${videoTitle}.${format}`;
            outputPath = path.join(downloadsDir, filename);

            // Download with youtube-dl-exec
            await youtubedl(url, {
                extractAudio: true,
                audioFormat: format,
                audioQuality: quality === '320' ? 0 : quality === '192' ? 5 : 9,
                output: outputPath,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                ffmpegLocation: ffmpegPath
            });

            console.log('Download complete with youtube-dl-exec');
        }

        // Check if file exists
        if (!fs.existsSync(outputPath)) {
            throw new Error('Conversion failed - output file not created');
        }

        // Send file to client
        res.download(outputPath, `${videoTitle}.${format}`, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to send file' });
                }
            }
            
            // Clean up file after download
            setTimeout(() => {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                    console.log(`Cleaned up: ${outputPath}`);
                }
            }, 60000); // Delete after 1 minute
        });

    } catch (error) {
        console.error('Error converting video:', error);
        res.status(500).json({ 
            error: 'Failed to convert video. Please try again.',
            details: error.message 
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        ytdlVersion: require('@distube/ytdl-core/package.json').version
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

app.listen(PORT, () => {
    const url = process.env.RAILWAY_STATIC_URL || `http://localhost:${PORT}`;
    console.log(`\n✅ Server running on ${url}`);
    console.log('\n📦 Using @distube/ytdl-core with youtube-dl-exec fallback');
    if (!process.env.RAILWAY_STATIC_URL) {
        console.log('\n⚠️  Make sure ffmpeg is installed on your system:');
        console.log('  macOS: brew install ffmpeg');
        console.log('  Ubuntu: sudo apt install ffmpeg');
        console.log('  Windows: Download from https://ffmpeg.org/download.html\n');
    }
});