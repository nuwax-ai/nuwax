/**
 * file-preview-openui.js
 * 分享/独立预览页的 OpenUI 专属逻辑：类型识别、契约校验、Runtime iframe Host
 *
 * 依赖：无（与主流程通过 hooks 解耦）
 * 加载顺序：file-preview-utils.js → 本文件 → file-preview.js
 *
 * 配对：Runtime 子页 file_path 自主拉取见 /static/openui-runtime/file-path-bootstrap.js
 * （两端不可合并为同一文件：本文件是 parent Host，对方是 iframe/顶层 bootstrap）
 */

// ============================================
// Constants
// ============================================
const OPENUI_RUNTIME_PROTOCOL = 'nuwax.openui-runtime/v1';
const OPENUI_RUNTIME_PATH = '/static/openui-runtime/index.html';
const OPENUI_FILE_NAME_PATTERN = /\.openui\.json$/i;
const OPENUI_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;

/**
 * 判断文件名是否为 OpenUI 产物（复合后缀 .openui.json）
 * @param {string} name
 * @returns {boolean}
 */
function isOpenUiFileName(name) {
    const fileName = String(name || '')
        .split(/[\\/]/)
        .pop() || '';
    return OPENUI_FILE_NAME_PATTERN.test(fileName);
}

/**
 * 从纯路径解析预览类型；优先识别 .openui.json，避免被拆成 json
 * @param {string} purePath
 * @returns {string}
 */
function resolvePreviewFileType(purePath) {
    const fileName = String(purePath || '')
        .split(/[\\/]/)
        .pop() || '';
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
    if (
        file.type !== 'nuwax.openui-file' ||
        file.schemaVersion !== 'nuwax.openui-file/v1'
    ) {
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
 * 从完整文件 URL 提取 OpenUI Runtime「自主拉取」所需的 file_path
 * （/api/computer/static 之后的相对路径，保留 ?sk= 等 query）。
 * 仅当 pathname 以 /api/computer/static 开头时返回；否则返回 null（走回退）。
 * @param {string} url
 * @returns {string | null}
 */
function extractOpenUiFilePath(url) {
    try {
        const u = new URL(url, window.location.origin);
        const prefix = '/api/computer/static';
        if (u.pathname.indexOf(prefix) === 0) {
            return u.pathname.slice(prefix.length) + u.search;
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * 将 .openui.json 渲染为 OpenUI Runtime 页面（iframe + postMessage）
 * 分享场景无会话连接：表单 onAction 一律回失败，禁止提交回原会话
 *
 * @param {string} url Artifact 文件 URL（可带 sk）
 * @param {HTMLElement} container
 * @param {{
 *   onShareExpired: () => void,
 *   registerPreviewer: (previewer: { destroy: () => void }) => void,
 * }} hooks 与主流程解耦：过期 UI / currentPreviewer 由调用方注入
 */
async function renderOpenUi(url, container, hooks) {
    const onShareExpired =
        hooks && typeof hooks.onShareExpired === 'function'
            ? hooks.onShareExpired
            : function () {};
    const registerPreviewer =
        hooks && typeof hooks.registerPreviewer === 'function'
            ? hooks.registerPreviewer
            : function () {};

    container.className = 'preview-container html-preview';

    // file_path 自主拉取模式：能从 url 提取出 /api/computer/static 之后的相对路径时，
    // 交给 iframe 内 inline script 同源拉取（带得上 sk/cookie），结果经 relay 回本页转发。
    // 提取失败（url 非 /api/computer/static 格式）则回退到本页自拉。
    const filePath = extractOpenUiFilePath(url);
    let artifact = null;

    if (!filePath) {
        const response = await fetch(url, {
            cache: 'no-store',
            credentials: 'same-origin',
        });
        if (!response.ok) {
            // 分享链接/静态访问凭据(static_sk)失效：按“已过期”处理，展示友好提示。
            // 不再使用倒计时定时器，改为依据拉取返回判断。
            onShareExpired();
            return;
        }

        let parsed;
        try {
            parsed = await response.json();
        } catch (error) {
            throw new Error('OpenUI artifact is not valid JSON.');
        }

        artifact = await validateOpenUiArtifact(parsed);
    }

    if (artifact && typeof artifact.title === 'string' && artifact.title.trim()) {
        document.title = artifact.title.trim();
    }

    const nonce = crypto.randomUUID();
    const iframe = document.createElement('iframe');
    iframe.className = 'html-preview-iframe';
    iframe.title = (artifact && artifact.title) || 'OpenUI';
    iframe.referrerPolicy = 'no-referrer';
    // 与会话内 OpenUI iframe 一致：ES module 需要同源，故启用 allow-same-origin
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.src = filePath
        ? `${OPENUI_RUNTIME_PATH}?nonce=${encodeURIComponent(nonce)}&file_path=${encodeURIComponent(filePath)}`
        : `${OPENUI_RUNTIME_PATH}?nonce=${encodeURIComponent(nonce)}`;

    const sendLoad = () => {
        // file_path 模式下 artifact 在收到 OPENUI_FP_ARTIFACT 后才就绪
        if (!iframe.contentWindow || !artifact) return;
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

        // file_path 模式：iframe inline script 同源拉取结果 relay 回来
        if (data.type === 'OPENUI_FP_ARTIFACT') {
            validateOpenUiArtifact(data.artifact)
                .then((validated) => {
                    artifact = validated;
                    if (
                        typeof artifact.title === 'string' &&
                        artifact.title.trim()
                    ) {
                        document.title = artifact.title.trim();
                    }
                    sendLoad();
                })
                .catch(() => {
                    onShareExpired();
                });
            return;
        }
        if (data.type === 'OPENUI_FP_ERROR') {
            // 拉取失败/过期（如 sk 失效）：按过期处理
            onShareExpired();
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
                    message:
                        'Share preview is read-only and cannot submit forms.',
                },
                '*',
            );
        }
    };

    window.addEventListener('message', handleMessage);
    registerPreviewer({
        destroy() {
            window.removeEventListener('message', handleMessage);
        },
    });

    iframe.onerror = () => {
        window.removeEventListener('message', handleMessage);
        throw new Error('Failed to load OpenUI runtime.');
    };

    container.appendChild(iframe);
    // iframe onload 时再补发一次，避免 READY 早于监听注册的竞态
    iframe.addEventListener('load', sendLoad);
}
