import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import {
  getPinnedSource,
  readMicroAppRegistry,
  runCommand,
} from '../../scripts/sync-micro-apps.mjs';
import {
  parseUpgradeArguments,
  upgradeMicroApps as performUpgradeMicroApps,
} from '../../scripts/upgrade-micro-apps.mjs';

function runFixtureCommand(command, args, options = {}) {
  const env = { ...(options.env ?? process.env) };
  // cwd 不能隔离 GIT_DIR / GIT_INDEX_FILE 等重定向；测试也不读取用户 Git 配置。
  for (const key of Object.keys(env))
    if (key.startsWith('GIT_')) delete env[key];
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_TERMINAL_PROMPT: '0',
    LC_ALL: 'C',
  });
  return runCommand(command, args, { ...options, env });
}

const git = (cwd, args) =>
  runFixtureCommand('git', args, { cwd, capture: true });
const upgradeMicroApps = (options) =>
  performUpgradeMicroApps({
    execute: runFixtureCommand,
    log: () => {},
    ...options,
  });

async function initRepository(directory, branch = 'main') {
  await fs.mkdir(directory, { recursive: true });
  await git(directory, ['init', '-b', branch]);
  await git(directory, ['config', 'user.name', 'Upgrade Fixture']);
  await git(directory, ['config', 'user.email', 'upgrade@example.invalid']);
  await git(directory, ['config', 'commit.gpgsign', 'false']);
  await git(directory, ['config', 'core.hooksPath', '/dev/null']);
}

async function commit(directory, message) {
  await git(directory, ['add', '--all']);
  await git(directory, ['commit', '-m', message]);
  return git(directory, ['rev-parse', 'HEAD']);
}

async function branchAt(directory) {
  try {
    return await git(directory, ['symbolic-ref', '--quiet', '--short', 'HEAD']);
  } catch (error) {
    if (error.exitCode === 1) return null;
    throw error;
  }
}

async function fixture(t, { advance = true } = {}) {
  const temporary = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'micro-app-upgrade-')),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'host');
  await initRepository(root, 'host-main');
  await fs.writeFile(
    path.join(root, '.gitignore'),
    '.cache/\npublic/\ndist/\n',
  );
  await fs.writeFile(path.join(root, 'unrelated.txt'), 'committed work\n');
  await fs.writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({
      packageManager: 'pnpm@10.27.0',
      dependencies: { qiankun: '2.10.17-beta.0' },
      devDependencies: { '@tiny-codes/vite-plugin-qiankun': '2.4.0' },
    }),
  );
  const apps = {};
  for (const id of ['repo', 'message']) {
    const upstream = path.join(temporary, `${id}-origin`);
    await initRepository(upstream);
    const projectDir = id === 'message' ? 'nuwax-im-web' : '';
    const upstreamProject = path.join(upstream, projectDir);
    await fs.mkdir(upstreamProject, { recursive: true });
    await fs.writeFile(
      path.join(upstreamProject, 'source.txt'),
      'fixed main\n',
    );
    await fs.writeFile(
      path.join(upstreamProject, 'marker.txt'),
      `${id} upstream marker\n`,
    );
    await fs.writeFile(path.join(upstream, '.gitignore'), 'blocked.txt\n');
    const ancestor = await commit(upstream, 'fixture seed');
    await fs.writeFile(
      path.join(upstream, 'pinned.txt'),
      `${id} pinned main\n`,
    );
    const oldPin = await commit(upstream, 'fixture pinned main');
    await git(upstream, ['checkout', '-b', 'side']);
    await fs.writeFile(path.join(upstream, 'side.txt'), `${id} side branch\n`);
    const side = await commit(upstream, 'fixture side branch');
    await git(upstream, ['checkout', 'main']);
    const sourceDir = `submodules/${
      id === 'repo' ? 'nuwax-repo-web' : 'nuwax-im'
    }`;
    await git(root, [
      '-c',
      'protocol.file.allow=always',
      'submodule',
      'add',
      '-b',
      'main',
      upstream,
      sourceDir,
    ]);
    const source = path.join(root, sourceDir);
    const adapterRoot = path.join(root, `micro-frontends/${id}`);
    const adapterRelative = `micro-frontends/${id}/adapter.json`;
    await fs.mkdir(path.join(adapterRoot, 'overlay'), { recursive: true });
    const patchedPath = projectDir ? `${projectDir}/source.txt` : 'source.txt';
    await fs.writeFile(
      path.join(adapterRoot, 'adapter.patch'),
      `diff --git a/${patchedPath} b/${patchedPath}\n--- a/${patchedPath}\n+++ b/${patchedPath}\n@@ -1 +1 @@\n-fixed main\n+adapted fixed main\n`,
    );
    await fs.writeFile(
      path.join(adapterRoot, 'overlay/marker.txt'),
      `${id} adapter marker\n`,
    );
    const adapter = {
      name: id === 'repo' ? 'nuwax-repo-web' : 'nuwax-im-web',
      appName: id === 'repo' ? 'nuwax-repo-web' : 'nuwax-im-web',
      sourceDir,
      ...(projectDir ? { projectDir } : {}),
      branch: 'main',
      pin: oldPin,
      patch: 'adapter.patch',
      overlay: 'overlay',
      entry: `/micro-apps/${id}/index.html`,
      assetBase: `/micro-apps/${id}/`,
      businessBase: id === 'repo' ? '/repo' : '/instant-message',
      ...(id === 'message'
        ? { buildEnvironment: { VITE_IM_AUTH_MODE: 'platform' } }
        : {}),
    };
    // 回滚须保留原字节，不能重新序列化成某一种统一缩进。
    await fs.writeFile(
      path.join(root, adapterRelative),
      `${JSON.stringify(adapter, null, id === 'repo' ? 2 : 4)}\n`,
    );
    apps[id] = {
      id,
      upstream,
      upstreamProject,
      source,
      sourceDir,
      projectDir,
      adapterRoot,
      adapterRelative,
      oldPin,
      ancestor,
      side,
    };
  }
  await fs.writeFile(
    path.join(root, 'micro-frontends/apps.json'),
    `${JSON.stringify(
      Object.values(apps).map((app) => ({
        id: app.id,
        adapter: app.adapterRelative,
      })),
      null,
      2,
    )}\n`,
  );
  await commit(root, 'fixture host and adapters');
  for (const directory of ['public/micro-apps', 'dist/micro-apps']) {
    await fs.mkdir(path.join(root, directory), { recursive: true });
    await fs.writeFile(
      path.join(root, directory, 'keep.txt'),
      'existing static artifact\n',
    );
  }
  if (advance) {
    for (const app of Object.values(apps)) {
      await fs.writeFile(
        path.join(app.upstream, 'feature.txt'),
        `${app.id} new main feature\n`,
      );
      app.newPin = await commit(app.upstream, 'fixture next main');
    }
  } else {
    for (const app of Object.values(apps)) app.newPin = app.oldPin;
  }
  return { temporary, root, apps };
}

