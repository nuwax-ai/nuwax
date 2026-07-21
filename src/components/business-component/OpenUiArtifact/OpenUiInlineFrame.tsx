import type React from 'react';
import styles from './index.less';
import type { OpenUiInlineArtifact } from './types';

const OPENUI_BUNDLE_URL =
  'https://cdn.jsdelivr.net/npm/@openuidev/browser-bundle@0.1.1/dist/openui-bundle.min.js';
const OPENUI_STYLES_URL =
  'https://cdn.jsdelivr.net/npm/@openuidev/browser-bundle@0.1.1/dist/openui-styles.css';

interface OpenUiInlineFrameProps {
  artifact: OpenUiInlineArtifact;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createSrcDoc(artifact: OpenUiInlineArtifact): string {
  const code = JSON.stringify(artifact.openuiLang).replace(/</g, '\\u003c');
  const title = escapeHtml(artifact.title);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="${OPENUI_STYLES_URL}" />
    <style>html,body,#root{margin:0;min-height:100%;background:transparent}body{padding:8px;box-sizing:border-box}</style>
  </head>
  <body>
    <div id="root" aria-label="${title}"></div>
    <script src="${OPENUI_BUNDLE_URL}"></script>
    <script>
      (function () {
        var root = document.getElementById('root');
        var code = ${code};
        try {
          var OpenUI = window.__OpenUI;
          if (!OpenUI) throw new Error('OpenUI bundle failed to load');
          var library = OpenUI.openuiChatLibrary;
          OpenUI.createRoot(root).render(
            OpenUI.React.createElement(OpenUI.Renderer, {
              response: code,
              library: library,
              isStreaming: false,
              onError: function (errors) {
                if (errors && errors.length) {
                  root.textContent = 'OpenUI 语法或组件校验失败：' + errors.map(function (error) {
                    return error.message || error.code || String(error);
                  }).join('；');
                }
              }
            })
          );
        } catch (error) {
          root.textContent = 'OpenUI 组件加载失败：' + (error && error.message ? error.message : String(error));
        }
      })();
    </script>
  </body>
</html>`;
}

const OpenUiInlineFrame: React.FC<OpenUiInlineFrameProps> = ({ artifact }) => (
  <section className={styles.inlineArtifact} aria-label={artifact.title}>
    <div className={styles.artifactTitle}>{artifact.title}</div>
    <iframe
      key={`${artifact.artifactId}-${artifact.revision}`}
      className={styles.inlineFrame}
      title={artifact.title}
      sandbox="allow-scripts"
      srcDoc={createSrcDoc(artifact)}
    />
  </section>
);

export default OpenUiInlineFrame;
