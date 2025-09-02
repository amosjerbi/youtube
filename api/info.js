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
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log('Processing URL:', url);

    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      return res.status(400).json({ error: "Invalid YouTube URL format" });
    }
    
    const videoId = videoIdMatch[1];
    
    // Use YouTube oEmbed API to get basic info (doesn't require authentication)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedResponse = await fetch(oembedUrl);
      
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        
        // Return video info with download service links
        const videoDetails = {
          title: oembedData.title || 'YouTube Video',
          duration: 0,
          thumbnail: oembedData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          author: oembedData.author_name || 'Unknown',
          videoId: videoId,
          description: '',
          viewCount: 0,
          // Add download service URLs
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
            },
            {
              name: "9xbuddy",
              url: `https://9xbuddy.org/process?url=https://www.youtube.com/watch?v=${videoId}`,
              description: "Multiple format options"
            }
          ]
        };
        
        console.log('Successfully processed video info');
        return res.status(200).json(videoDetails);
      }
    } catch (oembedError) {
      console.error('oEmbed error:', oembedError);
    }
    
    // Fallback: Return basic info even if oEmbed fails
    return res.status(200).json({
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
    });

  } catch (error) {
    console.error('Error in info handler:', error);
    res.status(500).json({ 
      error: "Failed to process video",
      details: error.message 
    });
  }
}