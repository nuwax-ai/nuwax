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
let activePreviewRequest = null;
let activeDownloadController = null;
let previewRequestId = 0;
const PPTX_RUNTIME_URL = '/static/file-preview/file-preview-pptx.js?v=2026.9.29-pptx-sharing';
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

function isCurrentPreview(request) {
    return activePreviewRequest === request && !request.controller.signal.aborted;
}

function assertCurrentPreview(request) {
    if (!isCurrentPreview(request)) throw new DOMException('Preview cancelled', 'AbortError');
}

function canDownloadCurrentFile() {
    return fileType !== 'openui' && !!downloadUrl && (!params.sk || params.dl === '1');
}

function pptxErrorMessage(error) {
    switch (error.code) {
        case 'legacy': return 'Legacy PPT format is not supported. Please use PPTX.';
        case 'damaged': return 'This presentation is damaged or incomplete.';
        case 'invalid': return 'This file is not a valid PPTX presentation.';
        case 'tooLarge': return 'This presentation exceeds the preview size limit.';
        case 'incomplete': return 'Some slides could not be rendered. Please retry.';
        default: return error.message || 'Document rendering failed';
    }
}

async function readPptxBuffer(url, request, maxBytes) {
    // 同源首跳可用 ticket cookie，重定向到对象存储后不发送跨源凭据。
    const response = await fetch(url, {
        signal: request.controller.signal,
        credentials: 'same-origin',
        cache: 'no-cache',
    });
    assertCurrentPreview(request);
    if (!response.ok) throw new Error(`File download failed: ${response.status}`);
    const tooLarge = () => Object.assign(new Error('Presentation exceeds the preview size limit'), { code: 'tooLarge' });
    if (Number(response.headers.get('Content-Length')) > maxBytes) {
        await response.body?.cancel();
        throw tooLarge();
    }
    if (!response.body || !response.body.getReader) {
        const buffer = await response.arrayBuffer();
        assertCurrentPreview(request);
        if (buffer.byteLength > maxBytes) throw tooLarge();
        return buffer;
    }
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    const cancel = () => { reader.cancel().catch(() => {}); };
    request.controller.signal.addEventListener('abort', cancel, { once: true });
    try {
        while (true) {
            const { done, value } = await reader.read();
            assertCurrentPreview(request);
            if (done) break;
            size += value.byteLength;
            if (size > maxBytes) {
                await reader.cancel();
                throw tooLarge();
            }
            chunks.push(value);
        }
        const buffer = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
            buffer.set(chunk, offset);
            offset += chunk.byteLength;
        }
        return buffer.buffer;
    } finally {
        request.controller.signal.removeEventListener('abort', cancel);
        reader.releaseLock();
    }
}

