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

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = path.join(ROOT, 'dist');
const SNAPSHOT_DIR = path.join(ROOT, '.dist-retention-snapshot');
const MANIFEST_NAME = '.dist-retention.json';

const DEFAULT_RETAIN_GENERATIONS = 3;

/** webpack 的异步 JS / chunk CSS 与 vite 的 8 位内容哈希资源。 */
const HASHED_ASSET_RE =
  /[-.][0-9A-Za-z_-]{8}(?:\.(?:async|chunk))?\.(?:js|mjs|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot)$/i;

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

const relFrom = (root, file) =>
  path.relative(root, file).split(path.sep).join('/');

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

// version.json 每次构建都重写 buildAt；同一次构建被多个 merge 提交引用不算新一代。
const buildIdentity = (value) => {
  if (
    !value ||
    typeof value.gitHash !== 'string' ||
    !/^[0-9a-f]{7,40}$/i.test(value.gitHash) ||
    typeof value.buildAt !== 'string' ||
    !Number.isFinite(Date.parse(value.buildAt))
  )
    return null;
  return JSON.stringify([value.gitHash, value.buildAt, value.version]);
};

/**
 * 首次修复时从当前部署分支的本地历史补回此前漏保留的 CSS。
 * 先用快照 version.json 定位构建，避免把其他分支/客户端产物算成部署代数；
 * 从该构建向前只取保留窗口内的不同构建，写入原有年龄体系，后续正常过期。
 * 不 fetch，不访问其他 ref；浅克隆/缺历史时按已有快照部署并打印限制。
 */
