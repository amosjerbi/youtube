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

    console.log(`Convert request for: ${url}`);

    // Extract video ID
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      return res.status(400).json({ error: "Invalid YouTube URL format" });
    }
    
    const videoId = videoIdMatch[1];
    
    // For Vercel deployment, we'll return a client-side download instruction
    // since ytdl-core has issues in serverless environments
    
    // Option 1: Try using ytdl-core if it works
    try {
      const { default: ytdl } = await import("@distube/ytdl-core");
      const { default: ffmpegPath } = await import("ffmpeg-static");
      const { default: ffmpeg } = await import("fluent-ffmpeg");
      const { default: sanitize } = await import("sanitize-filename");
      
      ffmpeg.setFfmpegPath(ffmpegPath);
      
      if (!ytdl.validateURL(url)) {
        throw new Error("Invalid URL for ytdl");
      }
      
      const info = await ytdl.getInfo(url);
      const videoTitle = sanitize(info.videoDetails.title) || 'download';
      const filename = `${videoTitle}.${format}`;
      
      const bitrates = {
        '128': '128k',
        '192': '192k',
        '320': '320k'
      };
      const bitrate = bitrates[quality] || '192k';
      
      res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : format === 'm4a' ? 'audio/mp4' : 'audio/wav');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const stream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly'
      });
      
      const command = ffmpeg(stream)
        .audioBitrate(bitrate)
        .audioCodec(format === 'mp3' ? 'libmp3lame' : format === 'm4a' ? 'aac' : 'pcm_s16le')
        .format(format === 'wav' ? 'wav' : format);
      
      command.pipe(res, { end: true });
      
    } catch (error) {
      console.error('ytdl-core conversion failed:', error);
      
      // Option 2: Return instructions for client-side download
      // This is a fallback when server-side conversion fails
      res.status(200).json({
        success: false,
        message: "Server-side conversion is currently unavailable. Please try again later or use a desktop YouTube downloader.",
        videoId: videoId,
        alternatives: [
          {
            name: "y2mate.com",
            url: `https://www.y2mate.com/youtube/${videoId}`,
            description: "Online YouTube to MP3 converter"
          },
          {
            name: "yt-dlp",
            url: "https://github.com/yt-dlp/yt-dlp",
            description: "Command-line YouTube downloader"
          }
        ],
        error: error.message
      });
    }
    
  } catch (error) {
    console.error('Error in convert handler:', error);
    res.status(500).json({ 
      error: 'Conversion service temporarily unavailable',
      details: error.message,
      suggestion: 'Please try again later or use an alternative YouTube to MP3 service'
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb'
    }
  },
  maxDuration: 60
};