import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { promises as fs, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const require = createRequire(import.meta.url);
const {
  DEFAULT_BRANCH,
  FALLBACK_REPO_URL,
  MOBILE_DIR_NAME,
  findLocalMobileOriginUrl,
  resolveMobileBuildOptions,
  downloadDirectory,
} = require('../scripts/download-mobile-build.js');

const stubOriginUrl = 'https://example.invalid/nuwax-mobile.git';
const stubOrigin = () => stubOriginUrl;

async function mobileDownloadFixture(t) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'mobile-retry-')),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const upstream = path.join(root, 'upstream');
  await fs.mkdir(upstream);
  const git = (args, cwd = root) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
      env: {
        ...process.env,
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: '/dev/null',
        LC_ALL: 'C',
      },
    }).trim();
  git(['init', '-b', DEFAULT_BRANCH], upstream);
  git(['config', 'user.name', 'Mobile Fixture'], upstream);
  git(['config', 'user.email', 'fixture@example.invalid'], upstream);
  git(['config', 'core.hooksPath', '/dev/null'], upstream);
  await fs.mkdir(path.join(upstream, 'unpackage/dist/build/web'), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(upstream, 'unpackage/dist/build/web/index.html'),
    'new mobile',
  );
  git(['add', '.'], upstream);
  git(
    ['-c', 'commit.gpgsign=false', 'commit', '-m', 'fixture mobile build'],
    upstream,
  );
  await fs.mkdir(path.join(root, 'dist/m'), { recursive: true });
  await fs.writeFile(path.join(root, 'dist/m/index.html'), 'old mobile');
  await fs.writeFile(path.join(root, 'dist/index.html'), 'completed PC build');
  return {
    root,
    git,
    options: { source: 'fixture', repoUrl: upstream, branch: DEFAULT_BRANCH },
  };
}

test('network interruptions during clone, sparse-checkout and checkout recover without rebuilding PC', async (t) => {
  const failures = {
    clone: 'fatal: Could not resolve host: github.com',
    'sparse-checkout': 'fatal: Operation timed out after 30000 milliseconds',
    checkout:
      'error: RPC failed; curl 18 Transferred a partial file\nfatal: early EOF',
  };
  for (const [command, stderr] of Object.entries(failures)) {
    await t.test(command, async (t) => {
      const state = await mobileDownloadFixture(t);
      const delays = [];
      let clones = 0;
      let interrupted = false;
      await downloadDirectory(state.options, {
        root: state.root,
        git: (args, cwd) => {
          if (args[0] === 'clone') clones += 1;
          if (args[0] === command && !interrupted) {
            interrupted = true;
            if (command === 'clone') {
              // 模拟失败 clone 留下的半成品，重试前必须清掉。
              mkdirSync(path.join(state.root, '.tmp_mobile_build'), {
                recursive: true,
              });
            }
            throw Object.assign(new Error('network interrupted'), {
              stderr,
            });
          }
          return state.git(args, cwd);
        },
        wait: async (ms) => {
          delays.push(ms);
          await assert.rejects(
            fs.stat(path.join(state.root, '.tmp_mobile_build')),
            { code: 'ENOENT' },
          );
          assert.equal(
            await fs.readFile(
              path.join(state.root, 'dist/m/index.html'),
              'utf8',
            ),
            'old mobile',
          );
        },
      });
      assert.equal(clones, 2);
      assert.deepEqual(delays, [10_000]);
      assert.equal(
        await fs.readFile(path.join(state.root, 'dist/m/index.html'), 'utf8'),
        'new mobile',
      );
      assert.equal(
        await fs.readFile(path.join(state.root, 'dist/index.html'), 'utf8'),
        'completed PC build',
      );
      await assert.rejects(
        fs.stat(path.join(state.root, '.tmp_mobile_build')),
        { code: 'ENOENT' },
      );
    });
  }
});

test('persistent network failure stops after three attempts and preserves existing artifacts', async (t) => {
  const state = await mobileDownloadFixture(t);
  const delays = [];
  let clones = 0;
  await assert.rejects(
    downloadDirectory(state.options, {
      root: state.root,
      git: (args, cwd) => {
        if (args[0] === 'clone') clones += 1;
        if (args[0] === 'checkout')
          throw Object.assign(new Error('connection reset'), {
            stderr: 'curl 56 Recv failure: Connection reset by peer',
          });
        return state.git(args, cwd);
      },
      wait: async (ms) => {
        delays.push(ms);
      },
    }),
    /connection reset/,
  );
  assert.equal(clones, 3);
  assert.deepEqual(delays, [10_000, 20_000]);
  assert.equal(
    await fs.readFile(path.join(state.root, 'dist/m/index.html'), 'utf8'),
    'old mobile',
  );
  assert.equal(
    await fs.readFile(path.join(state.root, 'dist/index.html'), 'utf8'),
    'completed PC build',
  );
  await assert.rejects(fs.stat(path.join(state.root, '.tmp_mobile_build')), {
    code: 'ENOENT',
  });
});

