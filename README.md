# YouTube to MP3 Converter

A clean, modern web application for downloading YouTube videos as MP3 audio files with multiple quality options.

## Features

- 🎵 Convert YouTube videos to MP3, M4A, or WAV format
- 🎚️ Multiple quality options (128, 192, 320 kbps)
- 📊 Real-time conversion progress
- 🖼️ Video thumbnail preview
- 📱 Responsive design
- 🚀 Fast conversion using ffmpeg

## Prerequisites

Before running this application, you need to have the following installed:

1. **Node.js** (v14 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **FFmpeg** (required for audio conversion)
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt update && sudo apt install ffmpeg`
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Installation

1. Clone or download this project to your local machine

2. Navigate to the project directory:
   ```bash
   cd /Users/amosjerbi/Desktop/Youtube
   ```

3. Install the required dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

2. The server will start on `http://localhost:3000`

3. Open your browser and navigate to `http://localhost:3000`

4. Paste a YouTube URL and click "Convert to MP3"

## How to Use

1. **Paste URL**: Copy any YouTube video URL and paste it in the input field
2. **Select Quality**: Choose your preferred audio quality (128, 192, or 320 kbps)
3. **Select Format**: Choose between MP3, M4A, or WAV format
4. **Convert**: Click the "Convert to MP3" button
5. **Download**: The file will automatically download once conversion is complete

## Supported URL Formats

- Standard: `https://www.youtube.com/watch?v=VIDEO_ID`
- With playlist: `https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID`
- Short URL: `https://youtu.be/VIDEO_ID`
- Embed URL: `https://www.youtube.com/embed/VIDEO_ID`

## Project Structure

```
Youtube/
├── index.html          # Frontend interface
├── styles.css          # Styling
├── server.js           # Backend server
├── package.json        # Node.js dependencies
├── downloads/          # Temporary download directory (auto-created)
└── README.md          # This file
```

## API Endpoints

- `POST /api/info` - Get video information
- `POST /api/convert` - Convert and download video
- `GET /api/health` - Server health check

## Security Notes

- Files are automatically deleted after 1 hour
- No user data is stored
- For personal use only
- Please respect YouTube's Terms of Service and copyright laws

## Troubleshooting

### Server won't start
- Make sure port 3000 is not in use
- Check if all dependencies are installed: `npm install`

### FFmpeg errors
- Ensure ffmpeg is installed: `ffmpeg -version`
- On macOS, install with Homebrew: `brew install ffmpeg`

### Download fails
- Check your internet connection
- Verify the YouTube URL is valid
- Some videos may be restricted or private

## License

MIT - For personal use only. Please respect copyright laws.

## Disclaimer

This tool is for personal use only. Users are responsible for ensuring they have the right to download and convert content. Please respect YouTube's Terms of Service and copyright laws.
# Trigger Vercel Deploy - Tue Sep  2 22:14:04 IDT 2025
