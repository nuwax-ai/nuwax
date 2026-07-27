/**
 * file-preview.js
 * Main business logic: file rendering engine, main process control, download logic
 */

// ============================================
// Global State
// ============================================
let currentPreviewer = null;
let fileUrl = '';
let fileType = '';
let originalFileType = ''; // Record original file extension for precise notification
let downloadUrl = ''; // Download API URL
let fileName = ''; // File name
const SHARE_EXPIRED_MESSAGE =
    'The sharing link has expired, please regenerate it';
const params = getQueryParams();

// Local debugging for development environment (do not delete)!!
// const baseUrl = getBaseUrl('https://testagent.xspaceagi.com');

// Dynamically get URL for production environment!!
const baseUrl = getBaseUrl(params.fileUrl);

// ============================================
// Preview Renderers (using local libraries)
// ============================================
async function renderDocx(url, container) {
    await loadScript('/libs/js-preview/docx.umd.js');

    if (typeof jsPreviewDocx === 'undefined') {
        throw new Error('Failed to load DOCX preview library');
    }

    currentPreviewer = jsPreviewDocx.init(container);
    try {
        await currentPreviewer.preview(url);
    } catch (error) {
        console.error('[FilePreview] Docx core error:', error);
        throw new Error(`Unable to preview this file type. Previewing [${originalFileType}] format is currently not supported.`);
    }
}

async function renderXlsx(url, container) {
    await loadScript('/libs/js-preview/excel.umd.js');

    if (typeof jsPreviewExcel === 'undefined') {
        throw new Error('Failed to load Excel preview library');
    }

    currentPreviewer = jsPreviewExcel.init(container);
    await currentPreviewer.preview(url);
}

async function renderPdf(url, container) {
    await loadScript('/libs/js-preview/pdf.umd.js');

    if (typeof jsPreviewPdf === 'undefined') {
        throw new Error('Failed to load PDF preview library');
    }

    // Use device pixel ratio to improve PDF rendering clarity
    const scale = window.devicePixelRatio || 2;
    currentPreviewer = jsPreviewPdf.init(container, {
        width: container.clientWidth * scale,
        height: container.clientHeight * scale,
    });
    await currentPreviewer.preview(url);
}

