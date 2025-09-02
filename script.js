// API base URL - uses relative path for Vercel deployment
const API_BASE = "/api";

// Store current video info
let currentVideoInfo = null;
let isConverting = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    document.getElementById('urlInput')?.focus();
    testAPIConnection();
});

// Test API connection
async function testAPIConnection() {
    try {
        console.log('Testing API connection...');
        const response = await fetch(API_BASE + '/health');
        if (response.ok) {
            console.log('✅ API connection successful');
        } else {
            console.warn('⚠️ API returned status:', response.status);
        }
    } catch (error) {
        console.error('❌ API connection failed:', error);
        console.log('If you see ERR_BLOCKED_BY_CLIENT, please disable ad blockers for this site');
    }
}

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
        console.log('Fetching video info from:', API_BASE + "/info");
        const response = await fetch(API_BASE + "/info", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ url })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            try {
                const error = JSON.parse(errorText);
                throw new Error(error.error || 'Failed to get video info');
            } catch {
                throw new Error('Failed to get video info: ' + errorText);
            }
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting video info:', error);
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Unable to connect to server. Please check your connection or disable ad blockers.');
        }
        throw error;
    }
}

// Convert video to audio (now redirects to download services)
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

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in conversion:', error);
        throw error;
    }
}

// Handle the conversion process
async function handleConvert() {
    if (isConverting) {
        showToast('Processing...');
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
    convertBtn.innerHTML = 'Processing... <span class="spinner"></span>';
    convertBtn.disabled = true;

    try {
        // Show progress
        showProgress();
        updateProgress(25, 'Getting video information...');

        // Get video info
        currentVideoInfo = await getVideoInfo(url);
        updateProgress(50, 'Video info retrieved');

        // Get selected options
        const quality = document.querySelector('.option-btn[data-quality].active')?.dataset.quality || '192';
        const format = document.querySelector('.option-btn[data-format].active')?.dataset.format || 'mp3';

        // Get download services
        updateProgress(75, 'Preparing download options...');
        const downloadData = await convertVideo(url, quality, format);
        
        updateProgress(100, 'Ready!');

        // Show download options
        setTimeout(() => {
            hideProgress();
            showDownloadOptions(currentVideoInfo, downloadData);
        }, 500);

    } catch (error) {
        console.error('Error:', error);
        showToast('Error: ' + error.message);
        hideProgress();
    } finally {
        isConverting = false;
        convertBtn.innerHTML = originalBtnText;
        convertBtn.disabled = false;
    }
}

// Show download options with external services
function showDownloadOptions(videoInfo, downloadData) {
    const resultsGrid = document.getElementById('resultsGrid');
    if (!resultsGrid) return;

    const services = downloadData.services || [];
    
    resultsGrid.innerHTML = `
        <div class="result-card" style="max-width: 600px; margin: 0 auto;">
            <div class="result-thumbnail" style="background-image: url('${videoInfo.thumbnail || ''}'); background-size: cover; background-position: center; height: 200px;">
                <div class="format-badge">${downloadData.requestedFormat?.toUpperCase() || 'MP3'}</div>
            </div>
            <div class="result-info">
                <h4 class="result-title">${videoInfo.title || 'YouTube Video'}</h4>
                <p class="result-author" style="margin: 10px 0; color: #666;">By ${videoInfo.author || 'Unknown'}</p>
                
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin: 15px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        ⚠️ Due to YouTube restrictions on cloud platforms, direct download is not available. 
                        Please use one of these trusted services:
                    </p>
                </div>
                
                <div class="download-services" style="margin-top: 20px;">
                    ${services.map(service => `
                        <a href="${service.url}" target="_blank" rel="noopener noreferrer" 
                           style="display: block; margin: 10px 0; padding: 12px; background: #007bff; color: white; 
                                  text-decoration: none; border-radius: 8px; text-align: center; 
                                  transition: background 0.3s;"
                           onmouseover="this.style.background='#0056b3'" 
                           onmouseout="this.style.background='#007bff'">
                            <strong>${service.name}</strong>
                            ${service.features ? `<br><small style="opacity: 0.9;">${service.features.join(' • ')}</small>` : ''}
                        </a>
                    `).join('')}
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; font-size: 13px; margin: 0;">
                        💡 Tip: For best results, use Y2Mate or SaveFrom.net. They support multiple formats and qualities.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // Add to history
    addToHistory(videoInfo, downloadData.requestedQuality, downloadData.requestedFormat);
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
            <div class="history-meta">${format?.toUpperCase() || 'MP3'} • ${quality || '192'}kbps</div>
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