async function snapshot(f) {
  const applications = {};
  for (const app of Object.values(f.apps)) {
    applications[app.id] = {
      head: await git(app.source, ['rev-parse', 'HEAD']),
      branch: await branchAt(app.source),
      status: await git(app.source, [
        'status',
        '--porcelain',
        '--untracked-files=all',
      ]),
      source: await fs.readFile(
        path.join(app.source, app.projectDir, 'source.txt'),
      ),
      adapter: await fs.readFile(path.join(f.root, app.adapterRelative)),
      patch: await fs.readFile(path.join(app.adapterRoot, 'adapter.patch')),
      overlay: await fs.readFile(
        path.join(app.adapterRoot, 'overlay/marker.txt'),
      ),
    };
  }
  return {
    head: await git(f.root, ['rev-parse', 'HEAD']),
    index: await git(f.root, ['ls-files', '--stage', '-z']),
    cached: await git(f.root, [
      'diff',
      '--cached',
      '--binary',
      '--full-index',
      '--no-ext-diff',
    ]),
    unrelated: await fs.readFile(path.join(f.root, 'unrelated.txt')),
    public: await fs.readFile(path.join(f.root, 'public/micro-apps/keep.txt')),
    dist: await fs.readFile(path.join(f.root, 'dist/micro-apps/keep.txt')),
    applications,
  };
}

function observeExecution(f, events, intercept) {
  return async (command, args, options) => {
    assert.ok(
      !['corepack', 'pnpm', 'npm', 'yarn'].includes(command),
      '升级不得安装或构建',
    );
    assert.ok(
      command !== 'git' || !['commit', 'push'].includes(args[0]),
      '升级不得 commit 或 push',
    );
    assert.ok(
      options.cwd === f.temporary ||
        options.cwd.startsWith(`${f.temporary}${path.sep}`),
      '只能操作临时 fixture',
    );
    events.push({ command, args: [...args], cwd: options.cwd });
    if (intercept) {
      const intercepted = await intercept(command, args, options);
      if (intercepted !== undefined) return intercepted;
    }
    return runFixtureCommand(command, args, options);
  };
}

async function assertPinned(f, id, expected) {
  const app = f.apps[id];
  const adapter = JSON.parse(
    await fs.readFile(path.join(f.root, app.adapterRelative), 'utf8'),
  );
  assert.equal(adapter.pin, expected);
  assert.equal(await git(app.source, ['rev-parse', 'HEAD']), expected);
  const staged = await git(f.root, [
    'ls-files',
    '--stage',
    '--',
    app.sourceDir,
  ]);
  assert.equal(staged, `160000 ${expected} 0\t${app.sourceDir}`);
  const registered = (await readMicroAppRegistry(f.root)).find(
    (item) => item.id === id,
  );
  assert.equal(
    (await getPinnedSource(f.root, registered, runFixtureCommand)).commit,
    expected,
  );
  assert.equal(
    await fs.readFile(
      path.join(app.source, app.projectDir, 'source.txt'),
      'utf8',
    ),
    'fixed main\n',
    '适配 patch 不得应用到共享子仓',
  );
}

