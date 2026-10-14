import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const require = createRequire(import.meta.url);
const {
  DEFAULT_BRANCH,
  FALLBACK_REPO_URL,
  MOBILE_DIR_NAME,
  findLocalMobileOriginUrl,
  resolveMobileBuildOptions,
} = require('../scripts/download-mobile-build.js');

const stubOriginUrl = 'https://example.invalid/nuwax-mobile.git';
const stubOrigin = () => stubOriginUrl;

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
    resolveMobileBuildOptions(['dev'], {}, { findOriginUrl: stubOrigin }).branch,
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
