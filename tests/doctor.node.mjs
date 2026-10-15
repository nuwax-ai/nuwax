import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { collectDoctorReport, formatDoctorReport } from '../scripts/doctor.mjs';
import {
  adapterFingerprint,
  readMicroAppRegistry,
  runCommand,
} from '../scripts/sync-micro-apps.mjs';

const git = (cwd, args) => runCommand('git', args, { cwd, capture: true });

async function fixture(t) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'doctor-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const upstream = path.join(temporary, 'upstream');
  const root = path.join(temporary, 'host');
  await fs.mkdir(upstream);
  await fs.mkdir(root);
  await git(upstream, ['init', '-b', 'main']);
  await git(upstream, ['config', 'user.name', 'Doctor Fixture']);
  await git(upstream, ['config', 'user.email', 'doctor@example.invalid']);
  await fs.writeFile(path.join(upstream, 'source.txt'), 'main\n');
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
  await fs.writeFile(
    path.join(adapterRoot, 'adapter.patch'),
    'diff --git a/source.txt b/source.txt\n--- a/source.txt\n+++ b/source.txt\n@@ -1 +1 @@\n-main\n+adapted\n',
  );
  await fs.writeFile(path.join(adapterRoot, 'overlay/marker.txt'), 'overlay\n');
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
    JSON.stringify({ packageManager: 'pnpm@10.27.0' }),
  );
  await fs.mkdir(path.join(root, 'node_modules'));
  await fs.mkdir(path.join(root, 'src/.umi'), { recursive: true });
  await fs.writeFile(path.join(root, 'src/.umi/tsconfig.json'), '{}');
  return { root, pin, adapter, adapterRoot };
}

async function writeArtifact(f, commit) {
  const [app] = await readMicroAppRegistry(f.root);
  const dir = path.join(f.root, 'public/micro-apps/repo');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'version.json'),
    JSON.stringify({
      source: { commit },
      adapter: { sha256: (await adapterFingerprint(app)).sha256 },
    }),
  );
}

const titles = (items, level) =>
  items.filter((item) => item.level === level).map((item) => item.title);

test('产物缺失时提醒 sync:micro-apps，quick 模式不查 pnpm/远端', async (t) => {
  const f = await fixture(t);
  const calls = [];
  const items = await collectDoctorReport({
    root: f.root,
    quick: true,
    execute: (command, args, options) => {
      calls.push(command);
      return runCommand(command, args, options);
    },
  });
  assert.ok(!calls.includes('pnpm'));
  assert.equal(titles(items, 'error').length, 0);
  assert.match(titles(items, 'warn').join('\n'), /本地无产物/);
  assert.match(
    formatDoctorReport(items, { quick: true }),
    /npm run sync:micro-apps/,
  );
  assert.doesNotMatch(formatDoctorReport(items, { quick: true }), /✅/);
});

test('产物与登记一致时报 ok；登记前进后提示产物过期', async (t) => {
  const f = await fixture(t);
  await writeArtifact(f, f.pin);
  let items = await collectDoctorReport({ root: f.root, quick: true });
  assert.match(titles(items, 'ok').join('\n'), /产物与登记版本一致/);
  await writeArtifact(f, 'f'.repeat(40));
  items = await collectDoctorReport({ root: f.root, quick: true });
  assert.match(titles(items, 'warn').join('\n'), /本地产物已过期/);
});

test('gitlink 与 adapter.pin 撕裂、patch 混入 .rej 都报错', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    path.join(f.adapterRoot, 'adapter.json'),
    JSON.stringify({ ...f.adapter, pin: 'a'.repeat(40) }),
  );
  await fs.appendFile(
    path.join(f.adapterRoot, 'adapter.patch'),
    'diff --git a/x.ts.rej b/x.ts.rej\nnew file mode 100644\n--- /dev/null\n+++ b/x.ts.rej\n@@ -0,0 +1 @@\n+x\n',
  );
  const errors = titles(
    await collectDoctorReport({ root: f.root, quick: true }),
    'error',
  ).join('\n');
  assert.match(errors, /与 adapter\.pin aaaaaaaaa 不一致/);
  assert.match(errors, /合并残留文件/);
});

test('子模块未初始化（社区版）只提醒不报错', async (t) => {
  const f = await fixture(t);
  await fs.rm(path.join(f.root, 'submodules/child/.git'), {
    force: true,
    recursive: true,
  });
  const items = await collectDoctorReport({ root: f.root, quick: true });
  assert.equal(titles(items, 'error').length, 0);
  assert.match(titles(items, 'warn').join('\n'), /子模块未初始化/);
});
