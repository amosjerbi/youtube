// API base URL - uses relative path for Vercel deployment
const API_BASE = "/api";

// Store current video info
let currentVideoInfo = null;
let isConverting = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    document.getElementById('urlInput')?.focus();
});

// Setup all event listeners
function setupEventListeners() {
    // Convert button
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
        convertBtn.addEventListener('click', handleConvert);
    }

    // URL input enter key
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleConvert();
            }
        });
    }

    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            document.getElementById('urlInput').value = '';
            currentVideoInfo = null;
            hideProgress();
        });
    }

    // Paste button
    const pasteBtn = document.getElementById('pasteBtn');
    if (pasteBtn) {
        pasteBtn.addEventListener('click', async function() {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('urlInput').value = text;
                showToast('URL pasted from clipboard');
            } catch (err) {
                showToast('Failed to read clipboard');
            }
        });
    }

    // Quality and Format buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.parentElement;
            group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Get video info from YouTube URL
async function getVideoInfo(url) {
    try {
        const response = await fetch(API_BASE + "/info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get video info');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting video info:', error);
        throw error;
    }
}

// Convert video to audio
async function convertVideo(url, quality, format) {
    try {
        const response = await fetch(API_BASE + "/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, quality, format })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Conversion failed');
        }

        // Check if response is JSON (fallback) or blob (successful conversion)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (!data.success) {
                // Show alternative options
                throw new Error(data.message || 'Conversion service unavailable');
            }
        }

        return await response.blob();
    } catch (error) {
        console.error('Error converting video:', error);
        throw error;
    }
}

// Handle the conversion process
async function handleConvert() {
    if (isConverting) {
        showToast('Conversion already in progress...');
        return;
    }

    const url = document.getElementById('urlInput').value.trim();
    if (!url) {
        showToast('Please enter a YouTube URL');
        return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(&[\w=]*)?/;
    if (!youtubeRegex.test(url)) {
        showToast('Please enter a valid YouTube URL');
        return;
    }

    isConverting = true;
    const convertBtn = document.getElementById('convertBtn');
    const originalBtnText = convertBtn.innerHTML;
    convertBtn.innerHTML = 'Converting... <span class="spinner"></span>';
    convertBtn.disabled = true;

    try {
        // Show progress
        showProgress();
        updateProgress(10, 'Fetching video information...');

        // Get video info
        currentVideoInfo = await getVideoInfo(url);
        updateProgress(30, 'Video info retrieved');

        // Get selected options
        const quality = document.querySelector('.option-btn[data-quality].active')?.dataset.quality || '192';
        const format = document.querySelector('.option-btn[data-format].active')?.dataset.format || 'mp3';

        // Convert video
        updateProgress(50, `Converting to ${format.toUpperCase()} at ${quality}kbps...`);
        const blob = await convertVideo(url, quality, format);
        updateProgress(90, 'Conversion complete');

        // Download the file
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${sanitizeFilename(currentVideoInfo.title || 'download')}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        updateProgress(100, 'Download started!');
        showToast('Download completed successfully!');

        // Show results
        setTimeout(() => {
            hideProgress();
            showResults(currentVideoInfo, quality, format);
        }, 1000);

    } catch (error) {
        console.error('Conversion error:', error);
        showToast('Error: ' + error.message);
        hideProgress();
    } finally {
        isConverting = false;
        convertBtn.innerHTML = originalBtnText;
        convertBtn.disabled = false;
    }
}

// Show progress section
function showProgress() {
    const progressSection = document.getElementById('progressSection');
    if (progressSection) {
        progressSection.style.display = 'block';
    }
}

// Hide progress section
function hideProgress() {
    const progressSection = document.getElementById('progressSection');
    if (progressSection) {
        progressSection.style.display = 'none';
    }
    updateProgress(0, '');
}

// Update progress bar
function updateProgress(percentage, message) {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.querySelector('.progress-percentage');
    const progressHeader = document.querySelector('.progress-header h3');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    if (progressPercentage) {
        progressPercentage.textContent = percentage + '%';
    }
    if (progressHeader && message) {
        progressHeader.textContent = message;
    }
}

// Show results after conversion
function showResults(videoInfo, quality, format) {
    const resultsGrid = document.getElementById('resultsGrid');
    if (!resultsGrid || !videoInfo) return;

    // Calculate file size estimate
    const duration = parseInt(videoInfo.duration) || 0;
    const bitrates = { '128': 128, '192': 192, '320': 320 };
    const sizeInMB = (bitrates[quality] * duration) / (8 * 1024);
    const fileSize = sizeInMB.toFixed(1) + ' MB';

    // Format duration
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    resultsGrid.innerHTML = `
        <div class="result-card">
            <div class="result-thumbnail" style="background-image: url('${videoInfo.thumbnail || ''}'); background-size: cover; background-position: center;">
                <div class="format-badge">${format.toUpperCase()}</div>
                <div class="play-overlay">▶</div>
            </div>
            <div class="result-info">
                <h4 class="result-title">${videoInfo.title || 'YouTube Video'}</h4>
                <div class="result-meta">
                    <span class="meta-item">${formattedDuration}</span>
                    <span class="meta-item">${quality} kbps</span>
                    <span class="meta-item">${fileSize}</span>
                </div>
                <div class="result-author">${videoInfo.author || 'Unknown Author'}</div>
                <div class="result-actions">
                    <button class="download-btn" onclick="handleRedownload()">Download Again</button>
                    <button class="preview-btn" onclick="window.open('https://youtube.com/watch?v=${videoInfo.videoId || ''}', '_blank')">Watch on YouTube</button>
                </div>
            </div>
        </div>
    `;

    // Add to history
    addToHistory(videoInfo, quality, format);
}

// Handle re-download
async function handleRedownload() {
    if (!currentVideoInfo) {
        showToast('Please convert a video first');
        return;
    }
    
    const url = document.getElementById('urlInput').value;
    if (!url) {
        showToast('URL not found');
        return;
    }
    
    await handleConvert();
}

// Add to conversion history
function addToHistory(videoInfo, quality, format) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div class="history-thumbnail" style="background-image: url('${videoInfo.thumbnail || ''}')"></div>
        <div class="history-info">
            <div class="history-title">${videoInfo.title || 'Unknown'}</div>
            <div class="history-meta">${format.toUpperCase()} • ${quality}kbps</div>
        </div>
        <div class="history-time">${new Date().toLocaleTimeString()}</div>
    `;

    // Add to beginning of list
    if (historyList.firstChild) {
        historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
        historyList.appendChild(historyItem);
    }

    // Keep only last 10 items
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

// Sanitize filename
function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9\s\-\_]/gi, '').trim();
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        // Create toast if it doesn't exist
        const toastDiv = document.createElement('div');
        toastDiv.id = 'toast';
        toastDiv.className = 'toast';
        toastDiv.innerHTML = '<span class="toast-message"></span>';
        document.body.appendChild(toastDiv);
    }
    
    const toastElement = document.getElementById('toast');
    const toastMessage = toastElement.querySelector('.toast-message');
    toastMessage.textContent = message;
    toastElement.classList.add('show');
    
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}