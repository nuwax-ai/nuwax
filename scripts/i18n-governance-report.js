/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const SCAN_DIRS = [
  'src/pages',
  'src/components',
  'src/layouts',
  'src/hooks',
  'src/models',
  'src/services',
];

const TEXT_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const CHINESE_STRING_RE = /(['"`])([^'"`]*[\u4e00-\u9fa5][^'"`]*)\1/g;
const LEGACY_SYSTEM_KEY_RE = /\bSystem\.[A-Za-z0-9_.]+\b/g;
const DICT_KEY_RE = /dict\(\s*(['"`])([^'"`]+)\1/g;
const I18N_KEY_RE =
  /^(PC|Mobile|Claw)\.(Pages|Components|Toast|Modal|Common|Hooks|Layouts|Models)\.([A-Za-z0-9]+\.)+[a-z][A-Za-z0-9]*$/;

const OUTPUT_FILE = path.join(
  process.cwd(),
  'docs/ch/i18n/saas-20260410-inventory.md',
);

function walkFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, fileList);
      return;
    }
    if (entry.isFile() && TEXT_FILE_RE.test(entry.name)) {
      fileList.push(fullPath);
    }
  });
  return fileList;
}

function toModuleName(filePath) {
  const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const parts = rel.split('/');
  if (parts.length < 2) return rel;
  if (parts[0] !== 'src') return rel;
  if (parts.length < 3) return rel;
  const [root, layer, module] = parts;
  if (['pages', 'components', 'layouts'].includes(layer)) {
    return `${root}/${layer}/${module || '(root)'}`;
  }
  return `${root}/${layer}`;
}

function pushIssue(target, moduleName, issue) {
  if (!target[moduleName]) {
    target[moduleName] = [];
  }
  target[moduleName].push(issue);
}

function scanFile(filePath, issuesByModule) {
  const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const moduleName = toModuleName(filePath);
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const lineNo = index + 1;

    CHINESE_STRING_RE.lastIndex = 0;
    let zhMatch = CHINESE_STRING_RE.exec(line);
    while (zhMatch) {
      pushIssue(issuesByModule, moduleName, {
        type: 'hardcoded_chinese',
        file: rel,
        line: lineNo,
        detail: zhMatch[2],
      });
      zhMatch = CHINESE_STRING_RE.exec(line);
    }

    LEGACY_SYSTEM_KEY_RE.lastIndex = 0;
    let legacyMatch = LEGACY_SYSTEM_KEY_RE.exec(line);
    while (legacyMatch) {
      pushIssue(issuesByModule, moduleName, {
        type: 'legacy_system_key',
        file: rel,
        line: lineNo,
        detail: legacyMatch[0],
      });
      legacyMatch = LEGACY_SYSTEM_KEY_RE.exec(line);
    }

    DICT_KEY_RE.lastIndex = 0;
    let dictMatch = DICT_KEY_RE.exec(line);
    while (dictMatch) {
      const key = dictMatch[2];
      if (!I18N_KEY_RE.test(key)) {
        pushIssue(issuesByModule, moduleName, {
          type: 'invalid_dict_key',
          file: rel,
          line: lineNo,
          detail: key,
        });
      }
      dictMatch = DICT_KEY_RE.exec(line);
    }
  });
}

function groupCount(issues, type) {
  return issues.reduce((count, item) => {
    if (item.type === type) return count + 1;
    return count;
  }, 0);
}

function renderMarkdown(issuesByModule) {
  const moduleNames = Object.keys(issuesByModule);
  const rows = moduleNames
    .map((moduleName) => {
      const issues = issuesByModule[moduleName];
      const hardcoded = groupCount(issues, 'hardcoded_chinese');
      const legacy = groupCount(issues, 'legacy_system_key');
      const invalid = groupCount(issues, 'invalid_dict_key');
      const total = hardcoded + legacy + invalid;
      return { moduleName, hardcoded, legacy, invalid, total };
    })
    .sort((a, b) => b.total - a.total);

  const totalHardcoded = rows.reduce((sum, item) => sum + item.hardcoded, 0);
  const totalLegacy = rows.reduce((sum, item) => sum + item.legacy, 0);
  const totalInvalid = rows.reduce((sum, item) => sum + item.invalid, 0);
  const totalAll = totalHardcoded + totalLegacy + totalInvalid;

  const lines = [];
  lines.push('# 多语言治理全量扫描报告（SAAS 2026-04-10）');
  lines.push('');
  lines.push(`- 生成时间：${new Date().toISOString()}`);
  lines.push(`- 扫描范围：${SCAN_DIRS.join(', ')}`);
  lines.push(
    '- 规则：hardcoded 中文字符串 / legacy `System.*` key / invalid `dict()` key 格式',
  );
  lines.push('');
  lines.push('## 汇总');
  lines.push('');
  lines.push(`- 总问题数：${totalAll}`);
  lines.push(`- hardcoded 中文：${totalHardcoded}`);
  lines.push(`- legacy System key：${totalLegacy}`);
  lines.push(`- invalid dict key：${totalInvalid}`);
  lines.push('');
  lines.push('## 按模块统计');
  lines.push('');
  lines.push('| 模块 | hardcoded中文 | legacyKey | invalidKey | 总计 |');
  lines.push('| --- | ---: | ---: | ---: | ---: |');
  rows.forEach((row) => {
    lines.push(
      `| ${row.moduleName} | ${row.hardcoded} | ${row.legacy} | ${row.invalid} | ${row.total} |`,
    );
  });

  rows
    .filter((row) => row.total > 0)
    .slice(0, 30)
    .forEach((row) => {
      lines.push('');
      lines.push(`## ${row.moduleName}`);
      lines.push('');
      const issues = issuesByModule[row.moduleName];
      issues.slice(0, 80).forEach((item) => {
        lines.push(
          `- [${item.type}] ${item.file}:${item.line} -> \`${item.detail}\``,
        );
      });
      if (issues.length > 80) {
        lines.push(`- ... 省略 ${issues.length - 80} 条`);
      }
    });

  lines.push('');
  return lines.join('\n');
}

function main() {
  const issuesByModule = {};
  const files = SCAN_DIRS.flatMap((dir) =>
    walkFiles(path.join(process.cwd(), dir)),
  );
  files.forEach((file) => {
    scanFile(file, issuesByModule);
  });

  const markdown = renderMarkdown(issuesByModule);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf8');

  const modules = Object.keys(issuesByModule);
  const total = modules.reduce(
    (sum, moduleName) => sum + issuesByModule[moduleName].length,
    0,
  );
  console.log(`[i18n-report] scanned files: ${files.length}`);
  console.log(`[i18n-report] modules with findings: ${modules.length}`);
  console.log(`[i18n-report] total findings: ${total}`);
  console.log(
    `[i18n-report] output: ${path.relative(process.cwd(), OUTPUT_FILE)}`,
  );
}

main();
