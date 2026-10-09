import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const script = fileURLToPath(
  new URL('../scripts/deploy_sync_test.sh', import.meta.url),
);
const feature = 'fixture-feature';
const version = 'fixture-version';

// 每个场景使用独立 Git 仓库和本地 bare 远端，不读取用户配置或调用真实部署工具。
function environment(extra = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith('GIT_') || key.startsWith('DEPLOY_')) delete env[key];
  }
  return {
    ...env,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_TERMINAL_PROMPT: '0',
    LC_ALL: 'C',
    CONFIG_FILE: '/dev/null',
    FEATURE_BRANCH: feature,
    VERSION_BRANCH: version,
    DEV_BRANCH: 'dev',
    TEST_BRANCH: 'test',
    USE_WORKTREE: '0',
    UPGRADE_MICRO_APPS: '0',
    INIT_ONLY: '0',
    DRY_RUN: '0',
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

async function fixture(t) {
  const temporary = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'deploy-sync-test-')),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'source');
  const tools = path.join(temporary, 'tools');
  await fs.mkdir(root);
  await fs.mkdir(tools);
  await git(root, 'init', '-b', feature);
  await git(root, 'config', 'user.name', 'Deploy Fixture');
  await git(root, 'config', 'user.email', 'deploy@example.invalid');
  await git(root, 'config', 'commit.gpgsign', 'false');
  await git(root, 'config', 'core.hooksPath', '/dev/null');
  await git(root, 'config', 'pull.rebase', 'false');
  for (const dir of [
    'scripts',
    'src/constants',
    'src/.umi',
    'node_modules',
    'micro-frontends',
  ]) {
    await fs.mkdir(path.join(root, dir), { recursive: true });
  }
  await fs.copyFile(script, path.join(root, 'scripts/deploy_sync_test.sh'));
  await fs.writeFile(
    path.join(root, '.gitignore'),
    '/dist\n/node_modules\n/src/.umi\n',
  );
  await fs.writeFile(
    path.join(root, 'src/constants/version.ts'),
    'source hash\n',
  );
  await fs.writeFile(path.join(root, 'src/.umi/tsconfig.json'), '{}\n');
  await fs.writeFile(path.join(root, 'micro-frontends/apps.json'), '[]\n');
  await fs.writeFile(path.join(root, 'source.txt'), 'initial source\n');
  await git(root, 'add', '.');
  await git(root, 'commit', '-m', 'fixture seed');
  for (const branch of [version, 'dev', 'test'])
    await git(root, 'branch', branch);
  for (const remote of ['origin', 'gitlab']) {
    const bare = path.join(temporary, `${remote}.git`);
    await git(root, 'init', '--bare', bare);
    await git(root, 'remote', 'add', remote, bare);
    await git(root, 'push', remote, '--all');
    await git(root, 'fetch', remote);
  }
  await fs.writeFile(path.join(tools, 'pnpm'), '#!/bin/sh\nexit 0\n', {
    mode: 0o755,
  });
  await fs.writeFile(
    path.join(tools, 'npm'),
    '#!/bin/sh\nmkdir -p dist\nprintf "fixture artifact\\n" > dist/index.html\nprintf "baked fixture hash\\n" > src/constants/version.ts\n',
    { mode: 0o755 },
  );
  // hash-object 的输入必须与脚本一致（不是 Node 的裸文本 SHA）。
  const hash = createHash('sha1')
    .update(`blob ${Buffer.byteLength(feature)}\0${feature}`)
    .digest('hex')
    .slice(0, 12);
  return {
    temporary,
    root,
    tools,
    deploy: path.join(temporary, `.nuwax-deploy-${hash}`),
    branch: `deploy-sync-${hash}`,
    record: path.join(root, '.git/nuwax-deploy', `${hash}.record`),
    env: {
      PATH: `${tools}:${process.env.PATH}`,
      FIXTURE_GATE_LOG: path.join(temporary, 'gates.log'),
      FIXTURE_BUILD_LOG: path.join(temporary, 'builds.log'),
    },
  };
}