test('CLI 解析显式目标、dry-run、commitish、人工审核 overlay 与帮助', () => {
  assert.equal(parseUpgradeArguments(['repo']).target, 'repo');
  assert.equal(parseUpgradeArguments(['repo']).dryRun, false);
  const options = parseUpgradeArguments([
    'message',
    '--dry-run',
    '--ref',
    'origin/main~1',
    '--allow-overlay-changes',
  ]);
  assert.equal(options.target, 'message');
  assert.equal(options.dryRun, true);
  assert.equal(options.ref, 'origin/main~1');
  assert.equal(options.allowOverlayChanges, true);
  assert.equal(parseUpgradeArguments(['--help']).help, true);
});

test('CLI 拒绝缺少目标、未知参数、重复目标及 all+ref', () => {
  for (const args of [
    [],
    ['repo', 'message'],
    ['repo', '--unknown'],
    ['repo', '--ref'],
    ['all', '--ref', 'main'],
  ]) {
    assert.throws(() => parseUpgradeArguments(args));
  }
});

test('未知应用在读取 registry 后拒绝，不能 fetch 或修改本地输入', async (t) => {
  const f = await fixture(t);
  const before = await snapshot(f);
  const events = [];
  await assert.rejects(
    upgradeMicroApps({
      root: f.root,
      target: 'unknown',
      execute: observeExecution(f, events),
    }),
    /未知应用/,
  );
  assert.deepEqual(await snapshot(f), before);
  assert.ok(
    !events.some((event) =>
      ['fetch', 'checkout', 'add'].includes(event.args[0]),
    ),
  );
});

test('单个升级只暂存所选应用，允许其它应用与主仓无关 WIP', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    path.join(f.apps.message.source, f.apps.message.projectDir, 'source.txt'),
    'unrelated child WIP\n',
  );
  await fs.writeFile(
    path.join(f.apps.message.adapterRoot, 'overlay/marker.txt'),
    'unrelated adapter WIP\n',
  );
  await fs.writeFile(path.join(f.root, 'unrelated.txt'), 'staged work\n');
  await git(f.root, ['add', '--', 'unrelated.txt']);
  await fs.writeFile(
    path.join(f.root, 'unrelated.txt'),
    'dirty work after staging\n',
  );
  const before = await snapshot(f);
  const events = [];
  const result = await upgradeMicroApps({
    root: f.root,
    target: 'repo',
    execute: observeExecution(f, events),
    log: () => {},
  });
  assert.equal(result.status, 'upgraded');
  assert.deepEqual(
    result.apps.map((app) => app.id),
    ['repo'],
  );
  assert.equal(result.apps[0].oldPin, f.apps.repo.oldPin);
  assert.equal(result.apps[0].newPin, f.apps.repo.newPin);
  assert.equal(result.apps[0].changed, true);
  await assertPinned(f, 'repo', f.apps.repo.newPin);
  const after = await snapshot(f);
  assert.deepEqual(after.applications.message, before.applications.message);
  assert.deepEqual(after.unrelated, before.unrelated);
  assert.equal(await git(f.root, ['show', ':unrelated.txt']), 'staged work');
  assert.equal(after.head, before.head, '不自动提交');
  assert.deepEqual(after.public, before.public);
  assert.deepEqual(after.dist, before.dist);
  assert.ok(
    !events.some(
      (event) =>
        event.args.includes('fetch') && event.cwd === f.apps.message.source,
    ),
  );
  assert.deepEqual(
    (await git(f.root, ['diff', '--cached', '--name-only'])).split('\n').sort(),
    [
      f.apps.repo.adapterRelative,
      f.apps.repo.sourceDir,
      'unrelated.txt',
    ].sort(),
  );
  assert.equal(
    events.filter((event) => event.cwd === f.root && event.args[0] === 'add')
      .length,
    1,
    '成功只批量暂存一次所选路径',
  );
  const receipt = JSON.parse(await fs.readFile(result.receipt, 'utf8'));
  assert.equal(receipt.status, 'upgraded');
  assert.deepEqual(
    receipt.apps.map((app) => app.id),
    ['repo'],
  );
  assert.deepEqual(
    await fs.readFile(
      path.join(path.dirname(result.receipt), receipt.apps[0].backup),
    ),
    before.applications.repo.adapter,
  );
});

test('all 完成两项升级，gitlink 与 adapter pin 可作为后续构建输入', async (t) => {
  const f = await fixture(t);
  const before = await snapshot(f);
  const result = await upgradeMicroApps({ root: f.root, target: 'all' });
  assert.equal(result.status, 'upgraded');
  assert.deepEqual(result.apps.map((app) => app.id).sort(), [
    'message',
    'repo',
  ]);
  for (const app of Object.values(f.apps)) {
    await assertPinned(f, app.id, app.newPin);
    assert.equal(await branchAt(app.source), null, '成功后固定 detached SHA');
  }
  const after = await snapshot(f);
  assert.equal(after.head, before.head);
  assert.deepEqual(after.public, before.public);
  assert.deepEqual(after.dist, before.dist);
  assert.deepEqual(
    (await git(f.root, ['diff', '--cached', '--name-only'])).split('\n').sort(),
    Object.values(f.apps)
      .flatMap((app) => [app.sourceDir, app.adapterRelative])
      .sort(),
  );
});

