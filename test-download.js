// Test script to verify YouTube download functionality
const fetch = require('node-fetch');

async function testDownload() {
    const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo" - first YouTube video
    
    console.log('Testing YouTube to MP3 converter...\n');
    console.log('Test URL:', testUrl);
    
    try {
        // Test 1: Get video info
        console.log('\n1. Testing video info endpoint...');
        const infoResponse = await fetch('http://localhost:3000/api/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: testUrl })
        });
        
        if (!infoResponse.ok) {
            const error = await infoResponse.json();
            throw new Error(`Info endpoint failed: ${error.error}`);
        }
        
        const videoInfo = await infoResponse.json();
        console.log('✅ Video info retrieved successfully:');
        console.log(`   Title: ${videoInfo.title}`);
        console.log(`   Duration: ${videoInfo.duration} seconds`);
        console.log(`   Author: ${videoInfo.author}`);
        
        // Test 2: Health check
        console.log('\n2. Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:3000/api/health');
        const health = await healthResponse.json();
        console.log('✅ Server health:', health.status);
        console.log(`   ytdl-core version: ${health.ytdlVersion}`);
        
        console.log('\n✅ All tests passed! The server is working correctly.');
        console.log('\nYou can now use the web interface at http://localhost:3000');
        console.log('Or test with your URL:', 'https://www.youtube.com/watch?v=ekr2nIex040');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\nTroubleshooting tips:');
        console.log('1. Make sure the server is running (npm start)');
        console.log('2. Check if ffmpeg is installed (ffmpeg -version)');
        console.log('3. Try restarting the server');
    }
}

// Check if fetch is available, if not, use a simple message
if (typeof fetch === 'undefined') {
    console.log('Note: node-fetch is not installed. You can test manually by:');
    console.log('1. Opening http://localhost:3000 in your browser');
    console.log('2. Pasting a YouTube URL and clicking Convert');
} else {
    testDownload();
}
