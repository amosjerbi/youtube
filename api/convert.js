import ytdl from "@distube/ytdl-core";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import sanitize from "sanitize-filename";

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb'
    }
  },
  maxDuration: 60
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, quality = '192', format = 'mp3' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`Converting: ${url} to ${format} at ${quality}kbps`);

    // Validate URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // Get video info for filename
    const info = await ytdl.getInfo(url);
    const videoTitle = sanitize(info.videoDetails.title) || 'download';
    const filename = `${videoTitle}.${format}`;

    // Set bitrate based on quality
    const bitrates = {
      '128': '128k',
      '192': '192k', 
      '320': '320k'
    };
    const bitrate = bitrates[quality] || '192k';

    // Set response headers for download
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : format === 'm4a' ? 'audio/mp4' : 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Create download stream
    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    // Handle stream errors
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download video' });
      }
    });

    // Convert and pipe to response
    const command = ffmpeg(stream)
      .audioBitrate(bitrate)
      .audioCodec(format === 'mp3' ? 'libmp3lame' : format === 'm4a' ? 'aac' : 'pcm_s16le')
      .format(format === 'wav' ? 'wav' : format)
      .on('error', (error) => {
        console.error('FFmpeg error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Conversion failed' });
        }
      })
      .on('end', () => {
        console.log('Conversion completed successfully');
      });

    // Pipe the output directly to the response
    command.pipe(res, { end: true });

  } catch (error) {
    console.error('Error in convert handler:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to convert video',
        details: error.message 
      });
    }
  }
}