async function renderPptx(url, container, request) {
    let disposed = false;
    let renderId = 0;
    let resizeTimer;
    let observer;
    let prepared;
    let runtime;
    let visiblePreviewer;
    let requestedSize;
    const instances = new Set();
    const session = {
        originalBuffer: null,
        destroy() {
            if (disposed) return;
            disposed = true;
            renderId++;
            clearTimeout(resizeTimer);
            observer?.disconnect();
            window.removeEventListener('resize', onResize);
            for (const previewer of instances) {
                try { previewer.destroy(); } catch (e) { /* 继续释放其它实例 */ }
            }
            instances.clear();
            visiblePreviewer = null;
            prepared = null;
        },
    };
    currentPreviewer = session;

    const isLive = () => !disposed && isCurrentPreview(request);
    const getSize = () => ({ width: container.clientWidth || 800, height: container.clientHeight || 600 });
    async function render(preserveScroll) {
        if (!isLive()) return;
        const id = ++renderId;
        requestedSize = getSize();
        const scroll = preserveScroll ? { outer: container.scrollTop, inner: visiblePreviewer?.wrapper?.scrollTop || 0 } : null;
        // 每一代解析使用独立 host；旧解析不能写入当前页面。
        const host = document.createElement('div');
        const previewer = runtime.init(host, { ...requestedSize, mode: 'list' });
        instances.add(previewer);
        try {
            await previewer.load(prepared.buffer);
            if (!isLive() || id !== renderId) {
                previewer.destroy();
                instances.delete(previewer);
                host.replaceChildren();
                return;
            }
            for (let index = 0; index < previewer.pptx.slides.length; index++) {
                previewer.htmlRender.renderSlide(index);
            }
            runtime.validateAndOrderPptxSlides(previewer, host, prepared.slidePaths);
            if (visiblePreviewer) {
                visiblePreviewer.destroy();
                instances.delete(visiblePreviewer);
            }
            visiblePreviewer = previewer;
            container.className = 'preview-container';
            container.replaceChildren(host);
            if (scroll) {
                container.scrollTop = scroll.outer;
                if (previewer.wrapper) previewer.wrapper.scrollTop = scroll.inner;
            }
        } catch (error) {
            previewer.destroy();
            instances.delete(previewer);
            host.replaceChildren();
            if (!isLive() || id !== renderId) return;
            throw error;
        }
    }
    function onResize() {
        if (!isLive() || !prepared || !requestedSize) return;
        const size = getSize();
        if (size.width === requestedSize.width && size.height === requestedSize.height) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            render(true).catch(error => {
                if (!isLive()) return;
                session.destroy();
                showError(pptxErrorMessage(error), canDownloadCurrentFile() ? downloadUrl : '');
                notifyParent({ type: 'preview_error', error: pptxErrorMessage(error) });
            });
        }, 150);
    }
    try {
        await loadScript(PPTX_RUNTIME_URL);
        assertCurrentPreview(request);
        runtime = window.NuwaxPptxPreview;
        if (!runtime) throw new Error('Failed to load PPTX preview library');
        session.originalBuffer = await readPptxBuffer(url, request, runtime.DEFAULT_PPTX_PACKAGE_LIMITS.maxCompressedBytes);
        prepared = await runtime.preparePptxForPreview(session.originalBuffer, { signal: request.controller.signal });
        assertCurrentPreview(request);
        await render(false);
        assertCurrentPreview(request);
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(onResize);
            observer.observe(container);
        } else {
            window.addEventListener('resize', onResize);
        }
    } catch (error) {
        session.destroy();
        throw error;
    }
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

/**
 * 分享过期：销毁预览并展示友好错误（隐藏下载）
 * 不再使用倒计时定时器；改为在拉取返回过期/失败时由调用方触发。
 * （OpenUI / 其它分享预览共用；OpenUI 渲染见 file-preview-openui.js）
 */
