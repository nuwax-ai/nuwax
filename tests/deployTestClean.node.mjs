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
const repo = fileURLToPath(new URL('../', import.meta.url));
const target = 'fixture-target';
const zero = '0'.repeat(40);

function environment(extra = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (
      /^(GIT_|DEPLOY_|MOBILE_BUILD_|DIST_|FIXTURE_|GATE)/.test(key) ||
      key === 'DRY_RUN'
    )
      delete env[key];
  }
  return {
    ...env,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'protocol.file.allow',
    GIT_CONFIG_VALUE_0: 'always',
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
    maxBuffer: 3 * 1024 * 1024,
  });
}
async function git(cwd, ...args) {
  return (await run(cwd, 'git', args)).stdout.trim();
}
async function write(root, name, contents) {
  const file = path.join(root, name);
  if (contents === null) return fs.rm(file, { force: true, recursive: true });
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents);
}

async function fixture(t, { trackedDist = false } = {}) {
  const temporary = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'deploy-clean-')),
  );
  t.after(() => fs.rm(temporary, { force: true, recursive: true }));
  const root = path.join(temporary, 'source');
  const tools = path.join(temporary, 'tools');
  await fs.mkdir(root);
  await fs.mkdir(tools);
  await git(root, 'init', '-b', target);
  await git(root, 'config', 'user.name', 'Deploy Fixture');
  await git(root, 'config', 'user.email', 'deploy@example.invalid');
  await git(root, 'config', 'commit.gpgsign', 'false');
  await git(root, 'config', 'core.hooksPath', '/dev/null');
  for (const file of [
    'deploy_test_clean.sh',
    'scripts/deploy/lib.sh',
    'scripts/deploy-asset-retention.mjs',
  ]) {
    await write(root, file, await fs.readFile(path.join(repo, file)));
  }
  await write(
    root,
    '.gitignore',
    '/dist\n/src/.umi\n/.cache\n/.dist-retention-snapshot\n',
  );
  await write(root, 'source.txt', 'initial\n');
  await write(root, 'deleted.txt', 'remove this\n');
  await write(root, 'src/constants/version.ts', 'stable version\n');
  await write(root, 'micro-frontends/apps.json', '[]\n');
  if (trackedDist)
    await write(root, 'dist/index.html', 'old source artifact\n');
  await git(root, 'add', '.');
  if (trackedDist) await git(root, 'add', '-f', 'dist');
  await git(root, 'commit', '-m', 'fixture seed');
  const seed = await git(root, 'rev-parse', 'HEAD');
  await git(root, 'branch', 'test');
  await git(root, 'branch', 'dev');
  const remotes = {};
  for (const remote of ['origin', 'gitlab']) {
    remotes[remote] = path.join(temporary, `${remote}.git`);
    await git(root, 'init', '--bare', remotes[remote]);
    await git(root, 'remote', 'add', remote, remotes[remote]);
    await git(root, 'push', remote, target, 'test', 'dev');
  }
  const env = {
    PATH: `${tools}:${process.env.PATH}`,
    FIXTURE_LOG: path.join(temporary, 'calls.jsonl'),
    FIXTURE_BUILD_COUNT: path.join(temporary, 'build-count'),
  };
  await fs.writeFile(
    path.join(tools, 'pnpm'),
    String.raw`#!/usr/bin/env node
const fs = require('fs');
const cp = require('child_process');
if (process.argv[3] === 'setup') { fs.mkdirSync('src/.umi', {recursive:true}); fs.writeFileSync('src/.umi/tsconfig.json', '{}'); process.exit(0); }
if (process.argv[3] !== 'test:conversation') process.exit(1);
fs.appendFileSync(process.env.FIXTURE_LOG, JSON.stringify({kind:'gate', branch:cp.execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(), head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()})+'\n');
if (process.env.FIXTURE_FAIL_GATE) { console.error(' FAIL tests/fixture.ts > failed\n     → expected source contract'); process.exit(1); }
console.log(' Test Files 1 passed (1)\n Tests 1 passed (1)');
`,
    { mode: 0o755 },
  );
  await fs.writeFile(
    path.join(tools, 'npm'),
    String.raw`#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const git = (...args) => cp.execFileSync('git',args,{encoding:'utf8'}).trim();
const log = (value) => fs.appendFileSync(process.env.FIXTURE_LOG, JSON.stringify(value)+'\n');
(async () => {
  const action = process.argv[3];
  const branch = git('branch','--show-current');
  if (action === 'generate:version') return;
  if (action === 'upgrade:micro-apps') {
    log({kind:'upgrade',branch});
    if (JSON.parse(fs.readFileSync('micro-frontends/apps.json','utf8')).length) {
      const {upgradeMicroApps} = await import(${JSON.stringify(
        new URL('../scripts/upgrade-micro-apps.mjs', import.meta.url).href,
      )});
      await upgradeMicroApps({root:process.cwd(),target:'all'});
    }
    return;
  }
  if (action !== 'build:prod:m') throw new Error('unexpected npm action: '+action);
  const countFile = process.env.FIXTURE_BUILD_COUNT;
  const count = (fs.existsSync(countFile) ? Number(fs.readFileSync(countFile,'utf8')) : 0)+1;
  fs.writeFileSync(countFile,String(count));
  const head = git('rev-parse','HEAD');
  log({kind:'build',branch,head});
  if (process.env.FIXTURE_FAIL_BUILD) throw new Error('fixture build failed');
  const {snapshot,merge} = await import(require('url').pathToFileURL(path.resolve('scripts/deploy-asset-retention.mjs')).href);
  snapshot();
  fs.rmSync('dist',{recursive:true,force:true});
  fs.mkdirSync('dist/m',{recursive:true});
  fs.writeFileSync('dist/index.html',fs.readFileSync('source.txt'));
  fs.writeFileSync('dist/m/index.html','new mobile');
  fs.writeFileSync('dist/version.json',JSON.stringify({gitHash:process.env.FIXTURE_WRONG_HASH ? 'badc0ffee' : head,buildAt:'2026-11-05T08:00:00Z'}));
  fs.writeFileSync('dist/umi.1234abcd.js','new chunk');
  if (fs.existsSync('submodules/app')) fs.writeFileSync('dist/app-pin.txt',git('-C','submodules/app','rev-parse','HEAD'));
  merge();
  if (process.env.FIXTURE_BUILD_DIRTY === 'always' || (process.env.FIXTURE_BUILD_DIRTY === 'once' && count === 1)) fs.appendFileSync('source.txt','generated source\n');
  for (const [variable,ref] of [['FIXTURE_CHANGE_TEST','test'],['FIXTURE_CHANGE_TARGET',${JSON.stringify(
    target,
  )}]]) {
    if (process.env[variable] && count === 1) git('--git-dir='+process.env[variable],'update-ref','refs/heads/'+ref,process.env.FIXTURE_LATE_SHA);
  }
})().catch(error => {console.error(error);process.exitCode=1;});
`,
    { mode: 0o755 },
  );
  return { temporary, root, tools, remotes, seed, env };
}

