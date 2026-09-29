import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  acquireMicroAppLock,
  adapterFingerprint,
  getPinnedSource,
  readMicroAppRegistry,
  runCommand,
  snapshotAdapter,
} from './sync-micro-apps.mjs';

const scriptRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const repoRelative = (root, file) =>
  path.relative(root, file).split(path.sep).join('/');

export const upgradeUsage = `用法：npm run upgrade:micro-apps -- <message|repo|all> [选项]

  message / repo             升级单个应用到远程 main
  all / --all                升级全部已登记应用
  --app <id>                 与位置参数选择应用等价
  --dry-run                  fetch 和预检，不改变 HEAD、pin 或 index
  --ref <SHA或ref>            单应用选择 main 历史中的快进提交
  --allow-overlay-changes    人工审查后允许上游 overlay 同名文件变化
  -h / --help                查看帮助

成功升级只暂存所选 gitlink 和 adapter.json；不会 commit、push 或构建。
升级后运行 npm run build:prod 生成完整 dist，再进行功能验收。`;

export function parseUpgradeArguments(argv) {
  const options = { dryRun: false, allowOverlayChanges: false };
  const setTarget = (target) => {
    if (options.target) throw new Error('只能指定一个应用或 all');
    options.target = target;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const next = argv[++i];
      if (!next || next.startsWith('-')) throw new Error(`${arg} 缺少参数`);
      return next;
    };
    if (arg === '--') continue;
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--allow-overlay-changes')
      options.allowOverlayChanges = true;
    else if (arg === '--ref') options.ref = value();
    else if (arg === '--app') setTarget(value());
    else if (arg === '--all') setTarget('all');
    else if (arg.startsWith('-')) throw new Error(`未知选项：${arg}`);
    else setTarget(arg);
  }
  if (options.help) return options;
  if (!options.target) throw new Error('请明确选择 message、repo 或 all');
  if (options.ref && options.target === 'all')
    throw new Error('--ref 仅支持单个应用');
  return options;
}

async function indexEntry(git, root, file) {
  const line = await git(root, ['ls-files', '--stage', '--', file]);
  const match = line.match(/^(\d{6}) ([a-f0-9]{40}) 0\t(.+)$/);
  if (!match || match[3] !== file)
    throw new Error(`${file} 缺少唯一 stage 0 index 条目`);
  return { path: file, mode: match[1], oid: match[2] };
}

async function branchOf(git, source) {
  try {
    return await git(source, ['symbolic-ref', '--quiet', 'HEAD']);
  } catch (error) {
    if (error.exitCode !== 1) throw error;
    return null;
  }
}

async function assertClean(git, cwd, paths, label) {
  const status = await git(cwd, [
    'status',
    '--porcelain',
    '--untracked-files=all',
    '--ignore-submodules=none',
    '--',
    ...paths,
  ]);
  if (status)
    throw new Error(
      `${label} 有未提交/暂存或未跟踪改动，请先保留并处理：\n${status}`,
    );
}