function handleShareExpired() {
    activePreviewRequest?.controller.abort();
    downloadUrl = '';
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
// Markdown Preview (+ KaTeX math)
// ============================================

/**
 * 在 marked 解析前抽出公式，避免 $$ 多行块被拆成多个 <p> 导致无法渲染。
 * 支持 $$...$$ / $...$ / \[...\] / \(...\)
 */
function extractMarkdownMath(markdown) {
    const slots = [];
    let text = markdown != null ? String(markdown) : '';

    const pushSlot = (tex, displayMode) => {
        const id = slots.length;
        slots.push({
            tex: String(tex).trim(),
            displayMode: displayMode === true,
        });
        // 占位符保持可被 marked 当普通文本处理
        return `@@KATEX${id}@@`;
    };

    // 先保护代码块，避免代码里的 $ 被当成公式
    const codeSlots = [];
    text = text.replace(/```[\s\S]*?```/g, (block) => {
        const id = codeSlots.length;
        codeSlots.push(block);
        return `@@CODEBLOCK${id}@@`;
    });
    text = text.replace(/`[^`\n]+`/g, (block) => {
        const id = codeSlots.length;
        codeSlots.push(block);
        return `@@CODEBLOCK${id}@@`;
    });

    // 块级公式
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => pushSlot(tex, true));
    text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => pushSlot(tex, true));
    // 行内公式
    text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => pushSlot(tex, false));
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, tex) => pushSlot(tex, false));

    // 还原代码块
    text = text.replace(/@@CODEBLOCK(\d+)@@/g, (_, id) => {
        const block = codeSlots[Number(id)];
        return block != null ? block : '';
    });

    return { markdown: text, slots: slots };
}

function escapeHtmlText(raw) {
    return String(raw)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function restoreMarkdownMath(html, slots) {
    if (typeof katex === 'undefined' || slots == null || slots.length === 0) {
        return html;
    }
    return String(html).replace(/@@KATEX(\d+)@@/g, (_, id) => {
        const slot = slots[Number(id)];
        if (slot == null) {
            return '';
        }
        try {
            return katex.renderToString(slot.tex, {
                displayMode: slot.displayMode === true,
                throwOnError: false,
                strict: 'ignore',
            });
        } catch (e) {
            console.warn('[FilePreview] KaTeX render failed:', e);
            return slot.displayMode
                ? `<pre class="katex-error">${escapeHtmlText(slot.tex)}</pre>`
                : `<code class="katex-error">${escapeHtmlText(slot.tex)}</code>`;
        }
    });
}

/**
 * 表格 → Markdown 管道文本（表格卡「复制」用，对齐会话区 extractTableToMarkdown 语义）
 */
function tableToMarkdownText(table) {
    if (!table) return '';
    var rows = [];
    var pushRow = function (tr) {
        var cells = Array.prototype.slice.call(tr.querySelectorAll('th,td')).map(function (cell) {
            return (cell.textContent || '').trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
        });
        if (cells.length) rows.push('| ' + cells.join(' | ') + ' |');
    };
    var headerRows = table.querySelectorAll('thead tr');
    headerRows.forEach(pushRow);
    var bodyRows = table.querySelectorAll('tbody tr');
    if (headerRows.length && (bodyRows.length || !rows.length)) {
        var colCount = headerRows[0].querySelectorAll('th,td').length || (bodyRows[0] ? bodyRows[0].querySelectorAll('th,td').length : 0);
        if (colCount) rows.push('| ' + Array.from({ length: colCount }, function () { return '---'; }).join(' | ') + ' |');
    }
    bodyRows.forEach(pushRow);
    return rows.join('\n');
}

/**
 * 代码块/表格卡复制：事件委托 + clipboard API（降级 execCommand），
 * 按钮文案「复制」→「已复制」约 3s 复位，期间防重复点击
 */
function setupMarkdownCodeCopy(scope) {
    if (!scope || scope.dataset.copyBound === '1') {
        return;
    }
    scope.dataset.copyBound = '1';

    scope.addEventListener('click', async (event) => {
        const btn = event.target && event.target.closest
            ? event.target.closest('.md-copy-btn')
            : null;
        if (!btn || btn.dataset.copyLocked === '1') {
            return;
        }

        const block = btn.closest('.md-code-block');
        // 代码块取高亮 code 的原始文本；表格卡从 table DOM 反提取 Markdown 管道文本
        const codeEl = block ? block.querySelector('pre code') : null;
        const text = codeEl
            ? (codeEl.textContent || '')
            : tableToMarkdownText(block ? block.querySelector('table') : null);
        if (!text) {
            return;
        }
        let copied = false;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                copied = true;
            }
        } catch (e) {
            console.warn('[FilePreview] clipboard API failed, fallback to execCommand:', e);
        }

        if (!copied) {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.cssText = 'position: fixed; top: -9999px; left: -9999px;';
                document.body.appendChild(textArea);
                textArea.select();
                textArea.setSelectionRange(0, 99999);
                copied = document.execCommand('copy');
                document.body.removeChild(textArea);
            } catch (e) {
                copied = false;
            }
        }

        btn.dataset.copyLocked = '1';
        btn.textContent = copied ? '已复制' : '复制失败';
        btn.classList.toggle('md-copy-btn-copied', copied);
        setTimeout(() => {
            btn.textContent = '复制';
            btn.classList.remove('md-copy-btn-copied');
            delete btn.dataset.copyLocked;
        }, 3000);
    });
}

/**
 * 表格卡 banner 片段（「表格」标签 + 复制按钮）：renderer.table（管道表格）与
 * enhanceMarkdownTables（裸 HTML 表格兜底）共用，改卡片结构只改这一处
 */
function buildTableCardBannerHtml() {
    return '<div class="md-code-block-banner">'
        + '<span class="md-code-block-language">表格</span>'
        + '<span class="md-copy-btn" role="button" tabindex="0">复制</span>'
        + '</div>';
}

/**
 * 裸 HTML 表格兜底：marked 只对管道表格调用 renderer.table，
 * 文档内嵌的 <table> 原样透传——既没有复制按钮也没有溢出包裹，
 * 宽表格会撑破 .markdown-body 触发整页横向滚动，左移后首列文字被裁。
 * 渲染后把未包卡的表格统一套上 md-table-block 外壳，与管道表格同款。
 */
function enhanceMarkdownTables(scope) {
    var tables = scope.querySelectorAll('table');
    tables.forEach(function (table) {
        if (table.closest('.md-table-block')) {
            return;
        }
        var card = document.createElement('div');
        card.className = 'md-code-block md-table-block';
        card.innerHTML = buildTableCardBannerHtml() + '<div class="md-table-content"></div>';
        table.parentNode.insertBefore(card, table);
        card.querySelector('.md-table-content').appendChild(table);
    });
}

async function renderMarkdown(url, container) {
    // Load marked.js for markdown rendering (Local)
    await loadScript('/libs/js-preview/marked.min.js');
    // Load highlight.js for code block syntax highlighting (Local)
    await loadScript('/libs/js-preview/highlight.min.js');
    // Load KaTeX for math formulas in markdown
    await loadStylesheet('/libs/js-preview/katex.min.css');
    await loadScript('/libs/js-preview/katex.min.js');

    if (typeof marked === 'undefined') {
        throw new Error('Failed to load Markdown preview library');
    }

    // Fetch markdown content
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`文件下载失败: ${response.status}`);
    }
    const markdown = await response.text();
    const mathExtract = extractMarkdownMath(markdown);

    // 代码块渲染为会话区同款 md-code-block（语言标签 + 复制按钮 + highlight.js 高亮）。
    // 注意：marked v11 已移除 setOptions({ highlight }) 选项（静默无效），高亮必须在 renderer 内直调
    const { marked: markedInstance } = window;
    const targetMarked = typeof marked !== 'undefined' ? marked : markedInstance;

    targetMarked.use({
        breaks: true,
        gfm: true,
        renderer: {
            code: function (code, infostring) {
                const lang = String(infostring || '').trim().split(/\s+/)[0];
                if (!lang) {
                    // 无语言围栏同样包卡片，仅省略语言标签（复制按钮可用）
                    return '<div class="md-code-block">'
                        + '<div class="md-code-block-banner">'
                        + '<span class="md-code-block-language"></span>'
                        + '<span class="md-copy-btn" role="button" tabindex="0">复制</span>'
                        + '</div>'
                        + '<pre class="md-code-block-content"><code>'
                        + escapeHtmlText(code)
                        + '</code></pre>'
                        + '</div>';
                }

                let highlighted = '';
                if (typeof hljs !== 'undefined') {
                    try {
                        if (hljs.getLanguage(lang)) {
                            highlighted = hljs.highlight(code, { language: lang }).value;
                        } else {
                            highlighted = hljs.highlightAuto(code).value;
                        }
                    } catch (e) {
                        console.error('Highlight error:', e);
                    }
                }

                return '<div class="md-code-block">'
                    + '<div class="md-code-block-banner">'
                    + '<span class="md-code-block-language">' + escapeHtmlText(lang) + '</span>'
                    + '<span class="md-copy-btn" role="button" tabindex="0">复制</span>'
                    + '</div>'
                    + '<pre class="md-code-block-content"><code class="language-' + escapeHtmlText(lang) + '">'
                    + (highlighted || escapeHtmlText(code))
                    + '</code></pre>'
                    + '</div>';
            },
            // 表格渲染为会话区同款表格卡（「表格」标签 + 复制为 Markdown）；
            // marked v11 旧签名为 table(header, body)，均为已渲染的 thead/tbody HTML
            table: function (header, body) {
                return '<div class="md-code-block md-table-block">'
                    + buildTableCardBannerHtml()
                    + '<div class="md-table-content"><table><thead>' + header + '</thead><tbody>' + (body || '') + '</tbody></table></div>'
                    + '</div>';
            },
        },
    });

    // Render markdown to HTML, then restore KaTeX
    const html = restoreMarkdownMath(targetMarked.parse(mathExtract.markdown), mathExtract.slots);

    container.className = 'preview-container markdown-preview';
    const markdownBody = document.createElement('div');
    markdownBody.className = 'markdown-body';
    markdownBody.innerHTML = html;
    // 裸 HTML 表格包卡（复制 + 溢出包裹），需在复制事件绑定前就位
    enhanceMarkdownTables(markdownBody);
    container.appendChild(markdownBody);
    setupMarkdownCodeCopy(markdownBody);
}


// ============================================
// Main Preview Function
// ============================================
async function startPreview() {
    activePreviewRequest?.controller.abort();
    activeDownloadController?.abort();
    activeDownloadController = null;
    const request = { id: ++previewRequestId, controller: new AbortController() };
    activePreviewRequest = request;
    if (currentPreviewer && typeof currentPreviewer.destroy === 'function') {
        try { currentPreviewer.destroy(); } catch (e) { /* ignore */ }
    }
    currentPreviewer = null;
    fileUrl = '';
    fileType = '';
    downloadUrl = '';
    fileName = '';
    const container = document.getElementById('previewContainer');
    if (container) container.replaceChildren();
    document.getElementById('previewDownloadBtn')?.classList.add('hidden');
    document.getElementById('errorDownloadBtn')?.classList.add('hidden');
    const errorDownloadButton = document.getElementById('errorDownloadBtn');
    if (errorDownloadButton) {
        errorDownloadButton.disabled = false;
        errorDownloadButton.style.opacity = '1';
    }
    showLoading();
    hideError();

    try {
        const sk = params.sk || '';
        // 1. If sk parameter exists, it's a sharing operation
        if (sk) {
            const response = await fetch(`${baseUrl}/api/agent/conversation/share/detail/${sk}`, {
                method: 'GET',
                signal: request.controller.signal,
                credentials: 'same-origin',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            assertCurrentPreview(request);
            if (!response.ok) throw new Error(`Failed to load sharing link: ${response.status}`);
            const { data, code, message } = await response.json();
            assertCurrentPreview(request);
            if (code === '0000' && data && data.content) {
                const sharedUrl = new URL(data.content, baseUrl);
                sharedUrl.searchParams.set('sk', sk);
                fileUrl = sharedUrl.href;
                // Extract file name from path, excluding query parameters
                const purePath = data.content.split('?')[0];
                fileName = purePath.split('/').pop();
                // 优先识别 .openui.json，避免被拆成普通 json
                fileType = resolvePreviewFileType(purePath);
                // .md 分享：用文件名（含后缀）作为页面标题，其它格式保持默认标题
                applyMarkdownDocumentTitle(purePath);
                // Set download URL
                downloadUrl = sharedUrl.href;
            
            } else {
                throw new Error(message || SHARE_EXPIRED_MESSAGE);
            }
        }
    
        // 2. If _ticket parameter exists, it's a normal preview operation
        else if (params.fileUrl) {
            // Normal preview operation: get file URL and type
            const previewUrl = new URL(params.fileUrl, baseUrl);
            if (params._ticket) previewUrl.searchParams.set('_ticket', params._ticket);
            fileUrl = previewUrl.href;
            // 从路径中提取文件名，排除查询参数
            const purePath = params.fileUrl.split('?')[0];
            fileName = purePath.split('/').pop();
            fileType = resolvePreviewFileType(purePath);
            // 设置下载地址
            const originalUrl = new URL(params.fileUrl, baseUrl);
            if (params._sk) originalUrl.searchParams.set('sk', params._sk);
            downloadUrl = originalUrl.href;
        }

        // 3. If docUrl parameter exists, it's a knowledge base document preview operation
        else if (params.docUrl) {
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

        // OpenUI 是交互式会话产物，只提供预览与表单交互，不展示文件下载入口。
        if (fileType === 'openui') {
            downloadUrl = '';
            const previewDownloadButton = document.getElementById('previewDownloadBtn');
            if (previewDownloadButton) previewDownloadButton.remove();
            const errorDownloadButton = document.getElementById('errorDownloadBtn');
            if (errorDownloadButton) errorDownloadButton.remove();
        }

        // Normalize file types for renderer distribution
        if (fileType === 'xls') fileType = 'xlsx';
        if (fileType === 'ppt') fileType = 'pptx';
        if (fileType === 'doc') fileType = 'docx';


        if (!fileUrl) {
            throw new Error('File URL not provided (missing fileUrl parameter)');
        }

        if (!fileType) {
            throw new Error('File type not provided (missing fileType parameter)');
        }

        if (container) {
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
                    await renderPptx(fileUrl, container, request);
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

                // OpenUI artifact（分享/独立预览走固化 Runtime，实现见 file-preview-openui.js）
                case 'openui':
                    await renderOpenUi(fileUrl, container, {
                        onShareExpired: handleShareExpired,
                        registerPreviewer: (previewer) => {
                            currentPreviewer = previewer;
                        },
                        // 会话内预览（_ticket 主分支，或 mobile ticket 签发失败回退的 mode=preview）才允许表单提交转发；
                        // 纯 ?sk=（外部分享）只读。
                        isChat: !!(params._ticket || params.mode === 'preview'),
                    });
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

            assertCurrentPreview(request);
            hideLoading();

            // Show bottom-right download button only when dl=1
            if (params.dl === '1' && canDownloadCurrentFile()) {
                const previewDownloadBtn = document.getElementById('previewDownloadBtn');
                if (previewDownloadBtn) {
                    previewDownloadBtn.classList.remove('hidden');
                }
            }

            // Notify parent
            notifyParent({ type: 'preview_success', fileType });

        }
    } catch (error) {
        if (!isCurrentPreview(request) || error.name === 'AbortError') return;
        console.error('[FilePreview] Render error:', error);
        const message = fileType === 'pptx' ? pptxErrorMessage(error) : (error.message || 'Document rendering failed');
        showError(message, canDownloadCurrentFile() ? downloadUrl : '');
        notifyParent({ type: 'preview_error', error: message });
    }
}


// ============================================
// Download Function
// ============================================
/**
 * App web-view 通过 evalJS 写入的平台标识：'ios' / 'android' / 'harmony'
 */
function getNuwaxAppPlatform() {
    const platform = window.__nuwaxAppPlatform;
    if (platform === 'ios' || platform === 'android' || platform === 'harmony') {
        return platform;
    }
    return '';
}

/**
 * 通知 App 用原生 downloadFileInApp 下载当前预览文件。
 */
function requestNuwaxAppFileDownload() {
    const payload = { type: 'download', action: 'downloadCurrentFile' };
    try {
        window.postMessage(payload, '*');
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, '*');
        }
        const post =
            window.uni && window.uni.webView && window.uni.webView.postMessage;
        if (post) {
            post({ data: payload });
        }
    } catch (e) {
        console.warn('[FilePreview] Failed to request App file download:', e);
    }
}

async function downloadFile() {
    if (fileType === 'openui' || (params.sk && params.dl !== '1')) {
        return;
    }

    // App web-view：自行 postMessage，由原生 downloadFileInApp 下载
    if (getNuwaxAppPlatform()) {
        requestNuwaxAppFileDownload();
        return;
    }

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

    activeDownloadController?.abort();
    const controller = new AbortController();
    activeDownloadController = controller;
    const request = activePreviewRequest;
    const sourceUrl = downloadUrl;
    const sourceName = fileName;
    const originalBuffer = fileType === 'pptx' ? currentPreviewer?.originalBuffer : null;
    const isLive = () => activeDownloadController === controller && !controller.signal.aborted && isCurrentPreview(request);
    try {
        const downloadBtn = document.getElementById('errorDownloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.style.opacity = '0.6';
        }

        // 缓存的是下载原件，兼容处理后的 buffer 永不作为下载内容。
        const response = originalBuffer ? null : await fetch(sourceUrl, {
            method: 'GET',
            credentials: 'same-origin',
            signal: controller.signal,
        });
        if (!isLive()) return;
        if (response && !response.ok) throw new Error(`Download failed: ${response.status}`);
        const contentDisposition = response?.headers.get('Content-Disposition');
        let downloadFileName = sourceName || 'download';
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

        const blob = originalBuffer ? new Blob([originalBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        }) : await response.blob();
        if (!isLive()) return;
        
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
        if (!isLive() || error.name === 'AbortError') return;
        console.error('[FilePreview] Download error:', error);
        showError(error.message || 'Download failed');
    } finally {
        if (activeDownloadController !== controller) return;
        activeDownloadController = null;
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
window.addEventListener('pagehide', () => {
    activePreviewRequest?.controller.abort();
    activeDownloadController?.abort();
    activeDownloadController = null;
    currentPreviewer?.destroy?.();
    currentPreviewer = null;
});
window.addEventListener('pageshow', event => {
    if (event.persisted) startPreview();
});
