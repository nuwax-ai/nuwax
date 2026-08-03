/**
 * openui-runtime/file-path-bootstrap.js
 *
 * Runtime 子页侧：?file_path= 自主拉取 .openui.json，再喂给 runtime.js。
 * - iframe（sidecar）：relay OPENUI_FP_ARTIFACT / OPENUI_FP_ERROR 给 parent。
 * - 顶层窗口：把相同消息 relay 给本窗。
 * Host 统一负责校验，并在 Runtime OPENUI_READY 后发送 OPENUI_LOAD。
 * - 无 file_path：立即 return，沿用 parent postMessage 下发。
 *
 * 本文件由 nuwax 仓库维护，sync:openui-runtime 不会用 mcp 包覆盖它。
 * Parent Host 实现见：/static/file-preview/file-preview-openui.js 与 OpenUiRuntimeFrame。
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  const filePath = params.get('file_path');
  const nonce = params.get('nonce') || '';
  if (!filePath) return;

  const PROTOCOL = 'nuwax.openui-runtime/v1';
  const fetchUrl = `${window.location.origin}/api/computer/static${filePath}`;
  const baseLoad = {
    protocolVersion: PROTOCOL,
    nonce,
    locale: document.documentElement.lang || navigator.language || 'en',
    theme: 'light',
    viewport: window.matchMedia('(max-width: 767px)').matches
      ? 'mobile'
      : 'desktop',
  };

  fetch(fetchUrl, { cache: 'no-store', credentials: 'same-origin' })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`OpenUI file request failed (${res.status}).`);
      }
      return res.json();
    })
    .then((artifact) => {
      if (artifact && typeof artifact.title === 'string' && artifact.title.trim()) {
        document.title = artifact.title.trim();
      }
      const target = window.parent === window ? window : window.parent;
      target.postMessage(
        { type: 'OPENUI_FP_ARTIFACT', ...baseLoad, artifact },
        '*',
      );
    })
    .catch((err) => {
      const message = err && err.message ? err.message : String(err);
      const target = window.parent === window ? window : window.parent;
      target.postMessage(
        { type: 'OPENUI_FP_ERROR', ...baseLoad, message },
        '*',
      );
    });
})();