/** 允许前一轮升级留下的配对 pin；其它 staged/dirty 适配仍拒绝。 */
async function assertSourceAndAdapterReady(git, root, app, execute) {
  const adapterPath = repoRelative(root, app.adapterPath);
  const status = await git(root, [
    'status',
    '--porcelain',
    '--untracked-files=all',
    '--ignore-submodules=none',
    '--',
    app.adapter.sourceDir,
    repoRelative(root, app.adapterRoot),
  ]);
  if (!status) return;
  const invalid = () =>
    new Error(
      `${app.id} 来源与适配有未提交/暂存或未跟踪改动，仅允许已配对的 gitlink/pin 暂存升级：\n${status}`,
    );
  const allowed = new Set([app.adapter.sourceDir, adapterPath]);
  const changes = status.split('\n');
  if (
    changes.length !== 2 ||
    changes.some(
      (line) => line.slice(0, 3) !== 'M  ' || !allowed.has(line.slice(3)),
    )
  )
    throw invalid();
  const tree = await git(root, ['ls-tree', 'HEAD', '--', ...allowed]);
  const entries = [...tree.matchAll(/^(\d{6}) (\w+) ([a-f0-9]{40})\t(.+)$/gm)];
  const source = entries.find((entry) => entry[4] === app.adapter.sourceDir);
  const adapter = entries.find((entry) => entry[4] === adapterPath);
  const stagedSource = await indexEntry(git, root, app.adapter.sourceDir);
  const stagedAdapter = await indexEntry(git, root, adapterPath);
  if (
    source?.[1] !== '160000' ||
    source?.[2] !== 'commit' ||
    stagedSource.mode !== '160000' ||
    adapter?.[2] !== 'blob' ||
    stagedAdapter.mode !== adapter?.[1]
  )
    throw invalid();
  const original = await execute('git', ['show', `HEAD:${adapterPath}`], {
    cwd: root,
    capture: true,
    trim: false,
  });
  const current = await fs.readFile(app.adapterPath, 'utf8');
  if (JSON.parse(original).pin !== source[3]) throw invalid();
  if (current !== updatedAdapter(original, source[3], stagedSource.oid))
    throw invalid();
}

async function writeReceipt(directory, receipt) {
  const target = path.join(directory, 'receipt.json');
  const temporary = target + '.tmp';
  await fs.writeFile(temporary, JSON.stringify(receipt, null, 2) + '\n');
  await fs.rename(temporary, target);
  return target;
}

