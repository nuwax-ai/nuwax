import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const script = fileURLToPath(new URL('../deploy_test.sh', import.meta.url));
const library = fileURLToPath(
  new URL('../scripts/deploy/lib.sh', import.meta.url),
);
const start = 'fixture-start';

// 每个场景使用独立 Git 仓库和本地 bare 远端（origin/gitlab），不读取用户配置或调用真实构建。
function environment(extra = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (
      key.startsWith('GIT_') ||
      key.startsWith('DEPLOY_') ||
      key.startsWith('MOBILE_BUILD_') ||
      ['GATE', 'DRY_RUN', 'DEV_BRANCH', 'TEST_BRANCH', 'GITLAB_REMOTE_URL'].includes(key)
    )
      delete env[key];
  }
  return {
    ...env,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_TERMINAL_PROMPT: '0',
    LC_ALL: 'C',
    ...extra,
  };
}

async function run(cwd, command, args, extra = {}) {
  return execute(command, args, {
    cwd,
    env: environment(extra),
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  });
}

async function git(cwd, ...args) {
  return (await run(cwd, 'git', args)).stdout.trim();
}

async function fixture(t, { skipGitlabRemote = false } = {}) {
  const temporary = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'deploy-fast-lane-')),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'source');
  const tools = path.join(temporary, 'tools');
  await fs.mkdir(root);
  await fs.mkdir(tools);
  await git(root, 'init', '-b', start);
  await git(root, 'config', 'user.name', 'Deploy Fixture');
  await git(root, 'config', 'user.email', 'deploy@example.invalid');
  await git(root, 'config', 'commit.gpgsign', 'false');
  await git(root, 'config', 'core.hooksPath', '/dev/null');
  await git(root, 'config', 'pull.rebase', 'false');
  for (const dir of ['scripts/deploy', 'src/constants', 'micro-frontends']) {
    await fs.mkdir(path.join(root, dir), { recursive: true });
  }
  await fs.copyFile(script, path.join(root, 'deploy_test.sh'));
  await fs.copyFile(library, path.join(root, 'scripts/deploy/lib.sh'));
  await fs.writeFile(path.join(root, '.gitignore'), '/dist\n/node_modules\n');
  await fs.writeFile(
    path.join(root, 'src/constants/version.ts'),
    'stable version\n',
  );
  await fs.writeFile(path.join(root, 'micro-frontends/apps.json'), '[]\n');
  await fs.writeFile(path.join(root, 'source.txt'), 'initial source\n');
  await git(root, 'add', '.');
  await git(root, 'commit', '-m', 'fixture seed');
  for (const branch of ['dev', 'test']) await git(root, 'branch', branch);
  for (const remote of ['origin', 'gitlab']) {
    const bare = path.join(temporary, `${remote}.git`);
    await git(root, 'init', '--bare', bare);
    if (remote === 'gitlab' && skipGitlabRemote) {
      // 同事克隆场景：gitlab 远端未配置，但远端仓库存在（用 GITLAB_REMOTE_URL 指过去）
      await git(root, 'push', bare, 'dev', 'test');
      continue;
    }
    await git(root, 'remote', 'add', remote, bare);
    await git(root, 'push', remote, 'dev', 'test');
    await git(root, 'fetch', remote);
  }
  await fs.writeFile(
    path.join(tools, 'pnpm'),
    '#!/bin/sh\n[ "$2" = "test:conversation" ] || exit 0\ngit rev-parse HEAD >> "$FIXTURE_GATE_LOG"\n[ -z "${FIXTURE_FAIL_GATE:-}" ] || exit 1\nexit 0\n',
    { mode: 0o755 },
  );
  await fs.writeFile(
    path.join(tools, 'npm'),
    [
      '#!/bin/sh',
      'printf "%s\\n" "${MOBILE_BUILD_REPO:-local-origin}" >> "$FIXTURE_BUILD_LOG"',
      'mkdir -p dist',
      'printf "artifact from %s\\n" "$(cat source.txt)" > dist/index.html',
      '[ -z "${FIXTURE_BUILD_DIRTY:-}" ] || printf "generated\\n" >> source.txt',
      'exit 0',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  return {
    temporary,
    root,
    env: {
      PATH: `${tools}:${process.env.PATH}`,
      FIXTURE_GATE_LOG: path.join(temporary, 'gates.log'),
      FIXTURE_BUILD_LOG: path.join(temporary, 'builds.log'),
    },
  };
}

// 以独立 worktree 模拟同事直接推送到某个远端分支。
async function remoteCommit(state, remote, branch, file, contents) {
  const writer = path.join(
    state.temporary,
    `${remote}-${branch}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  await git(state.root, 'fetch', remote);
  await git(state.root, 'worktree', 'add', '--detach', writer, `${remote}/${branch}`);
  await fs.mkdir(path.dirname(path.join(writer, file)), { recursive: true });
  await fs.writeFile(path.join(writer, file), contents);
  await git(writer, 'add', '-f', file);
  await git(writer, 'commit', '-m', `${remote}/${branch} direct push`);
  const head = await git(writer, 'rev-parse', 'HEAD');
  await git(writer, 'push', remote, `HEAD:refs/heads/${branch}`);
  await git(state.root, 'worktree', 'remove', '--force', writer);
  return head;
}

async function remoteHead(state, remote, branch) {
  return git(
    state.root,
    '--git-dir',
    path.join(state.temporary, `${remote}.git`),
    'rev-parse',
    `refs/heads/${branch}`,
  );
}

async function remoteShow(state, remote, spec) {
  return git(
    state.root,
    '--git-dir',
    path.join(state.temporary, `${remote}.git`),
    'show',
    spec,
  );
}

async function logLines(file) {
  try {
    return (await fs.readFile(file, 'utf8')).trim().split('\n').filter(Boolean);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return [];
  }
}

async function deploy(state, extra = {}, shell = 'bash') {
  return run(state.root, shell, ['deploy_test.sh'], {
    ...state.env,
    ...extra,
  });
}

async function snapshot(root) {
  const index = path.resolve(
    root,
    await git(root, 'rev-parse', '--git-path', 'index'),
  );
  return {
    refs: await git(root, 'show-ref'),
    status: await git(root, 'status', '--porcelain'),
    branch: await git(root, 'branch', '--show-current'),
    index: (await fs.readFile(index)).toString('hex'),
  };
}

test('delivers dev to both test remotes without injecting a mobile source', async (t) => {
  const state = await fixture(t);
  await remoteCommit(state, 'origin', 'dev', 'source.txt', 'dev feature\n');
  const result = await deploy(state);
  assert.match(result.stdout, /快速通道提测完成/);
  const origin = await remoteHead(state, 'origin', 'test');
  assert.equal(await remoteHead(state, 'gitlab', 'test'), origin);
  assert.equal(
    await remoteShow(state, 'gitlab', 'test:dist/index.html'),
    'artifact from dev feature',
  );
  // 脚本不再注入 MOBILE_BUILD_SOURCE，M 端源交给下载脚本读本地 nuwax-mobile 的 origin
  assert.deepEqual(await logLines(state.env.FIXTURE_BUILD_LOG), ['local-origin']);
  assert.equal(await git(state.root, 'branch', '--show-current'), start);
  assert.equal(await git(state.root, 'status', '--porcelain'), '');
});

test('MOBILE_BUILD_REPO set by the caller reaches the build unchanged', async (t) => {
  const state = await fixture(t);
  await remoteCommit(state, 'origin', 'dev', 'source.txt', 'repo override\n');
  await deploy(state, { MOBILE_BUILD_REPO: 'https://fixture.invalid/m.git' });
  assert.deepEqual(await logLines(state.env.FIXTURE_BUILD_LOG), [
    'https://fixture.invalid/m.git',
  ]);
});

test('a missing gitlab remote is auto-configured and the delivery still succeeds', async (t) => {
  const state = await fixture(t, { skipGitlabRemote: true });
  await remoteCommit(state, 'origin', 'dev', 'source.txt', 'colleague clone\n');
  const result = await deploy(state, {
    GITLAB_REMOTE_URL: path.join(state.temporary, 'gitlab.git'),
  });
  assert.match(result.stdout, /已自动补配 gitlab 远端/);
  // 远端补配后正常走完 fetch/merge/push，两处 test 落点一致
  const origin = await remoteHead(state, 'origin', 'test');
  assert.equal(await remoteHead(state, 'gitlab', 'test'), origin);
  assert.equal(
    await git(state.root, 'remote', 'get-url', 'gitlab'),
    path.join(state.temporary, 'gitlab.git'),
  );
  assert.equal(
    await remoteShow(state, 'gitlab', 'test:dist/index.html'),
    'artifact from colleague clone',
  );
});

test('a clone without the local test branch gets it rebuilt from the remote', async (t) => {
  const state = await fixture(t);
  await remoteCommit(state, 'origin', 'dev', 'source.txt', 'single-branch clone\n');
  // 同事克隆常见单分支检出：本地只有 dev，test 分支不存在
  await git(state.root, 'branch', '-D', 'test');
  const result = await deploy(state);
  assert.match(result.stdout, /已自动补建本地分支 test ← gitlab\/test/);
  const origin = await remoteHead(state, 'origin', 'test');
  assert.equal(await remoteHead(state, 'gitlab', 'test'), origin);
  assert.equal(
    await remoteShow(state, 'gitlab', 'test:dist/index.html'),
    'artifact from single-branch clone',
  );
  assert.equal(await git(state.root, 'branch', '--show-current'), start);
});

test('source pushed directly to gitlab dev reaches the delivered test', async (t) => {
  const state = await fixture(t);
  const direct = await remoteCommit(
    state,
    'gitlab',
    'dev',
    'gitlab-only.txt',
    'gitlab dev direct push\n',
  );
  await deploy(state);
  for (const remote of ['origin', 'gitlab']) {
    await git(
      state.root,
      '--git-dir',
      path.join(state.temporary, `${remote}.git`),
      'merge-base',
      '--is-ancestor',
      direct,
      'refs/heads/test',
    );
  }
});

test('commits pushed directly to either test remote are kept in the delivery', async (t) => {
  const state = await fixture(t);
  const direct = await remoteCommit(
    state,
    'gitlab',
    'test',
    'hotfix.txt',
    'gitlab test hotfix\n',
  );
  await deploy(state);
  await git(
    state.root,
    '--git-dir',
    path.join(state.temporary, 'origin.git'),
    'merge-base',
    '--is-ancestor',
    direct,
    'refs/heads/test',
  );
});

test('a source conflict between dev and test stops before build and leaves remotes untouched', async (t) => {
  const state = await fixture(t);
  await remoteCommit(state, 'origin', 'dev', 'source.txt', 'dev side\n');
  await remoteCommit(state, 'gitlab', 'test', 'source.txt', 'test side\n');
  const before = {
    origin: await remoteHead(state, 'origin', 'test'),
    gitlab: await remoteHead(state, 'gitlab', 'test'),
  };
  const failure = await deploy(state).then(
    () => assert.fail('源码冲突必须停止'),
    (error) => error,
  );
  assert.match(failure.stderr, /source\.txt/);
  assert.match(failure.stderr, /源码冲突/);
  assert.equal(await remoteHead(state, 'origin', 'test'), before.origin);
  assert.equal(await remoteHead(state, 'gitlab', 'test'), before.gitlab);
  assert.deepEqual(await logLines(state.env.FIXTURE_BUILD_LOG), []);
  assert.equal(await git(state.root, 'ls-files', '-u'), '');
  assert.equal(await git(state.root, 'branch', '--show-current'), start);
});

test('dist-only conflicts are rebuilt instead of stopping the delivery', async (t) => {
  const state = await fixture(t);
  await remoteCommit(state, 'origin', 'dev', 'dist/index.html', 'dev dist\n');
  await remoteCommit(state, 'gitlab', 'test', 'dist/index.html', 'test dist\n');
  await deploy(state);
  assert.equal(
    await remoteShow(state, 'gitlab', 'test:dist/index.html'),
    'artifact from initial source',
  );
});

test('quality gate runs for new source, fails closed, and is skipped when only artifacts change', async (t) => {
  const state = await fixture(t);
  await remoteCommit(state, 'origin', 'dev', 'source.txt', 'gated source\n');
  const before = await remoteHead(state, 'gitlab', 'test');
  await assert.rejects(deploy(state, { FIXTURE_FAIL_GATE: '1' }));
  assert.equal(await remoteHead(state, 'gitlab', 'test'), before);
  assert.deepEqual(await logLines(state.env.FIXTURE_BUILD_LOG), []);
  assert.equal((await logLines(state.env.FIXTURE_GATE_LOG)).length, 1);

  // 失败后重跑：本地 test 已含合并，仍必须重新过门，不能借本地 HEAD 绕过。
  await deploy(state);
  assert.equal((await logLines(state.env.FIXTURE_GATE_LOG)).length, 2);

  // 源码与已部署的 gitlab/test 一致时不再付门的成本。
  await deploy(state);
  assert.equal((await logLines(state.env.FIXTURE_GATE_LOG)).length, 2);
});

test('GATE=0 skips the quality gate explicitly', async (t) => {
  const state = await fixture(t);
  await remoteCommit(state, 'origin', 'dev', 'source.txt', 'urgent source\n');
  const result = await deploy(state, { GATE: '0', FIXTURE_FAIL_GATE: '1' });
  assert.match(result.stdout + result.stderr, /GATE=0/);
  assert.deepEqual(await logLines(state.env.FIXTURE_GATE_LOG), []);
  assert.equal(
    await remoteShow(state, 'gitlab', 'test:dist/index.html'),
    'artifact from urgent source',
  );
});

test('dry-run prints the plan without touching refs, index or files', async (t) => {
  const state = await fixture(t);
  const before = await snapshot(state.root);
  const result = await deploy(state, { DRY_RUN: '1' });
  assert.match(result.stdout, /只读演练/);
  assert.match(result.stdout, /push gitlab test/);
  assert.deepEqual(await snapshot(state.root), before);
  assert.deepEqual(await logLines(state.env.FIXTURE_BUILD_LOG), []);
});

test('uncommitted source left by the build stops the push', async (t) => {
  const state = await fixture(t);
  const before = await remoteHead(state, 'gitlab', 'test');
  await assert.rejects(deploy(state, { FIXTURE_BUILD_DIRTY: '1' }));
  assert.equal(await remoteHead(state, 'gitlab', 'test'), before);
  assert.equal(await remoteHead(state, 'origin', 'test'), before);
});

test('a dirty working tree is rejected before any branch switch', async (t) => {
  const state = await fixture(t);
  await fs.writeFile(path.join(state.root, 'source.txt'), 'local WIP\n');
  const before = await snapshot(state.root);
  const failure = await deploy(state).then(
    () => assert.fail('脏工作区必须拒绝'),
    (error) => error,
  );
  assert.match(failure.stderr, /未提交改动/);
  assert.deepEqual(await snapshot(state.root), before);
});

test('invoking through sh re-executes under bash and still delivers', async (t) => {
  const state = await fixture(t);
  await remoteCommit(state, 'origin', 'dev', 'source.txt', 'via sh\n');
  const result = await deploy(state, {}, 'sh');
  assert.match(result.stdout, /快速通道提测完成/);
  assert.equal(
    await remoteShow(state, 'gitlab', 'test:dist/index.html'),
    'artifact from via sh',
  );
});

test('submodules are aligned for the build and again when handing back the start branch', async (t) => {
  const state = await fixture(t);
  const fileProtocol = {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'protocol.file.allow',
    GIT_CONFIG_VALUE_0: 'always',
  };
  const upstream = path.join(state.temporary, 'micro-app');
  await fs.mkdir(upstream);
  await git(upstream, 'init', '-b', 'main');
  await git(upstream, 'config', 'user.name', 'Fixture');
  await git(upstream, 'config', 'user.email', 'fixture@example.invalid');
  await fs.writeFile(path.join(upstream, 'app.txt'), 'v1\n');
  await git(upstream, 'add', '.');
  await git(upstream, 'commit', '-m', 'v1');
  await fs.writeFile(path.join(upstream, 'app.txt'), 'v2\n');
  await git(upstream, 'commit', '-am', 'v2');
  const [v2, v1] = (await git(upstream, 'rev-list', 'main')).split('\n');

  // 起跑分支登记 v1，dev 登记 v2 并已推到 origin。
  await run(
    state.root,
    'git',
    ['submodule', 'add', upstream, 'submodules/app'],
    fileProtocol,
  );
  await git(path.join(state.root, 'submodules/app'), 'checkout', '-q', v1);
  await git(state.root, 'add', '.gitmodules', 'submodules/app');
  await git(state.root, 'commit', '-m', 'register app v1');
  await git(state.root, 'checkout', '-q', 'dev');
  await git(state.root, 'merge', '-q', start);
  await git(path.join(state.root, 'submodules/app'), 'checkout', '-q', v2);
  await git(state.root, 'add', 'submodules/app');
  await git(state.root, 'commit', '-m', 'dev moves app to v2');
  await git(state.root, 'push', '-q', 'origin', 'dev');
  await git(state.root, 'checkout', '-q', start);
  await run(
    state.root,
    'git',
    ['submodule', 'update', '--init'],
    fileProtocol,
  );

  const result = await deploy(state, fileProtocol);
  assert.match(result.stdout, /快速通道提测完成/);
  assert.equal(
    await git(
      state.root,
      '--git-dir',
      path.join(state.temporary, 'gitlab.git'),
      'rev-parse',
      'test:submodules/app',
    ),
    v2,
  );
  assert.equal(await git(state.root, 'branch', '--show-current'), start);
  assert.equal(await git(state.root, 'status', '--porcelain'), '');
});