test('已暂存的配对升级允许重复检查和继续升级到新的 main', async (t) => {
  const f = await fixture(t);
  await upgradeMicroApps({ root: f.root, target: 'all' });
  const before = await snapshot(f);
  const events = [];
  const repeated = await upgradeMicroApps({
    root: f.root,
    target: 'all',
    execute: observeExecution(f, events),
  });
  assert.equal(repeated.status, 'unchanged');
  assert.deepEqual(await snapshot(f), before);
  assert.equal(events.filter((event) => event.args[0] === 'fetch').length, 2);
  assert.ok(
    !events.some((event) => ['checkout', 'add'].includes(event.args[0])),
  );
  const firstPins = {};
  for (const app of Object.values(f.apps)) {
    firstPins[app.id] = app.newPin;
    await fs.writeFile(
      path.join(app.upstream, 'second-feature.txt'),
      'second main\n',
    );
    app.newPin = await commit(app.upstream, 'fixture second main');
  }
  const continued = await upgradeMicroApps({ root: f.root, target: 'all' });
  assert.equal(continued.status, 'upgraded');
  for (const app of Object.values(f.apps)) {
    await assertPinned(f, app.id, app.newPin);
    assert.equal(
      continued.apps.find((item) => item.id === app.id).oldPin,
      firstPins[app.id],
    );
  }
  assert.equal(await git(f.root, ['rev-parse', 'HEAD']), before.head);
});

test('已暂存的单个手工升级可进入默认 all 升级，另一个应用正常更新', async (t) => {
  const f = await fixture(t);
  await upgradeMicroApps({ root: f.root, target: 'repo' });
  const repoBefore = (await snapshot(f)).applications.repo;
  const events = [];
  const result = await upgradeMicroApps({
    root: f.root,
    target: 'all',
    execute: observeExecution(f, events),
  });
  assert.equal(result.status, 'upgraded');
  assert.equal(result.apps.find((app) => app.id === 'repo').changed, false);
  assert.equal(result.apps.find((app) => app.id === 'message').changed, true);
  assert.deepEqual((await snapshot(f)).applications.repo, repoBefore);
  for (const app of Object.values(f.apps))
    await assertPinned(f, app.id, app.newPin);
  assert.ok(
    !events.some(
      (event) =>
        event.cwd === f.apps.repo.source && event.args[0] === 'checkout',
    ),
  );
});

test('已暂存的第一轮升级在第二轮部分暂存失败后完整保留', async (t) => {
  const f = await fixture(t);
  await upgradeMicroApps({ root: f.root, target: 'all' });
  await fs.writeFile(path.join(f.root, 'unrelated.txt'), 'staged work\n');
  await git(f.root, ['add', '--', 'unrelated.txt']);
  await fs.writeFile(
    path.join(f.root, 'unrelated.txt'),
    'dirty work after staging\n',
  );
  for (const app of Object.values(f.apps)) {
    await fs.writeFile(
      path.join(app.upstream, 'second-feature.txt'),
      'second main\n',
    );
    await commit(app.upstream, 'fixture second main');
  }
  const before = await snapshot(f);
  const events = [];
  let injected = false;
  const execute = observeExecution(
    f,
    events,
    async (command, args, options) => {
      if (command === 'git' && options.cwd === f.root && args[0] === 'add') {
        injected = true;
        await runFixtureCommand(
          'git',
          ['add', '--', f.apps.repo.sourceDir, f.apps.repo.adapterRelative],
          options,
        );
        throw new Error('injected second upgrade staging failure');
      }
    },
  );
  await assert.rejects(
    upgradeMicroApps({ root: f.root, target: 'all', execute }),
    /injected second upgrade/,
  );
  assert.equal(injected, true);
  assert.deepEqual(await snapshot(f), before);
  for (const app of Object.values(f.apps))
    await assertPinned(f, app.id, app.newPin);
  assert.equal(await git(f.root, ['show', ':unrelated.txt']), 'staged work');
});

