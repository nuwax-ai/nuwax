/**
 * scripts/deploy-asset-retention.mjs 单测：快照 / 合并恢复 / 超代清理三场景。
 * 纯 node 脚本（无 umi 依赖），目录参数注入临时目录，不触碰真实 dist。
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isHashedAsset, merge, snapshot } from '../scripts/deploy-asset-retention.mjs';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-retention-'));
afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

const makeDir = (name) => {
  const dir = path.join(tmpRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const writeFile = (root, rel, content = 'x') => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf-8');
};

beforeEach(() => {
  process.env.DIST_RETENTION = '1';
  delete process.env.DIST_RETAIN_GENERATIONS;
});

describe('isHashedAsset', () => {
  it('接受 webpack/vite 两族哈希文件名', () => {
    expect(isHashedAsset('umi.a1b2c3d4.js')).toBe(true);
    expect(isHashedAsset('p__Chat__index.b2c3d4e5.async.js')).toBe(true);
    expect(isHashedAsset('micro-apps/repo/assets/CollabEditor-Dn7whwJw.js')).toBe(true);
    expect(isHashedAsset('m/assets/index.f3e4d5c6.css')).toBe(true);
    expect(isHashedAsset('logo.a1b2c3d4.png')).toBe(true);
    expect(isHashedAsset('fonts/font.a1b2c3d4.woff2')).toBe(true);
  });

  it('拒绝入口/元信息/sourcemap/非哈希文件', () => {
    expect(isHashedAsset('index.html')).toBe(false);
    expect(isHashedAsset('m/index.html')).toBe(false);
    expect(isHashedAsset('version.json')).toBe(false);
    expect(isHashedAsset('micro-apps/repo/version.json')).toBe(false);
    expect(isHashedAsset('micro-apps/repo/manifest.json')).toBe(false);
    expect(isHashedAsset('static/sdk/captcha.js')).toBe(false);
    expect(isHashedAsset('umi.a1b2c3d4.js.map')).toBe(false);
    expect(isHashedAsset('plain.js')).toBe(false);
  });
});

describe('snapshot', () => {
  it('拷贝整个 dist 且未设 DIST_RETENTION 时 no-op', () => {
    const dist = makeDir('snap-dist');
    const snap = path.join(tmpRoot, 'snap-snapshot');
    writeFile(dist, 'umi.aaaa1111.js');
    writeFile(dist, 'index.html', '<html>old</html>');

    delete process.env.DIST_RETENTION;
    snapshot({ distDir: dist, snapshotDir: snap });
    expect(fs.existsSync(snap)).toBe(false);

    process.env.DIST_RETENTION = '1';
    snapshot({ distDir: dist, snapshotDir: snap });
    expect(fs.existsSync(path.join(snap, 'umi.aaaa1111.js'))).toBe(true);
    expect(fs.existsSync(path.join(snap, 'index.html'))).toBe(true);
  });

  it('dist 不存在时跳过并清理陈旧快照', () => {
    const snap = path.join(tmpRoot, 'snap-missing');
    fs.mkdirSync(snap, { recursive: true });
    snapshot({ distDir: path.join(tmpRoot, 'no-such-dist'), snapshotDir: snap });
    expect(fs.existsSync(snap)).toBe(false);
  });
});

describe('merge', () => {
  it('恢复缺失哈希资源、不恢复入口元信息、不重复恢复现存文件', () => {
    const snap = makeDir('merge1-snap');
    const dist = makeDir('merge1-dist');
    // 上一版：旧入口 + 旧 chunk + 旧静态资源
    writeFile(snap, 'umi.aaaa1111.js', 'old-entry');
    writeFile(snap, 'p__Chat__index.bbbb2222.async.js', 'old-chunk');
    writeFile(snap, 'micro-apps/repo/assets/Editor-Cccc3333.js', 'old-micro');
    writeFile(snap, 'index.html', '<html>old</html>');
    writeFile(snap, 'version.json', '{"gitHash":"old"}');
    writeFile(snap, 'static/sdk/sdk.js', 'old-static');
    // 新构建：新入口 + 新 chunk；旧 chunk 在新构建中不存在
    writeFile(dist, 'umi.dddd4444.js', 'new-entry');
    writeFile(dist, 'p__Chat__index.eeee5555.async.js', 'new-chunk');
    writeFile(dist, 'index.html', '<html>new</html>');
    writeFile(dist, 'version.json', '{"gitHash":"new"}');

    merge({ distDir: dist, snapshotDir: snap });

    // 旧哈希资源被恢复（含 micro-apps / 老入口 js）
    expect(fs.readFileSync(path.join(dist, 'p__Chat__index.bbbb2222.async.js'), 'utf-8')).toBe(
      'old-chunk',
    );
    expect(fs.readFileSync(path.join(dist, 'micro-apps/repo/assets/Editor-Cccc3333.js'), 'utf-8')).toBe(
      'old-micro',
    );
    expect(fs.existsSync(path.join(dist, 'umi.aaaa1111.js'))).toBe(true);
    // 入口/元信息保持新版，不被旧内容覆盖
    expect(fs.readFileSync(path.join(dist, 'index.html'), 'utf-8')).toBe('<html>new</html>');
    expect(fs.readFileSync(path.join(dist, 'version.json'), 'utf-8')).toBe('{"gitHash":"new"}');
    expect(fs.existsSync(path.join(dist, 'static/sdk/sdk.js'))).toBe(false);
    // 清单记录恢复项年龄为 1；快照目录被清理
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'));
    expect(manifest.files['p__Chat__index.bbbb2222.async.js']).toBe(1);
    expect(manifest.retainGenerations).toBe(3);
    expect(fs.existsSync(snap)).toBe(false);
  });

  it('超过保留代数的文件放弃恢复（默认 3 代）', () => {
    const snap = makeDir('merge2-snap');
    const dist = makeDir('merge2-dist');
    writeFile(snap, 'a.aaaa1111.js', 'age3');
    writeFile(snap, 'b.bbbb2222.js', 'age2');
    writeFile(snap, 'c.cccc3333.js', 'untracked');
    fs.writeFileSync(
      path.join(snap, '.dist-retention.json'),
      JSON.stringify({
        version: 1,
        retainGenerations: 3,
        files: { 'a.aaaa1111.js': 3, 'b.bbbb2222.js': 2 },
      }),
      'utf-8',
    );

    merge({ distDir: dist, snapshotDir: snap });

    // 清单年龄 3 → 本轮 4 > 3：放弃；年龄 2 → 3：保留；无记录 → 1：保留
    expect(fs.existsSync(path.join(dist, 'a.aaaa1111.js'))).toBe(false);
    expect(fs.existsSync(path.join(dist, 'b.bbbb2222.js'))).toBe(true);
    expect(fs.existsSync(path.join(dist, 'c.cccc3333.js'))).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'));
    expect(manifest.files).toEqual({ 'b.bbbb2222.js': 3, 'c.cccc3333.js': 1 });
  });

  it('DIST_RETAIN_GENERATIONS 可收紧保留窗口', () => {
    const snap = makeDir('merge3-snap');
    const dist = makeDir('merge3-dist');
    writeFile(snap, 'a.aaaa1111.js', 'age1');
    process.env.DIST_RETAIN_GENERATIONS = '1';

    merge({ distDir: dist, snapshotDir: snap });

    // 未记录年龄 1，保 1 代窗口下仍保留；年龄阈值写入清单供下轮判定
    expect(fs.existsSync(path.join(dist, 'a.aaaa1111.js'))).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'));
    expect(manifest.retainGenerations).toBe(1);
    expect(manifest.files['a.aaaa1111.js']).toBe(1);
  });
});
