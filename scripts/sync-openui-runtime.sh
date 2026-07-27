#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="$PROJECT_ROOT/public/static/openui-runtime"

if ! OPENUI_MCP_DIR="$(${NODE_BINARY:-node} --input-type=module -e '
  import path from "node:path";
  import { fileURLToPath } from "node:url";
  const entry = fileURLToPath(import.meta.resolve("@nuwax-ai/openui-mcp"));
  process.stdout.write(path.resolve(path.dirname(entry), "../.."));
' 2>/dev/null)"; then
  echo "Unable to resolve @nuwax-ai/openui-mcp. Run pnpm install first." >&2
  exit 1
fi

SOURCE_DIR="$OPENUI_MCP_DIR/dist/web"
for file in runtime.js runtime.css; do
  if [[ ! -f "$SOURCE_DIR/$file" ]]; then
    echo "Missing $SOURCE_DIR/$file. Reinstall @nuwax-ai/openui-mcp." >&2
    exit 1
  fi
done

PACKAGE_VERSION="$(${NODE_BINARY:-node} --input-type=module -e '
  import fs from "node:fs";
  import path from "node:path";
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.argv[1], "package.json"), "utf8"));
  process.stdout.write(packageJson.version);
' "$OPENUI_MCP_DIR")"

mkdir -p "$TARGET_DIR"
cp "$SOURCE_DIR/runtime.js" "$TARGET_DIR/runtime.js"
cp "$SOURCE_DIR/runtime.css" "$TARGET_DIR/runtime.css"

# 用包版本改写 index.html 的 js/css 查询参数，避免浏览器缓存旧资源
cat > "$TARGET_DIR/index.html" <<EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="referrer" content="no-referrer" />
    <title>OpenUI Runtime</title>
    <!-- v 与 @nuwax-ai/openui-mcp 包版本对齐，由 sync:openui-runtime 自动写入 -->
    <link rel="stylesheet" href="./runtime.css?v=${PACKAGE_VERSION}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./runtime.js?v=${PACKAGE_VERSION}"></script>
  </body>
</html>
EOF

echo "OpenUI Runtime $PACKAGE_VERSION synchronized from installed @nuwax-ai/openui-mcp to $TARGET_DIR"
