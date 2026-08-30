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

function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`link[href="${href}"]`)) {
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = () => reject(new Error(`Failed to load: ${href}`));
        document.head.appendChild(link);
    });
}

// ============================================
// Parent Communication
// ============================================
function notifyParent(data) {
    try {
        // For iframe（PC web / H5）：parent 直收
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(data, '*');
        }

        // For WeChat Mini Program WebView
        if (typeof wx !== 'undefined' && wx.miniProgram) {
            wx.miniProgram.postMessage({ data });
        }

        // For uni-app x / App 顶层 webview（window.parent===window）：经 uni.webView.postMessage
        // 桥接到 <web-view> @message（JSSDK 由 file-preview.html 无条件加载；未就绪时此分支安全跳过）。
        if (window.parent === window) {
            var post =
                window.uni && window.uni.webView && window.uni.webView.postMessage;
            // uni-app x Android 仅稳定支持对象 payload；原生 event.detail.data
            // 会自行包装为消息数组，这里不能再预先包一层数组。
            if (post) post({ data: data });
        }
    } catch (e) {
        console.warn('[FilePreview] Failed to notify parent:', e);
    }
}
