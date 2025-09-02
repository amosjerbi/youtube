exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { url, quality = '192', format = 'mp3' } = JSON.parse(event.body || '{}');
    
    if (!url) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "URL is required" })
      };
    }

    console.log(`Convert request for: ${url}`);

    // Extract video ID
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Invalid YouTube URL format" })
      };
    }
    
    const videoId = videoIdMatch[1];
    
    // Return download service links (since direct download is blocked on cloud platforms)
    const downloadServices = {
      y2mate: `https://www.y2mate.com/youtube/${videoId}`,
      savefrom: `https://en.savefrom.net/1-youtube-video-downloader-${videoId}/`,
      ninexbuddy: `https://9xbuddy.org/process?url=https://www.youtube.com/watch?v=${videoId}`,
      dirpy: `https://dirpy.com/from/youtube?url=https://www.youtube.com/watch?v=${videoId}`,
      ytmp3: `https://ytmp3.cc/youtube-to-mp3/?url=https://www.youtube.com/watch?v=${videoId}`
    };
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
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
      })
    };
    
  } catch (error) {
    console.error('Error in convert handler:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: 'Service error',
        details: error.message,
        suggestion: 'Please try using one of the alternative download services'
      })
    };
  }
};