async function renderPptx(url, container) {
    await loadScript('/libs/js-preview/pptx-preview.umd.js');

    if (typeof PptxPreview === 'undefined' && typeof pptxPreview === 'undefined') {
        throw new Error('Failed to load PPTX preview library');
    }

    const PptxLib = typeof PptxPreview !== 'undefined' ? PptxPreview : pptxPreview;
    currentPreviewer = PptxLib.init(container, {
        width: container.clientWidth || 800,
        height: container.clientHeight || 600
    });

    // Fetch file as ArrayBuffer
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`File download failed: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    await currentPreviewer.preview(arrayBuffer);
}

// ============================================
// HTML Preview (render as webpage)
// ============================================
async function renderHtml(url, container) {
    container.className = 'preview-container html-preview';

    // Try to fetch HTML content to extract the title
    try {
        const response = await fetch(url);
        if (response.ok) {
            const html = await response.text();
            const titleMatch = html.match(/<title>(.*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
                document.title = titleMatch[1].trim();
            }
        }
    } catch (e) {
        console.warn('Fetch HTML title failed:', e);
    }

    const iframe = document.createElement('iframe');
    iframe.className = 'html-preview-iframe';
    iframe.src = url;

    // Handle iframe load error
    iframe.onerror = () => {
        throw new Error('Failed to load HTML page');
    };

    container.appendChild(iframe);
}

// ============================================
// OpenUI Preview（分享/独立预览：加载固化 Runtime）
// ============================================
const OPENUI_RUNTIME_PROTOCOL = 'nuwax.openui-runtime/v1';
const OPENUI_RUNTIME_PATH = '/static/openui-runtime/index.html';
const OPENUI_FILE_NAME_PATTERN = /\.openui\.json$/i;
const OPENUI_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;

/**
 * 分享过期：销毁预览并展示友好错误（隐藏下载）
 * 不再使用倒计时定时器；改为在拉取返回过期/失败时由调用方触发。
 */
function handleShareExpired() {
    if (currentPreviewer && typeof currentPreviewer.destroy === 'function') {
        try {
            currentPreviewer.destroy();
        } catch (e) { /* ignore */ }
        currentPreviewer = null;
    }

    const container = document.getElementById('previewContainer');
    if (container) {
        container.innerHTML = '';
    }

    const previewDownloadBtn = document.getElementById('previewDownloadBtn');
    if (previewDownloadBtn) {
        previewDownloadBtn.classList.add('hidden');
    }

    // 过期后重试无意义：隐藏 Retry，仅展示说明
    const retryBtn = document.querySelector('.retry-action-btn');
    if (retryBtn) {
        retryBtn.classList.add('hidden');
    }

    showError(SHARE_EXPIRED_MESSAGE);
}

/**
 * 判断文件名是否为 OpenUI 产物（复合后缀 .openui.json）
 * @param {string} name
 * @returns {boolean}
 */
function isOpenUiFileName(name) {
    const fileName = String(name || '').split(/[\\/]/).pop() || '';
    return OPENUI_FILE_NAME_PATTERN.test(fileName);
}

/**
 * 从纯路径解析预览类型；优先识别 .openui.json，避免被拆成 json
 * @param {string} purePath
 * @returns {string}
 */
function resolvePreviewFileType(purePath) {
    const fileName = String(purePath || '').split(/[\\/]/).pop() || '';
    if (isOpenUiFileName(fileName)) {
        return 'openui';
    }
    return (fileName.split('.').pop() || '').toLowerCase();
}

/**
 * 计算 SHA-256 摘要（格式与 Host 侧一致：sha256:<hex>）
 * @param {string} value
 * @returns {Promise<string>}
 */
async function sha256Digest(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, '0'),
    ).join('');
    return `sha256:${hex}`;
}

/**
 * 校验 OpenUI 文件契约（分享页严格拦截损坏/篡改内容）
 * @param {unknown} artifact
 * @returns {Promise<object>}
 */
async function validateOpenUiArtifact(artifact) {
    if (!artifact || typeof artifact !== 'object') {
        throw new Error('OpenUI artifact is empty or invalid.');
    }
    const file = /** @type {Record<string, any>} */ (artifact);
    if (file.type !== 'nuwax.openui-file' || file.schemaVersion !== 'nuwax.openui-file/v1') {
        throw new Error('Unsupported OpenUI artifact schema.');
    }
    if (typeof file.artifactId !== 'string' || !file.artifactId) {
        throw new Error('OpenUI artifactId is missing.');
    }
    if (!file.document || typeof file.document.source !== 'string') {
        throw new Error('OpenUI document.source is missing.');
    }
    if (
        typeof file.document.digest !== 'string' ||
        !OPENUI_DIGEST_PATTERN.test(file.document.digest)
    ) {
        throw new Error('OpenUI document.digest is missing or invalid.');
    }
    const actualDigest = await sha256Digest(file.document.source);
    if (actualDigest !== file.document.digest) {
        throw new Error('OpenUI artifact digest verification failed.');
    }
    return file;
}

/**
 * 将 .openui.json 渲染为 OpenUI Runtime 页面（iframe + postMessage）
 * 分享场景无会话连接：表单 onAction 一律回失败，禁止提交回原会话
 * @param {string} url Artifact 文件 URL（可带 sk）
 * @param {HTMLElement} container
 */
async function renderOpenUi(url, container) {
    container.className = 'preview-container html-preview';

    const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) {
        // 分享链接/静态访问凭据(static_sk)失效：按“已过期”处理，展示友好提示。
        // 不再使用倒计时定时器，改为依据拉取返回判断。
        handleShareExpired();
        return;
    }

    let parsed;
    try {
        parsed = await response.json();
    } catch (error) {
        throw new Error('OpenUI artifact is not valid JSON.');
    }

    const artifact = await validateOpenUiArtifact(parsed);
    if (typeof artifact.title === 'string' && artifact.title.trim()) {
        document.title = artifact.title.trim();
    }

    const nonce = crypto.randomUUID();
    const iframe = document.createElement('iframe');
    iframe.className = 'html-preview-iframe';
    iframe.title = artifact.title || 'OpenUI';
    iframe.referrerPolicy = 'no-referrer';
    // 与会话内 OpenUI iframe 一致：ES module 需要同源，故启用 allow-same-origin
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.src = `${OPENUI_RUNTIME_PATH}?nonce=${encodeURIComponent(nonce)}`;

    const sendLoad = () => {
        if (!iframe.contentWindow) return;
        iframe.contentWindow.postMessage(
            {
                type: 'OPENUI_LOAD',
                protocolVersion: OPENUI_RUNTIME_PROTOCOL,
                nonce,
                artifact,
                locale: document.documentElement.lang || navigator.language,
                theme: 'light',
                viewport: window.matchMedia('(max-width: 767px)').matches
                    ? 'mobile'
                    : 'desktop',
            },
            '*',
        );
    };

    const handleMessage = (message) => {
        if (message.source !== iframe.contentWindow) return;
        const data = message.data;
        if (
            !data ||
            data.protocolVersion !== OPENUI_RUNTIME_PROTOCOL ||
            data.nonce !== nonce
        ) {
            return;
        }

        if (data.type === 'OPENUI_READY') {
            sendLoad();
            return;
        }

        // 分享页只读：无会话 sender，表单提交一律拒绝
        if (data.type === 'OPENUI_ACTION') {
            const actionId =
                data.event && typeof data.event.actionId === 'string'
                    ? data.event.actionId
                    : '';
            iframe.contentWindow?.postMessage(
                {
                    type: 'OPENUI_ACTION_RESULT',
                    protocolVersion: OPENUI_RUNTIME_PROTOCOL,
                    nonce,
                    actionId,
                    success: false,
                    message: 'Share preview is read-only and cannot submit forms.',
                },
                '*',
            );
        }
    };

    window.addEventListener('message', handleMessage);
    currentPreviewer = {
        destroy() {
            window.removeEventListener('message', handleMessage);
        },
    };

    iframe.onerror = () => {
        window.removeEventListener('message', handleMessage);
        throw new Error('Failed to load OpenUI runtime.');
    };

    container.appendChild(iframe);
    // iframe onload 时再补发一次，避免 READY 早于监听注册的竞态
    iframe.addEventListener('load', sendLoad);
}

// ============================================
// Image Preview
// ============================================
async function renderImage(url, container) {
    container.className = 'preview-container image-preview';

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Image Preview';

    // Handle image load error
    img.onerror = () => {
        throw new Error('Failed to load image');
    };

    container.appendChild(img);
}

// ============================================
// Video Preview
// ============================================
async function renderVideo(url, container) {
    container.className = 'preview-container video-preview';
    // Set container styles for vertical and horizontal centering
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.overflow = 'hidden'; 
    container.style.padding = '0px';
    container.style.background = '#000'; // 黑色背景

    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.autoplay = false;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '100%';
    video.style.objectFit = 'contain';
    video.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.1)'; 

    // Handle video load error
    video.onerror = () => {
        throw new Error('Failed to load video');
    };

    container.appendChild(video);
}

// ============================================
// Audio Preview
// ============================================
async function renderAudio(url, container) {
    container.className = 'preview-container audio-preview';
    // 设置容器样式以实现垂直和水平居中
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.overflow = 'hidden';
    container.style.padding = '0px';
    container.style.background = '#f5f5f5'; // Light gray background

    const audio = document.createElement('audio');
    audio.src = url;
    audio.controls = true;
    audio.autoplay = false;
    audio.style.width = '100%';
    audio.style.maxWidth = '600px';
    audio.style.outline = 'none';

    // Handle audio load error
    audio.onerror = () => {
        throw new Error('Failed to load audio');
    };

    container.appendChild(audio);
}

// ============================================
// Text/Code Preview with Syntax Highlighting
// ============================================
async function renderText(url, container, language = '') {
    // Load highlight.js for syntax highlighting (Local)
    await loadScript('/libs/js-preview/highlight.min.js');

    // Fetch file content
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`文件下载失败: ${response.status}`);
    }
    const text = await response.text();

    container.className = 'preview-container text-preview';

    const pre = document.createElement('pre');
    const code = document.createElement('code');

    // Set language class for syntax highlighting
    if (language) {
        code.className = `language-${language}`;
    }

    code.textContent = text;
    pre.appendChild(code);
    container.appendChild(pre);

    // Apply syntax highlighting if hljs is available
    if (typeof hljs !== 'undefined') {
        hljs.highlightElement(code);
    }
}

// ============================================
// Markdown Preview
// ============================================
async function renderMarkdown(url, container) {
    // Load marked.js for markdown rendering (Local)
    await loadScript('/libs/js-preview/marked.min.js');
    // Load highlight.js for code block syntax highlighting (Local)
    await loadScript('/libs/js-preview/highlight.min.js');

    if (typeof marked === 'undefined') {
        throw new Error('Failed to load Markdown preview library');
    }

    // Fetch markdown content
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`文件下载失败: ${response.status}`);
    }
    const markdown = await response.text();

    // Configure marked to use highlight.js
    if (typeof hljs !== 'undefined') {
        const { marked: markedInstance } = window;
        const targetMarked = typeof marked !== 'undefined' ? marked : markedInstance;
        
        targetMarked.setOptions({
            highlight: function (code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (e) {
                        console.error('Highlight error:', e);
                    }
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });
    }

    // Render markdown to HTML
    const html = marked.parse(markdown);

    container.className = 'preview-container markdown-preview';
    const markdownBody = document.createElement('div');
    markdownBody.className = 'markdown-body';
    markdownBody.innerHTML = html;
    container.appendChild(markdownBody);
}


// ============================================
// Main Preview Function
// ============================================
async function startPreview() {
    const sk = params.sk || '';
    // 1. If sk parameter exists, it's a sharing operation
    if (sk) {
        const response = await fetch(`${baseUrl}/api/agent/conversation/share/detail/${sk}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const { data, code, message } = await response.json();
        if (code === '0000') {
            fileUrl = baseUrl + data.content + '?sk=' + sk;
            // Extract file name from path, excluding query parameters
            const purePath = data.content.split('?')[0];
            fileName = purePath.split('/').pop();
            // 优先识别 .openui.json，避免被拆成普通 json
            fileType = resolvePreviewFileType(purePath);
            // Set download URL
            downloadUrl = baseUrl + data.content + '?sk=' + sk;
            
        } else {
            showError(message);
            return;
        }
    } 
    
    // 2. If _ticket parameter exists, it's a normal preview operation
    if(params._ticket){
        // Normal preview operation: get file URL and type
        fileUrl = params.fileUrl + "?_ticket=" + params._ticket;
        // 从路径中提取文件名，排除查询参数
        const purePath = params.fileUrl.split('?')[0];
        fileName = purePath.split('/').pop();
        fileType = resolvePreviewFileType(purePath);
        // 设置下载地址
        downloadUrl = params.fileUrl + "?sk=" + params._sk;
    }

    // 3. If docUrl parameter exists, it's a knowledge base document preview operation
    if (params.docUrl) {
        fileUrl = params.docUrl;
        // 从路径中提取文件名，排除查询参数
        const purePath = params.docUrl.split('?')[0];
        fileName = purePath.split('/').pop();
        fileType = resolvePreviewFileType(purePath);
        // 设置下载地址
        downloadUrl = params.docUrl;
    }

    // Auto-detect file type from URL if not provided
    if (!fileType && fileUrl) {
        const purePath = fileUrl.split('?')[0];
        const detected = resolvePreviewFileType(purePath);
        const supportedTypes = [
            'docx', 'xlsx', 'xls', 'pdf', 'pptx', 'ppt',
            'md', 'html', 'css', 'js', 'ts', 'txt', 'json', 'openui',
            'png', 'jpg', 'jpeg', 'gif', 'svg', 'py', 'java',
            'mp4', 'webm', 'ogg', 'mov', 'avi',
            'mp3', 'wav', 'm4a', 'aac', 'flac', 'wma'
        ];
        if (supportedTypes.includes(detected)) {
            fileType = detected;
        }
    }

    // Save original file type for subsequent precise notification
    originalFileType = fileType;

    // Normalize file types for renderer distribution
    if (fileType === 'xls') fileType = 'xlsx';
    if (fileType === 'ppt') fileType = 'pptx';
    if (fileType === 'doc') fileType = 'docx';


    if (!fileUrl) {
        showError('File URL not provided (missing fileUrl parameter)');
        return;
    }

    if (!fileType) {
        showError('File type not provided (missing fileType parameter)');
        return;
    }

    showLoading();
    hideError();

    const container = document.getElementById('previewContainer');
    if (container) {
        container.innerHTML = '';

        // Destroy previous previewer
        if (currentPreviewer && typeof currentPreviewer.destroy === 'function') {
            try {
                currentPreviewer.destroy();
            } catch (e) { /* ignore */ }
            currentPreviewer = null;
        }

        try {
            switch (fileType) {
                // Office documents
                case 'docx':
                    await renderDocx(fileUrl, container);
                    break;
                case 'xlsx':
                    await renderXlsx(fileUrl, container);
                    break;
                case 'pdf':
                    await renderPdf(fileUrl, container);
                    break;
                case 'pptx':
                    await renderPptx(fileUrl, container);
                    break;

                // Images
                case 'png':
                case 'jpg':
                case 'jpeg':
                case 'gif':
                case 'svg':
                    await renderImage(fileUrl, container);
                    break;

                // Videos
                case 'mp4':
                case 'webm':
                case 'ogg':
                case 'mov':
                case 'avi':
                    await renderVideo(fileUrl, container);
                    break;

                // Audio
                case 'mp3':
                case 'wav':
                case 'm4a':
                case 'aac':
                case 'flac':
                case 'wma':
                    await renderAudio(fileUrl, container);
                    break;

                // Markdown
                case 'md':
                    await renderMarkdown(fileUrl, container);
                    break;

                // HTML (render as webpage)
                case 'html':
                    await renderHtml(fileUrl, container);
                    break;

                // OpenUI artifact（分享/独立预览走固化 Runtime）
                case 'openui':
                    await renderOpenUi(fileUrl, container);
                    break;

                // Code files with syntax highlighting
                case 'js':
                    await renderText(fileUrl, container, 'javascript');
                    break;
                case 'ts':
                    await renderText(fileUrl, container, 'typescript');
                    break;
                case 'css':
                    await renderText(fileUrl, container, 'css');
                    break;
                case 'json':
                    await renderText(fileUrl, container, 'json');
                    break;
                case 'py':
                    await renderText(fileUrl, container, 'python');
                    break;
                case 'java':
                    await renderText(fileUrl, container, 'java');
                    break;
                case 'txt':
                    await renderText(fileUrl, container, 'plaintext');
                    break;

                default:
                    // throw new Error(`不支持的文件类型: ${fileType}`);
                    throw new Error(`Unable to preview this file type. Previewing [${originalFileType}] format is currently not supported.`);
            }

            hideLoading();

            // Show bottom-right download button only when dl=1
            if (params.dl === '1' && downloadUrl) {
                const previewDownloadBtn = document.getElementById('previewDownloadBtn');
                if (previewDownloadBtn) {
                    previewDownloadBtn.classList.remove('hidden');
                }
            }

            // Notify parent
            notifyParent({ type: 'preview_success', fileType });

        } catch (error) {
            console.error('[FilePreview] Render error:', error);
            showError(error.message || 'Document rendering failed', downloadUrl);
            notifyParent({ type: 'preview_error', error: error.message });
        }
    }
}


