const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['src'];
const EXT_RE = /\.(ts|tsx|js|jsx)$/;
// Match "PC." or 'PC.' or `PC.` followed by a valid module namespace.
const SEARCH_RE =
  /(['"`])NuwaxPC\.(Pages|Components|Toast|Modal|Common|Hooks|Layouts|Models)\./g;
const REPLACE_STR = '$1PC.$2.';

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    // Avoid large unneeded dirs just in case
    if (['node_modules', '.umi', '.umi-production'].includes(entry.name))
      continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverse(fullPath);
    } else if (entry.isFile() && EXT_RE.test(entry.name)) {
      processFile(fullPath);
    }
  }
}

let modifiedCount = 0;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (SEARCH_RE.test(content)) {
    // Reset regex index before replace
    SEARCH_RE.lastIndex = 0;
    const newContent = content.replace(SEARCH_RE, REPLACE_STR);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modifiedCount++;
    }
  }
}

TARGET_DIRS.forEach((dir) => traverse(path.join(process.cwd(), dir)));
console.log(`[fix-i18n-keys] Done. Modified ${modifiedCount} files.`);
