#!/usr/bin/env node
/**
 * 部署产物旧哈希资源保留（防发版后旧页面懒加载 chunk 404 弹「资源加载失败」）
 *
 * 背景：提测部署是全新构建的 dist 全量快照提交（deploy_sync_test.sh `git add -f dist`），
 * 旧哈希文件随发版立即消失，持有旧页面的用户点新路由必 404。本脚本把上一版 dist 中
 * 带内容哈希的资源文件并回新构建产物，让旧页面在保留窗口内仍可正常加载。
 *
 * 用法（deploy 脚本设 DIST_RETENTION=1；本地构建不设即整体 no-op）：
 *   node scripts/deploy-asset-retention.mjs snapshot   # 构建前：dist/ → .dist-retention-snapshot/
 *   node scripts/deploy-asset-retention.mjs merge      # 构建后：恢复缺失哈希资源 + 超代清理 + 清快照
 *
 * 规则：
 *   - 只保留文件名带内容哈希的产物（-[0-9a-f]{8}.js 等，含 micro-apps assets 与 m/ 移动端）；
 *     入口/元信息类文件（*.html、version.json、manifest.json、static/ 非 ?v= 资源）永远只取新构建。
 *   - sourcemap（.map）不保留：仅调试用，避免 test 分支 dist 体积翻倍。
 *   - dist/.dist-retention.json 记录每个保留文件的「年龄」（自最后一次出现在新构建起经过的发版轮数），
 *     超过 DIST_RETAIN_GENERATIONS（默认 3）不再恢复，分支产物体积有界。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = path.join(ROOT, 'dist');
const SNAPSHOT_DIR = path.join(ROOT, '.dist-retention-snapshot');
const MANIFEST_NAME = '.dist-retention.json';

const DEFAULT_RETAIN_GENERATIONS = 3;

/** 文件名带 8 位内容哈希的资源（webpack `[name].[contenthash:8](.async).js` / vite `name-Dn7whwJw` 两族） */
const HASHED_ASSET_RE =
  /[-.][0-9A-Za-z_-]{8}(?:\.async)?\.(?:js|mjs|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot)$/i;

export const isHashedAsset = (relPath) => {
  const posix = relPath.split(path.sep).join('/');
  if (posix.endsWith('.map')) return false;
  if (posix.endsWith('.html')) return false;
  if (posix.startsWith('static/')) return false;
  const base = posix.split('/').pop() || '';
  if (base === 'version.json' || base === 'manifest.json') return false;
  return HASHED_ASSET_RE.test(base);
};

const listFiles = (dir) => {
  const out = [];
  const walk = (cur) => {
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(dir);
  return out;
};

const relFrom = (root, file) => path.relative(root, file).split(path.sep).join('/');

const readManifest = (distDir) => {
  const file = path.join(distDir, MANIFEST_NAME);
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (parsed && typeof parsed.files === 'object') return parsed;
  } catch {
    /* 首轮无清单或损坏，按空处理 */
  }
  return null;
};

const isEnabled = () => process.env.DIST_RETENTION === '1';

const retainGenerations = () => {
  const raw = Number(process.env.DIST_RETAIN_GENERATIONS);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_RETAIN_GENERATIONS;
};

/**
 * 构建前快照：把现有 dist（= 上一版已部署产物）整体拷走，防 umi build 清空 dist 后无从恢复。
 * 目录参数仅供测试注入，生产链路用默认值。
 */
export function snapshot({ distDir = DIST_DIR, snapshotDir = SNAPSHOT_DIR } = {}) {
  if (!isEnabled()) return;
  fs.rmSync(snapshotDir, { recursive: true, force: true });
  if (!fs.existsSync(distDir)) {
    console.log('ℹ️ dist/ 不存在（首轮部署），跳过产物保留快照');
    return;
  }
  fs.cpSync(distDir, snapshotDir, { recursive: true });
  console.log('✅ 已快照上一版 dist → .dist-retention-snapshot/');
}

/**
 * 构建后合并：从快照恢复新 dist 中缺失的哈希资源；年龄超代的放弃恢复；写新清单；清理快照。
 * 目录参数仅供测试注入，生产链路用默认值。
 */
export function merge({ distDir = DIST_DIR, snapshotDir = SNAPSHOT_DIR } = {}) {
  if (!isEnabled()) return;
  if (!fs.existsSync(snapshotDir)) {
    console.log('ℹ️ 无产物保留快照，跳过合并');
    return;
  }
  const generations = retainGenerations();
  const prevManifest = readManifest(snapshotDir);
  const prevAges = prevManifest?.files || {};

  const current = new Set(
    fs.existsSync(distDir) ? listFiles(distDir).map((f) => relFrom(distDir, f)) : [],
  );

  const retained = {};
  let restored = 0;
  let pruned = 0;
  for (const file of listFiles(snapshotDir)) {
    const rel = relFrom(snapshotDir, file);
    if (rel === MANIFEST_NAME || !isHashedAsset(rel) || current.has(rel)) continue;
    const age = (typeof prevAges[rel] === 'number' ? prevAges[rel] : 0) + 1;
    if (age > generations) {
      pruned += 1;
      continue;
    }
    const dest = path.join(distDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
    retained[rel] = age;
    restored += 1;
  }

  fs.writeFileSync(
    path.join(distDir, MANIFEST_NAME),
    `${JSON.stringify(
      {
        version: 1,
        retainGenerations: generations,
        generatedAt: new Date().toISOString(),
        files: retained,
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );
  fs.rmSync(snapshotDir, { recursive: true, force: true });
  console.log(
    `✅ 产物保留合并完成：恢复 ${restored} 个旧哈希资源（保 ${generations} 代），超代放弃 ${pruned} 个`,
  );
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const cmd = process.argv[2];
  if (cmd === 'snapshot') snapshot();
  else if (cmd === 'merge') merge();
  else {
    console.error('用法: node scripts/deploy-asset-retention.mjs <snapshot|merge>');
    process.exit(1);
  }
}
