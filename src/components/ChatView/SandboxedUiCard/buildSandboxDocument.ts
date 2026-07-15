import type { SandboxedUiArtifact } from './types';

const escapeScript = (value = '') => value.replace(/<\/script/gi, '<\\/script');
const escapeStyle = (value = '') => value.replace(/<\/style/gi, '<\\/style');

export const clampSandboxHeight = (height?: number) => {
  const value = Number(height) || 360;
  return Math.max(160, Math.min(900, value));
};

export const buildSandboxDocument = (artifact: SandboxedUiArtifact) => {
  const artifactId = JSON.stringify(artifact.id || '');
  const heightReporter = `
    (function () {
      var reportHeight = function () {
        var height = Math.ceil(document.documentElement.scrollHeight || document.body.scrollHeight || 160);
        parent.postMessage({ type: 'sandbox_ui_resize', artifactId: ${artifactId}, height: height }, '*');
      };
      new ResizeObserver(reportHeight).observe(document.documentElement);
      window.addEventListener('load', reportHeight);
      requestAnimationFrame(reportHeight);
    })();
  `;

  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; media-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'" />
<style>html,body{margin:0;padding:0;overflow:hidden}*,*:before,*:after{box-sizing:border-box}${escapeStyle(
    artifact.css,
  )}</style>
</head><body>${artifact.html}<script>${escapeScript(
    artifact.js,
  )}\n${heightReporter}</script></body></html>`;
};