test('已配对的暂存 pin 不能放行其它适配改动或不完整版本指针', async (t) => {
  const cases = {
    'staged adapter field': async (f, app) => {
      const file = path.join(f.root, app.adapterRelative);
      const adapter = JSON.parse(await fs.readFile(file, 'utf8'));
      await fs.writeFile(
        file,
        JSON.stringify({ ...adapter, devPort: 9999 }, null, 2) + '\n',
      );
      await git(f.root, ['add', '--', app.adapterRelative]);
    },
    'staged adapter formatting': async (f, app) => {
      await fs.appendFile(path.join(f.root, app.adapterRelative), '\n');
      await git(f.root, ['add', '--', app.adapterRelative]);
    },
    'staged adapter mode': async (f, app) => {
      await fs.chmod(path.join(f.root, app.adapterRelative), 0o755);
      await git(f.root, ['add', '--', app.adapterRelative]);
    },
    'staged patch': async (f, app) => {
      await fs.appendFile(path.join(app.adapterRoot, 'adapter.patch'), '\n');
      await git(f.root, [
        'add',
        '--',
        path.posix.join(
          path.posix.dirname(app.adapterRelative),
          'adapter.patch',
        ),
      ]);
    },
    'staged overlay': async (f, app) => {
      await fs.appendFile(
        path.join(app.adapterRoot, 'overlay/marker.txt'),
        'staged overlay work\n',
      );
      await git(f.root, [
        'add',
        '--',
        path.posix.join(
          path.posix.dirname(app.adapterRelative),
          'overlay/marker.txt',
        ),
      ]);
    },
    'unstaged adapter': (f, app) =>
      fs.appendFile(path.join(f.root, app.adapterRelative), '\n'),
    'untracked adapter': (f, app) =>
      fs.writeFile(
        path.join(app.adapterRoot, 'local-note.txt'),
        'untracked work\n',
      ),
    'gitlink only': (f, app) =>
      git(f.root, [
        'restore',
        '--source=HEAD',
        '--staged',
        '--worktree',
        '--',
        app.adapterRelative,
      ]),
    'adapter only': async (f, app) => {
      await git(app.source, ['checkout', '--detach', app.oldPin]);
      await git(f.root, ['add', '--', app.sourceDir]);
    },
    'inconsistent pin': async (f, app) => {
      const file = path.join(f.root, app.adapterRelative);
      await fs.writeFile(
        file,
        (await fs.readFile(file, 'utf8')).replace(app.newPin, app.side),
      );
      await git(f.root, ['add', '--', app.adapterRelative]);
    },
  };
  for (const [name, dirty] of Object.entries(cases))
    await t.test(name, async (t) => {
      const f = await fixture(t);
      const app = f.apps.repo;
      await upgradeMicroApps({ root: f.root, target: 'repo' });
      await dirty(f, app);
      const before = await snapshot(f);
      const events = [];
      await assert.rejects(
        upgradeMicroApps({
          root: f.root,
          target: 'all',
          execute: observeExecution(f, events),
        }),
        /未提交|暂存|未跟踪/,
      );
      assert.deepEqual(await snapshot(f), before);
      assert.ok(
        !events.some((event) =>
          ['fetch', 'checkout', 'add'].includes(event.args[0]),
        ),
      );
      if (name === 'untracked adapter')
        assert.equal(
          await fs.readFile(
            path.join(app.adapterRoot, 'local-note.txt'),
            'utf8',
          ),
          'untracked work\n',
        );
      if (name === 'staged adapter mode')
        assert.equal(
          (await fs.stat(path.join(f.root, app.adapterRelative))).mode & 0o777,
          0o755,
        );
    });
});

test('缺少本地 origin/main 引用时先 fetch 补齐，再校验历史并升级', async (t) => {
  const f = await fixture(t);
  const app = f.apps.repo;
  await git(app.source, ['update-ref', '-d', 'refs/remotes/origin/main']);
  await assert.rejects(
    git(app.source, ['rev-parse', '--verify', 'refs/remotes/origin/main']),
    { exitCode: 128 },
  );
  const events = [];
  const result = await upgradeMicroApps({
    root: f.root,
    target: 'repo',
    execute: observeExecution(f, events),
  });
  assert.equal(result.status, 'upgraded');
  assert.equal(result.apps[0].newPin, app.newPin);
  assert.equal(
    await git(app.source, ['rev-parse', 'refs/remotes/origin/main']),
    app.newPin,
  );
  await assertPinned(f, 'repo', app.newPin);
  const fetch = events.findIndex(
    (event) => event.cwd === app.source && event.args[0] === 'fetch',
  );
  const historyCheck = events.findIndex(
    (event) =>
      event.cwd === app.source &&
      event.args[0] === 'merge-base' &&
      event.args.includes('--is-ancestor'),
  );
  assert.ok(
    fetch >= 0 && historyCheck > fetch,
    '历史校验须在 fetch 补齐 main 后',
  );
});

test('main 没有前进时 unchanged 保留 HEAD、分支、adapter 原字节与 index', async (t) => {
  const f = await fixture(t, { advance: false });
  const before = await snapshot(f);
  const result = await upgradeMicroApps({ root: f.root, target: 'all' });
  assert.equal(result.status, 'unchanged');
  assert.ok(
    result.apps.every((app) => !app.changed && app.oldPin === app.newPin),
  );
  assert.deepEqual(await snapshot(f), before);
});

test('dry-run 更新所选远端引用并检查 patch，保留全部本地输入和产物', async (t) => {
  const f = await fixture(t);
  const before = await snapshot(f);
  const events = [];
  const result = await upgradeMicroApps({
    root: f.root,
    target: 'all',
    dryRun: true,
    execute: observeExecution(f, events),
  });
  assert.equal(result.status, 'dry-run');
  assert.ok(result.apps.every((app) => app.changed));
  assert.deepEqual(await snapshot(f), before);
  for (const app of Object.values(f.apps))
    assert.equal(
      await git(app.source, ['rev-parse', 'origin/main']),
      app.newPin,
    );
  assert.ok(events.some((event) => event.args.includes('archive')));
  assert.ok(
    events.some(
      (event) => event.args.includes('apply') && event.args.includes('--check'),
    ),
  );
  assert.equal(
    events.filter(
      (event) => event.args[0] === 'apply' && event.args.includes('--check'),
    ).length,
    2,
    'dry-run 检查每一个候选应用的 patch',
  );
  assert.ok(
    !events.some(
      (event) => event.args.includes('checkout') || event.args[0] === 'add',
    ),
  );
});

