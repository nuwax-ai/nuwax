/**
 * openui-runtime/file-path-bootstrap.js
 *
 * Runtime 子页侧：?file_path= 自主拉取 .openui.json，再喂给 runtime.js。
 * - iframe（sidecar / 分享页）：relay OPENUI_FP_ARTIFACT / OPENUI_FP_ERROR 给 parent，
 *   由 parent Host 校验后转发 OPENUI_LOAD（runtime.js 要求 source === window.parent）。
 * - 顶层窗口：等 OPENUI_READY 后再对本窗发 OPENUI_LOAD。
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
      if (window.parent === window) {
        // 顶层：runtime.js listener 在 React mount 后才注册，需等 OPENUI_READY
        let delivered = false;
        const postLoad = () => {
          if (delivered) return;
          delivered = true;
          window.postMessage(
            { type: 'OPENUI_LOAD', ...baseLoad, artifact },
            '*',
          );
          window.removeEventListener('message', onReady);
        };
        const onReady = (ev) => {
          const d = ev.data;
          if (
            ev.source === window &&
            d &&
            d.protocolVersion === PROTOCOL &&
            d.nonce === nonce &&
            d.type === 'OPENUI_READY'
          ) {
            postLoad();
          }
        };
        window.addEventListener('message', onReady);
        // 兜底：OPENUI_READY 可能早于监听注册到达
        setTimeout(postLoad, 1500);
      } else {
        // iframe：relay 给 parent，由其转发 OPENUI_LOAD
        window.parent.postMessage(
          { type: 'OPENUI_FP_ARTIFACT', ...baseLoad, artifact },
          '*',
        );
      }
    })
    .catch((err) => {
      const message = err && err.message ? err.message : String(err);
      if (window.parent === window) {
        console.error('[OpenUI runtime] file_path fetch failed:', message);
      } else {
        window.parent.postMessage(
          { type: 'OPENUI_FP_ERROR', ...baseLoad, message },
          '*',
        );
      }
    });
})();
