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
    const { url } = JSON.parse(event.body || '{}');
    
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

    console.log('Processing URL:', url);

    // Extract video ID from URL
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
    
    // Use YouTube oEmbed API to get basic info
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const fetch = (await import('node-fetch')).default;
      const oembedResponse = await fetch(oembedUrl);
      
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: oembedData.title || 'YouTube Video',
            duration: 0,
            thumbnail: oembedData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            author: oembedData.author_name || 'Unknown',
            videoId: videoId,
            description: '',
            viewCount: 0,
            downloadServices: [
              {
                name: "Y2Mate",
                url: `https://www.y2mate.com/youtube/${videoId}`,
                description: "Popular online converter"
              },
              {
                name: "SaveFrom.net",
                url: `https://en.savefrom.net/1-youtube-video-downloader-${videoId}/`,
                description: "Fast downloads"
              }
            ]
          })
        };
      }
    } catch (oembedError) {
      console.error('oEmbed error:', oembedError);
    }
    
    // Fallback response
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: `YouTube Video`,
        duration: 0,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        author: 'YouTube',
        videoId: videoId,
        description: '',
        viewCount: 0,
        downloadServices: [
          {
            name: "Y2Mate",
            url: `https://www.y2mate.com/youtube/${videoId}`,
            description: "Popular online converter"
          },
          {
            name: "SaveFrom.net",
            url: `https://en.savefrom.net/1-youtube-video-downloader-${videoId}/`,
            description: "Fast downloads"
          }
        ]
      })
    };

  } catch (error) {
    console.error('Error in info handler:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Failed to process video",
        details: error.message
      })
    };
  }
};
