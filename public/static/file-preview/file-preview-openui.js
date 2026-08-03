/**
 * file-preview-openui.js
 * 分享/独立预览页的 OpenUI 专属逻辑：类型识别、契约校验、Runtime 按需加载与 iframe 回退 Host
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
const OPENUI_RUNTIME_ASSET_VERSION = '0.3.10';
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
 * 将 JS 字符串编码为 UTF-8；兼容缺少 TextEncoder 的旧 WebView。
 * @param {string} value
 * @returns {number[]}
 */
function encodeOpenUiUtf8(value) {
    const bytes = [];
    for (let index = 0; index < value.length; index += 1) {
        let codePoint = value.charCodeAt(index);
        if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
            const next = value.charCodeAt(index + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                codePoint =
                    0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00);
                index += 1;
            } else {
                codePoint = 0xfffd;
            }
        } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
            codePoint = 0xfffd;
        }
        if (codePoint <= 0x7f) {
            bytes.push(codePoint);
        } else if (codePoint <= 0x7ff) {
            bytes.push(0xc0 | (codePoint >>> 6), 0x80 | (codePoint & 0x3f));
        } else if (codePoint <= 0xffff) {
            bytes.push(
                0xe0 | (codePoint >>> 12),
                0x80 | ((codePoint >>> 6) & 0x3f),
                0x80 | (codePoint & 0x3f),
            );
        } else {
            bytes.push(
                0xf0 | (codePoint >>> 18),
                0x80 | ((codePoint >>> 12) & 0x3f),
                0x80 | ((codePoint >>> 6) & 0x3f),
                0x80 | (codePoint & 0x3f),
            );
        }
    }
    return bytes;
}

/**
 * 纯 JS SHA-256，供缺少 crypto.subtle.digest 的小程序 WebView 使用。
 * @param {string} value
 * @returns {string}
 */
function sha256DigestFallback(value) {
    const constants = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const hash = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];
    const bytes = encodeOpenUiUtf8(value);
    const byteLength = bytes.length;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const highBits = Math.floor(byteLength / 0x20000000);
    const lowBits = (byteLength << 3) >>> 0;
    for (let shift = 24; shift >= 0; shift -= 8) {
        bytes.push((highBits >>> shift) & 0xff);
    }
    for (let shift = 24; shift >= 0; shift -= 8) {
        bytes.push((lowBits >>> shift) & 0xff);
    }

    const words = new Uint32Array(64);
    const rotateRight = (word, bits) =>
        (word >>> bits) | (word << (32 - bits));
    for (let offset = 0; offset < bytes.length; offset += 64) {
        for (let index = 0; index < 16; index += 1) {
            const cursor = offset + index * 4;
            words[index] =
                (bytes[cursor] << 24) |
                (bytes[cursor + 1] << 16) |
                (bytes[cursor + 2] << 8) |
                bytes[cursor + 3];
        }
        for (let index = 16; index < 64; index += 1) {
            const previous = words[index - 15];
            const beforePrevious = words[index - 2];
            const sigma0 =
                rotateRight(previous, 7) ^
                rotateRight(previous, 18) ^
                (previous >>> 3);
            const sigma1 =
                rotateRight(beforePrevious, 17) ^
                rotateRight(beforePrevious, 19) ^
                (beforePrevious >>> 10);
            words[index] =
                (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
        }

        let [a, b, c, d, e, f, g, h] = hash;
        for (let index = 0; index < 64; index += 1) {
            const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
            const choice = (e & f) ^ (~e & g);
            const temp1 = (h + sum1 + choice + constants[index] + words[index]) >>> 0;
            const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
            const majority = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (sum0 + majority) >>> 0;
            h = g;
            g = f;
            f = e;
            e = (d + temp1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) >>> 0;
        }
        hash[0] = (hash[0] + a) >>> 0;
        hash[1] = (hash[1] + b) >>> 0;
        hash[2] = (hash[2] + c) >>> 0;
        hash[3] = (hash[3] + d) >>> 0;
        hash[4] = (hash[4] + e) >>> 0;
        hash[5] = (hash[5] + f) >>> 0;
        hash[6] = (hash[6] + g) >>> 0;
        hash[7] = (hash[7] + h) >>> 0;
    }
    return `sha256:${hash
        .map((word) => word.toString(16).padStart(8, '0'))
        .join('')}`;
}