async function remoteCommit(state, remote, branch, file, contents) {
  const writer = path.join(state.temporary, `${remote}-${branch}-writer`);
  await git(
    state.root,
    'worktree',
    'add',
    '-b',
    `writer-${remote}-${branch}`,
    writer,
    `${remote}/${branch}`,
  );
  await fs.mkdir(path.dirname(path.join(writer, file)), { recursive: true });
  await fs.writeFile(path.join(writer, file), contents);
  await git(writer, 'add', '-f', file);
  await git(writer, 'commit', '-m', `${remote}/${branch} independent source`);
  const head = await git(writer, 'rev-parse', 'HEAD');
  await git(writer, 'push', remote, `HEAD:refs/heads/${branch}`);
  return { writer, head };
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

async function logLines(file) {
  try {
    return (await fs.readFile(file, 'utf8')).trim().split('\n');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return [];
  }
}

async function instrumentTools(state) {
  await fs.writeFile(
    path.join(state.tools, 'pnpm'),
    '#!/bin/sh\ngit rev-parse HEAD >> "$FIXTURE_GATE_LOG"\nif [ -n "${FIXTURE_FAIL_GATE_WITH_FILE:-}" ] && [ -f "$FIXTURE_FAIL_GATE_WITH_FILE" ]; then exit 1; fi\nexit 0\n',
    { mode: 0o755 },
  );
  await fs.writeFile(
    path.join(state.tools, 'npm'),
    '#!/bin/sh\nprintf "build\\n" >> "$FIXTURE_BUILD_LOG"\nmkdir -p dist\nprintf "fixture artifact\\n" > dist/index.html\nprintf "baked fixture hash\\n" > src/constants/version.ts\n',
    { mode: 0o755 },
  );
}

async function deploy(state, cwd = state.root, extra = {}) {
  return run(cwd, 'bash', ['scripts/deploy_sync_test.sh'], {
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
    worktrees: await git(root, 'worktree', 'list', '--porcelain'),
    status: await git(root, 'status', '--porcelain'),
    branch: await git(root, 'branch', '--show-current'),
    index: (await fs.readFile(index)).toString('hex'),
  };
}

test('dirty dry-run preserves foreign worktrees, refs, index and mismatched adapter bytes', async (t) => {
  const state = await fixture(t);
  const foreign = path.join(state.temporary, '.nuwax-deploy-worktree');
  await git(state.root, 'worktree', 'add', '-b', 'deploy-sync-work', foreign);
  await fs.writeFile(path.join(foreign, 'source.txt'), 'parallel work\n');
  await fs.writeFile(path.join(state.root, 'source.txt'), 'current work\n');
  await fs.writeFile(
    path.join(state.root, 'micro-frontends/adapter.json'),
    '{"pin":"invalid"}\n',
  );
  const before = await snapshot(state.root);
  const result = await deploy(state, state.root, {
    DRY_RUN: '1',
    USE_WORKTREE: '1',
  });
  assert.match(result.stdout, /只读演练/);
  assert.match(result.stdout, /步骤 8\/8/);
  assert.deepEqual(await snapshot(state.root), before);
  assert.equal(
    await fs.readFile(path.join(foreign, 'source.txt'), 'utf8'),
    'parallel work\n',
  );
  assert.equal(
    await fs.readFile(
      path.join(state.root, 'micro-frontends/adapter.json'),
      'utf8',
    ),
    '{"pin":"invalid"}\n',
  );
  await assert.rejects(fs.stat(state.deploy), { code: 'ENOENT' });
});

test('dry-run does not clear an unresolved index', async (t) => {
  const state = await fixture(t);
  await git(state.root, 'branch', 'conflicting');
  await fs.writeFile(path.join(state.root, 'source.txt'), 'feature side\n');
  await git(state.root, 'commit', '-am', 'feature side');
  await git(state.root, 'checkout', 'conflicting');
  await fs.writeFile(path.join(state.root, 'source.txt'), 'other side\n');
  await git(state.root, 'commit', '-am', 'other side');
  await git(state.root, 'checkout', feature);
  await assert.rejects(git(state.root, 'merge', 'conflicting'));
  const before = await snapshot(state.root);
  const result = await deploy(state, state.root, { DRY_RUN: '1' });
  assert.match(result.stdout, /未执行部署/);
  assert.deepEqual(await snapshot(state.root), before);
  assert.match(await git(state.root, 'ls-files', '-u'), /source.txt/);
});

test('isolated delivery starts from committed local source and commits baked hash with dist', async (t) => {
  const state = await fixture(t);
  const foreign = path.join(state.temporary, '.nuwax-deploy-worktree');
  await git(state.root, 'worktree', 'add', '-b', 'deploy-sync-work', foreign);
  await fs.writeFile(path.join(foreign, 'source.txt'), 'foreign WIP\n');
  await fs.writeFile(
    path.join(state.root, 'source.txt'),
    'new committed source\n',
  );
  await git(state.root, 'commit', '-am', 'unpublished source');
  const sourceCommit = await git(state.root, 'rev-parse', 'HEAD');
  await fs.writeFile(
    path.join(state.root, 'src/constants/version.ts'),
    'parallel baked hash\n',
  );
  const result = await deploy(state, state.root, { USE_WORKTREE: '1' });
  assert.match(result.stdout, /同步测试流程完成/);
  assert.equal(
    await fs.readFile(
      path.join(state.root, 'src/constants/version.ts'),
      'utf8',
    ),
    'parallel baked hash\n',
  );
  assert.equal(
    await fs.readFile(path.join(foreign, 'source.txt'), 'utf8'),
    'foreign WIP\n',
  );
  assert.equal(await git(state.root, 'branch', '--show-current'), feature);
  assert.equal(
    await git(state.deploy, 'branch', '--show-current'),
    state.branch,
  );
  assert.equal(await git(state.deploy, 'status', '--porcelain'), '');
  assert.equal(
    await git(state.root, 'show', 'test:src/constants/version.ts'),
    'baked fixture hash',
  );
  await git(
    state.root,
    'merge-base',
    '--is-ancestor',
    sourceCommit,
    'origin/fixture-feature',
  );
  assert.match(
    await fs.readFile(state.record, 'utf8'),
    new RegExp(state.branch),
  );
});

test('registered worktree is reused and receives new committed source on the next delivery', async (t) => {
  const state = await fixture(t);
  await deploy(state, state.root, { USE_WORKTREE: '1' });
  const record = await fs.readFile(state.record, 'utf8');
  await fs.writeFile(path.join(state.root, 'source.txt'), 'second source\n');
  await git(state.root, 'commit', '-am', 'second source');
  const latest = await git(state.root, 'rev-parse', 'HEAD');
  const result = await deploy(state, state.root, { USE_WORKTREE: '1' });
  assert.match(result.stdout, /同步 fixture-feature 最新源码到提测 worktree/);
  assert.equal(await fs.readFile(state.record, 'utf8'), record);
  await git(
    state.root,
    'merge-base',
    '--is-ancestor',
    latest,
    'origin/fixture-feature',
  );
  assert.equal(
    await fs.readFile(path.join(state.deploy, 'source.txt'), 'utf8'),
    'second source\n',
  );
});

test('resume only adopts the registered directory and preserves an arbitrary worktree', async (t) => {
  const state = await fixture(t);
  await deploy(state, state.root, { USE_WORKTREE: '1' });
  const other = path.join(state.temporary, 'other-task');
  await git(state.root, 'worktree', 'add', '-b', 'other-task', other);
  const before = await snapshot(other);
  await assert.rejects(deploy(state, other), (error) => {
    assert.match(error.stderr, /被其它 worktree 占用，保留原样/);
    return true;
  });
  assert.deepEqual(await snapshot(other), before);
  await git(state.deploy, 'checkout', 'dev');
  const result = await deploy(state, state.deploy);
  assert.match(result.stdout, /检测到已登记提测 worktree 内续跑/);
  assert.equal(
    await git(state.deploy, 'branch', '--show-current'),
    state.branch,
  );
});

test('occupied version branch blocks delivery without deleting its dirty worktree', async (t) => {
  const state = await fixture(t);
  const other = path.join(state.temporary, 'version-owner');
  await git(state.root, 'worktree', 'add', other, version);
  await fs.writeFile(path.join(other, 'source.txt'), 'version owner WIP\n');
  const before = await snapshot(state.root);
  await assert.rejects(deploy(state), (error) => {
    assert.match(
      error.stderr,
      /fixture-version 被其它 worktree 占用，保留原样/,
    );
    return true;
  });
  assert.deepEqual(await snapshot(state.root), before);
  assert.equal(
    await fs.readFile(path.join(other, 'source.txt'), 'utf8'),
    'version owner WIP\n',
  );
});

test('unregistered destination or temporary branch is preserved instead of force removed', async (t) => {
  const state = await fixture(t);
  await fs.mkdir(state.deploy);
  await fs.writeFile(
    path.join(state.deploy, 'keep.txt'),
    'existing directory\n',
  );
  await assert.rejects(
    deploy(state, state.root, { USE_WORKTREE: '1' }),
    (error) => {
      assert.match(error.stderr, /目录已存在但没有本脚本登记，保留原样/);
      return true;
    },
  );
  assert.equal(
    await fs.readFile(path.join(state.deploy, 'keep.txt'), 'utf8'),
    'existing directory\n',
  );
  await fs.rm(state.deploy, { recursive: true });
  await git(state.root, 'branch', state.branch);
  const before = await snapshot(state.root);
  await assert.rejects(
    deploy(state, state.root, { USE_WORKTREE: '1' }),
    (error) => {
      assert.match(error.stderr, /临时分支已存在但没有本脚本登记，保留原样/);
      return true;
    },
  );
  assert.deepEqual(await snapshot(state.root), before);
});

test('registered destination with unfinished work or another branch is not repurposed', async (t) => {
  const state = await fixture(t);
  await deploy(state, state.root, { USE_WORKTREE: '1' });
  await fs.writeFile(
    path.join(state.deploy, 'source.txt'),
    'pending delivery work\n',
  );
  await assert.rejects(
    deploy(state, state.root, { USE_WORKTREE: '1' }),
    (error) => {
      assert.match(error.stderr, /已登记提测 worktree 有未提交现场/);
      return true;
    },
  );
  assert.equal(
    await fs.readFile(path.join(state.deploy, 'source.txt'), 'utf8'),
    'pending delivery work\n',
  );
  await git(state.deploy, 'checkout', '--', 'source.txt');
  await git(state.deploy, 'checkout', '-b', 'other-owner');
  const before = await snapshot(state.deploy);
  await assert.rejects(
    deploy(state, state.root, { USE_WORKTREE: '1' }),
    (error) => {
      assert.match(error.stderr, /当前用于其它分支，保留原样/);
      return true;
    },
  );
  await assert.rejects(deploy(state, state.deploy), (error) => {
    assert.match(error.stderr, /当前用于其它分支，保留原样/);
    return true;
  });
  assert.deepEqual(await snapshot(state.deploy), before);
});

test('GitLab dev source not yet in GitLab test enters both test outputs without pushing dev', async (t) => {
  const state = await fixture(t);
  await instrumentTools(state);
  const gitlabDev = await remoteCommit(
    state,
    'gitlab',
    'dev',
    'gitlab-only.txt',
    'pending GitLab development\n',
  );
  const originDevBefore = await remoteHead(state, 'origin', 'dev');
  const testBefore = await remoteHead(state, 'gitlab', 'test');
  const result = await deploy(state, state.root, { USE_WORKTREE: '1' });
  assert.match(result.stdout, /步骤 6.1：汇合 gitlab\/dev/);
  assert.match(result.stdout, /步骤 6.2：组合 dev 源码不同/);
  for (const remote of ['origin', 'gitlab']) {
    const testHead = await remoteHead(state, remote, 'test');
    await git(
      state.root,
      'merge-base',
      '--is-ancestor',
      gitlabDev.head,
      testHead,
    );
    await git(state.root, 'merge-base', '--is-ancestor', testBefore, testHead);
    assert.equal(
      await git(state.root, 'show', `${testHead}:gitlab-only.txt`),
      'pending GitLab development',
    );
  }
  assert.equal(await remoteHead(state, 'gitlab', 'dev'), gitlabDev.head);
  assert.equal(await remoteHead(state, 'origin', 'dev'), originDevBefore);
  assert.equal((await logLines(state.env.FIXTURE_GATE_LOG)).length, 1);
});

test('divergent dev and test remotes preserve both histories, source additions and foreign work', async (t) => {
  const state = await fixture(t);
  await instrumentTools(state);
  const originDev = await remoteCommit(
    state,
    'origin',
    'dev',
    'origin-dev.txt',
    'origin development\n',
  );
  const gitlabDev = await remoteCommit(
    state,
    'gitlab',
    'dev',
    'gitlab-dev.txt',
    'GitLab development\n',
  );
  const originTest = await remoteCommit(
    state,
    'origin',
    'test',
    'origin-test.txt',
    'origin test history\n',
  );
  const gitlabTest = await remoteCommit(
    state,
    'gitlab',
    'test',
    'gitlab-test.txt',
    'GitLab test history\n',
  );
  await fs.writeFile(
    path.join(state.root, 'source.txt'),
    'new personal source\n',
  );
  await git(state.root, 'commit', '-am', 'personal source');
  const personal = await git(state.root, 'rev-parse', 'HEAD');
  await fs.writeFile(
    path.join(state.root, 'src/constants/version.ts'),
    'parallel hash\n',
  );
  await fs.writeFile(
    path.join(gitlabDev.writer, 'source.txt'),
    'foreign writer WIP\n',
  );
  await deploy(state, state.root, { USE_WORKTREE: '1' });
  const testHead = await remoteHead(state, 'origin', 'test');
  assert.equal(await remoteHead(state, 'gitlab', 'test'), testHead);
  for (const ancestor of [
    originDev.head,
    gitlabDev.head,
    originTest.head,
    gitlabTest.head,
    personal,
  ]) {
    await git(state.root, 'merge-base', '--is-ancestor', ancestor, testHead);
  }
  for (const [file, value] of Object.entries({
    'origin-dev.txt': 'origin development',
    'gitlab-dev.txt': 'GitLab development',
    'origin-test.txt': 'origin test history',
    'gitlab-test.txt': 'GitLab test history',
    'source.txt': 'new personal source',
  }))
    assert.equal(await git(state.root, 'show', `${testHead}:${file}`), value);
  assert.equal(await remoteHead(state, 'origin', 'dev'), originDev.head);
  assert.equal(await remoteHead(state, 'gitlab', 'dev'), gitlabDev.head);
  assert.equal(
    await fs.readFile(
      path.join(state.root, 'src/constants/version.ts'),
      'utf8',
    ),
    'parallel hash\n',
  );
  assert.equal(
    await fs.readFile(path.join(gitlabDev.writer, 'source.txt'), 'utf8'),
    'foreign writer WIP\n',
  );
  assert.equal((await logLines(state.env.FIXTURE_GATE_LOG)).length, 3);
});

test('conflicting GitLab dev source rolls back before build or either test push', async (t) => {
  const state = await fixture(t);
  await instrumentTools(state);
  const gitlabDev = await remoteCommit(
    state,
    'gitlab',
    'dev',
    'source.txt',
    'GitLab conflicting source\n',
  );
  await fs.writeFile(
    path.join(state.root, 'source.txt'),
    'personal conflicting source\n',
  );
  await git(state.root, 'commit', '-am', 'personal conflict');
  const before = {
    origin: await remoteHead(state, 'origin', 'test'),
    gitlab: await remoteHead(state, 'gitlab', 'test'),
  };
  await assert.rejects(
    deploy(state, state.root, { USE_WORKTREE: '1' }),
    (error) => {
      assert.match(error.stderr, /gitlab\/dev 与本地 dev 存在源码冲突，已回滚/);
      return true;
    },
  );
  for (const remote of ['origin', 'gitlab'])
    assert.equal(await remoteHead(state, remote, 'test'), before[remote]);
  assert.equal(await remoteHead(state, 'gitlab', 'dev'), gitlabDev.head);
  assert.equal(await git(state.deploy, 'ls-files', '-u'), '');
  assert.deepEqual(await logLines(state.env.FIXTURE_BUILD_LOG), []);
});

test('failed combined dev quality gate is retried and successful exact commit is reused', async (t) => {
  const state = await fixture(t);
  await instrumentTools(state);
  const gitlabDev = await remoteCommit(
    state,
    'gitlab',
    'dev',
    'reject-combined.txt',
    'untested combined development\n',
  );
  const testBefore = await remoteHead(state, 'gitlab', 'test');
  const failEnv = {
    USE_WORKTREE: '1',
    FIXTURE_FAIL_GATE_WITH_FILE: 'reject-combined.txt',
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    await assert.rejects(deploy(state, state.root, failEnv), (error) => {
      assert.match(error.stdout, /步骤 6.2：组合 dev 源码不同/);
      return true;
    });
    assert.equal(await remoteHead(state, 'gitlab', 'test'), testBefore);
    assert.equal(await remoteHead(state, 'origin', 'test'), testBefore);
  }
  assert.equal((await logLines(state.env.FIXTURE_GATE_LOG)).length, 2);
  assert.deepEqual(await logLines(state.env.FIXTURE_BUILD_LOG), []);
  await deploy(state, state.root, { USE_WORKTREE: '1' });
  const successCalls = (await logLines(state.env.FIXTURE_GATE_LOG)).length;
  const result = await deploy(state, state.root, { USE_WORKTREE: '1' });
  assert.match(result.stdout, /组合 dev 提交 .*已过质量门，断点续跑跳过/);
  assert.equal(
    (await logLines(state.env.FIXTURE_GATE_LOG)).length,
    successCalls,
  );
  await git(
    state.root,
    'merge-base',
    '--is-ancestor',
    gitlabDev.head,
    await remoteHead(state, 'gitlab', 'test'),
  );
});

test('dev and test source conflicts stop instead of silently discarding dev changes', async (t) => {
  const state = await fixture(t);
  await instrumentTools(state);
  const gitlabDev = await remoteCommit(
    state,
    'gitlab',
    'dev',
    'source.txt',
    'new GitLab dev logic\n',
  );
  const gitlabTest = await remoteCommit(
    state,
    'gitlab',
    'test',
    'source.txt',
    'existing GitLab test logic\n',
  );
  const originTestBefore = await remoteHead(state, 'origin', 'test');
  await assert.rejects(
    deploy(state, state.root, { USE_WORKTREE: '1' }),
    (error) => {
      assert.match(error.stderr, /合并 dev 进 test 冲突：已回滚/);
      return true;
    },
  );
  assert.equal(await remoteHead(state, 'origin', 'test'), originTestBefore);
  assert.equal(await remoteHead(state, 'gitlab', 'test'), gitlabTest.head);
  assert.equal(await remoteHead(state, 'gitlab', 'dev'), gitlabDev.head);
  assert.equal(await git(state.deploy, 'ls-files', '-u'), '');
  assert.equal(
    await git(state.root, 'show', 'dev:source.txt'),
    'new GitLab dev logic',
  );
  assert.equal(
    await git(state.root, 'show', 'test:source.txt'),
    'existing GitLab test logic',
  );
  assert.deepEqual(await logLines(state.env.FIXTURE_BUILD_LOG), []);
});

for (const file of ['src/constants/version.ts', 'dist/conflicting-asset.txt']) {
  test(`machine conflict in ${file} still rebuilds and preserves both histories`, async (t) => {
    const state = await fixture(t);
    const gitlabDev = await remoteCommit(
      state,
      'gitlab',
      'dev',
      file,
      'dev generated artifact\n',
    );
    const gitlabTest = await remoteCommit(
      state,
      'gitlab',
      'test',
      file,
      'test generated artifact\n',
    );
    const result = await deploy(state, state.root, { USE_WORKTREE: '1' });
    assert.match(result.stdout, /merge 冲突含 (version.ts|dist\/)/);
    const deployed = await remoteHead(state, 'gitlab', 'test');
    assert.equal(await remoteHead(state, 'origin', 'test'), deployed);
    await git(
      state.root,
      'merge-base',
      '--is-ancestor',
      gitlabDev.head,
      deployed,
    );
    await git(
      state.root,
      'merge-base',
      '--is-ancestor',
      gitlabTest.head,
      deployed,
    );
    assert.equal(
      await git(state.root, 'show', `${deployed}:src/constants/version.ts`),
      'baked fixture hash',
    );
    assert.equal(
      await git(state.root, 'show', `${deployed}:dist/index.html`),
      'fixture artifact',
    );
    assert.equal(await git(state.deploy, 'status', '--porcelain'), '');
  });
}

test('test-only combined source fails before build, retries failure and reuses only successful source across artifacts', async (t) => {
  const state = await fixture(t);
  await instrumentTools(state);
  const gitlabTest = await remoteCommit(
    state,
    'gitlab',
    'test',
    'reject-test.txt',
    'independent test source\n',
  );
  const originBefore = await remoteHead(state, 'origin', 'test');
  const failEnv = {
    USE_WORKTREE: '1',
    FIXTURE_FAIL_GATE_WITH_FILE: 'reject-test.txt',
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    await assert.rejects(deploy(state, state.root, failEnv), (error) => {
      assert.match(error.stdout, /步骤 7.1：组合 test 源码不同/);
      return true;
    });
    assert.equal(await remoteHead(state, 'origin', 'test'), originBefore);
    assert.equal(await remoteHead(state, 'gitlab', 'test'), gitlabTest.head);
  }
  assert.equal((await logLines(state.env.FIXTURE_GATE_LOG)).length, 2);
  assert.deepEqual(await logLines(state.env.FIXTURE_BUILD_LOG), []);
  await fs.writeFile(
    path.join(state.tools, 'npm'),
    '#!/bin/sh\nprintf "build\\n" >> "$FIXTURE_BUILD_LOG"\ncount=$(wc -l < "$FIXTURE_BUILD_LOG" | tr -d " ")\nmkdir -p dist\nprintf "artifact %s\\n" "$count" > dist/index.html\nprintf "baked fixture hash\\n" > src/constants/version.ts\n',
    { mode: 0o755 },
  );
  await deploy(state, state.root, { USE_WORKTREE: '1' });
  const testedCalls = (await logLines(state.env.FIXTURE_GATE_LOG)).length;
  const firstArtifactHead = await remoteHead(state, 'gitlab', 'test');
  const result = await deploy(state, state.root, { USE_WORKTREE: '1' });
  assert.match(result.stdout, /步骤 7.1：组合 test 提交 .*已过质量门/);
  assert.equal(
    (await logLines(state.env.FIXTURE_GATE_LOG)).length,
    testedCalls,
  );
  assert.notEqual(await remoteHead(state, 'gitlab', 'test'), firstArtifactHead);
  assert.equal(
    await remoteHead(state, 'origin', 'test'),
    await remoteHead(state, 'gitlab', 'test'),
  );
});

test('source staged by production prebuild passes a new gate before test pushes and cannot cache a failure', async (t) => {
  const state = await fixture(t);
  await instrumentTools(state);
  await fs.writeFile(
    path.join(state.tools, 'npm'),
    '#!/bin/sh\nprintf "build\\n" >> "$FIXTURE_BUILD_LOG"\nmkdir -p dist\nprintf "fixture artifact\\n" > dist/index.html\nprintf "baked fixture hash\\n" > src/constants/version.ts\nprintf "upgraded adapter source\\n" > adapter-upgrade.txt\ngit add adapter-upgrade.txt\n',
    { mode: 0o755 },
  );
  const before = await remoteHead(state, 'gitlab', 'test');
  await assert.rejects(
    deploy(state, state.root, {
      USE_WORKTREE: '1',
      FIXTURE_FAIL_GATE_WITH_FILE: 'adapter-upgrade.txt',
    }),
    (error) => {
      assert.match(error.stdout, /步骤 7.2：组合 test 源码不同/);
      return true;
    },
  );
  for (const remote of ['origin', 'gitlab'])
    assert.equal(await remoteHead(state, remote, 'test'), before);
  assert.equal((await logLines(state.env.FIXTURE_BUILD_LOG)).length, 1);
  await assert.rejects(
    deploy(state, state.root, {
      USE_WORKTREE: '1',
      FIXTURE_FAIL_GATE_WITH_FILE: 'adapter-upgrade.txt',
    }),
    (error) => {
      assert.match(error.stdout, /步骤 7.1：组合 test 源码不同/);
      return true;
    },
  );
  assert.equal((await logLines(state.env.FIXTURE_BUILD_LOG)).length, 1);
  await deploy(state, state.root, { USE_WORKTREE: '1' });
  assert.equal(
    await git(
      state.root,
      'show',
      `${await remoteHead(state, 'gitlab', 'test')}:adapter-upgrade.txt`,
    ),
    'upgraded adapter source',
  );
});

test('unexpected unstaged source generated by build is preserved without pushing test', async (t) => {
  const state = await fixture(t);
  await fs.writeFile(
    path.join(state.tools, 'npm'),
    '#!/bin/sh\nmkdir -p dist\nprintf "fixture artifact\\n" > dist/index.html\nprintf "baked fixture hash\\n" > src/constants/version.ts\nprintf "unexpected unstaged source\\n" > source.txt\n',
    { mode: 0o755 },
  );
  const before = await remoteHead(state, 'gitlab', 'test');
  await assert.rejects(
    deploy(state, state.root, { USE_WORKTREE: '1' }),
    (error) => {
      assert.match(error.stderr, /生产构建留下未提交源码\/子模块改动/);
      return true;
    },
  );
  for (const remote of ['origin', 'gitlab'])
    assert.equal(await remoteHead(state, remote, 'test'), before);
  assert.equal(
    await fs.readFile(path.join(state.deploy, 'source.txt'), 'utf8'),
    'unexpected unstaged source\n',
  );
});

test('immutable feature input survives parallel source commits after startup and fetch', async (t) => {
  const state = await fixture(t);
  await fs.writeFile(
    path.join(state.root, 'source.txt'),
    'authorized source\n',
  );
  await git(state.root, 'commit', '-am', 'authorized source');
  const inputHead = await git(state.root, 'rev-parse', 'HEAD');
  const realGit = (await run(state.root, 'which', ['git'])).stdout.trim();
  await fs.writeFile(
    path.join(state.tools, 'git'),
    '#!/bin/sh\n"$FIXTURE_REAL_GIT" "$@" || exit $?\nif [ "$1" = "fetch" ] && [ ! -f "$FIXTURE_ADVANCE_FLAG" ]; then\nprintf "parallel later source\\n" > "$FIXTURE_SOURCE_ROOT/parallel-later.txt"\n"$FIXTURE_REAL_GIT" -C "$FIXTURE_SOURCE_ROOT" add parallel-later.txt\n"$FIXTURE_REAL_GIT" -C "$FIXTURE_SOURCE_ROOT" commit -m "parallel later source" >/dev/null\nprintf "advanced\\n" > "$FIXTURE_ADVANCE_FLAG"\nfi\n',
    { mode: 0o755 },
  );
  await deploy(state, state.root, {
    USE_WORKTREE: '1',
    FIXTURE_REAL_GIT: realGit,
    FIXTURE_SOURCE_ROOT: state.root,
    FIXTURE_ADVANCE_FLAG: path.join(state.temporary, 'source-advanced'),
  });
  const laterSourceHead = await git(state.root, 'rev-parse', 'HEAD');
  assert.notEqual(laterSourceHead, inputHead);
  assert.equal(
    await fs.readFile(path.join(state.root, 'parallel-later.txt'), 'utf8'),
    'parallel later source\n',
  );
  const deployed = await remoteHead(state, 'gitlab', 'test');
  await git(state.root, 'merge-base', '--is-ancestor', inputHead, deployed);
  await assert.rejects(
    git(state.root, 'merge-base', '--is-ancestor', laterSourceHead, deployed),
  );
  await assert.rejects(
    git(state.root, 'show', `${deployed}:parallel-later.txt`),
  );
  assert.equal(await git(state.root, 'branch', '--show-current'), feature);
});