// ============================================
// Download Function
// ============================================
async function downloadFile() {
    if (!downloadUrl) {
        showError('Download URL does not exist');
        return;
    }

    // Detect if in WeChat mini program web-view environment
    const isInMiniProgram = window.__wxjs_environment === 'miniprogram' || 
                            (typeof wx !== 'undefined' && wx.miniProgram);
    
    if (isInMiniProgram) {
        // Mini program environment
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(downloadUrl);
                alert('The mini program does not support direct file downloads yet.\n\nThe download link has been copied to the clipboard. Please open it in a browser to download.');
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = downloadUrl;
                textArea.style.cssText = 'position: fixed; top: -9999px; left: -9999px;';
                document.body.appendChild(textArea);
                textArea.select();
                textArea.setSelectionRange(0, 99999);
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    alert('The mini program does not support direct file downloads yet.\n\nThe download link has been copied to the clipboard. Please open it in a browser to download.');
                } else {
                    alert('The mini program does not support direct file downloads yet.\n\nPlease long press to copy the following link:\n' + downloadUrl);
                }
            }
        } catch (err) {
            console.error('[FilePreview] Copy failed:', err);
            alert('The mini program does not support direct file downloads yet.\n\nPlease long press to copy the following link:\n' + downloadUrl);
        }
        return;
    }

    try {
        const downloadBtn = document.getElementById('errorDownloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.style.opacity = '0.6';
        }

        const response = await fetch(downloadUrl, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }

        const contentDisposition = response.headers.get('Content-Disposition');
        let downloadFileName = fileName || 'download';
        try {
            downloadFileName = decodeURIComponent(downloadFileName);
        } catch (e) {
            console.warn('Failed to decode filename:', e);
        }
        
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\\n]*=((['"]).*?\\2|[^;\\n]*)/);
            if (fileNameMatch && fileNameMatch[1]) {
                downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
                try {
                    downloadFileName = decodeURIComponent(downloadFileName);
                } catch (e) {
                    console.warn('Failed to decode filename:', e);
                }
            }
        }

        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        console.error('[FilePreview] Download error:', error);
        showError(error.message || 'Download failed');
    } finally {
        const downloadBtn = document.getElementById('errorDownloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
        }
    }
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', startPreview);