test('第二项 patch 冲突时 all 整体不修改 HEAD、adapter 或 index', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    path.join(f.apps.message.upstreamProject, 'source.txt'),
    'upstream incompatible main\n',
  );
  await commit(f.apps.message.upstream, 'fixture incompatible source');
  const before = await snapshot(f);
  const events = [];
  await assert.rejects(
    upgradeMicroApps({
      root: f.root,
      target: 'all',
      log: () => {},
      execute: observeExecution(f, events),
    }),
    /message.*patch.*冲突/,
  );
  assert.deepEqual(await snapshot(f), before);
  assert.ok(
    !events.some(
      (event) => event.args[0] === 'checkout' || event.args[0] === 'add',
    ),
    '所有 patch 预检须先于任何共享 HEAD 或 index 改动',
  );
});

test('所选子仓或 adapter 的 tracked/untracked/staged 改动均拒绝且不丢数据', async (t) => {
  const cases = {
    'child tracked': (f) =>
      fs.writeFile(
        path.join(f.apps.repo.source, 'source.txt'),
        'child dirty\n',
      ),
    'child untracked': (f) =>
      fs.writeFile(
        path.join(f.apps.repo.source, 'local-note.txt'),
        'local work\n',
      ),
    'adapter overlay': (f) =>
      fs.writeFile(
        path.join(f.apps.repo.adapterRoot, 'overlay/marker.txt'),
        'overlay dirty\n',
      ),
    'adapter patch': (f) =>
      fs.appendFile(path.join(f.apps.repo.adapterRoot, 'adapter.patch'), '\n'),
    'adapter staged': async (f) => {
      const filename = path.join(f.root, f.apps.repo.adapterRelative);
      const adapter = JSON.parse(await fs.readFile(filename, 'utf8'));
      await fs.writeFile(
        filename,
        JSON.stringify({ ...adapter, devPort: 9999 }),
      );
      await git(f.root, ['add', '--', f.apps.repo.adapterRelative]);
    },
  };
  for (const [name, dirty] of Object.entries(cases))
    await t.test(name, async (t) => {
      const f = await fixture(t);
      await dirty(f);
      const before = await snapshot(f);
      const events = [];
      await assert.rejects(
        upgradeMicroApps({
          root: f.root,
          target: 'repo',
          execute: observeExecution(f, events),
        }),
        /未提交|暂存|未跟踪/,
      );
      assert.deepEqual(await snapshot(f), before);
      assert.ok(
        !events.some(
          (event) => event.args.includes('checkout') || event.args[0] === 'add',
        ),
      );
    });
});

test('apps.json 和 .gitmodules 未提交改动拒绝进入事务', async (t) => {
  for (const filename of ['micro-frontends/apps.json', '.gitmodules'])
    await t.test(filename, async (t) => {
      const f = await fixture(t);
      await fs.appendFile(path.join(f.root, filename), '\n');
      const original = await fs.readFile(path.join(f.root, filename));
      const before = await snapshot(f);
      await assert.rejects(
        upgradeMicroApps({ root: f.root, target: 'repo' }),
        /来源登记.*未提交/,
      );
      assert.deepEqual(await snapshot(f), before);
      assert.deepEqual(
        await fs.readFile(path.join(f.root, filename)),
        original,
      );
    });
});

test('批量 git add 已部分暂存后失败，完整恢复 index、分支及无关双层 WIP', async (t) => {
  const f = await fixture(t);
  await git(f.apps.message.source, [
    'checkout',
    '--detach',
    f.apps.message.oldPin,
  ]);
  await fs.writeFile(path.join(f.root, 'unrelated.txt'), 'staged work\n');
  await git(f.root, ['add', '--', 'unrelated.txt']);
  await fs.writeFile(
    path.join(f.root, 'unrelated.txt'),
    'dirty work after staging\n',
  );
  const before = await snapshot(f);
  const events = [];
  let injected = false;
  const execute = observeExecution(
    f,
    events,
    async (command, args, options) => {
      if (command === 'git' && options.cwd === f.root && args[0] === 'add') {
        injected = true;
        await runFixtureCommand(
          'git',
          ['add', '--', f.apps.repo.sourceDir, f.apps.repo.adapterRelative],
          options,
        );
        throw new Error('injected failure after partial git add');
      }
    },
  );
  await assert.rejects(
    upgradeMicroApps({ root: f.root, target: 'all', execute }),
    /injected failure/,
  );
  assert.equal(injected, true);
  assert.deepEqual(await snapshot(f), before);
  assert.equal(await git(f.root, ['show', ':unrelated.txt']), 'staged work');
});

