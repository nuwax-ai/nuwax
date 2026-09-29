import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  newTypeDiagnostics,
  normalizeTypeDiagnostics,
  readMicroAppRegistry,
  runCommand,
  syncMicroApps,
} from '../../scripts/sync-micro-apps.mjs';

async function fixture(t, { projectDir = '', ownWorkspace = false } = {}) {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), 'micro-app-build-'),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const upstream = path.join(temporary, 'upstream');
  const root = path.join(temporary, 'host');
  const git = (cwd, args) => runCommand('git', args, { cwd, capture: true });
  await fs.mkdir(upstream);
  await fs.mkdir(root);
  await git(upstream, ['init', '-b', 'main']);
  await git(upstream, ['config', 'user.name', 'Build Fixture']);
  await git(upstream, [
    'config',
    'user.email',
    'build-fixture@example.invalid',
  ]);
  const project = path.join(upstream, projectDir);
  await fs.mkdir(project, { recursive: true });
  await fs.writeFile(path.join(project, 'source.txt'), 'fixed main\n');
  await fs.writeFile(
    path.join(project, 'pnpm-lock.yaml'),
    "lockfileVersion: '9.0'\n",
  );
  await fs.writeFile(
    path.join(project, 'package.json'),
    '{"scripts":{"build":"fixture"}}\n',
  );
  if (ownWorkspace)
    await fs.writeFile(
      path.join(project, 'pnpm-workspace.yaml'),
      "packages:\n  - '.'\n",
    );
  await git(upstream, ['add', '.']);
  await git(upstream, ['commit', '-m', 'fixture']);
  const pin = await git(upstream, ['rev-parse', 'HEAD']);
  await git(root, ['init', '-b', 'fixture']);
  await git(root, [
    '-c',
    'protocol.file.allow=always',
    'submodule',
    'add',
    '-b',
    'main',
    upstream,
    'submodules/child',
  ]);
  const adapterRoot = path.join(root, 'micro-frontends/fixture');
  await fs.mkdir(path.join(adapterRoot, 'overlay'), { recursive: true });
  const patchPath = projectDir ? `${projectDir}/source.txt` : 'source.txt';
  await fs.writeFile(
    path.join(adapterRoot, 'adapter.patch'),
    `diff --git a/${patchPath} b/${patchPath}\n--- a/${patchPath}\n+++ b/${patchPath}\n@@ -1 +1 @@\n-fixed main\n+adapted fixed main\n`,
  );
  await fs.writeFile(
    path.join(adapterRoot, 'overlay/marker.txt'),
    'adapter overlay\n',
  );
  const adapter = {
    appName: 'nuwax-repo-web',
    sourceDir: 'submodules/child',
    branch: 'main',
    pin,
    patch: 'adapter.patch',
    overlay: 'overlay',
    entry: '/micro-apps/repo/index.html',
    assetBase: '/micro-apps/repo/',
    businessBase: '/repo',
    ...(projectDir ? { projectDir } : {}),
  };
  await fs.writeFile(
    path.join(adapterRoot, 'adapter.json'),
    JSON.stringify(adapter),
  );
  await fs.writeFile(
    path.join(root, 'micro-frontends/apps.json'),
    JSON.stringify([
      { id: 'repo', adapter: 'micro-frontends/fixture/adapter.json' },
    ]),
  );
  await fs.writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({
      packageManager: 'pnpm@10.27.0',
      dependencies: { qiankun: '2.10.17-beta.0' },
      devDependencies: { '@tiny-codes/vite-plugin-qiankun': '2.4.0' },
    }),
  );
  const destination = path.join(root, 'public/micro-apps');
  await fs.mkdir(path.join(destination, 'repo'), { recursive: true });
  await fs.writeFile(
    path.join(destination, 'repo/stale.js'),
    'previous output',
  );
  await fs.mkdir(path.join(root, 'dist/micro-apps/repo'), { recursive: true });
  await fs.writeFile(
    path.join(root, 'dist/micro-apps/repo/stale.js'),
    'previous packaged output',
  );
  return {
    root,
    pin,
    adapter,
    adapterRoot,
    destination,
    projectDir,
    source: path.join(root, 'submodules/child'),
  };
}

