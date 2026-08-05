#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="$PROJECT_ROOT/public/static/openui-runtime"

# 运行时资源已从 @nuwax-ai/openui-mcp 拆到独立的 @nuwax-ai/openui-runtime 包。
# 该包没有 exports 字段，故可直接 resolve 其 package.json 得到包根目录。
if ! OPENUI_RUNTIME_DIR="$(${NODE_BINARY:-node} --input-type=module -e '
  import path from "node:path";
  import { fileURLToPath } from "node:url";
  const pkgJson = fileURLToPath(import.meta.resolve("@nuwax-ai/openui-runtime/package.json"));
  process.stdout.write(path.resolve(path.dirname(pkgJson)));
' 2>/dev/null)"; then
  echo "Unable to resolve @nuwax-ai/openui-runtime. Run pnpm install first." >&2
  exit 1
fi

SOURCE_DIR="$OPENUI_RUNTIME_DIR/dist"
for file in runtime.js runtime.css; do
  if [[ ! -f "$SOURCE_DIR/$file" ]]; then
    echo "Missing $SOURCE_DIR/$file. Reinstall @nuwax-ai/openui-runtime." >&2
    exit 1
  fi
done

PACKAGE_VERSION="$(${NODE_BINARY:-node} --input-type=module -e '
  import fs from "node:fs";
  import path from "node:path";
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.argv[1], "package.json"), "utf8"));
  process.stdout.write(packageJson.version);
' "$OPENUI_RUNTIME_DIR")"

mkdir -p "$TARGET_DIR"
cp "$SOURCE_DIR/runtime.js" "$TARGET_DIR/runtime.js"
cp "$SOURCE_DIR/runtime.css" "$TARGET_DIR/runtime.css"
# uni.webview JSSDK 由 nuwax 自维为全站唯一副本 /static/uni.webview.1.5.5.js（不在 runtime 包内），
# 由 index.html 无条件加载；sync 不再从 runtime 包复制 uni-webview.js（runtime 已保持纯粹）。

# file-path-bootstrap.js 由 nuwax 自维（不在 openui-runtime dist 内），同步时不得覆盖。
if [[ ! -f "$TARGET_DIR/file-path-bootstrap.js" ]]; then
  echo "Missing $TARGET_DIR/file-path-bootstrap.js (nuwax-owned). Restore it before sync." >&2
  exit 1
fi

# 用包版本改写 index.html 的 js/css 查询参数，避免浏览器缓存旧资源。
# file_path 逻辑在外部 file-path-bootstrap.js，不再内联（避免 heredoc 与模板字符串冲突）。
cat > "$TARGET_DIR/index.html" <<'HTML_EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="referrer" content="no-referrer" />
    <title>OpenUI Runtime</title>
    <!-- v 与 @nuwax-ai/openui-runtime 包版本对齐，由 sync:openui-runtime 自动写入 -->
    <link rel="stylesheet" href="./runtime.css?v=__OPENUI_VERSION__" />
  </head>
  <body>
    <div id="root"></div>
    <!-- 微信小程序旧 WebView 可能缺少 crypto.randomUUID；须先于 bootstrap/runtime 加载。 -->
    <script src="/static/openui-crypto-compat.js?v=2026.8.3"></script>
    <!-- file_path 自主拉取（nuwax 自维）；须在 runtime.js 之前加载 -->
    <script src="./file-path-bootstrap.js?v=__OPENUI_VERSION__"></script>
    <!-- 官方 uni.webview JSSDK（nuwax 仓 /static/uni.webview.1.5.5.js，全站唯一副本），无条件加载。
         加载本身无害：仅顶层 webview 的 bootstrap relay 会调用 uni.webView.postMessage；iframe 里
         relay 不运行，runtime 经 window.parent.postMessage 直达 Host。runtime 不引用 JSSDK，保持纯粹。 -->
    <script src="/static/uni.webview.1.5.5.js"></script>
    <script>
      // bootstrap relay：仅顶层 webview（App 原生 / 小程序，window.parent===window）生效。
      // runtime 只发标准 postMessage，回环到本窗后由此转发到 <web-view> @message。
      if (window.parent === window) {
        var relayQueue = [];
        var relayReady = false;
        function openuiFlushRelay() {
          if (!relayReady) return;
          var post = window.uni && window.uni.webView && window.uni.webView.postMessage;
          if (!post) return;
          // uni-app x Android 仅稳定支持对象 payload；原生 event.detail.data
          // 会自行包装为消息数组，这里不能再预先包一层数组。
          while (relayQueue.length) post({ data: relayQueue.shift() });
        }
        window.addEventListener('message', function (ev) {
          var d = ev.data;
          if (!d || d.protocolVersion !== 'nuwax.openui-runtime/v1') return;
          if (!/^(OPENUI_READY|OPENUI_RESIZE|OPENUI_ACTION|OPENUI_ERROR)$/.test(d.type || ''))
            return;
          relayQueue.push(d);
          openuiFlushRelay();
        });
        function openuiMarkReady() {
          relayReady = true;
          openuiFlushRelay();
        }
        document.addEventListener('UniAppJSBridgeReady', openuiMarkReady);
        // JSSDK 已同步加载（先于本段执行）；桥直连则立即放行，否则限时兜底。
        if (window.uni && window.uni.webView && window.uni.webView.postMessage) openuiMarkReady();
        else window.setTimeout(openuiMarkReady, 1500);
      }
    </script>
    <script type="module" src="./runtime.js?v=__OPENUI_VERSION__"></script>
  </body>
</html>
HTML_EOF

# 版本号通过占位符替换写入（-i.bak 兼容 macOS bsd sed 与 Linux gnu sed）
sed -i.bak "s/__OPENUI_VERSION__/${PACKAGE_VERSION}/g" "$TARGET_DIR/index.html" && rm -f "$TARGET_DIR/index.html.bak"

echo "OpenUI Runtime $PACKAGE_VERSION synchronized from installed @nuwax-ai/openui-runtime to $TARGET_DIR"
echo "Kept nuwax-owned file-path-bootstrap.js (not overwritten)."