export function backfillHistoricalCss({ snapshotDir, repoDir = ROOT } = {}) {
  if (!isEnabled()) return;
  const manifest = readManifest(snapshotDir);
  if (manifest?.historicalCssBackfilled) return;
  let anchor;
  try {
    anchor = buildIdentity(
      JSON.parse(
        fs.readFileSync(path.join(snapshotDir, 'version.json'), 'utf-8'),
      ),
    );
  } catch {
    /* 旧产物没有构建元信息 */
  }
  if (!anchor) {
    console.log('ℹ️ CSS 历史回填跳过：快照缺少有效构建元信息');
    return;
  }
  const git = (args, options = {}) =>
    execFileSync('git', args, {
      cwd: repoDir,
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 16 * 1024 * 1024,
      ...options,
    });
  let commits;
  try {
    commits = git([
      'log',
      '--first-parent',
      '--format=%H',
      '-n',
      '200',
      'HEAD',
      '--',
      'dist/version.json',
    ])
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    console.log('ℹ️ CSS 历史回填跳过：本地 Git 部署历史不可用');
    return;
  }
  const versions = [];
  const identities = new Set();
  let foundAnchor = false;
  let incomplete = false;
  for (const commit of commits) {
    let identity;
    try {
      identity = buildIdentity(
        JSON.parse(git(['show', `${commit}:dist/version.json`]).toString()),
      );
    } catch {
      if (foundAnchor) {
        console.warn(
          `⚠️ CSS 历史回填：版本 ${commit.slice(
            0,
            10,
          )} 元信息不可读，停止检查更早产物`,
        );
        incomplete = true;
        break;
      }
      continue;
    }
    if (!identity) {
      if (foundAnchor) {
        console.warn(
          `⚠️ CSS 历史回填：版本 ${commit.slice(
            0,
            10,
          )} 元信息无效，停止检查更早产物`,
        );
        incomplete = true;
        break;
      }
      continue;
    }
    if (!foundAnchor) {
      if (identity !== anchor) continue;
      foundAnchor = true;
    }
    if (identities.has(identity)) continue;
    identities.add(identity);
    versions.push(commit);
    if (versions.length >= retainGenerations()) break;
  }
  if (!foundAnchor) {
    console.log('ℹ️ CSS 历史回填跳过：当前快照不在本地 HEAD 部署历史中');
    return;
  }
  const ages = { ...(manifest?.files || {}) };
  const rejectedAges = new Set();
  let restored = 0;
  for (const [distance, commit] of versions.entries()) {
    let files;
    try {
      files = git(['ls-tree', '-r', '-z', '--name-only', commit, '--', 'dist/'])
        .toString()
        .split('\0')
        .filter(Boolean);
    } catch {
      incomplete = true;
      console.warn(
        `⚠️ CSS 历史回填：版本 ${commit.slice(0, 10)} 文件树不可读，跳过该代`,
      );
      continue;
    }
    let historicalAges;
    try {
      const historicalManifest = JSON.parse(
        git(['show', `${commit}:dist/${MANIFEST_NAME}`]).toString(),
      );
      if (
        historicalManifest?.version !== 1 ||
        !historicalManifest.files ||
        typeof historicalManifest.files !== 'object' ||
        Array.isArray(historicalManifest.files)
      )
        throw new Error('invalid retention manifest');
      historicalAges = historicalManifest.files;
    } catch {
      incomplete = true;
      for (const file of files) {
        const rel = file.slice('dist/'.length);
        if (rel.endsWith('.css') && isHashedAsset(rel)) rejectedAges.add(rel);
      }
      console.warn(
        `⚠️ CSS 历史回填：版本 ${commit.slice(
          0,
          10,
        )} 保留清单缺失或无效，跳过年龄未知的 CSS`,
      );
      continue;
    }
    for (const file of files) {
      const rel = file.slice('dist/'.length);
      if (!rel.endsWith('.css') || !isHashedAsset(rel)) continue;
      if (rejectedAges.has(rel)) continue;
      const dest = path.join(snapshotDir, rel);
      if (fs.existsSync(dest)) continue;
      // 树中出现不代表是该代新构建文件，也可能是之前机制恢复的旧资源。
      const historicalAge = Object.prototype.hasOwnProperty.call(
        historicalAges,
        rel,
      )
        ? historicalAges[rel]
        : 0;
      if (!Number.isInteger(historicalAge) || historicalAge < 0) {
        rejectedAges.add(rel);
        incomplete = true;
        console.warn(
          `⚠️ CSS 历史回填：${commit.slice(
            0,
            10,
          )} 的 ${rel} 保留年龄无效，跳过该文件`,
        );
        continue;
      }
      const age = historicalAge + distance;
      if (age + 1 > retainGenerations()) {
        // 最近出现时已确认超代，不用更老的清单重新给它一个较小年龄。
        rejectedAges.add(rel);
        continue;
      }
      let content;
      try {
        content = git(['show', `${commit}:${file}`]);
      } catch {
        incomplete = true;
        console.warn(
          `⚠️ CSS 历史回填：${commit.slice(
            0,
            10,
          )} 的 ${rel} 不可读，跳过该文件`,
        );
        continue;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, content);
      ages[rel] = age;
      restored += 1;
    }
  }
  fs.writeFileSync(
    path.join(snapshotDir, MANIFEST_NAME),
    `${JSON.stringify(
      {
        ...manifest,
        version: 1,
        historicalCssBackfilled: !incomplete,
        files: ages,
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );
  console.log(
    `✅ CSS 历史回填：检查 ${versions.length} 代本地产物，补回 ${restored} 个文件`,
  );
  if (versions.length < retainGenerations()) {
    console.log('ℹ️ 本地部署历史不足保留窗口，仅回填现有历史（可能是浅克隆）');
  }
  if (incomplete) {
    console.warn(
      '⚠️ CSS 历史回填未全部完成，保留已恢复文件与年龄，下一轮部署继续尝试',
    );
  }
}

/**
 * 构建前快照：把现有 dist（= 上一版已部署产物）整体拷走，防 umi build 清空 dist 后无从恢复。
 * 目录参数仅供测试注入，生产链路用默认值。
 */
export function snapshot({
  distDir = DIST_DIR,
  snapshotDir = SNAPSHOT_DIR,
  repoDir = ROOT,
} = {}) {
  if (!isEnabled()) return;
  fs.rmSync(snapshotDir, { recursive: true, force: true });
  if (!fs.existsSync(distDir)) {
    console.log('ℹ️ dist/ 不存在（首轮部署），跳过产物保留快照');
    return;
  }
  fs.cpSync(distDir, snapshotDir, { recursive: true });
  backfillHistoricalCss({ snapshotDir, repoDir });
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
    fs.existsSync(distDir)
      ? listFiles(distDir).map((f) => relFrom(distDir, f))
      : [],
  );

  const retained = {};
  let restored = 0;
  let pruned = 0;
  for (const file of listFiles(snapshotDir)) {
    const rel = relFrom(snapshotDir, file);
    if (rel === MANIFEST_NAME || !isHashedAsset(rel) || current.has(rel))
      continue;
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
        ...(prevManifest?.historicalCssBackfilled
          ? { historicalCssBackfilled: true }
          : {}),
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
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const cmd = process.argv[2];
  if (cmd === 'snapshot') snapshot();
  else if (cmd === 'merge') merge();
  else {
    console.error(
      '用法: node scripts/deploy-asset-retention.mjs <snapshot|merge>',
    );
    process.exit(1);
  }
}