function fakeBuild({
  failBuild = false,
  observe,
  observeInstall,
  appName = 'nuwax-repo-web',
  assetBase = '/micro-apps/repo/',
  upstreamTypes = '',
  adapterTypes = '',
  ownWorkspace = false,
} = {}) {
  return async (command, args, options) => {
    if (command !== 'corepack') return runCommand(command, args, options);
    assert.equal(args[0], 'pnpm@10.27.0');
    if (args[1] === '--version') return '10.27.0';
    if (ownWorkspace) assert.notEqual(args[1], '--ignore-workspace');
    else {
      assert.equal(args[1], '--ignore-workspace');
      args = [args[0], ...args.slice(2)];
    }
    if (args[1] === 'install') {
      assert.deepEqual(args.slice(1), ['install', '--frozen-lockfile']);
      await fs.mkdir(path.join(options.cwd, 'node_modules'), {
        recursive: true,
      });
      await observeInstall?.(options);
      return '';
    }
    if (args[1] === 'exec' && args[2] === 'tsc') {
      assert.deepEqual(args.slice(1), [
        'exec',
        'tsc',
        '-b',
        '--pretty',
        'false',
        '--force',
      ]);
      const output = options.cwd.endsWith('-main')
        ? upstreamTypes
        : adapterTypes;
      if (output) {
        const error = new Error('TypeScript diagnostics');
        error.exitCode = 1;
        error.stdout = output;
        throw error;
      }
      return '';
    }
    if (args[1] === 'exec')
      assert.deepEqual(args.slice(1), ['exec', 'vite', 'build']);
    else assert.deepEqual(args.slice(1), ['run', 'build']);
    if (failBuild) throw new Error('child build failed');
    await observe?.(options);
    await fs.mkdir(path.join(options.cwd, 'dist/assets'), { recursive: true });
    await fs.writeFile(
      path.join(options.cwd, 'dist/index.html'),
      `<script>window["${appName}"]</script><link href="${assetBase}assets/main.css">`,
    );
    await fs.writeFile(
      path.join(options.cwd, 'dist/assets/main.js'),
      'export const artifact = true;',
    );
    return '';
  };
}

test('构建使用 gitlink archive 和显式适配，保留共享 checkout dirty 文件，写来源 manifest', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    path.join(f.source, 'source.txt'),
    'parallel dirty work\n',
  );
  const manifests = await syncMicroApps({
    root: f.root,
    execute: fakeBuild({
      observe: async ({ cwd, env }) => {
        assert.equal(
          await fs.readFile(path.join(cwd, 'source.txt'), 'utf8'),
          'adapted fixed main\n',
        );
        assert.equal(
          await fs.readFile(path.join(cwd, 'marker.txt'), 'utf8'),
          'adapter overlay\n',
        );
        assert.equal(env.NUWAX_MICRO_APP_HOST_ROOT, f.root);
        assert.notEqual(cwd, f.source);
      },
    }),
  });
  assert.equal(
    await fs.readFile(path.join(f.source, 'source.txt'), 'utf8'),
    'parallel dirty work\n',
  );
  assert.equal(manifests[0].source.commit, f.pin);
  assert.equal(manifests[0].source.branch, 'main');
  assert.match(manifests[0].adapter.sha256, /^[a-f0-9]{64}$/);
  const written = JSON.parse(
    await fs.readFile(path.join(f.destination, 'repo/version.json'), 'utf8'),
  );
  assert.equal(written.source.commit, f.pin);
  await assert.rejects(fs.access(path.join(f.destination, 'repo/stale.js')));
});

test('monorepo 只从指定前端目录 install/build，后端保持原始 archive', async (t) => {
  const f = await fixture(t, { projectDir: 'pc-web' });
  await syncMicroApps({
    root: f.root,
    execute: fakeBuild({
      observe: async ({ cwd }) => {
        assert.equal(path.basename(cwd), 'pc-web');
        assert.equal(
          await fs.readFile(path.join(cwd, 'source.txt'), 'utf8'),
          'adapted fixed main\n',
        );
      },
    }),
  });
  const manifest = JSON.parse(
    await fs.readFile(path.join(f.destination, 'repo/version.json'), 'utf8'),
  );
  assert.equal(manifest.projectDir, 'pc-web');
});

test('子应用构建失败向上抛出并删除旧产物，不能发布半成品', async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    syncMicroApps({ root: f.root, execute: fakeBuild({ failBuild: true }) }),
    /child build failed/,
  );
  await assert.rejects(fs.access(f.destination));
  await assert.rejects(fs.access(path.join(f.root, 'dist/micro-apps')));
  await assert.rejects(
    fs.access(path.join(f.root, '.cache/micro-apps/.sync.lock')),
  );
});

test('adapter pin 与 gitlink 不一致时在 install 前失败并清旧产物', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    path.join(f.adapterRoot, 'adapter.json'),
    JSON.stringify({ ...f.adapter, pin: 'f'.repeat(40) }),
  );
  await assert.rejects(
    syncMicroApps({ root: f.root, execute: fakeBuild() }),
    /gitlink .* 与 adapter.pin .* 不一致/,
  );
  await assert.rejects(fs.access(f.destination));
});