test('第二项 checkout 的 ignored 文件冲突回滚第一项，保留 ignored 文件', async (t) => {
  const f = await fixture(t);
  const app = f.apps.message;
  const ignored = path.join(app.source, app.projectDir, 'blocked.txt');
  await fs.writeFile(ignored, 'private ignored work\n');
  await fs.writeFile(
    path.join(app.upstreamProject, 'blocked.txt'),
    'upstream tracked file\n',
  );
  await git(app.upstream, [
    'add',
    '--force',
    '--',
    path.posix.join(app.projectDir, 'blocked.txt'),
  ]);
  await git(app.upstream, [
    'commit',
    '-m',
    'fixture tracks previously ignored path',
  ]);
  const before = await snapshot(f);
  const events = [];
  await assert.rejects(
    upgradeMicroApps({
      root: f.root,
      target: 'all',
      execute: observeExecution(f, events),
    }),
    /overwritten|覆盖/,
  );
  assert.ok(
    events.some(
      (event) =>
        event.cwd === app.source &&
        event.args.includes('checkout') &&
        event.args.includes('--no-overwrite-ignore'),
    ),
  );
  assert.deepEqual(await snapshot(f), before);
  assert.equal(await fs.readFile(ignored, 'utf8'), 'private ignored work\n');
});

test('单个 ref 接收 commitish，可选择 main 上经过旧 pin 的较早提交', async (t) => {
  const f = await fixture(t);
  const selected = f.apps.repo.newPin;
  await fs.writeFile(
    path.join(f.apps.repo.upstream, 'later.txt'),
    'later main work\n',
  );
  await commit(f.apps.repo.upstream, 'fixture later main');
  const result = await upgradeMicroApps({
    root: f.root,
    target: 'repo',
    ref: 'origin/main~1',
  });
  assert.equal(result.status, 'upgraded');
  assert.equal(result.apps[0].newPin, selected);
  await assertPinned(f, 'repo', selected);
});

test('ref 拒绝旧 pin 之前的提交、非 main 旁支和 all，dry-run 同样守边界', async (t) => {
  for (const [name, options] of [
    ['ancestor', (f) => ({ target: 'repo', ref: f.apps.repo.ancestor })],
    ['side', (f) => ({ target: 'repo', ref: f.apps.repo.side })],
    [
      'side dry-run',
      (f) => ({ target: 'repo', ref: f.apps.repo.side, dryRun: true }),
    ],
  ])
    await t.test(name, async (t) => {
      const f = await fixture(t);
      const before = await snapshot(f);
      await assert.rejects(
        upgradeMicroApps({ root: f.root, ...options(f) }),
        /main.*快进/,
      );
      assert.deepEqual(await snapshot(f), before);
    });
  const f = await fixture(t);
  let called = false;
  await assert.rejects(
    upgradeMicroApps({
      root: f.root,
      target: 'all',
      ref: f.apps.repo.newPin,
      execute: async () => {
        called = true;
        throw new Error('executor should not run');
      },
    }),
    /单个应用/,
  );
  assert.equal(called, false);
});

test('上游修改 overlay 覆盖路径默认拒绝，人工审核允许后才更新，包括 monorepo 前缀', async (t) => {
  for (const id of ['repo', 'message'])
    await t.test(id, async (t) => {
      const f = await fixture(t);
      const app = f.apps[id];
      await fs.writeFile(
        path.join(app.upstreamProject, 'marker.txt'),
        'upstream changed covered file\n',
      );
      const newPin = await commit(
        app.upstream,
        'fixture covered source change',
      );
      const before = await snapshot(f);
      await assert.rejects(
        upgradeMicroApps({ root: f.root, target: id }),
        /overlay 覆盖文件/,
      );
      assert.deepEqual(await snapshot(f), before);
      const result = await upgradeMicroApps({
        root: f.root,
        target: id,
        allowOverlayChanges: true,
      });
      assert.equal(result.apps[0].newPin, newPin);
      await assertPinned(f, id, newPin);
      assert.equal(
        await fs.readFile(
          path.join(app.source, app.projectDir, 'marker.txt'),
          'utf8',
        ),
        'upstream changed covered file\n',
      );
    });
});

test('已有同步锁拒绝升级，不能释放其它活进程的锁或修改输入', async (t) => {
  const f = await fixture(t);
  const lock = path.join(f.root, '.cache/micro-apps/.sync.lock');
  await fs.mkdir(lock, { recursive: true });
  await fs.writeFile(path.join(lock, 'pid'), String(process.pid));
  const before = await snapshot(f);
  const events = [];
  await assert.rejects(
    upgradeMicroApps({
      root: f.root,
      target: 'all',
      execute: observeExecution(f, events),
    }),
    /正在运行|等待/,
  );
  assert.deepEqual(await snapshot(f), before);
  assert.equal(
    await fs.readFile(path.join(lock, 'pid'), 'utf8'),
    String(process.pid),
  );
  assert.ok(
    !events.some(
      (event) =>
        event.args.includes('fetch') ||
        event.args.includes('checkout') ||
        event.args[0] === 'add',
    ),
  );
});

test('sourceDir 必须是真实子仓顶层，不能落回宿主 Git 仓库', async (t) => {
  const f = await fixture(t);
  await fs.rm(path.join(f.apps.repo.source, '.git'));
  const index = await git(f.root, ['ls-files', '--stage', '-z']);
  const adapter = await fs.readFile(
    path.join(f.root, f.apps.repo.adapterRelative),
  );
  const events = [];
  await assert.rejects(
    upgradeMicroApps({
      root: f.root,
      target: 'repo',
      execute: observeExecution(f, events),
    }),
    /子模块未初始化/,
  );
  assert.equal(await git(f.root, ['ls-files', '--stage', '-z']), index);
  assert.deepEqual(
    await fs.readFile(path.join(f.root, f.apps.repo.adapterRelative)),
    adapter,
  );
  assert.ok(
    !events.some(
      (event) =>
        event.args.includes('fetch') ||
        event.args.includes('checkout') ||
        event.args[0] === 'add',
    ),
  );
});

