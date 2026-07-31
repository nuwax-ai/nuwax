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
for file in runtime.js runtime.css uni-webview.js; do
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
cp "$SOURCE_DIR/uni-webview.js" "$TARGET_DIR/uni-webview.js"

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
    <!-- file_path 自主拉取（nuwax 自维）；须在 runtime.js 之前加载 -->
    <script src="./file-path-bootstrap.js?v=__OPENUI_VERSION__"></script>
    <!-- 仅在 uni-app / App webview 加载 uni webview JSSDK：runtime 经 window.uni.postMessage
         把 OPENUI_RESIZE 等桥接到 App <web-view> @message；PC web 不需要、不加载（避免 JSSDK
         把 payload 包进 WEB_INVOKE_APPSERVICE 破坏 Host 直收 OPENUI_*）。 -->
    <script>
      if (window.__dcloud_weex_postMessage || window.__dcloud_weex_ || window.plus || /uni-app|Html5Plus|nuwax|nuwa/i.test(navigator.userAgent)) {
        document.write('<script src="./uni-webview.js?v=__OPENUI_VERSION__"><\/script>');
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
