#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="$PROJECT_ROOT/public/static/openui-runtime"
PREVIEW_OPENUI_JS="$PROJECT_ROOT/public/static/file-preview/file-preview-openui.js"
PREVIEW_HTML="$PROJECT_ROOT/public/static/file-preview.html"

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
# 由 file-preview.html 无条件加载；sync 不再从 runtime 包复制 uni-webview.js。

# 动态加载器与 HTML 对加载器的缓存键必须跟随 Runtime 包版本，避免升级后继续命中旧资源。
sed -E -i.bak \
  "s/const OPENUI_RUNTIME_ASSET_VERSION = '[^']+';/const OPENUI_RUNTIME_ASSET_VERSION = '${PACKAGE_VERSION}';/" \
  "$PREVIEW_OPENUI_JS" && rm -f "$PREVIEW_OPENUI_JS.bak"
sed -E -i.bak \
  "s#file-preview/file-preview-openui.js\?v=[^\"]+#file-preview/file-preview-openui.js?v=runtime-${PACKAGE_VERSION}#" \
  "$PREVIEW_HTML" && rm -f "$PREVIEW_HTML.bak"

if ! grep -q "OPENUI_RUNTIME_ASSET_VERSION = '${PACKAGE_VERSION}'" "$PREVIEW_OPENUI_JS"; then
  echo "Failed to update Runtime version in $PREVIEW_OPENUI_JS" >&2
  exit 1
fi

# file-path-bootstrap.js 由 nuwax 自维（不在 openui-runtime dist 内），同步时不得覆盖。
if [[ ! -f "$TARGET_DIR/file-path-bootstrap.js" ]]; then
  echo "Missing $TARGET_DIR/file-path-bootstrap.js (nuwax-owned). Restore it before sync." >&2
  exit 1
fi

# 旧入口仅保留轻量跳转，兼容历史收藏/缓存；新业务不得引用。
cat > "$TARGET_DIR/index.html" <<'HTML_EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenUI compatibility redirect</title>
  </head>
  <body>
    <script>
      window.location.replace(
        '/static/file-preview.html?openui=1' +
          (window.location.search ? '&' + window.location.search.slice(1) : '') +
          window.location.hash,
      );
    </script>
  </body>
</html>
HTML_EOF

echo "OpenUI Runtime $PACKAGE_VERSION synchronized from installed @nuwax-ai/openui-runtime to $TARGET_DIR"
echo "Kept nuwax-owned file-path-bootstrap.js (not overwritten)."
