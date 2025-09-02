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

    console.log('Getting info for:', url);

    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      return res.status(400).json({ error: "Invalid YouTube URL format" });
    }
    
    const videoId = videoIdMatch[1];
    
    // Use YouTube oEmbed API as a fallback (doesn't require authentication)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedResponse = await fetch(oembedUrl);
      
      if (!oembedResponse.ok) {
        throw new Error('Failed to fetch from oEmbed API');
      }
      
      const oembedData = await oembedResponse.json();
      
      // Return basic info from oEmbed
      const videoDetails = {
        title: oembedData.title || 'Unknown Title',
        duration: 0, // oEmbed doesn't provide duration
        thumbnail: oembedData.thumbnail_url || '',
        author: oembedData.author_name || 'Unknown',
        videoId: videoId,
        description: '', // oEmbed doesn't provide description
        viewCount: 0 // oEmbed doesn't provide view count
      };
      
      console.log('Successfully got video info from oEmbed');
      return res.status(200).json(videoDetails);
      
    } catch (oembedError) {
      console.error('oEmbed API error:', oembedError);
      
      // If oEmbed fails, try ytdl-core
      try {
        const { default: ytdl } = await import("@distube/ytdl-core");
        
        if (!ytdl.validateURL(url)) {
          return res.status(400).json({ error: "Invalid YouTube URL" });
        }
        
        const info = await ytdl.getInfo(url);
        
        const videoDetails = {
          title: info.videoDetails.title,
          duration: info.videoDetails.lengthSeconds,
          thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || '',
          author: info.videoDetails.author?.name || 'Unknown',
          videoId: info.videoDetails.videoId,
          description: info.videoDetails.description?.substring(0, 200) || '',
          viewCount: info.videoDetails.viewCount || 0
        };
        
        console.log('Successfully got video info from ytdl-core');
        return res.status(200).json(videoDetails);
        
      } catch (ytdlError) {
        console.error('ytdl-core error:', ytdlError);
        
        // Return minimal info if all methods fail
        return res.status(200).json({
          title: `YouTube Video (${videoId})`,
          duration: 0,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          author: 'YouTube',
          videoId: videoId,
          description: '',
          viewCount: 0
        });
      }
    }

  } catch (error) {
    console.error('Error in info handler:', error);
    res.status(500).json({ 
      error: "Failed to fetch video information",
      details: error.message 
    });
  }
}