async function makeCommit(state, base, files) {
  const checkout = path.join(
    state.temporary,
    `writer-${Math.random().toString(36).slice(2)}`,
  );
  await git(state.root, 'worktree', 'add', '--detach', checkout, base);
  try {
    for (const [file, content] of Object.entries(files))
      await write(checkout, file, content);
    await git(checkout, 'add', '-A');
    if (await fs.stat(path.join(checkout, 'dist')).catch(() => null))
      await git(checkout, 'add', '-f', '-A', '--', 'dist');
    await git(checkout, 'commit', '-m', 'fixture independent update');
    return await git(checkout, 'rev-parse', 'HEAD');
  } finally {
    await git(state.root, 'worktree', 'remove', '--force', checkout);
  }
}

async function publish(state, remote, branch, sha) {
  await git(state.root, 'push', remote, `${sha}:refs/heads/${branch}`);
}
async function head(state, remote, branch = 'test') {
  return (
    await git(
      state.root,
      'ls-remote',
      '--heads',
      remote,
      `refs/heads/${branch}`,
    )
  ).split(/\s/)[0];
}
async function deploy(state, extra = {}, branch = target) {
  return run(
    state.root,
    'bash',
    ['deploy_test_clean.sh', ...(branch === null ? [] : [branch])],
    { ...state.env, ...extra },
  );
}
async function failure(promise) {
  return promise.then(
    () => assert.fail('expected failure'),
    (error) => error,
  );
}
async function calls(state) {
  return (await fs.readFile(state.env.FIXTURE_LOG, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}
async function show(state, sha, file) {
  return git(state.root, 'show', `${sha}:${file}`);
}
async function existsAt(state, sha, file) {
  return git(state.root, 'cat-file', '-e', `${sha}:${file}`).then(
    () => true,
    () => false,
  );
}
async function hook(state, remote, program) {
  await fs.writeFile(
    path.join(state.remotes[remote], 'hooks/update'),
    `#!/usr/bin/env node\n${program}\n`,
    { mode: 0o755 },
  );
}
async function runDirectory(state) {
  const common = path.join(state.root, '.git/nuwax-deploy');
  return path.join(
    common,
    (await fs.readdir(common)).find(
      (name) => name.startsWith('clean-') && name !== 'clean-test.lock',
    ),
  );
}

test('commits all non-dist input and remote source on target, rebuilding test without old test/dev content', async (t) => {
  const state = await fixture(t, { trackedDist: true });
  const originalSourceTree = await git(
    state.root,
    'rev-parse',
    `${state.seed}:dist`,
  );
  const oldOrigin = await makeCommit(state, state.seed, {
    'old-origin-only.txt': 'unreleased',
    'dist/index.html': 'old origin',
  });
  const oldGitlab = await makeCommit(state, state.seed, {
    'old-gitlab-only.txt': 'unreleased',
    'dist/index.html': 'old gitlab',
    'dist/umi.aaaa1111.js': 'old chunk',
    'dist/unhashed.js': 'do not retain',
  });
  await publish(state, 'origin', 'test', oldOrigin);
  await publish(state, 'gitlab', 'test', oldGitlab);
  const originSource = await makeCommit(state, state.seed, {
    'origin-source.txt': 'keep source',
    'dist/index.html': 'remote source artifact',
  });
  const gitlabSource = await makeCommit(state, state.seed, {
    'gitlab-source.txt': 'keep source',
  });
  await publish(state, 'origin', target, originSource);
  await publish(state, 'gitlab', target, gitlabSource);
  const dev = await makeCommit(state, state.seed, {
    'dev-only.txt': 'do not ship',
  });
  await publish(state, 'origin', 'dev', dev);
  await write(state.root, 'source.txt', 'local business source\n');
  await write(state.root, 'new-source.txt', 'new business source');
  await write(state.root, 'odd [source].txt', 'literal filename');
  await write(state.root, 'deleted.txt', null);
  await write(state.root, 'dist/index.html', 'staged artifact, never source');
  await git(state.root, 'add', '-f', 'dist');
  await deploy(state);
  const source = await head(state, 'origin', target);
  const artifact = await head(state, 'origin');
  assert.equal(source, await head(state, 'gitlab', target));
  assert.equal(artifact, await head(state, 'gitlab'));
  assert.equal(
    await git(state.root, 'rev-parse', `${source}:dist`),
    originalSourceTree,
  );
  assert.equal(await git(state.root, 'rev-parse', `${artifact}^`), source);
  assert.equal(
    await git(
      state.root,
      'diff',
      '--name-only',
      source,
      artifact,
      '--',
      '.',
      ':(exclude)dist',
    ),
    '',
  );
  for (const file of [
    'origin-source.txt',
    'gitlab-source.txt',
    'new-source.txt',
    'odd [source].txt',
  ])
    assert.equal(await existsAt(state, source, file), true);
  for (const file of [
    'old-origin-only.txt',
    'old-gitlab-only.txt',
    'dev-only.txt',
    'deleted.txt',
  ])
    assert.equal(await existsAt(state, artifact, file), false);
  assert.equal(
    await show(state, artifact, 'dist/index.html'),
    'local business source',
  );
  assert.equal(
    await show(state, artifact, 'dist/umi.aaaa1111.js'),
    'old chunk',
  );
  assert.equal(await existsAt(state, artifact, 'dist/unhashed.js'), false);
  assert.equal(await git(state.root, 'branch', '--show-current'), target);
  assert((await calls(state)).every((call) => call.branch === target));
  const backups = await git(
    state.root,
    'ls-remote',
    '--heads',
    'origin',
    'refs/heads/backup/test/*',
  );
  assert(
    backups.includes(`${oldOrigin}\t`) &&
      backups.includes(`${oldGitlab}\t`) &&
      backups.includes(`${state.seed}\t`),
  );
  assert.equal(
    backups,
    await git(
      state.root,
      'ls-remote',
      '--heads',
      'gitlab',
      'refs/heads/backup/test/*',
    ),
  );
  assert.equal(await head(state, 'origin', 'dev'), dev);
});

test('tracked files covered by ignore rules are updated or deleted while new ignored files stay untracked', async (t) => {
  const state = await fixture(t);
  await write(state.root, '.cursor/rules/project-rules.mdc', 'tracked rules');
  await write(state.root, '.cursorrules', 'unchanged tracked rules');
  await write(state.root, 'k8s/config/keep.yaml', 'unchanged tracked config');
  await write(state.root, 'k8s/config/remove.yaml', 'remove this config');
  await git(state.root, 'add', '.cursor', '.cursorrules', 'k8s');
  await git(state.root, 'commit', '-m', 'fixture tracked config');
  await fs.appendFile(
    path.join(state.root, '.gitignore'),
    '.cursor\n.cursorrules\n/k8s\n',
  );
  await git(state.root, 'add', '.gitignore');
  await git(state.root, 'commit', '-m', 'fixture ignore tracked directories');
  await write(
    state.root,
    '.cursor/rules/project-rules.mdc',
    'updated tracked rules',
  );
  await write(state.root, 'k8s/config/remove.yaml', null);
  await write(state.root, '.cursor/rules/new.mdc', 'ignored local rules');
  await write(state.root, 'k8s/config/new.yaml', 'ignored local config');
  await write(state.root, 'source.txt', 'updated source');
  await write(state.root, 'dist/local-cache.txt', 'local artifact');
  await git(state.root, 'add', '-f', 'dist');
  await deploy(state, {}, null);
  const source = await head(state, 'origin', target);
  const artifact = await head(state, 'origin');
  assert.equal(source, await head(state, 'gitlab', target));
  assert.equal(artifact, await head(state, 'gitlab'));
  assert.equal(
    await show(state, source, '.cursor/rules/project-rules.mdc'),
    'updated tracked rules',
  );
  assert.equal(
    await show(state, source, '.cursorrules'),
    'unchanged tracked rules',
  );
  assert.equal(
    await show(state, source, 'k8s/config/keep.yaml'),
    'unchanged tracked config',
  );
  assert.equal(await existsAt(state, source, 'k8s/config/remove.yaml'), false);
  assert.equal(await show(state, source, 'source.txt'), 'updated source');
  assert.equal(await existsAt(state, source, 'dist'), false);
  for (const file of ['.cursor/rules/new.mdc', 'k8s/config/new.yaml']) {
    assert.equal(await existsAt(state, source, file), false);
    assert.equal(await existsAt(state, artifact, file), false);
    assert(await fs.stat(path.join(state.root, file)));
  }
});

test('build source changes are committed on target and rebuilt at the final commit without dist history', async (t) => {
  const state = await fixture(t);
  const previous = await makeCommit(state, state.seed, {
    'dist/index.html': 'old page',
    'dist/keep.deadbeef.css': 'retained css',
    'dist/.dist-retention.json': JSON.stringify({
      version: 1,
      historicalCssBackfilled: true,
      files: { 'keep.deadbeef.css': 2 },
    }),
  });
  await publish(state, 'gitlab', 'test', previous);
  await deploy(state, { FIXTURE_BUILD_DIRTY: 'once' });
  const source = await head(state, 'origin', target);
  const artifact = await head(state, 'origin');
  const events = await calls(state);
  assert.equal(events.filter((call) => call.kind === 'gate').length, 2);
  assert.equal(events.filter((call) => call.kind === 'build').length, 2);
  assert.equal(
    events.filter((call) => call.kind === 'build').at(-1).head,
    source,
  );
  assert.equal(
    JSON.parse(await show(state, artifact, 'dist/version.json')).gitHash,
    source,
  );
  assert.equal(await existsAt(state, source, 'dist'), false);
  assert.equal(
    await show(state, artifact, 'dist/keep.deadbeef.css'),
    'retained css',
  );
  assert.equal(
    JSON.parse(await show(state, artifact, 'dist/.dist-retention.json')).files[
      'keep.deadbeef.css'
    ],
    3,
  );
  assert.equal(
    await show(state, source, 'source.txt'),
    'initial\ngenerated source',
  );
});

test('continuous source changes, gate/build failures and invalid artifacts never delete old test', async (t) => {
  for (const extra of [
    { FIXTURE_BUILD_DIRTY: 'always' },
    { FIXTURE_FAIL_GATE: '1' },
    { FIXTURE_FAIL_BUILD: '1' },
    { FIXTURE_WRONG_HASH: '1' },
  ]) {
    await t.test(Object.keys(extra)[0], async (sub) => {
      const state = await fixture(sub);
      const result = await failure(deploy(state, extra));
      assert.match(result.stderr, /提测失败/);
      assert.equal(await head(state, 'origin'), state.seed);
      assert.equal(await head(state, 'gitlab'), state.seed);
      assert.equal(await head(state, 'origin', target), state.seed);
      assert.equal(
        await git(
          state.root,
          'ls-remote',
          '--heads',
          'origin',
          'refs/heads/backup/test/*',
        ),
        '',
      );
      assert(await fs.stat(path.join(await runDirectory(state), 'state')));
    });
  }
});

test('a remote-only target in a single-branch clone is fetched and deployed; absent tests are allowed', async (t) => {
  const state = await fixture(t);
  const oldTarget = await makeCommit(state, state.seed, {
    'deploy_test_clean.sh': null,
  });
  for (const remote of ['origin', 'gitlab'])
    await publish(state, remote, target, oldTarget);
  await git(state.root, 'checkout', 'dev');
  await git(state.root, 'branch', '-d', target);
  await git(state.root, 'branch', '-d', 'test');
  for (const remote of ['origin', 'gitlab']) {
    await git(state.root, 'push', remote, '--delete', 'test');
    await git(
      state.root,
      'config',
      `remote.${remote}.fetch`,
      `+refs/heads/dev:refs/remotes/${remote}/dev`,
    );
    await git(
      state.root,
      'update-ref',
      '-d',
      `refs/remotes/${remote}/${target}`,
    );
  }
  await deploy(state);
  assert.equal(await head(state, 'origin'), await head(state, 'gitlab'));
  assert.equal(await git(state.root, 'branch', '--show-current'), target);
});

test('source conflicts stop before build and preserve remote test branches', async (t) => {
  const state = await fixture(t);
  const remote = await makeCommit(state, state.seed, {
    'source.txt': 'remote conflict\n',
  });
  await publish(state, 'gitlab', target, remote);
  await write(state.root, 'source.txt', 'local conflict\n');
  const error = await failure(deploy(state));
  assert.match(error.stderr, /源码冲突[\s\S]*source.txt/);
  assert.equal(await head(state, 'origin'), state.seed);
  assert.equal(await head(state, 'gitlab'), state.seed);
  assert.equal(await git(state.root, 'ls-files', '-u'), '');
});

test('dirty input on another branch and occupied test worktrees are preserved', async (t) => {
  const state = await fixture(t);
  await git(state.root, 'checkout', 'dev');
  await write(state.root, 'source.txt', 'foreign WIP\n');
  assert.match((await failure(deploy(state))).stderr, /其他分支.*未提交代码/);
  assert.equal(await git(state.root, 'branch', '--show-current'), 'dev');
  assert.equal(
    await fs.readFile(path.join(state.root, 'source.txt'), 'utf8'),
    'foreign WIP\n',
  );
  await git(state.root, 'restore', 'source.txt');
  const other = path.join(state.temporary, 'foreign-test');
  await git(state.root, 'worktree', 'add', other, 'test');
  await write(other, 'source.txt', 'test WIP');
  assert.match(
    (await failure(deploy(state))).stderr,
    /test 被其它 worktree 占用/,
  );
  assert.equal(
    await fs.readFile(path.join(other, 'source.txt'), 'utf8'),
    'test WIP',
  );
});

test('a failed source push does not delete test or merge unbuilt remote source', async (t) => {
  const state = await fixture(t);
  await write(state.root, 'source.txt', 'new local source');
  await hook(
    state,
    'gitlab',
    `if (process.argv[2] === ${JSON.stringify(
      `refs/heads/${target}`,
    )}) process.exit(1);`,
  );
  const error = await failure(deploy(state));
  assert.match(error.stderr, /双推目标分支/);
  assert.notEqual(await head(state, 'origin', target), state.seed);
  assert.equal(await head(state, 'gitlab', target), state.seed);
  assert.equal(await head(state, 'origin'), state.seed);
  assert.equal(await head(state, 'gitlab'), state.seed);
  assert.match(error.stderr, /源码.*补推/);
});

test('target and test concurrent updates stop without combining them into built source', async (t) => {
  for (const kind of ['TEST', 'TARGET']) {
    await t.test(kind, async (sub) => {
      const state = await fixture(sub);
      const late = await makeCommit(state, state.seed, {
        'late.txt': 'concurrent source',
      });
      await publish(state, 'gitlab', 'fixture-late', late);
      const error = await failure(
        deploy(state, {
          [`FIXTURE_CHANGE_${kind}`]: state.remotes.gitlab,
          FIXTURE_LATE_SHA: late,
        }),
      );
      assert.match(error.stderr, /并发更新/);
      assert.equal(
        await head(state, 'gitlab', kind === 'TEST' ? 'test' : target),
        late,
      );
      assert.equal(await head(state, 'origin'), state.seed);
      assert.equal(
        await existsAt(
          state,
          await git(state.root, 'rev-parse', 'HEAD'),
          'late.txt',
        ),
        false,
      );
    });
  }
});

test('a deletion rejection preserves both old backups and prints an exact restore for the missing remote', async (t) => {
  const state = await fixture(t);
  await hook(
    state,
    'origin',
    `if (process.argv[2] === 'refs/heads/test' && process.argv[4] === ${JSON.stringify(
      zero,
    )}) process.exit(1);`,
  );
  const error = await failure(deploy(state));
  assert.equal(await head(state, 'origin'), state.seed);
  assert.equal(await head(state, 'gitlab'), '');
  assert.match(
    error.stderr,
    new RegExp(`git push gitlab ${state.seed}:refs/heads/test`),
  );
  assert.match(
    await fs.readFile(path.join(await runDirectory(state), 'state'), 'utf8'),
    /deleted\tgitlab/,
  );
  const backups = await git(
    state.root,
    'ls-remote',
    '--heads',
    'gitlab',
    'refs/heads/backup/test/*',
  );
  assert(backups.includes(state.seed));
});

test('a partial artifact publish retains the exact candidate and recovery commands', async (t) => {
  const state = await fixture(t);
  await hook(
    state,
    'gitlab',
    `if (process.argv[2] === 'refs/heads/test' && process.argv[4] !== ${JSON.stringify(
      zero,
    )}) process.exit(1);`,
  );
  const error = await failure(deploy(state));
  const candidate = await git(state.root, 'rev-parse', 'test');
  assert.equal(await head(state, 'origin'), candidate);
  assert.equal(await head(state, 'gitlab'), '');
  assert.match(
    error.stderr,
    new RegExp(`git push gitlab ${candidate}:refs/heads/test`),
  );
  assert(await fs.stat(path.join(await runDirectory(state), 'built-dist.tar')));
  assert.equal(await git(state.root, 'branch', '--show-current'), 'test');
  assert.doesNotMatch(error.stdout, /✅/);
});

test('a backup rejection leaves both old test branches untouched', async (t) => {
  const state = await fixture(t);
  await hook(
    state,
    'gitlab',
    "if (process.argv[2].startsWith('refs/heads/backup/test/')) process.exit(1);",
  );
  await failure(deploy(state));
  assert.equal(await head(state, 'origin'), state.seed);
  assert.equal(await head(state, 'gitlab'), state.seed);
});

test('a test recreated concurrently after deletion is preserved instead of merging or overwriting it', async (t) => {
  const state = await fixture(t);
  const late = await makeCommit(state, state.seed, {
    'late-test.txt': 'another deploy',
  });
  await publish(state, 'gitlab', 'fixture-late', late);
  await hook(
    state,
    'origin',
    `
if (process.argv[2] === 'refs/heads/test' && process.argv[4] === ${JSON.stringify(
      zero,
    )}) {
  require('child_process').execFileSync('git', [${JSON.stringify(
    `--git-dir=${state.remotes.gitlab}`,
  )}, 'update-ref', 'refs/heads/test', ${JSON.stringify(late)}]);
}`,
  );
  const error = await failure(deploy(state));
  assert.match(error.stderr, /gitlab\/test 出现并发更新/);
  assert.equal(await head(state, 'gitlab'), late);
  const candidate = await git(state.root, 'rev-parse', 'test');
  assert.equal(await head(state, 'origin'), candidate);
  assert.equal(await existsAt(state, candidate, 'late-test.txt'), false);
  assert.doesNotMatch(error.stdout, /✅/);
});

test('omitting the target deploys the current local branch including its non-dist input', async (t) => {
  const state = await fixture(t);
  const current = 'current-source';
  await git(state.root, 'checkout', '-b', current);
  await write(state.root, 'current-only.txt', 'current branch source');
  await deploy(state, {}, null);
  const source = await head(state, 'origin', current);
  const artifact = await head(state, 'origin');
  assert.equal(source, await head(state, 'gitlab', current));
  assert.equal(artifact, await head(state, 'gitlab'));
  assert.equal(await git(state.root, 'rev-parse', `${artifact}^`), source);
  assert.equal(
    await show(state, source, 'current-only.txt'),
    'current branch source',
  );
  assert.equal(await existsAt(state, source, 'dist'), false);
  assert.equal(await head(state, 'origin', target), state.seed);
  assert.equal(await head(state, 'gitlab', target), state.seed);
  assert((await calls(state)).every((call) => call.branch === current));
  assert.equal(await git(state.root, 'branch', '--show-current'), current);
});

test('dry-run preserves dirty files, staged dist, refs and index for explicit and current targets', async (t) => {
  const state = await fixture(t);
  await write(state.root, 'source.txt', 'WIP');
  await write(state.root, 'dist/index.html', 'staged dist');
  await git(state.root, 'add', '-f', 'dist');
  const snapshot = async () => ({
    refs: await git(state.root, 'show-ref'),
    index: createHash('sha256')
      .update(await fs.readFile(path.join(state.root, '.git/index')))
      .digest('hex'),
    source: await fs.readFile(path.join(state.root, 'source.txt'), 'utf8'),
    dist: await fs.readFile(path.join(state.root, 'dist/index.html'), 'utf8'),
    gitEntries: await fs.readdir(path.join(state.root, '.git')),
  });
  const before = await snapshot();
  assert.match((await deploy(state, { DRY_RUN: '1' })).stdout, /只读演练/);
  assert.match(
    (await deploy(state, { DRY_RUN: '1' }, null)).stdout,
    new RegExp(`检出 ${target}`),
  );
  assert.deepEqual(await snapshot(), before);
  assert.match(
    (
      await failure(
        run(
          state.root,
          'bash',
          ['deploy_test_clean.sh', target, 'extra'],
          state.env,
        ),
      )
    ).stderr,
    /最多指定/,
  );
  assert.match(
    (await failure(deploy(state, {}, 'test'))).stderr,
    /不能将 test/,
  );
});

test('implicit test and detached HEAD targets fail before creating state or changing remotes', async (t) => {
  const state = await fixture(t);
  await git(state.root, 'checkout', 'test');
  assert.match((await failure(deploy(state, {}, null))).stderr, /不能将 test/);
  await git(state.root, 'checkout', '--detach', state.seed);
  assert.match(
    (await failure(deploy(state, {}, null))).stderr,
    /detached HEAD/,
  );
  assert.equal(await head(state, 'origin'), state.seed);
  assert.equal(await head(state, 'gitlab'), state.seed);
  assert.equal(await git(state.root, 'rev-parse', 'HEAD'), state.seed);
  assert.equal(
    await fs.stat(path.join(state.root, '.git/nuwax-deploy')).then(
      () => true,
      () => false,
    ),
    false,
  );
});

test('real submodule upgrades and pins are committed only on target; child file edits are protected', async (t) => {
  const state = await fixture(t);
  const upstream = path.join(state.temporary, 'micro-app');
  await fs.mkdir(upstream);
  await git(upstream, 'init', '-b', 'main');
  await git(upstream, 'config', 'user.name', 'Fixture');
  await git(upstream, 'config', 'user.email', 'fixture@example.invalid');
  await write(upstream, 'app.txt', 'initial app\n');
  await git(upstream, 'add', '.');
  await git(upstream, 'commit', '-m', 'v1');
  const v1 = await git(upstream, 'rev-parse', 'HEAD');
  await git(
    state.root,
    'submodule',
    'add',
    '-b',
    'main',
    upstream,
    'submodules/app',
  );
  await write(
    state.root,
    'micro-frontends/apps.json',
    JSON.stringify([
      { id: 'repo', adapter: 'micro-frontends/repo/adapter.json' },
    ]),
  );
  await write(
    state.root,
    'micro-frontends/repo/adapter.json',
    JSON.stringify({
      name: 'fixture-repo',
      appName: 'fixture-repo',
      sourceDir: 'submodules/app',
      branch: 'main',
      pin: v1,
      patch: 'adapter.patch',
      overlay: 'overlay',
      entry: '/micro-apps/repo/index.html',
      assetBase: '/micro-apps/repo/',
      businessBase: '/repo',
    }),
  );
  await write(
    state.root,
    'micro-frontends/repo/adapter.patch',
    'diff --git a/host.txt b/host.txt\nnew file mode 100644\n--- /dev/null\n+++ b/host.txt\n@@ -0,0 +1 @@\n+adapter host\n',
  );
  await write(state.root, 'micro-frontends/repo/overlay/.gitkeep', '');
  await git(state.root, 'add', '.');
  await git(state.root, 'commit', '-m', 'fixture register app');
  await publish(
    state,
    'origin',
    target,
    await git(state.root, 'rev-parse', 'HEAD'),
  );
  await publish(
    state,
    'gitlab',
    target,
    await git(state.root, 'rev-parse', 'HEAD'),
  );
  await write(upstream, 'app.txt', 'remote app update\n');
  await git(upstream, 'commit', '-am', 'v2');
  const v2 = await git(upstream, 'rev-parse', 'HEAD');
  await write(state.root, 'submodules/app/app.txt', 'child WIP\n');
  assert.match((await failure(deploy(state))).stderr, /子模块.*未提交文件修改/);
  assert.equal(
    await fs.readFile(path.join(state.root, 'submodules/app/app.txt'), 'utf8'),
    'child WIP\n',
  );
  await git(path.join(state.root, 'submodules/app'), 'restore', 'app.txt');
  await deploy(state);
  const source = await head(state, 'origin', target);
  const artifact = await head(state, 'origin');
  assert.equal(
    JSON.parse(await show(state, source, 'micro-frontends/repo/adapter.json'))
      .pin,
    v2,
  );
  assert.match(
    await git(state.root, 'ls-tree', source, 'submodules/app'),
    new RegExp(v2),
  );
  assert.equal(await show(state, artifact, 'dist/app-pin.txt'), v2);
  assert.equal(
    await git(
      state.root,
      'diff',
      '--name-only',
      source,
      artifact,
      '--',
      '.',
      ' :(exclude)dist'.trim(),
    ),
    '',
  );
});