/** 同目录 rename，写入失败时原文件保持完整；不覆盖期间产生的编辑。 */
async function replaceAdapter(file, expected, contents) {
  const temporary = path.join(
    path.dirname(file),
    `.${path.basename(file)}.upgrade-${randomUUID()}`,
  );
  const mode = (await fs.stat(file)).mode & 0o777;
  try {
    await fs.writeFile(temporary, contents, { mode, flag: 'wx' });
    if ((await fs.readFile(file, 'utf8')) !== expected)
      throw new Error(`${file} 在写入期间发生变化，保留当前内容`);
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

/** 保留 JSON 原有格式，只替换唯一的 pin 字段。 */
function updatedAdapter(contents, oldPin, newPin) {
  const matches = [...contents.matchAll(/("pin"\s*:\s*")([a-f0-9]{40})(")/g)];
  if (matches.length !== 1 || matches[0][2] !== oldPin)
    throw new Error('adapter pin 字段不唯一或已发生变化');
  return contents.replace(
    /("pin"\s*:\s*")[a-f0-9]{40}(")/,
    (_, start, end) => `${start}${newPin}${end}`,
  );
}

async function overlayChanges(git, state, snapshot) {
  const prefix = state.app.adapter.projectDir
    ? state.app.adapter.projectDir + '/'
    : '';
  const overlayFiles = snapshot.fingerprint.files
    .slice(2)
    .map((file) => prefix + file.slice(state.app.adapter.overlay.length + 1));
  if (!overlayFiles.length || state.oldPin === state.newPin) return [];
  const patch = await fs.readFile(snapshot.snapshot.patch, 'utf8');
  // 当前 Vite 原配置通过纯 rename 留在 upstream 文件，不被 overlay 覆盖。
  const preserved = new Set(
    [
      ...patch.matchAll(
        /similarity index 100%\nrename from ([^\n]+)\nrename to ([^\n]+)/g,
      ),
    ]
      .filter((match) => !overlayFiles.includes(match[2]))
      .map((match) => match[1]),
  );
  const files = await git(state.app.source, [
    'diff',
    '--name-only',
    '-z',
    '--no-renames',
    state.oldPin,
    state.newPin,
    '--',
    ...overlayFiles,
  ]);
  return files.split('\0').filter((file) => file && !preserved.has(file));
}

async function rollback(states, git, root) {
  const errors = [];
  const attempt = async (label, task) => {
    try {
      await task();
    } catch (error) {
      errors.push(`${label}: ${error.message}`);
    }
  };
  for (const state of [...states].reverse()) {
    if (!state.touched) continue;
    await attempt(`${state.app.id} adapter`, async () => {
      const contents = await fs.readFile(state.app.adapterPath, 'utf8');
      if (contents !== state.oldAdapter && contents !== state.newAdapter)
        throw new Error('文件已被另外修改，保留当前内容');
      await replaceAdapter(state.app.adapterPath, contents, state.oldAdapter);
    });
    await attempt(`${state.app.id} HEAD`, async () => {
      const current = await git(state.app.source, ['rev-parse', 'HEAD']);
      if (![state.head, state.newPin].includes(current))
        throw new Error('HEAD 已被另外修改，保留当前状态');
      if (
        state.branch &&
        (await git(state.app.source, ['rev-parse', state.branch])) !==
          state.head
      )
        throw new Error('原分支 ref 已变化，保留当前状态');
      const target = state.branch
        ? state.branch.replace(/^refs\/heads\//, '')
        : state.head;
      await git(state.app.source, [
        'checkout',
        '--no-overwrite-ignore',
        '--no-recurse-submodules',
        ...(!state.branch ? ['--detach'] : []),
        target,
      ]);
    });
    for (const entry of state.index) {
      await attempt(`${state.app.id} index ${entry.path}`, async () => {
        const current = await indexEntry(git, root, entry.path);
        const owned =
          entry.path === state.app.adapter.sourceDir
            ? state.newPin
            : state.newAdapterOid;
        if (
          current.mode !== entry.mode ||
          (current.oid !== entry.oid && current.oid !== owned)
        )
          throw new Error('index 已被另外修改，保留当前条目');
        await git(root, [
          'update-index',
          '--cacheinfo',
          entry.mode,
          entry.oid,
          entry.path,
        ]);
      });
    }
  }
  return errors;
}

export async function upgradeMicroApps({
  root: inputRoot = scriptRoot,
  target,
  dryRun = false,
  ref,
  allowOverlayChanges = false,
  execute = runCommand,
  log = console.info,
  signal,
} = {}) {
  const root = await fs.realpath(inputRoot);
  if (!target || (ref && target === 'all'))
    throw new Error('必须选择单个应用或 all；--ref 仅支持单个应用');
  const git = (cwd, args) => execute('git', args, { cwd, capture: true });
  const checked = async (cwd, args) => {
    signal?.throwIfAborted();
    return execute('git', args, {
      cwd,
      capture: true,
      signal,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
  };
  const sharedInputs = await Promise.all(
    ['.gitmodules', 'micro-frontends/apps.json'].map(async (file) => ({
      file,
      contents: await fs.readFile(path.join(root, file)),
    })),
  );
  const checkSharedInputs = async () => {
    for (const input of sharedInputs) {
      if (
        !(await fs.readFile(path.join(root, input.file))).equals(input.contents)
      )
        throw new Error(`${input.file} 预检期间发生变化，请重试`);
    }
  };
  const registry = await readMicroAppRegistry(root);
  const apps =
    target === 'all' ? registry : registry.filter((app) => app.id === target);
  if (!apps.length)
    throw new Error(
      `未知应用 ${target}；可选：${registry
        .map((app) => app.id)
        .join(', ')}、all`,
    );
  const cache = path.join(root, '.cache/micro-apps');
  const release = await acquireMicroAppLock(cache);
  let scratch;
  let receiptDir;
  let receipt;
  const states = [];
  try {
    await checkSharedInputs();
    await assertClean(
      git,
      root,
      ['.gitmodules', 'micro-frontends/apps.json'],
      '来源登记',
    );
    // 所有目标先检查本地状态，避免 all 在第二项有 WIP 时已操作第一项。
    for (const app of apps) {
      const top = await git(app.source, ['rev-parse', '--show-toplevel']).catch(
        () => '',
      );
      if (!top || (await fs.realpath(top)) !== (await fs.realpath(app.source)))
        throw new Error(
          `${app.id} 子模块未初始化；先 git submodule update --init --recursive -- ${app.adapter.sourceDir}`,
        );
      await assertClean(git, app.source, [], `${app.id} 子仓`);
      await assertSourceAndAdapterReady(git, root, app, execute);
      for (const marker of [
        'MERGE_HEAD',
        'rebase-merge',
        'rebase-apply',
        'CHERRY_PICK_HEAD',
        'REVERT_HEAD',
      ]) {
        const file = await git(app.source, ['rev-parse', '--git-path', marker]);
        if (
          await fs.access(path.resolve(app.source, file)).then(
            () => true,
            () => false,
          )
        )
          throw new Error(`${app.id} 有进行中的 Git 操作：${marker}`);
      }
      // main ref 可由下面的 fetch 补齐；这里先验证 index/pin、提交和来源。
      const source = await getPinnedSource(root, app, execute, {
        checkMainHistory: false,
      });
      const head = await git(app.source, ['rev-parse', 'HEAD']);
      if (head !== source.commit)
        throw new Error(`${app.id} 子仓 HEAD 偏离固定 gitlink，请先保留并处理`);
      const origin = await git(app.source, ['remote', 'get-url', 'origin']);
      const normalize = (url) => url.replace(/\/$/, '').replace(/\.git$/, '');
      if (normalize(origin) !== normalize(source.url))
        throw new Error(
          `${app.id} origin 与 .gitmodules 来源不一致，请先核对仓库身份`,
        );
      states.push({
        app,
        oldPin: source.commit,
        head,
        branch: await branchOf(git, app.source),
        oldAdapter: await fs.readFile(app.adapterPath, 'utf8'),
        fingerprint: (await adapterFingerprint(app)).sha256,
        index: await Promise.all(
          [app.adapter.sourceDir, repoRelative(root, app.adapterPath)].map(
            (file) => indexEntry(git, root, file),
          ),
        ),
      });
    }
    scratch = await fs.mkdtemp(path.join(cache, 'upgrade-check-'));
    for (const state of states) {
      const { app } = state;
      await checked(app.source, [
        'fetch',
        '--no-tags',
        '--recurse-submodules=no',
        'origin',
        '+refs/heads/main:refs/remotes/origin/main',
      ]);
      state.newPin = await checked(app.source, [
        'rev-parse',
        '--verify',
        '--end-of-options',
        `${ref || 'refs/remotes/origin/main'}^{commit}`,
      ]);
      try {
        await checked(app.source, [
          'merge-base',
          '--is-ancestor',
          state.oldPin,
          state.newPin,
        ]);
        await checked(app.source, [
          'merge-base',
          '--is-ancestor',
          state.newPin,
          'refs/remotes/origin/main',
        ]);
      } catch (cause) {
        throw new Error(
          `${app.id} 候选必须在 main 历史中且相对原 pin 为快进；不自动回退或接收分叉提交`,
          { cause },
        );
      }
      state.newAdapter = updatedAdapter(
        state.oldAdapter,
        state.oldPin,
        state.newPin,
      );
      const snapshot = await snapshotAdapter(
        app,
        path.join(scratch, app.id + '-adapter'),
      );
      const working = path.join(scratch, app.id);
      await fs.mkdir(working);
      const archive = path.join(scratch, app.id + '.tar');
      await checked(app.source, [
        'archive',
        '--format=tar',
        `--output=${archive}`,
        state.newPin,
      ]);
      await execute('tar', ['-xf', archive, '-C', working], {
        cwd: root,
        signal,
      });
      await checked(working, ['init', '--quiet']);
      try {
        await checked(working, ['apply', '--check', snapshot.snapshot.patch]);
      } catch (cause) {
        // 逐文件重放定位冲突文件，把「一句话报错」升级为可直接行动的诊断
        const conflicted = [];
        try {
          const patchText = await fs.readFile(
            snapshot.snapshot.patch,
            'utf8',
          );
          const files = [
            ...patchText.matchAll(/^diff --git a\/(\S+) b\/(\S+)$/gm),
          ].map((m) => m[2]);
          for (const file of files) {
            try {
              await checked(working, [
                'apply',
                '--check',
                `--include=${file}`,
                snapshot.snapshot.patch,
              ]);
            } catch {
              conflicted.push(file);
            }
          }
        } catch {
          /* 逐文件诊断失败不影响主报错 */
        }
        throw new Error(
          `${app.id} adapter patch 与候选 main 冲突，请先调整适配` +
            (conflicted.length
              ? `\n冲突文件（适配需基于新候选重制这些段）：\n${conflicted.join('\n')}`
              : '') +
            `\n上游：${state.oldPin.slice(0, 9)} -> ${state.newPin.slice(0, 9)}${state.oldPin === state.newPin ? '（本次为本地适配未重制，非上游前进）' : ''}` +
            `\n处置：微应用适配负责人基于新候选重制 adapter.patch 并随构建提交；` +
            `其他同事无需本地处理，拉取最新分支（dev/版本分支）后重跑构建即可。` +
            (cause?.stderr
              ? `\ngit apply 原始输出：\n${String(cause.stderr).trim()}`
              : ''),
          { cause },
        );
      }
      state.overlayChanged = await overlayChanges(checked, state, snapshot);
      if (state.overlayChanged.length && !allowOverlayChanges)
        throw new Error(
          `${app.id} 上游变更了 overlay 覆盖文件：\n${state.overlayChanged.join(
            '\n',
          )}\n请审查并同步适配；确认后可使用 --allow-overlay-changes`,
        );
      log(
        `[upgrade] ${app.id}: ${state.oldPin} -> ${state.newPin}${
          state.oldPin === state.newPin ? '（无变化）' : ''
        }`,
      );
      if (state.overlayChanged.length)
        log(
          `[upgrade] ${
            app.id
          } 已显式允许 overlay 上游变化：${state.overlayChanged.join(', ')}`,
        );
    }
    const summaries = states.map((state) => ({
      id: state.app.id,
      oldPin: state.oldPin,
      newPin: state.newPin,
      changed: state.oldPin !== state.newPin,
      overlayChanged: state.overlayChanged,
    }));
    if (dryRun) return { status: 'dry-run', apps: summaries };
    const changed = states.filter((state) => state.oldPin !== state.newPin);
    if (!changed.length) return { status: 'unchanged', apps: summaries };
    // 锁不能阻止手工编辑；写入前复核完整适配指纹、HEAD/分支与 index。
    await checkSharedInputs();
    await assertClean(
      git,
      root,
      ['.gitmodules', 'micro-frontends/apps.json'],
      '来源登记',
    );
    for (const state of states) {
      await assertClean(git, state.app.source, [], `${state.app.id} 子仓`);
      await assertSourceAndAdapterReady(git, root, state.app, execute);
      if (
        (await git(state.app.source, ['rev-parse', 'HEAD'])) !== state.head ||
        (await branchOf(git, state.app.source)) !== state.branch ||
        (await adapterFingerprint(state.app)).sha256 !== state.fingerprint
      )
        throw new Error(`${state.app.id} 预检后输入发生变化，请重试`);
      for (const entry of state.index) {
        if (
          JSON.stringify(await indexEntry(git, root, entry.path)) !==
          JSON.stringify(entry)
        )
          throw new Error(`${entry.path} 预检后 index 发生变化，请重试`);
      }
    }
    const history = path.join(cache, 'upgrades');
    await fs.mkdir(history, { recursive: true });
    receiptDir = await fs.mkdtemp(path.join(history, 'upgrade-'));
    receipt = {
      schemaVersion: 1,
      root,
      createdAt: new Date().toISOString(),
      status: 'applying',
      apps: [],
    };
    for (const state of changed) {
      const backup = state.app.id + '-adapter.before.json';
      await fs.writeFile(path.join(receiptDir, backup), state.oldAdapter);
      receipt.apps.push({
        ...summaries.find((item) => item.id === state.app.id),
        sourceDir: state.app.adapter.sourceDir,
        adapter: repoRelative(root, state.app.adapterPath),
        head: state.head,
        branch: state.branch,
        index: state.index,
        backup,
      });
    }
    await writeReceipt(receiptDir, receipt);
    for (const state of changed) {
      signal?.throwIfAborted();
      state.touched = true;
      await checked(state.app.source, [
        'checkout',
        '--detach',
        '--no-overwrite-ignore',
        '--no-recurse-submodules',
        state.newPin,
      ]);
      if (
        (await fs.readFile(state.app.adapterPath, 'utf8')) !== state.oldAdapter
      )
        throw new Error(`${state.app.id} adapter 在写入前变化`);
      await replaceAdapter(
        state.app.adapterPath,
        state.oldAdapter,
        state.newAdapter,
      );
      state.newAdapterOid = await checked(root, [
        'hash-object',
        state.app.adapterPath,
      ]);
    }
    await checked(root, [
      'add',
      '--',
      ...changed.flatMap((state) => [
        state.app.adapter.sourceDir,
        repoRelative(root, state.app.adapterPath),
      ]),
    ]);
    for (const state of changed) {
      const entry = await indexEntry(git, root, state.app.adapter.sourceDir);
      if (
        entry.oid !== state.newPin ||
        (await indexEntry(git, root, repoRelative(root, state.app.adapterPath)))
          .oid !== state.newAdapterOid
      )
        throw new Error(`${state.app.id} 新 pin 未正确写入 index`);
    }
    signal?.throwIfAborted();
    receipt.status = 'upgraded';
    const receiptPath = await writeReceipt(receiptDir, receipt);
    log(
      `[upgrade] 完成，所选 gitlink/adapter 已暂存。恢复记录：${receiptPath}`,
    );
    log(
      '[upgrade] 下一步：npm run build:prod，然后审查并验收；未执行 commit/push。',
    );
    return { status: 'upgraded', apps: summaries, receipt: receiptPath };
  } catch (cause) {
    const errors = await rollback(states, git, root);
    if (receipt) {
      receipt.status = errors.length ? 'rollback-failed' : 'rolled-back';
      receipt.error = cause.message;
      receipt.rollbackErrors = errors;
      try {
        await writeReceipt(receiptDir, receipt);
      } catch (error) {
        errors.push(`恢复记录写入失败：${error.message}`);
      }
    }
    if (errors.length)
      throw new Error(
        `${cause.message}\n部分恢复失败：\n${errors.join(
          '\n',
        )}\n恢复记录：${receiptDir}`,
        { cause },
      );
    if (states.some((state) => state.touched))
      throw new Error(
        `${cause.message}\n已恢复所选 HEAD、pin 和 index。恢复记录：${receiptDir}`,
        { cause },
      );
    throw cause;
  } finally {
    try {
      if (scratch) await fs.rm(scratch, { recursive: true, force: true });
    } finally {
      await release();
    }
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const controller = new AbortController();
  const interrupt = () => controller.abort(new Error('升级已中断'));
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    const options = parseUpgradeArguments(process.argv.slice(2));
    if (options.help) console.info(upgradeUsage);
    else {
      const result = await upgradeMicroApps({
        ...options,
        signal: controller.signal,
      });
      if (result.status === 'dry-run')
        console.info('[upgrade] dry-run 完成，未改变 HEAD、pin 或 index。');
      if (result.status === 'unchanged')
        console.info('[upgrade] 选中应用已是目标提交。');
    }
  } catch (error) {
    console.error(`[upgrade] ${error.message}`);
    process.exitCode = 1;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
}
