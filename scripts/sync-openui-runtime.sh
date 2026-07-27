#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="$PROJECT_ROOT/public/openui-runtime"

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

echo "OpenUI Runtime $PACKAGE_VERSION synchronized from installed @nuwax-ai/openui-mcp to $TARGET_DIR"
