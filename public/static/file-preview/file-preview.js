/**
 * file-preview.js
 * 业务主逻辑：文件渲染引擎、主流程控制、下载逻辑
 */

// ============================================
// Global State
// ============================================
let currentPreviewer = null;
let fileUrl = '';
let fileType = '';
let originalFileType = ''; // 记录原始文件扩展名，用于精准提示
let downloadUrl = ''; // 下载接口地址
let fileName = ''; // 文件名
const params = getQueryParams();

// 开发环境本地调试使用（不要删除）！！
// const baseUrl = getBaseUrl('https://testagent.xspaceagi.com');

// 正式环境动态获取地址！！
const baseUrl = getBaseUrl(params.fileUrl);

// ============================================
// Preview Renderers (using local libraries)
// ============================================
async function renderDocx(url, container) {
    await loadScript('/libs/js-preview/docx.umd.js');

    if (typeof jsPreviewDocx === 'undefined') {
        throw new Error('DOCX 预览库加载失败');
    }

    currentPreviewer = jsPreviewDocx.init(container);
    try {
        await currentPreviewer.preview(url);
    } catch (error) {
        console.error('[FilePreview] Docx core error:', error);
        throw new Error(`无法预览此文件类型，当前不支持预览【${originalFileType}】格式的文件。`);
    }
}

async function renderXlsx(url, container) {
    await loadScript('/libs/js-preview/excel.umd.js');

    if (typeof jsPreviewExcel === 'undefined') {
        throw new Error('Excel 预览库加载失败');
    }

    currentPreviewer = jsPreviewExcel.init(container);
    await currentPreviewer.preview(url);
}

async function renderPdf(url, container) {
    await loadScript('/libs/js-preview/pdf.umd.js');

    if (typeof jsPreviewPdf === 'undefined') {
        throw new Error('PDF 预览库加载失败');
    }

    // 使用设备像素比来提高 PDF 渲染清晰度
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
        throw new Error('PPTX 预览库加载失败');
    }

    const PptxLib = typeof PptxPreview !== 'undefined' ? PptxPreview : pptxPreview;
    currentPreviewer = PptxLib.init(container, {
        width: container.clientWidth || 800,
        height: container.clientHeight || 600
    });

    // Fetch file as ArrayBuffer
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`文件下载失败: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    await currentPreviewer.preview(arrayBuffer);
}

// ============================================
// HTML Preview (render as webpage)
// ============================================
async function renderHtml(url, container) {
    container.className = 'preview-container html-preview';

    // 尝试获取HTML内容以提取标题
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
        throw new Error('HTML 页面加载失败');
    };

    container.appendChild(iframe);
}

// ============================================
// Image Preview
// ============================================
async function renderImage(url, container) {
    container.className = 'preview-container image-preview';

    const img = document.createElement('img');
    img.src = url;
    img.alt = '图片预览';

    // Handle image load error
    img.onerror = () => {
        throw new Error('图片加载失败');
    };

    container.appendChild(img);
}

// ============================================
// Video Preview
// ============================================
async function renderVideo(url, container) {
    container.className = 'preview-container video-preview';
    // 设置容器样式以实现垂直和水平居中
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
        throw new Error('视频加载失败');
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
    container.style.background = '#f5f5f5'; // 浅灰色背景

    const audio = document.createElement('audio');
    audio.src = url;
    audio.controls = true;
    audio.autoplay = false;
    audio.style.width = '100%';
    audio.style.maxWidth = '600px';
    audio.style.outline = 'none';

    // Handle audio load error
    audio.onerror = () => {
        throw new Error('音频加载失败');
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
        throw new Error('Markdown 预览库加载失败');
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
    // 1. 如果有sk参数，说明是分享操作
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
            // 从路径中提取文件名
            fileName = data.content.split('/').pop();
            fileType = data.content.split('.').pop().toLowerCase();
            // 设置下载地址
            downloadUrl = baseUrl + data.content + '?sk=' + sk;
            
        } else {
            showError(message);
            return;
        }
    } 
    
    // 2. 如果有_ticket参数，说明是正常预览操作
    if(params._ticket){
        // 正常预览操作获取文件地址和类型
        fileUrl = params.fileUrl + "?_ticket=" + params._ticket;
        // 从路径中提取文件名
        fileName = params.fileUrl.split('/').pop();
        fileType = params.fileUrl.split('.').pop().toLowerCase();
        // 设置下载地址
        downloadUrl = params.fileUrl + "?sk=" + params._sk;
    }

    // 3. 如果有docUrl参数，说明是知识库文档预览操作
    if (params.docUrl) {
        fileUrl = params.docUrl;
        // 从路径中提取文件名
        fileName = params.docUrl.split('/').pop();
        fileType = params.docUrl.split('.').pop().toLowerCase();
        // 设置下载地址
        downloadUrl = params.docUrl;
    }

    // Auto-detect file type from URL if not provided
    if (!fileType && fileUrl) {
        const ext = fileUrl.split('.').pop().split('?')[0].toLowerCase();
        const supportedTypes = [
            'docx', 'xlsx', 'xls', 'pdf', 'pptx', 'ppt',
            'md', 'html', 'css', 'js', 'ts', 'txt', 'json',
            'png', 'jpg', 'jpeg', 'gif', 'svg', 'py', 'java',
            'mp4', 'webm', 'ogg', 'mov', 'avi',
            'mp3', 'wav', 'm4a', 'aac', 'flac', 'wma'
        ];
        if (supportedTypes.includes(ext)) {
            fileType = ext;
        }
    }

    // 保存原始文件类型，用于后续精准提示
    originalFileType = fileType;

    // Normalize file types for renderer distribution
    if (fileType === 'xls') fileType = 'xlsx';
    if (fileType === 'ppt') fileType = 'pptx';
    if (fileType === 'doc') fileType = 'docx';


    if (!fileUrl) {
        showError('未提供文件地址 (fileUrl 参数缺失)');
        return;
    }

    if (!fileType) {
        showError('未提供文件类型 (fileType 参数缺失)');
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
                    throw new Error(`不支持的文件类型: ${fileType}`);
            }

            hideLoading();

            // 只有当 dl=1 时才显示右下角下载按钮
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
            showError(error.message || '文档渲染失败');
            notifyParent({ type: 'preview_error', error: error.message });
        }
    }
}


// ============================================
// Download Function
// ============================================
async function downloadFile() {
    if (!downloadUrl) {
        showError('下载地址不存在');
        return;
    }

    // 检测是否在微信小程序 web-view 环境中
    const isInMiniProgram = window.__wxjs_environment === 'miniprogram' || 
                            (typeof wx !== 'undefined' && wx.miniProgram);
    
    if (isInMiniProgram) {
        // 小程序环境
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(downloadUrl);
                alert('小程序暂不支持直接下载文件\n\n下载链接已复制到剪切板，请在浏览器中打开下载');
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
                    alert('小程序暂不支持直接下载文件\n\n下载链接已复制到剪切板，请在浏览器中打开下载');
                } else {
                    alert('小程序暂不支持直接下载文件\n\n请长按复制以下链接：\n' + downloadUrl);
                }
            }
        } catch (err) {
            console.error('[FilePreview] Copy failed:', err);
            alert('小程序暂不支持直接下载文件\n\n请长按复制以下链接：\n' + downloadUrl);
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
            throw new Error(`下载失败: ${response.status}`);
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
        showError(error.message || '下载失败');
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