test('submodule.ignore=all 不能隐藏所选 gitlink HEAD 偏离 pin 的改动', async (t) => {
  const f = await fixture(t);
  await git(f.root, [
    'config',
    `submodule.${f.apps.repo.sourceDir}.ignore`,
    'all',
  ]);
  await git(f.apps.repo.source, ['checkout', '--detach', f.apps.repo.ancestor]);
  assert.equal(
    await git(f.root, ['status', '--porcelain', '--', f.apps.repo.sourceDir]),
    '',
  );
  const before = await snapshot(f);
  const events = [];
  await assert.rejects(
    upgradeMicroApps({
      root: f.root,
      target: 'repo',
      execute: observeExecution(f, events),
    }),
    /未提交|HEAD.*偏离/,
  );
  assert.deepEqual(await snapshot(f), before);
  assert.ok(
    !events.some((event) =>
      ['fetch', 'checkout', 'add'].includes(event.args[0]),
    ),
  );
});

test('第二项 adapter 的部分写入或 rename 失败整体回滚，原文件字节和 index 完整', async (t) => {
  for (const method of ['writeFile', 'rename'])
    await t.test(method, async (t) => {
      const f = await fixture(t);
      const target = path.join(f.root, f.apps.message.adapterRelative);
      const before = await snapshot(f);
      const original = fs[method];
      let injected = false;
      t.mock.method(fs, method, async (...args) => {
        const destination = method === 'writeFile' ? args[0] : args[1];
        const matches =
          method === 'writeFile'
            ? typeof destination === 'string' &&
              path.dirname(destination) === path.dirname(target) &&
              path.basename(destination).startsWith('.adapter.json.upgrade-')
            : destination === target;
        if (!injected && matches) {
          injected = true;
          if (method === 'writeFile')
            await original(args[0], 'partial bytes', args[2]);
          throw new Error(`injected adapter ${method} failure`);
        }
        return original(...args);
      });
      await assert.rejects(
        upgradeMicroApps({ root: f.root, target: 'all', log: () => {} }),
        /injected adapter/,
      );
      assert.equal(injected, true);
      assert.deepEqual(await snapshot(f), before);
      for (const app of Object.values(f.apps))
        assert.ok(
          !(await fs.readdir(app.adapterRoot)).some((file) =>
            file.startsWith('.adapter.json.upgrade-'),
          ),
        );
    });
});

test('第二项 checkout 前中止仍回滚第一项且释放同步锁', async (t) => {
  const f = await fixture(t);
  const before = await snapshot(f);
  const controller = new AbortController();
  const events = [];
  let interrupted = false;
  const execute = observeExecution(
    f,
    events,
    async (command, args, options) => {
      if (
        !interrupted &&
        command === 'git' &&
        options.cwd === f.apps.message.source &&
        args[0] === 'checkout'
      ) {
        interrupted = true;
        controller.abort(new Error('injected upgrade interrupt'));
      }
    },
  );
  await assert.rejects(
    upgradeMicroApps({
      root: f.root,
      target: 'all',
      signal: controller.signal,
      execute,
      log: () => {},
    }),
    /aborted|injected upgrade interrupt/i,
  );
  assert.equal(interrupted, true);
  assert.deepEqual(await snapshot(f), before);
  await assert.rejects(
    fs.access(path.join(f.root, '.cache/micro-apps/.sync.lock')),
    { code: 'ENOENT' },
  );
});

test('runCommand 中止后等待真实 child close，不能提前启动 Git 回滚', async (t) => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), 'micro-app-abort-'),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const ready = path.join(temporary, 'ready');
  const closed = path.join(temporary, 'closed');
  const controller = new AbortController();
  const source = `
    const fs = require('node:fs');
    const [ready, closed] = process.argv.slice(1);
    process.on('SIGTERM', () => setTimeout(() => {
      fs.writeFileSync(closed, 'child completed termination');
      process.exit(0);
    }, 180));
    fs.writeFileSync(ready, 'ready');
    setInterval(() => {}, 1000);
  `;
  const running = runCommand(process.execPath, ['-e', source, ready, closed], {
    cwd: temporary,
    capture: true,
    signal: controller.signal,
  });
  const rejected = assert.rejects(running, { name: 'AbortError' });
  t.after(async () => {
    controller.abort();
    await running.catch(() => {});
  });
  const deadline = Date.now() + 5000;
  while (
    !(await fs.access(ready).then(
      () => true,
      () => false,
    ))
  ) {
    if (Date.now() > deadline) throw new Error('child did not signal ready');
    await delay(10);
  }
  controller.abort();
  await rejected;
  assert.equal(
    await fs.readFile(closed, 'utf8'),
    'child completed termination',
  );
});
