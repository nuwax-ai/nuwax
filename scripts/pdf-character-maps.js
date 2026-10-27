const fs = require('node:fs');
const path = require('node:path');

/** 与预览器内嵌的 PDF.js 配对，映射作为 JS 数据入包，不在断网预览时请求 CDN。 */
function readPdfCharacterMaps() {
  const root = path.join(
    path.dirname(require.resolve('pdfjs-dist/package.json')),
    'cmaps',
  );
  return Object.fromEntries(
    fs
      .readdirSync(root)
      .filter((name) => name.endsWith('.bcmap'))
      .sort()
      .map((name) => [
        name.slice(0, -'.bcmap'.length),
        fs.readFileSync(path.join(root, name)).toString('base64'),
      ]),
  );
}

exports.readPdfCharacterMaps = readPdfCharacterMaps;
