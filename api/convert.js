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
    
    // Since direct download from Vercel is blocked by YouTube,
    // return redirect URLs to working download services
    const downloadServices = {
      y2mate: `https://www.y2mate.com/youtube/${videoId}`,
      savefrom: `https://en.savefrom.net/1-youtube-video-downloader-${videoId}/`,
      ninexbuddy: `https://9xbuddy.org/process?url=https://www.youtube.com/watch?v=${videoId}`,
      dirpy: `https://dirpy.com/from/youtube?url=https://www.youtube.com/watch?v=${videoId}`,
      ytmp3: `https://ytmp3.cc/youtube-to-mp3/?url=https://www.youtube.com/watch?v=${videoId}`
    };
    
    // Return a JSON response with redirect information
    res.status(200).json({
      success: true,
      message: "Due to YouTube restrictions on cloud platforms, please use one of these services to download your video:",
      videoId: videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      services: [
        {
          name: "Y2Mate (Recommended)",
          url: downloadServices.y2mate,
          features: ["MP3", "MP4", "Multiple qualities"],
          direct: true
        },
        {
          name: "SaveFrom.net",
          url: downloadServices.savefrom,
          features: ["Fast downloads", "Browser extension available"],
          direct: true
        },
        {
          name: "Dirpy",
          url: downloadServices.dirpy,
          features: ["Audio cutting", "ID3 tag editing"],
          direct: true
        },
        {
          name: "YTMP3",
          url: downloadServices.ytmp3,
          features: ["Simple interface", "Quick conversion"],
          direct: true
        }
      ],
      requestedFormat: format,
      requestedQuality: quality
    });
    
  } catch (error) {
    console.error('Error in convert handler:', error);
    res.status(500).json({ 
      error: 'Service error',
      details: error.message,
      suggestion: 'Please try using one of the alternative download services'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};