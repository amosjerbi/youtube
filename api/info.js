const ytdl = require("@distube/ytdl-core");

module.exports = async function handler(req, res) {
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
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log('Getting info for:', url);

    // Validate URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL. Please provide a valid YouTube video URL." });
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    
    // Extract relevant details
    const videoDetails = {
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || '',
      author: info.videoDetails.author?.name || 'Unknown',
      videoId: info.videoDetails.videoId,
      description: info.videoDetails.description?.substring(0, 200) || '',
      viewCount: info.videoDetails.viewCount || 0
    };

    console.log('Successfully got video info');
    res.status(200).json(videoDetails);

  } catch (error) {
    console.error('Error getting video info:', error);
    
    // Handle specific error types
    if (error.message?.includes('private')) {
      return res.status(403).json({ 
        error: "This video is private and cannot be accessed." 
      });
    }
    
    if (error.message?.includes('age')) {
      return res.status(403).json({ 
        error: "This video is age-restricted and cannot be accessed." 
      });
    }
    
    if (error.statusCode === 410) {
      return res.status(410).json({ 
        error: "This video is no longer available." 
      });
    }

    // Generic error response
    res.status(500).json({ 
      error: "Failed to fetch video information. Please check the URL and try again.",
      details: error.message 
    });
  }
};