test('authentication, branch and certificate failures do not retry', async (t) => {
  for (const details of [
    'error: RPC failed; HTTP 403\nfatal: Authentication failed',
    'fatal: Remote branch missing not found in upstream origin',
    'fatal: unable to access remote: SSL certificate problem: certificate has expired',
  ]) {
    const state = await mobileDownloadFixture(t);
    let attempts = 0;
    await assert.rejects(
      downloadDirectory(state.options, {
        root: state.root,
        git: () => {
          attempts += 1;
          throw Object.assign(new Error(details), { stderr: details });
        },
        wait: () => assert.fail('非网络抖动不得重试'),
      }),
      { message: details },
    );
    assert.equal(attempts, 1);
    assert.equal(
      await fs.readFile(path.join(state.root, 'dist/m/index.html'), 'utf8'),
      'old mobile',
    );
  }
});

test('a missing remote branch stops the real Git download immediately', async (t) => {
  const state = await mobileDownloadFixture(t);
  await assert.rejects(
    downloadDirectory(
      { ...state.options, branch: 'missing-branch' },
      {
        root: state.root,
        wait: () => assert.fail('不存在的远端分支不得重试'),
      },
    ),
    /Remote branch missing-branch not found/,
  );
  assert.equal(
    await fs.readFile(path.join(state.root, 'dist/m/index.html'), 'utf8'),
    'old mobile',
  );
  await assert.rejects(fs.stat(path.join(state.root, '.tmp_mobile_build')), {
    code: 'ENOENT',
  });
});

test('defaults to the local nuwax-mobile origin and the current release branch', () => {
  assert.deepEqual(
    resolveMobileBuildOptions([], {}, { findOriginUrl: stubOrigin }),
    {
      source: `本地 ${MOBILE_DIR_NAME} origin`,
      branch: DEFAULT_BRANCH,
      repoUrl: stubOriginUrl,
    },
  );
});

test('falls back to the GitHub repo when no local checkout exists', () => {
  // 普通用户本地没有 nuwax-mobile 检出：回退 GitHub 地址，不报错
  assert.deepEqual(
    resolveMobileBuildOptions([], {}, { findOriginUrl: () => null }),
    {
      source: 'GitHub 回退',
      branch: DEFAULT_BRANCH,
      repoUrl: FALLBACK_REPO_URL,
    },
  );
});

test('MOBILE_BUILD_REPO overrides the repo url without touching the local checkout', () => {
  assert.deepEqual(
    resolveMobileBuildOptions(
      [],
      { MOBILE_BUILD_REPO: 'https://git.example.invalid/weapp.git' },
      { findOriginUrl: () => assert.fail('不应再读本地检出') },
    ),
    {
      source: 'MOBILE_BUILD_REPO',
      branch: DEFAULT_BRANCH,
      repoUrl: 'https://git.example.invalid/weapp.git',
    },
  );
});

test('environment variables choose the branch and win over positional arguments', () => {
  assert.equal(
    resolveMobileBuildOptions([], {
      MOBILE_BUILD_BRANCH: 'release/x',
    }).branch,
    'release/x',
  );
  assert.equal(
    resolveMobileBuildOptions(['dev'], {}, { findOriginUrl: stubOrigin })
      .branch,
    'dev',
  );
  assert.equal(
    resolveMobileBuildOptions(
      ['dev'],
      { MOBILE_BUILD_BRANCH: 'release/x' },
      { findOriginUrl: stubOrigin },
    ).branch,
    'release/x',
  );
});

test('MOBILE_BUILD_SOURCE is rejected with a migration hint', () => {
  assert.throws(
    () => resolveMobileBuildOptions([], { MOBILE_BUILD_SOURCE: 'gitlab' }),
    /MOBILE_BUILD_SOURCE 已废弃.*MOBILE_BUILD_REPO/s,
  );
});

test('findLocalMobileOriginUrl returns null when nothing can be located', async (t) => {
  const temporary = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'mobile-missing-')),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  // 有效 git 仓库、但主检出旁边没有 nuwax-mobile
  const main = path.join(temporary, 'nuwax');
  await fs.mkdir(main);
  await execute('git', ['init', '-b', 'main'], { cwd: main });
  assert.equal(findLocalMobileOriginUrl(main), null);
  // 连 git 仓库都不是的目录同样返回 null（由调用方回退 GitHub）
  const loose = path.join(temporary, 'loose');
  await fs.mkdir(loose);
  assert.equal(findLocalMobileOriginUrl(loose), null);
});

test('origin discovery follows the main checkout, including from linked worktrees', async (t) => {
  const temporary = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'mobile-origin-')),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const main = path.join(temporary, 'nuwax');
  const mobile = path.join(temporary, MOBILE_DIR_NAME);
  const worktree = path.join(temporary, 'deploy-worktree');
  await fs.mkdir(main);
  await fs.mkdir(mobile);
  const env = {
    ...process.env,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
  };
  const run = (cwd, ...args) =>
    execute('git', args, { cwd, env, timeout: 30_000 });

  await run(main, 'init', '-b', 'main');
  await run(main, 'config', 'user.name', 'Fixture');
  await run(main, 'config', 'user.email', 'fixture@example.invalid');
  await fs.writeFile(path.join(main, 'seed.txt'), 'seed\n');
  await run(main, 'add', '.');
  await run(main, 'commit', '-m', 'seed');
  await run(mobile, 'init', '-b', 'main');
  await run(mobile, 'remote', 'add', 'origin', stubOriginUrl);
  await run(main, 'worktree', 'add', '--detach', worktree);

  assert.equal(findLocalMobileOriginUrl(main), stubOriginUrl);
  // deploy 在链接 worktree 里跑构建时，nuwax-mobile 以主检出的邻居位置为准
  assert.equal(findLocalMobileOriginUrl(worktree), stubOriginUrl);
});
