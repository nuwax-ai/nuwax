#!/usr/bin/env node
/**
 * i18n 多语言同步对比工具
 *
 * 对比平台导出的完整 i18n JSON 与本地 locale 文件，生成新增/修改的差异 JSON。
 * 仅处理 PC.* 前缀的 key。支持 zh-CN / en-US / zh-TW 三种语言。
 *
 * 用法：
 *   node scripts/sync-i18n-diff.js --lang zh-CN --source ./i18n-config-zh-CN.json
 *   node scripts/sync-i18n-diff.js --lang en-US --source ./i18n-config-export.json --batch-size 100
 *
 * 输出文件（在 source 同目录）：
 *   - i18n-diff-{lang}-added.json     新增的 key
 *   - i18n-diff-{lang}-modified.json  值有变化的 key
 */

const fs = require('fs');
const path = require('path');

// ── 参数解析 ──────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { lang: 'zh-CN', batchSize: 0 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--lang':
        opts.lang = args[++i];
        break;
      case '--source':
        opts.source = args[++i];
        break;
      case '--batch-size':
        opts.batchSize = parseInt(args[++i], 10) || 0;
        break;
      case '--help':
      case '-h':
        console.log(`
i18n 多语言同步对比工具

对比平台导出的完整 i18n JSON 与本地 locale 文件，生成新增/修改的差异 JSON。
仅处理 PC.* 前缀的 key，支持 zh-CN / en-US / zh-TW 三种语言。

用法:
  node scripts/sync-i18n-diff.js --lang <语言> --source <导出文件> [--batch-size <数量>]

参数:
  --lang <lang>        目标语言: zh-CN | en-US | zh-TW (默认 zh-CN)
  --source <file>      平台导出的 JSON 文件路径
  --batch-size <n>     分批大小 (0 = 不分批，默认 0)
  -h, --help           显示帮助

示例:
  # zh-CN 对比（不分批）
  node scripts/sync-i18n-diff.js --lang zh-CN --source .temp/i18n-platform/source/i18n-config-zh-CN.json

  # en-US 对比，每批 100 个
  node scripts/sync-i18n-diff.js --lang en-US --source .temp/i18n-platform/source/i18n-config-en-US.json --batch-size 100

  # zh-TW 对比，每批 100 个
  node scripts/sync-i18n-diff.js --lang zh-TW --source .temp/i18n-platform/source/i18n-config-zh-TW.json --batch-size 100

输出:
  差异 JSON 输出到 source 文件同目录下:
    i18n-diff-{lang}-added.json              新增的 key
    i18n-diff-{lang}-modified.json           值有变化的 key
    i18n-diff-{lang}-modified-N-of-M.json    分批输出（--batch-size > 0 时）
`);
        process.exit(0);
    }
  }
  if (!opts.source) {
    console.error('Error: --source is required');
    process.exit(1);
  }
  return opts;
}

const LANG_FILE_MAP = {
  'zh-CN': 'zh-CN.ts',
  'en-US': 'en-US.ts',
  'zh-TW': 'zh-TW.ts',
};

// ── 解析平台导出 JSON ────────────────────────────────────

function parseExport(filePath, targetLang) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const configs = raw.configs || raw;
  const map = {};
  for (const c of configs) {
    if (c.lang !== targetLang) continue;
    const key = c.fieldKey;
    if (!key || !key.startsWith('PC.')) continue;
    map[key] = c.fieldValue;
  }
  return map;
}

// ── 解析本地 locale TS 文件 ──────────────────────────────

function parseLocaleFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const map = {};
  // 匹配 "PC.xxx": "value" 或 "PC.xxx": 'value'
  const re = /^[\s]*"(PC\.[^"]+)":\s*"((?:[^"\\]|\\.)*)"/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

// ── 对比 ──────────────────────────────────────────────────

function diffKeys(exportMap, localMap) {
  const added = {};
  const modified = {};
  const localOnly = {};

  for (const [key, value] of Object.entries(exportMap)) {
    if (!(key in localMap)) {
      added[key] = value;
    } else if (localMap[key] !== value) {
      modified[key] = { local: localMap[key], remote: value };
    }
  }

  // 本地有但平台没有的 key
  for (const [key, value] of Object.entries(localMap)) {
    if (!(key in exportMap)) {
      localOnly[key] = value;
    }
  }

  return { added, modified, localOnly };
}

// ── 分批 ──────────────────────────────────────────────────

function splitBatches(obj, batchSize) {
  const entries = Object.entries(obj);
  if (!batchSize || batchSize <= 0 || entries.length <= batchSize) {
    return [obj];
  }
  const batches = [];
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = {};
    for (const [k, v] of entries.slice(i, i + batchSize)) {
      batch[k] = v;
    }
    batches.push(batch);
  }
  return batches;
}

// ── 主流程 ────────────────────────────────────────────────

function main() {
  const opts = parseArgs();

  const localeFileName = LANG_FILE_MAP[opts.lang];
  if (!localeFileName) {
    console.error(
      `Error: unsupported lang "${opts.lang}". Use zh-CN | en-US | zh-TW`,
    );
    process.exit(1);
  }

  const sourcePath = path.resolve(opts.source);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: source file not found: ${sourcePath}`);
    process.exit(1);
  }

  const localePath = path.resolve(
    __dirname,
    `../src/locales/i18n/${localeFileName}`,
  );
  if (!fs.existsSync(localePath)) {
    console.error(`Error: locale file not found: ${localePath}`);
    process.exit(1);
  }

  console.log(`\n=== i18n Diff Report (${opts.lang}) ===`);
  console.log(`Source:  ${sourcePath}`);
  console.log(`Local:   ${localePath}\n`);

  const exportMap = parseExport(sourcePath, opts.lang);
  const localMap = parseLocaleFile(localePath);
  const { added, modified, localOnly } = diffKeys(exportMap, localMap);

  const addedCount = Object.keys(added).length;
  const modifiedCount = Object.keys(modified).length;
  const localOnlyCount = Object.keys(localOnly).length;
  const unchangedCount =
    Object.keys(exportMap).length - addedCount - modifiedCount;

  console.log(`Export PC.* keys: ${Object.keys(exportMap).length}`);
  console.log(`Local  PC.* keys: ${Object.keys(localMap).length}`);
  console.log(`  Added (platform has, local missing): ${addedCount}`);
  console.log(`  Modified (value differs):            ${modifiedCount}`);
  console.log(`  Local-only (local has, platform missing): ${localOnlyCount}`);
  console.log(`  Unchanged:                           ${unchangedCount}\n`);

  if (addedCount > 0) {
    console.log('--- Added Keys (sample) ---');
    for (const [k, v] of Object.entries(added).slice(0, 5)) {
      console.log(`  + ${k}: ${v.slice(0, 60)}`);
    }
    if (addedCount > 5) console.log(`  ... and ${addedCount - 5} more`);
    console.log();
  }

  if (modifiedCount > 0) {
    console.log('--- Modified Keys (sample) ---');
    for (const [k, v] of Object.entries(modified).slice(0, 5)) {
      console.log(`  ~ ${k}:`);
      console.log(`      local:  ${v.local.slice(0, 60)}`);
      console.log(`      remote: ${v.remote.slice(0, 60)}`);
    }
    if (modifiedCount > 5) console.log(`  ... and ${modifiedCount - 5} more`);
    console.log();
  }

  if (localOnlyCount > 0) {
    console.log('--- Local-only Keys (sample) ---');
    for (const [k, v] of Object.entries(localOnly).slice(0, 5)) {
      console.log(`  - ${k}: ${v.slice(0, 60)}`);
    }
    if (localOnlyCount > 5) console.log(`  ... and ${localOnlyCount - 5} more`);
    console.log();
  }

  // 写入差异 JSON — 输出到 .temp/i18n-platform/diff/{lang}/
  const baseDir = path.resolve(__dirname, '../.temp/i18n-platform');
  const outDir = path.join(baseDir, 'diff', opts.lang);
  fs.mkdirSync(outDir, { recursive: true });

  if (addedCount > 0) {
    const addedBatches = splitBatches(added, opts.batchSize);
    if (addedBatches.length === 1) {
      const outFile = path.join(outDir, `i18n-diff-${opts.lang}-added.json`);
      fs.writeFileSync(outFile, JSON.stringify(added, null, 2), 'utf8');
      console.log(`Written: ${outFile} (${addedCount} keys)`);
    } else {
      addedBatches.forEach((batch, i) => {
        const outFile = path.join(
          outDir,
          `i18n-diff-${opts.lang}-added-${i + 1}-of-${
            addedBatches.length
          }.json`,
        );
        fs.writeFileSync(outFile, JSON.stringify(batch, null, 2), 'utf8');
        console.log(`Written: ${outFile} (${Object.keys(batch).length} keys)`);
      });
    }
  }

  if (modifiedCount > 0) {
    const modifiedBatches = splitBatches(modified, opts.batchSize);
    if (modifiedBatches.length === 1) {
      const outFile = path.join(outDir, `i18n-diff-${opts.lang}-modified.json`);
      fs.writeFileSync(outFile, JSON.stringify(modified, null, 2), 'utf8');
      console.log(`Written: ${outFile} (${modifiedCount} keys)`);
    } else {
      modifiedBatches.forEach((batch, i) => {
        const outFile = path.join(
          outDir,
          `i18n-diff-${opts.lang}-modified-${i + 1}-of-${
            modifiedBatches.length
          }.json`,
        );
        fs.writeFileSync(outFile, JSON.stringify(batch, null, 2), 'utf8');
        console.log(`Written: ${outFile} (${Object.keys(batch).length} keys)`);
      });
    }
  }

  if (localOnlyCount > 0) {
    const localOnlyBatches = splitBatches(localOnly, opts.batchSize);
    if (localOnlyBatches.length === 1) {
      const outFile = path.join(
        outDir,
        `i18n-diff-${opts.lang}-local-only.json`,
      );
      fs.writeFileSync(outFile, JSON.stringify(localOnly, null, 2), 'utf8');
      console.log(`Written: ${outFile} (${localOnlyCount} keys)`);
    } else {
      localOnlyBatches.forEach((batch, i) => {
        const outFile = path.join(
          outDir,
          `i18n-diff-${opts.lang}-local-only-${i + 1}-of-${
            localOnlyBatches.length
          }.json`,
        );
        fs.writeFileSync(outFile, JSON.stringify(batch, null, 2), 'utf8');
        console.log(`Written: ${outFile} (${Object.keys(batch).length} keys)`);
      });
    }
  }

  if (addedCount === 0 && modifiedCount === 0 && localOnlyCount === 0) {
    console.log('No differences found. Local and platform are in sync.');
  }
}

main();
