/* eslint-disable no-console */
const { execSync } = require('child_process');
const TEXT_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const IGNORE_PATH_RE =
  /(^docs\/)|(^tests\/)|(^src\/locales\/)|(^dist\/)|(^node_modules\/)/;
const CHINESE_STRING_RE = /(['"`])([^'"`]*[\u4e00-\u9fa5][^'"`]*)\1/g;
const LEGACY_SYSTEM_KEY_RE = /\bSystem\.[A-Za-z0-9_.]+\b/;
const DICT_KEY_RE = /dict\(\s*(['"`])([^'"`]+)\1/g;
const I18N_KEY_RE =
  /^(PC|Mobile|Claw)\.(Pages|Components|Toast|Modal|Common|Hooks|Layouts|Models)\.([A-Za-z0-9]+\.)+[a-z][A-Za-z0-9]*$/;
const LEGACY_KEY_ALLOW_FILES = new Set([
  'src/services/i18nRuntime.ts',
  'scripts/check-hardcoded-i18n.js',
  'scripts/i18n-governance-report.js',
]);

function getDiffText() {
  const commands = [
    'git diff --unified=0 --no-color --diff-filter=ACMRTUXB',
    'git diff --cached --unified=0 --no-color --diff-filter=ACMRTUXB',
  ];
  const chunks = [];

  commands.forEach((cmd) => {
    try {
      const output = execSync(cmd, { encoding: 'utf8' }).trim();
      if (!output) return;
      chunks.push(output);
    } catch {
      // ignore git command failures
    }
  });

  return chunks.join('\n');
}

function scanAddedLines(diffText) {
  const lines = diffText.split('\n');
  const hardcodedFindings = [];
  const legacyKeyFindings = [];
  const invalidKeyFindings = [];
  let currentFile = '';
  let currentLine = 0;

  lines.forEach((line) => {
    if (line.startsWith('+++ b/')) {
      currentFile = line.replace('+++ b/', '').trim();
      return;
    }

    if (line.startsWith('@@')) {
      const match = line.match(/\+(\d+)(?:,(\d+))?/);
      currentLine = match ? Number(match[1]) : currentLine;
      return;
    }

    if (!currentFile || !TEXT_FILE_RE.test(currentFile)) return;
    if (IGNORE_PATH_RE.test(currentFile)) return;

    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.slice(1);
      CHINESE_STRING_RE.lastIndex = 0;
      if (CHINESE_STRING_RE.test(content)) {
        hardcodedFindings.push({
          file: currentFile,
          line: currentLine,
          content: content.trim(),
        });
      }

      LEGACY_SYSTEM_KEY_RE.lastIndex = 0;
      if (
        LEGACY_SYSTEM_KEY_RE.test(content) &&
        !LEGACY_KEY_ALLOW_FILES.has(currentFile)
      ) {
        legacyKeyFindings.push({
          file: currentFile,
          line: currentLine,
          content: content.trim(),
        });
      }

      DICT_KEY_RE.lastIndex = 0;
      let dictMatch = DICT_KEY_RE.exec(content);
      while (dictMatch) {
        const i18nKey = dictMatch[2];
        if (!I18N_KEY_RE.test(i18nKey)) {
          invalidKeyFindings.push({
            file: currentFile,
            line: currentLine,
            content: i18nKey,
          });
        }
        dictMatch = DICT_KEY_RE.exec(content);
      }

      currentLine += 1;
      return;
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      return;
    }

    CHINESE_STRING_RE.lastIndex = 0;
    currentLine += 1;
  });

  return { hardcodedFindings, legacyKeyFindings, invalidKeyFindings };
}

function main() {
  const diffText = getDiffText();
  if (!diffText) {
    console.log('[i18n-check] No changes to scan.');
    return;
  }

  const { hardcodedFindings, legacyKeyFindings, invalidKeyFindings } =
    scanAddedLines(diffText);

  if (
    !hardcodedFindings.length &&
    !legacyKeyFindings.length &&
    !invalidKeyFindings.length
  ) {
    console.log('[i18n-check] Added lines passed i18n governance checks.');
    return;
  }

  if (hardcodedFindings.length) {
    console.error('[i18n-check] Found hardcoded Chinese strings:');
    hardcodedFindings.forEach((item) => {
      console.error(`- ${item.file}:${item.line} ${item.content}`);
    });
  }

  if (legacyKeyFindings.length) {
    console.error('[i18n-check] Found legacy System.* keys in added lines:');
    legacyKeyFindings.forEach((item) => {
      console.error(`- ${item.file}:${item.line} ${item.content}`);
    });
  }

  if (invalidKeyFindings.length) {
    console.error(
      '[i18n-check] Found invalid dict keys (must be {Client}.{Scope}.{Domain}.{key}):',
    );
    invalidKeyFindings.forEach((item) => {
      console.error(`- ${item.file}:${item.line} ${item.content}`);
    });
  }

  process.exit(1);
}

main();