/**
 * 计算 SHA-256 摘要（格式与 Host 侧一致：sha256:<hex>）
 * @param {string} value
 * @returns {Promise<string>}
 */
async function sha256Digest(value) {
    if (
        typeof TextEncoder === 'function' &&
        crypto.subtle &&
        typeof crypto.subtle.digest === 'function'
    ) {
        try {
            const bytes = new TextEncoder().encode(value);
            const digest = await crypto.subtle.digest('SHA-256', bytes);
            const hex = Array.from(new Uint8Array(digest), (byte) =>
                byte.toString(16).padStart(2, '0'),
            ).join('');
            return `sha256:${hex}`;
        } catch (_error) {
            // WebView 的 Web Crypto 实现不可用时回退到纯 JS。
        }
    }
    return sha256DigestFallback(value);
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
 * 在 file-preview.html 当前文档中按需加载 Runtime 资源，不再嵌套 iframe。
 * 仅 OpenUI 分支会下载约 3.4 MB 的 runtime.js/runtime.css。
 *
 * @param {string | null} filePath
 * @param {HTMLElement} container
 * @param {boolean} isChat
 * @param {(previewer: { destroy: () => void }) => void} registerPreviewer
 * @param {() => void} onShareExpired
 * @param {object | null} initialArtifact
 * @returns {Promise<void>}
 */
function loadOpenUiRuntimeDirect(
    filePath,
    container,
    isChat,
    registerPreviewer,
    onShareExpired,
    initialArtifact = null,
) {
    const currentUrl = new URL(window.location.href);
    const nonce = currentUrl.searchParams.get('nonce') || crypto.randomUUID();
    currentUrl.searchParams.set('nonce', nonce);
    if (filePath) currentUrl.searchParams.set('file_path', filePath);
    else currentUrl.searchParams.delete('file_path');
    currentUrl.searchParams.set('read_only', isChat ? '0' : '1');
    window.history.replaceState(null, '', currentUrl.toString());

    container.innerHTML = '<div id="root"></div>';

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `/static/openui-runtime/runtime.css?v=${OPENUI_RUNTIME_ASSET_VERSION}`;
    document.head.appendChild(stylesheet);

    let runtimeReady = false;
    let validatedArtifact = initialArtifact;
    let lastSentDigest = '';
    let destroyed = false;
    let startRuntime = () => {};
    const sendLoad = () => {
        if (!runtimeReady || !validatedArtifact || destroyed) return;
        const digest = validatedArtifact.document.digest;
        if (lastSentDigest === digest) return;
        lastSentDigest = digest;
        window.postMessage(
            {
                type: 'OPENUI_LOAD',
                protocolVersion: OPENUI_RUNTIME_PROTOCOL,
                nonce,
                artifact: validatedArtifact,
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
        // 部分小程序 / Android WebView 对同窗口 postMessage 不回填 source。
        // nonce + protocolVersion 已限定为本次 Runtime 会话，因此允许 null；
        // 有明确 source 时仍只接受当前窗口，避免接收外层页面或其它 frame 的消息。
        if (message.source && message.source !== window) return;
        const data = message.data;
        if (
            !data ||
            data.protocolVersion !== OPENUI_RUNTIME_PROTOCOL ||
            data.nonce !== nonce
        ) {
            return;
        }
        if (data.type === 'OPENUI_READY') {
            runtimeReady = true;
            sendLoad();
            return;
        }
        if (data.type === 'OPENUI_FP_ARTIFACT') {
            validateOpenUiArtifact(data.artifact)
                .then((artifact) => {
                    if (destroyed) return;
                    validatedArtifact = artifact;
                    if (typeof artifact.title === 'string' && artifact.title.trim()) {
                        document.title = artifact.title.trim();
                    }
                    if (window.parent === window) startRuntime();
                    sendLoad();
                })
                .catch(() => {
                    if (!destroyed) onShareExpired();
                });
            return;
        }
        if (data.type === 'OPENUI_FP_ERROR') {
            onShareExpired();
            return;
        }
        if (data.type !== 'OPENUI_ACTION') return;
        const actionId =
            data.event && typeof data.event.actionId === 'string'
                ? data.event.actionId
                : '';
        if (isChat) {
            notifyParent({ type: 'OPENUI_ACTION', event: data.event });
        }
        window.postMessage(
            {
                type: 'OPENUI_ACTION_RESULT',
                protocolVersion: OPENUI_RUNTIME_PROTOCOL,
                nonce,
                actionId,
                success: isChat,
                message: isChat
                    ? undefined
                    : 'Share preview is read-only and cannot submit forms.',
            },
            '*',
        );
    };
    window.addEventListener('message', handleMessage);

    registerPreviewer({
        destroy() {
            destroyed = true;
            window.removeEventListener('message', handleMessage);
            stylesheet.remove();
        },
    });

    return new Promise((resolve, reject) => {
        let runtimeStarted = false;
        startRuntime = () => {
            if (runtimeStarted || destroyed) return;
            runtimeStarted = true;
            const runtime = document.createElement('script');
            // runtime.js 是无 import/export 的自执行 bundle。按 classic script 加载，
            // 兼容不执行动态 type=module 的微信小程序与旧 Android WebView。
            runtime.src = `/static/openui-runtime/runtime.js?v=${OPENUI_RUNTIME_ASSET_VERSION}`;
            runtime.onload = () => resolve();
            runtime.onerror = () =>
                reject(new Error('Failed to load OpenUI runtime.'));
            document.body.appendChild(runtime);
        };
        if (!filePath) {
            startRuntime();
            return;
        }
        const bootstrap = document.createElement('script');
        bootstrap.src = `/static/openui-runtime/file-path-bootstrap.js?v=${OPENUI_RUNTIME_ASSET_VERSION}-direct3`;
        bootstrap.onerror = () =>
            reject(new Error('Failed to load OpenUI bootstrap.'));
        bootstrap.onload = () => {
            // iframe 内由外层 Host 校验；顶层则等待本页校验 artifact 后再启动 Runtime。
            if (window.parent !== window) startRuntime();
        };
        document.body.appendChild(bootstrap);
    });
}

/**
 * 将 .openui.json 渲染到 file-preview.html 当前文档（Runtime 资源按需加载）
 * 分享场景无会话连接：表单 onAction 一律回失败，禁止提交回原会话
 *
 * @param {string} url Artifact 文件 URL（可带 sk）
 * @param {HTMLElement} container
 * @param {{
 *   onShareExpired: () => void,
 *   registerPreviewer: (previewer: { destroy: () => void }) => void,
 *   parentManaged?: boolean,
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
    // 从 chat 打开（带 _ticket，有会话）才允许表单提交转发；分享链接（sk）只读。
    const isChat = !!(hooks && hooks.isChat);
    const parentManaged = !!(hooks && hooks.parentManaged);

    container.className = 'preview-container html-preview';

    // file_path 自主拉取模式：能从 url 提取出 /api/computer/static 之后的相对路径时，
    // 交给 iframe 内 inline script 同源拉取（带得上 sk/cookie），结果经 relay 回本页转发。
    // 提取失败（url 非 /api/computer/static 格式）则回退到本页自拉。
    const filePath = extractOpenUiFilePath(url);
    let artifact = null;

    // 所有 OpenUI 页面入口统一为 file-preview.html；当前文档按需加载 Runtime 重资源。
    // parentManaged 用于 PC sidecar：外层组件负责向本窗口发送 OPENUI_LOAD。
    if (filePath || parentManaged) {
        await loadOpenUiRuntimeDirect(
            filePath,
            container,
            isChat,
            registerPreviewer,
            onShareExpired,
        );
        return;
    }

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
    await loadOpenUiRuntimeDirect(
        null,
        container,
        isChat,
        registerPreviewer,
        onShareExpired,
        artifact,
    );
}