test('业务路由与资源目录混用、monorepo目录越界和消息auth模式均拒绝', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    path.join(f.adapterRoot, 'adapter.json'),
    JSON.stringify({ ...f.adapter, entry: '/repo/index.html' }),
  );
  await assert.rejects(readMicroAppRegistry(f.root), /契约无效/);
  await fs.writeFile(
    path.join(f.adapterRoot, 'adapter.json'),
    JSON.stringify({ ...f.adapter, projectDir: '../backend' }),
  );
  await assert.rejects(readMicroAppRegistry(f.root), /不得越出/);
  await fs.writeFile(
    path.join(f.adapterRoot, 'adapter.json'),
    JSON.stringify(f.adapter),
  );
  await fs.writeFile(
    path.join(f.root, 'micro-frontends/apps.json'),
    JSON.stringify([
      { id: 'message', adapter: 'micro-frontends/fixture/adapter.json' },
    ]),
  );
  await assert.rejects(
    readMicroAppRegistry(f.root),
    /VITE_IM_AUTH_MODE=platform/,
  );
});

test('真实 main 类型基线允许行号移动，新增类型诊断仍中止资产发布', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    path.join(f.adapterRoot, 'adapter.json'),
    JSON.stringify({ ...f.adapter, typeCheckBaseline: true }),
  );
  const upstreamTypes =
    "src/original.ts(4,2): error TS2322: Type 'x' is not assignable to type 'number'.\n";
  const adapterTypes = upstreamTypes.replace('(4,2)', '(18,2)');
  const [manifest] = await syncMicroApps({
    root: f.root,
    execute: fakeBuild({ upstreamTypes, adapterTypes }),
  });
  assert.equal(manifest.typecheck.upstreamDiagnostics, 1);
  assert.equal(manifest.typecheck.newDiagnostics, 0);
  await assert.rejects(
    syncMicroApps({
      root: f.root,
      execute: fakeBuild({
        upstreamTypes,
        adapterTypes: `${adapterTypes}src/adapter.ts(1,1): error TS2304: Cannot find name 'broken'.\n`,
      }),
    }),
    /适配新增 1 条类型诊断/,
  );
  await assert.rejects(fs.access(f.destination));
});

test('类型基线比较保留多行消息并检查同诊断数量，防止同码不同原因被吞', () => {
  const first = normalizeTypeDiagnostics(
    'src/a.ts(1,2): error TS2345: Incompatible callback.\n  Type number is not string.\n',
    '/app',
  );
  const shifted = normalizeTypeDiagnostics(
    'src/a.ts(30,2): error TS2345: Incompatible callback.\n  Type number is not string.\n',
    '/other',
  );
  assert.deepEqual(newTypeDiagnostics(first, shifted), []);
  assert.equal(newTypeDiagnostics(first, [...shifted, ...shifted]).length, 1);
  const changed = normalizeTypeDiagnostics(
    'src/a.ts(1,2): error TS2345: Incompatible callback.\n  Missing required field.\n',
    '/app',
  );
  assert.equal(newTypeDiagnostics(first, changed).length, 1);
});

test('消息前端环境固定为 platform 并记录在版本 manifest', async (t) => {
  const f = await fixture(t);
  const adapter = {
    ...f.adapter,
    appName: 'nuwax-im-web',
    businessBase: '/instant-message',
    entry: '/micro-apps/message/index.html',
    assetBase: '/micro-apps/message/',
    buildEnvironment: { VITE_IM_AUTH_MODE: 'platform' },
  };
  await fs.writeFile(
    path.join(f.adapterRoot, 'adapter.json'),
    JSON.stringify(adapter),
  );
  await fs.writeFile(
    path.join(f.root, 'micro-frontends/apps.json'),
    JSON.stringify([
      { id: 'message', adapter: 'micro-frontends/fixture/adapter.json' },
    ]),
  );
  const [manifest] = await syncMicroApps({
    root: f.root,
    execute: fakeBuild({
      appName: adapter.appName,
      assetBase: adapter.assetBase,
      observe: async ({ env }) => {
        assert.equal(env.VITE_IM_AUTH_MODE, 'platform');
      },
    }),
  });
  assert.equal(manifest.buildEnvironment.VITE_IM_AUTH_MODE, 'platform');
});

test('并行编辑适配源文件不会改变本次已冻结的构建输入', async (t) => {
  const f = await fixture(t);
  await syncMicroApps({
    root: f.root,
    execute: fakeBuild({
      observeInstall: async () => {
        await fs.writeFile(
          path.join(f.adapterRoot, 'overlay/marker.txt'),
          'parallel next adapter\n',
        );
      },
      observe: async ({ cwd }) => {
        assert.equal(
          await fs.readFile(path.join(cwd, 'marker.txt'), 'utf8'),
          'adapter overlay\n',
        );
      },
    }),
  });
  assert.equal(
    await fs.readFile(path.join(f.adapterRoot, 'overlay/marker.txt'), 'utf8'),
    'parallel next adapter\n',
  );
});

test('子仓自身 workspace 保留本地依赖补丁上下文，与宿主 workspace 隔离', async (t) => {
  const f = await fixture(t, { ownWorkspace: true });
  const [manifest] = await syncMicroApps({
    root: f.root,
    execute: fakeBuild({ ownWorkspace: true }),
  });
  assert.equal(manifest.workspaceMode, 'project-workspace');
});
