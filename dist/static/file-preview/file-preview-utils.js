/**
 * file-preview-utils.js
 * Pure utility methods: URL parsing, UI state management, basic loading tools, etc.
 */

// ============================================
// URL Parameter Parsing
// ============================================
function getQueryParams() {
    const params = {};
    const search = window.location.search.slice(1);
    if (!search) return params;

    search.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    });
    return params;
}

// Get file origin
function getBaseUrl(url) {
    try {
        if (!url) return window.location.origin;
        return new URL(url).origin;
    } catch (e) {
        return window.location.origin;
    }
}

// ============================================
// UI State Management
// ============================================
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        const textField = overlay.querySelector('.loading-text');
        if (textField) textField.textContent = 'Loading...';
    }
    const errorOverlay = document.getElementById('errorOverlay');
    if (errorOverlay) errorOverlay.classList.add('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

/**
 * Show error message
 * @param {string} message Error title
 * @param {string} downloadUrl Optional download URL for displaying the download button
 */
function showError(message, downloadUrl = '') {
    hideLoading();
    const icon = document.getElementById('errorIcon');
    if (icon) icon.textContent = '⚠️';
    const text = document.getElementById('errorText');
    if (text) text.textContent = message || 'Loading failed';
    const overlay = document.getElementById('errorOverlay');
    if (overlay) overlay.classList.remove('hidden');
    
    // If download URL exists, show download button
    const errorDownloadBtn = document.getElementById('errorDownloadBtn');
    if (downloadUrl && errorDownloadBtn) {
        errorDownloadBtn.classList.remove('hidden');
    } else if (errorDownloadBtn) {
        errorDownloadBtn.classList.add('hidden');
    }
}

function hideError() {
    const overlay = document.getElementById('errorOverlay');
    if (overlay) overlay.classList.add('hidden');
}

// ============================================
// Dynamic Script Loading
// ============================================
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(script);
    });
}

// ============================================
// Parent Communication
// ============================================
function notifyParent(data) {
    try {
        // For iframe
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(data, '*');
        }

        // For WeChat Mini Program WebView
        if (typeof wx !== 'undefined' && wx.miniProgram) {
            wx.miniProgram.postMessage({ data });
        }
    } catch (e) {
        console.warn('[FilePreview] Failed to notify parent:', e);
    }
}
