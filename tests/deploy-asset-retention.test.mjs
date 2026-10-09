/**
 * scripts/deploy-asset-retention.mjs 单测：快照 / 合并恢复 / 超代清理三场景。
 * 纯 node 脚本（无 umi 依赖），目录参数注入临时目录，不触碰真实 dist。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  isHashedAsset,
  merge,
  snapshot,
} from '../scripts/deploy-asset-retention.mjs';

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
    expect(
      isHashedAsset('micro-apps/repo/assets/CollabEditor-Dn7whwJw.js'),
    ).toBe(true);
    expect(isHashedAsset('m/assets/index.f3e4d5c6.css')).toBe(true);
    expect(isHashedAsset('p__Chat__index.b2c3d4e5.chunk.css')).toBe(true);
    expect(isHashedAsset('5906.7bc54e97.chunk.css')).toBe(true);
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
    expect(isHashedAsset('page.deadbeef.chunk.css.map')).toBe(false);
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
    snapshot({
      distDir: path.join(tmpRoot, 'no-such-dist'),
      snapshotDir: snap,
    });
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
    writeFile(
      snap,
      'p__Chat__index.bbbb2222.chunk.css',
      '.old { color: blue }',
    );
    writeFile(snap, '5906.7bc54e97.chunk.css', '.numeric { color: red }');
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
    expect(
      fs.readFileSync(
        path.join(dist, 'p__Chat__index.bbbb2222.async.js'),
        'utf-8',
      ),
    ).toBe('old-chunk');
    expect(
      fs.readFileSync(
        path.join(dist, 'micro-apps/repo/assets/Editor-Cccc3333.js'),
        'utf-8',
      ),
    ).toBe('old-micro');
    expect(fs.existsSync(path.join(dist, 'umi.aaaa1111.js'))).toBe(true);
    expect(
      fs.readFileSync(
        path.join(dist, 'p__Chat__index.bbbb2222.chunk.css'),
        'utf-8',
      ),
    ).toBe('.old { color: blue }');
    expect(fs.existsSync(path.join(dist, '5906.7bc54e97.chunk.css'))).toBe(
      true,
    );
    // 入口/元信息保持新版，不被旧内容覆盖
    expect(fs.readFileSync(path.join(dist, 'index.html'), 'utf-8')).toBe(
      '<html>new</html>',
    );
    expect(fs.readFileSync(path.join(dist, 'version.json'), 'utf-8')).toBe(
      '{"gitHash":"new"}',
    );
    expect(fs.existsSync(path.join(dist, 'static/sdk/sdk.js'))).toBe(false);
    // 清单记录恢复项年龄为 1；快照目录被清理
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'),
    );
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
    writeFile(snap, '5906.7bc54e97.chunk.css', 'expired-css');
    writeFile(snap, 'Home.deadbeef.chunk.css', 'retained-css');
    fs.writeFileSync(
      path.join(snap, '.dist-retention.json'),
      JSON.stringify({
        version: 1,
        retainGenerations: 3,
        files: {
          'a.aaaa1111.js': 3,
          'b.bbbb2222.js': 2,
          '5906.7bc54e97.chunk.css': 3,
          'Home.deadbeef.chunk.css': 2,
        },
      }),
      'utf-8',
    );

    merge({ distDir: dist, snapshotDir: snap });

    // 清单年龄 3 → 本轮 4 > 3：放弃；年龄 2 → 3：保留；无记录 → 1：保留
    expect(fs.existsSync(path.join(dist, 'a.aaaa1111.js'))).toBe(false);
    expect(fs.existsSync(path.join(dist, 'b.bbbb2222.js'))).toBe(true);
    expect(fs.existsSync(path.join(dist, 'c.cccc3333.js'))).toBe(true);
    expect(fs.existsSync(path.join(dist, '5906.7bc54e97.chunk.css'))).toBe(
      false,
    );
    expect(fs.existsSync(path.join(dist, 'Home.deadbeef.chunk.css'))).toBe(
      true,
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'),
    );
    expect(manifest.files).toEqual({
      'b.bbbb2222.js': 3,
      'c.cccc3333.js': 1,
      'Home.deadbeef.chunk.css': 3,
    });
  });

  it('DIST_RETAIN_GENERATIONS 可收紧保留窗口', () => {
    const snap = makeDir('merge3-snap');
    const dist = makeDir('merge3-dist');
    writeFile(snap, 'a.aaaa1111.js', 'age1');
    process.env.DIST_RETAIN_GENERATIONS = '1';

    merge({ distDir: dist, snapshotDir: snap });

    // 未记录年龄 1，保 1 代窗口下仍保留；年龄阈值写入清单供下轮判定
    expect(fs.existsSync(path.join(dist, 'a.aaaa1111.js'))).toBe(true);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'),
    );
    expect(manifest.retainGenerations).toBe(1);
    expect(manifest.files['a.aaaa1111.js']).toBe(1);
  });
});

describe('首次部署 CSS 历史回填', () => {
  const makeHistory = (name, customize = () => {}) => {
    const repo = makeDir(name);
    const git = (args) =>
      execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
    git(['init', '-q']);
    git(['config', 'user.name', 'Retention Test']);
    git(['config', 'user.email', 'retention@example.invalid']);
    const dist = path.join(repo, 'dist');
    for (let build = 0; build < 4; build += 1) {
      fs.rmSync(dist, { recursive: true, force: true });
      writeFile(dist, `Home.aaaa000${build}.chunk.css`, `css-${build}`);
      writeFile(dist, `Page.aaaa000${build}.async.js`, `js-${build}`);
      writeFile(dist, 'static/static.css', `static-${build}`);
      writeFile(dist, 'index.html', `<html>build-${build}</html>`);
      writeFile(
        dist,
        '.dist-retention.json',
        JSON.stringify({ version: 1, files: {} }),
      );
      writeFile(
        dist,
        'version.json',
        JSON.stringify({
          gitHash: `aaaa000${build}`,
          version: '1.2.0',
          buildAt: `2026-10-0${build + 1}T00:00:00.000Z`,
        }),
      );
      customize({ build, dist });
      git(['add', '.']);
      git(['commit', '-qm', `build-${build}`]);
      // 日常源码提交不得吃掉 CSS 保留代数。
      writeFile(repo, 'source.txt', `${build}`);
      git(['add', '.']);
      git(['commit', '-qm', `source-${build}`]);
    }
    return { repo, dist };
  };

  it('只补本地 HEAD 保留窗口的 CSS，带正确年龄且不覆盖当前构建', () => {
    const { repo, dist } = makeHistory('history-window');
    const snap = path.join(repo, 'snapshot');
    snapshot({ distDir: dist, snapshotDir: snap, repoDir: repo });
    const ages = JSON.parse(
      fs.readFileSync(path.join(snap, '.dist-retention.json'), 'utf-8'),
    ).files;
    expect(ages).toEqual({
      'Home.aaaa0002.chunk.css': 1,
      'Home.aaaa0001.chunk.css': 2,
    });
    expect(fs.existsSync(path.join(snap, 'Home.aaaa0000.chunk.css'))).toBe(
      false,
    );
    expect(fs.existsSync(path.join(snap, 'Page.aaaa0002.async.js'))).toBe(
      false,
    );
    expect(fs.readFileSync(path.join(snap, 'static/static.css'), 'utf-8')).toBe(
      'static-3',
    );

    fs.rmSync(dist, { recursive: true, force: true });
    writeFile(dist, 'index.html', '<html>new</html>');
    writeFile(dist, 'Home.aaaa0002.chunk.css', 'current-file-wins');
    merge({ distDir: dist, snapshotDir: snap });
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'),
    );
    expect(manifest.historicalCssBackfilled).toBe(true);
    expect(manifest.files).toEqual({
      'Home.aaaa0003.chunk.css': 1,
      'Home.aaaa0001.chunk.css': 3,
      'Page.aaaa0003.async.js': 1,
    });
    expect(
      fs.readFileSync(path.join(dist, 'Home.aaaa0002.chunk.css'), 'utf-8'),
    ).toBe('current-file-wins');
    expect(fs.readFileSync(path.join(dist, 'index.html'), 'utf-8')).toBe(
      '<html>new</html>',
    );
  });

  it('迁移旗标跨合并传承，过期 CSS 不会被历史重新复活', () => {
    const { repo, dist } = makeHistory('history-once');
    const snap = path.join(repo, 'snapshot');
    const currentVersion = fs.readFileSync(
      path.join(dist, 'version.json'),
      'utf-8',
    );
    for (let build = 0; build < 3; build += 1) {
      snapshot({ distDir: dist, snapshotDir: snap, repoDir: repo });
      fs.rmSync(dist, { recursive: true, force: true });
      writeFile(dist, 'version.json', currentVersion);
      merge({ distDir: dist, snapshotDir: snap });
    }
    expect(fs.existsSync(path.join(dist, 'Home.aaaa0001.chunk.css'))).toBe(
      false,
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'),
    );
    expect(manifest.historicalCssBackfilled).toBe(true);
    snapshot({ distDir: dist, snapshotDir: snap, repoDir: repo });
    expect(fs.existsSync(path.join(snap, 'Home.aaaa0001.chunk.css'))).toBe(
      false,
    );
  });

  it('快照版本不属于当前部署历史时跳过，不猜其他构建', () => {
    const { repo, dist } = makeHistory('history-unmatched');
    writeFile(
      dist,
      'version.json',
      JSON.stringify({
        gitHash: 'ffffffff',
        buildAt: '2026-10-09T00:00:00.000Z',
      }),
    );
    const snap = path.join(repo, 'snapshot');
    snapshot({ distDir: dist, snapshotDir: snap, repoDir: repo });
    expect(fs.existsSync(path.join(snap, 'Home.aaaa0002.chunk.css'))).toBe(
      false,
    );
    expect(
      JSON.parse(
        fs.readFileSync(path.join(snap, '.dist-retention.json'), 'utf-8'),
      ).historicalCssBackfilled,
    ).not.toBe(true);
  });

  it('未开启 DIST_RETENTION 不扫描或回填历史', () => {
    const { repo, dist } = makeHistory('history-disabled');
    delete process.env.DIST_RETENTION;
    const snap = path.join(repo, 'snapshot');
    snapshot({ distDir: dist, snapshotDir: snap, repoDir: repo });
    expect(fs.existsSync(snap)).toBe(false);
  });

  it('浅克隆仅回填能证明属于保留窗口的产物', () => {
    const { repo } = makeHistory('history-shallow-source');
    const shallowRepo = path.join(tmpRoot, 'history-shallow');
    execFileSync(
      'git',
      [
        'clone',
        '--quiet',
        '--depth',
        '1',
        pathToFileURL(repo).href,
        shallowRepo,
      ],
      { stdio: 'pipe' },
    );
    const dist = path.join(shallowRepo, 'dist');
    // 即使最新快照自身漏了 CSS，也可以从唯一可用的同代 Git 树补回。
    fs.rmSync(path.join(dist, 'Home.aaaa0003.chunk.css'));
    const snap = path.join(shallowRepo, 'snapshot');
    snapshot({ distDir: dist, snapshotDir: snap, repoDir: shallowRepo });
    expect(
      fs.readFileSync(path.join(snap, 'Home.aaaa0003.chunk.css'), 'utf-8'),
    ).toBe('css-3');
    expect(fs.existsSync(path.join(snap, 'Home.aaaa0002.chunk.css'))).toBe(
      false,
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(snap, '.dist-retention.json'), 'utf-8'),
    );
    expect(manifest.files).toEqual({ 'Home.aaaa0003.chunk.css': 0 });
  });

  it('历史 CSS blob 不可读时不中断构建，保留年龄且不标记回填完成', () => {
    const { repo, dist } = makeHistory('history-missing-blob');
    const git = (args) =>
      execFileSync('git', args, { cwd: repo, stdio: 'pipe' }).toString().trim();
    const priorBuild = git([
      'log',
      '--first-parent',
      '--format=%H',
      '--grep=^build-2$',
    ]);
    const blob = git([
      'rev-parse',
      `${priorBuild}:dist/Home.aaaa0002.chunk.css`,
    ]);
    fs.rmSync(
      path.join(repo, '.git', 'objects', blob.slice(0, 2), blob.slice(2)),
    );
    const snap = path.join(repo, 'snapshot');
    expect(() =>
      snapshot({ distDir: dist, snapshotDir: snap, repoDir: repo }),
    ).not.toThrow();
    const recovered = JSON.parse(
      fs.readFileSync(path.join(snap, '.dist-retention.json'), 'utf-8'),
    );
    expect(recovered.historicalCssBackfilled).toBe(false);
    expect(recovered.files).toEqual({ 'Home.aaaa0001.chunk.css': 2 });
    expect(fs.existsSync(path.join(snap, 'Home.aaaa0002.chunk.css'))).toBe(
      false,
    );
    fs.rmSync(dist, { recursive: true, force: true });
    writeFile(dist, 'index.html', '<html>new</html>');
    expect(() => merge({ distDir: dist, snapshotDir: snap })).not.toThrow();
    const merged = JSON.parse(
      fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'),
    );
    expect(merged.historicalCssBackfilled).not.toBe(true);
    expect(merged.files['Home.aaaa0001.chunk.css']).toBe(3);
  });

  it('历史树里已留存的 CSS 使用自身年龄加部署距离，过期文件不会复活', () => {
    const { repo, dist } = makeHistory(
      'history-retained-age',
      ({ build, dist: artifact }) => {
        if (build === 1) {
          // 更老的树即使有同名文件，也不能覆写最近一代的明确过期判定。
          writeFile(artifact, 'umi.deadbeef.css', 'expired-retained-css');
        }
        if (build !== 2) return;
        writeFile(artifact, 'umi.deadbeef.css', 'expired-retained-css');
        writeFile(artifact, 'umi.cafebabe.css', 'eligible-retained-css');
        writeFile(
          artifact,
          '.dist-retention.json',
          JSON.stringify({
            version: 1,
            files: { 'umi.deadbeef.css': 3, 'umi.cafebabe.css': 1 },
          }),
        );
      },
    );
    const snap = path.join(repo, 'snapshot');
    snapshot({ distDir: dist, snapshotDir: snap, repoDir: repo });
    expect(fs.existsSync(path.join(snap, 'umi.deadbeef.css'))).toBe(false);
    const historical = JSON.parse(
      fs.readFileSync(path.join(snap, '.dist-retention.json'), 'utf-8'),
    );
    expect(historical.files['umi.cafebabe.css']).toBe(2);
    expect(historical.historicalCssBackfilled).toBe(true);
    fs.rmSync(dist, { recursive: true, force: true });
    writeFile(dist, 'index.html', '<html>new</html>');
    merge({ distDir: dist, snapshotDir: snap });
    expect(fs.existsSync(path.join(dist, 'umi.deadbeef.css'))).toBe(false);
    const merged = JSON.parse(
      fs.readFileSync(path.join(dist, '.dist-retention.json'), 'utf-8'),
    );
    expect(merged.files['umi.cafebabe.css']).toBe(3);
  });

  it.each(['missing-manifest', 'invalid-files', 'invalid-age'])(
    '历史年龄未知 (%s) 时跳过可疑 CSS 且不标完成',
    (kind) => {
      const { repo, dist } = makeHistory(
        `history-unknown-${kind}`,
        ({ build, dist: artifact }) => {
          if (build === 1)
            writeFile(artifact, 'umi.cafebabe.css', 'unknown-age');
          if (build !== 2) return;
          writeFile(artifact, 'umi.cafebabe.css', 'unknown-age');
          if (kind === 'missing-manifest')
            fs.rmSync(path.join(artifact, '.dist-retention.json'));
          else
            writeFile(
              artifact,
              '.dist-retention.json',
              JSON.stringify({
                version: 1,
                files:
                  kind === 'invalid-files' ? [] : { 'umi.cafebabe.css': '1' },
              }),
            );
        },
      );
      const snap = path.join(repo, 'snapshot');
      expect(() =>
        snapshot({ distDir: dist, snapshotDir: snap, repoDir: repo }),
      ).not.toThrow();
      expect(fs.existsSync(path.join(snap, 'umi.cafebabe.css'))).toBe(false);
      const recovered = JSON.parse(
        fs.readFileSync(path.join(snap, '.dist-retention.json'), 'utf-8'),
      );
      expect(recovered.historicalCssBackfilled).toBe(false);
      expect(recovered.files['Home.aaaa0001.chunk.css']).toBe(2);
    },
  );
});
