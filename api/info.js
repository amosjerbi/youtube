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
    // Try to load ytdl-core
    let ytdl;
    try {
      ytdl = require("@distube/ytdl-core");
    } catch (loadError) {
      console.error("Failed to load ytdl-core:", loadError);
      return res.status(500).json({ 
        error: "Server configuration error",
        details: "Failed to load video processing library",
        errorMessage: loadError.message
      });
    }

    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log('Getting info for:', url);

    // Validate URL
    try {
      if (!ytdl.validateURL(url)) {
        return res.status(400).json({ error: "Invalid YouTube URL. Please provide a valid YouTube video URL." });
      }
    } catch (validateError) {
      console.error("URL validation error:", validateError);
      return res.status(400).json({ 
        error: "Could not validate URL",
        details: validateError.message
      });
    }

    // Get video info
    let info;
    try {
      info = await ytdl.getInfo(url);
    } catch (infoError) {
      console.error("Failed to get video info:", infoError);
      
      // Handle specific error types
      if (infoError.message?.includes('private')) {
        return res.status(403).json({ 
          error: "This video is private and cannot be accessed." 
        });
      }
      
      if (infoError.message?.includes('age')) {
        return res.status(403).json({ 
          error: "This video is age-restricted and cannot be accessed." 
        });
      }
      
      if (infoError.statusCode === 410) {
        return res.status(410).json({ 
          error: "This video is no longer available." 
        });
      }

      return res.status(500).json({ 
        error: "Failed to fetch video information",
        details: infoError.message,
        stack: process.env.NODE_ENV === 'development' ? infoError.stack : undefined
      });
    }
    
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
    console.error('Unexpected error in info handler:', error);
    res.status(500).json({ 
      error: "An unexpected error occurred",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};