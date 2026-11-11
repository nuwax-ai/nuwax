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

  message / repo             升级单个应用到登记分支的远程最新提交
  all / --all                升级全部已登记应用
  --app <id>                 与位置参数选择应用等价
  --dry-run                  fetch 和预检，不改变 HEAD、pin 或 index
  --ref <SHA或ref>            单应用选择登记分支历史中的快进提交
  --allow-overlay-changes    人工审查后允许上游 overlay 同名文件变化
  --no-rebase-patch          补丁贴不上时不要三方重算（默认会重算）
  -h / --help                查看帮助

成功升级只暂存所选 gitlink、adapter.json，以及本次重算过的 adapter.patch；
不会 commit、push 或构建。升级后运行 npm run build:prod 生成完整 dist，再进行功能验收。`;

export function parseUpgradeArguments(argv) {
  const options = {
    dryRun: false,
    allowOverlayChanges: false,
    rebasePatch: true,
  };
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
    else if (arg === '--no-rebase-patch') options.rebasePatch = false;
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

/**
 * 从补丁里去掉目标树上不存在、且不是新增文件的 diff。
 * 切换子模块分支时，旧分支独有文件不能再打到新分支上。
 * 新增文件（--- /dev/null）保留，它们是宿主补丁自己带进来的。
 *
 * @param {string} patch 完整 adapter.patch
 * @param {Iterable<string>} existingFiles 目标提交里的路径
 * @returns {{ patch: string, dropped: string[] }}
 */
export function omitUnavailablePatchFiles(patch, existingFiles) {
  const present = new Set(existingFiles);
  const dropped = [];
  const kept = [];
  for (const section of String(patch).split(/(?=^diff --git )/m)) {
    if (!section.startsWith('diff --git ')) {
      kept.push(section);
      continue;
    }
    const paths = section.match(/^diff --git a\/(\S+) b\/(\S+)/);
    const target = paths?.[2];
    // 纯重命名的 b/ 路径在目标树上本来就不存在。只要 a/ 还在，就要留下，
    // 让 overlay 能盖住原文件名（例如 vite.config.ts → vite.upstream.config.ts）。
    const renameFrom = section.match(/^rename from (\S+)/m)?.[1];
    if (renameFrom) {
      if (!present.has(renameFrom)) dropped.push(renameFrom);
      else kept.push(section);
      continue;
    }
    const isNewFile =
      /^new file mode /m.test(section) || /^--- \/dev\/null$/m.test(section);
    if (target && !isNewFile && !present.has(target)) {
      dropped.push(target);
      continue;
    }
    kept.push(section);
  }
  let text = kept.join('');
  if (text && !text.endsWith('\n')) text += '\n';
  return { patch: text, dropped };
}

/**
 * 三方冲突时保留远端一侧。
 * worktree 检出的是 adapter.json 所配分支的远端提交，git apply --3way
 * 的第一段（ours / HEAD）就是这份远端代码。只替换冲突段，已经贴上的宿主适配保留。
 *
 * @param {string} source 带冲突标记的文件文本
 * @returns {string} 冲突段改为远端代码后的文本
 */
export function keepRemoteConflictSides(source) {
  const markerCount = source.match(/^<<<<<<< /gm)?.length ?? 0;
  if (markerCount === 0) return source;
  let resolvedCount = 0;
  const resolved = source.replace(
    /^<<<<<<< (?:ours|HEAD)\r?\n([\s\S]*?)^=======\r?\n[\s\S]*?^>>>>>>> [^\n]+\r?\n/gm,
    (_match, remoteSide) => {
      resolvedCount += 1;
      return remoteSide;
    },
  );
  if (resolvedCount !== markerCount || /^<<<<<<< |^>>>>>>> /m.test(resolved)) {
    throw new Error('补丁冲突标记无法按远端代码取舍');
  }
  return dropUnusedNamedImports(resolved);
}

/**
 * 冲突段取远端后，补丁加进来的 import 可能整段被丢掉，而后面能贴上的调用还在。
 * 这些名字仍被使用时把对应 import 补回去；没人用的不加，避免和「删掉无用导入」对着干。
 *
 * @param {string} source 冲突已经按远端取舍后的文件
 * @param {string} patchSection 该文件在补丁里的那一段
 * @returns {string}
 */
export function restoreUsedPatchImports(source, patchSection) {
  const added = String(patchSection)
    .split('\n')
    .filter((line) => line.startsWith('+import ') || line.startsWith('+import{'))
    .map((line) => line.slice(1));
  let text = source.endsWith('\n') || source === '' ? source : `${source}\n`;
  for (const statement of added) {
    const names = importBindingNames(statement).filter((name) => {
      const body = text
        .split('\n')
        .filter((line) => !line.startsWith('import ') && !line.startsWith('import{'))
        .join('\n');
      if (!new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(body))
        return false;
      return !new RegExp(
        `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      ).test(importLines(text));
    });
    if (!names.length || text.includes(statement)) continue;
    text = insertImport(text, narrowImport(statement, names));
  }
  return text;
}

function importLines(source) {
  return source
    .split('\n')
    .filter((line) => line.startsWith('import ') || line.startsWith('import{'))
    .join('\n');
}

function importBindingNames(statement) {
  const named = statement.match(/\{([^}]+)\}/);
  if (named) {
    return named[1]
      .split(',')
      .map((part) => part.trim().split(/\s+as\s+/).pop().trim())
      .filter(Boolean);
  }
  const fallback = statement.match(/^import\s+(?!type\b)([A-Za-z_$][\w$]*)\s+from\b/);
  return fallback ? [fallback[1]] : [];
}

function narrowImport(statement, names) {
  if (!statement.includes('{')) return statement;
  return statement.replace(/\{[^}]+\}/, `{ ${names.join(', ')} }`);
}

function insertImport(source, statement) {
  const lines = source.split('\n');
  let lastImport = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (/^import[\s{]/.test(lines[index])) lastImport = index;
    else if (lastImport >= 0 && lines[index].trim() !== '') break;
  }
  lines.splice(lastImport + 1, 0, statement);
  return lines.join('\n');
}

function patchSectionFor(patch, file) {
  return (
    String(patch)
      .split(/(?=^diff --git )/m)
      .find((section) => {
        const paths = section.match(/^diff --git a\/(\S+) b\/(\S+)/);
        return paths?.[1] === file || paths?.[2] === file;
      }) ?? ''
  );
}

/** 冲突段改回远端后，补丁引进但已不再使用的具名导入删掉，避免产物编译报未使用。 */
function dropUnusedNamedImports(source) {
  return source.replace(
    /^import\s+(type\s+)?\{([^}]+)\}\s+from\s+(['"][^'"]+['"]);?[ \t]*\r?\n/gm,
    (line, typeKeyword, names, specifier) => {
      const parts = names
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      const elsewhere = source.replace(line, '\n');
      const used = parts.filter((part) => {
        const name = part.split(/\s+as\s+/).pop().trim();
        return new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(
          elsewhere,
        );
      });
      if (used.length === parts.length) return line;
      if (used.length === 0) return '';
      const typePrefix = typeKeyword || '';
      return `import ${typePrefix}{ ${used.join(', ')} } from ${specifier};\n`;
    },
  );
}

/** 子仓有旧 blob，空归档没有，贴不上时只能在 worktree 里三方重算。 */
async function rebasePatchOnto(
  execute,
  source,
  commit,
  patchFile,
  workParent,
  log = () => {},
) {
  await fs.mkdir(workParent, { recursive: true });
  const parent = await fs.mkdtemp(path.join(workParent, 'rebase-'));
  const work = path.join(parent, 'work');
  try {
    await execute(
      'git',
      ['worktree', 'add', '--detach', '--quiet', work, commit],
      { cwd: source, capture: true },
    );
    const listed = await execute(
      'git',
      ['ls-tree', '-r', '--name-only', commit],
      { cwd: source, capture: true },
    );
    const filtered = omitUnavailablePatchFiles(
      await fs.readFile(patchFile, 'utf8'),
      listed.split('\n').filter(Boolean),
    );
    if (filtered.dropped.length) {
      log(
        `[upgrade] 目标提交没有这些文件，已从补丁去掉：${filtered.dropped.join(
          ', ',
        )}`,
      );
    }
    const filteredPatch = path.join(parent, 'filtered.patch');
    await fs.writeFile(filteredPatch, filtered.patch);
    if (!/^diff --git /m.test(filtered.patch)) {
      return Buffer.from('');
    }
    try {
      await execute('git', ['apply', '--3way', filteredPatch], {
        cwd: work,
        capture: true,
      });
    } catch (applyError) {
      const unmerged = await execute(
        'git',
        ['diff', '--name-only', '--diff-filter=U'],
        { cwd: work, capture: true },
      );
      const files = unmerged
        .split('\n')
        .map((file) => file.trim())
        .filter(Boolean);
      if (!files.length) throw applyError;
      for (const file of files) {
        const fullPath = path.join(work, file);
        const text = await fs.readFile(fullPath, 'utf8');
        // 远端赢了冲突段之后，补丁里仍被调用的导入要补回，否则产物能贴上补丁但编不过。
        await fs.writeFile(
          fullPath,
          restoreUsedPatchImports(
            keepRemoteConflictSides(text),
            patchSectionFor(filtered.patch, file),
          ),
        );
      }
      log(
        `[upgrade] 补丁与远端冲突，冲突段采用配置分支远端代码：${files.join(
          ', ',
        )}`,
      );
    }
    await execute(
      'git',
      ['add', '-A', '--', '.', ':(exclude)*.rej', ':(exclude)*.orig'],
      { cwd: work, capture: true },
    );
    const diff = await execute(
      'git',
      ['diff', '--cached', '--binary', '--find-renames'],
      { cwd: work, capture: true, trim: false },
    );
    return Buffer.from(diff.endsWith('\n') ? diff : `${diff}\n`);
  } finally {
    try {
      await execute('git', ['worktree', 'remove', '--force', work], {
        cwd: source,
        capture: true,
      });
    } catch {
      /* 预检失败也拆掉 worktree */
    }
    await fs.rm(parent, { recursive: true, force: true });
  }
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
  const gitmodulesState = states.find((state) => state.gitmodulesTouched);
  if (gitmodulesState) {
    await attempt('.gitmodules', async () => {
      const file = path.join(root, '.gitmodules');
      const contents = await fs.readFile(file);
      if (
        !contents.equals(gitmodulesState.oldGitmodules) &&
        !contents.equals(gitmodulesState.newGitmodules)
      )
        throw new Error('文件已被另外修改，保留当前内容');
      await fs.writeFile(file, gitmodulesState.oldGitmodules);
      await git(root, ['add', '--', '.gitmodules']);
    });
  }
  for (const state of [...states].reverse()) {
    if (!state.touched) continue;
    await attempt(`${state.app.id} adapter`, async () => {
      const contents = await fs.readFile(state.app.adapterPath, 'utf8');
      if (contents !== state.oldAdapter && contents !== state.newAdapter)
        throw new Error('文件已被另外修改，保留当前内容');
      await replaceAdapter(state.app.adapterPath, contents, state.oldAdapter);
    });
    await attempt(`${state.app.id} patch`, async () => {
      if (!state.oldPatch || !state.rebasedPatch) return;
      const contents = await fs.readFile(state.app.patch);
      if (
        !contents.equals(state.oldPatch) &&
        !contents.equals(state.rebasedPatch)
      )
        throw new Error('文件已被另外修改，保留当前内容');
      await fs.writeFile(state.app.patch, state.oldPatch);
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
            : entry.path === repoRelative(root, state.app.adapterPath)
            ? state.newAdapterOid
            : state.newPatchOid;
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
  rebasePatch = true,
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
      // 登记分支的 ref 可由下面的 fetch 补齐；这里先验证 index/pin、提交和来源。
      const source = await getPinnedSource(root, app, execute, {
        checkBranchHistory: false,
        // adapter.json 是登记的目标分支。.gitmodules 只是跟踪提示，名字不同就改过来，不在这里中止。
        followAdapterBranch: true,
      });
      if (source.recordedBranch !== app.adapter.branch)
        log(
          `[upgrade] ${app.id} .gitmodules 分支 ${source.recordedBranch} 与 adapter.branch ${app.adapter.branch} 不一致，按 adapter 改为 ${app.adapter.branch}`,
        );
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
        oldPatch: await fs.readFile(app.patch),
        recordedBranch: source.recordedBranch,
        moduleKey: source.moduleKey,
        fingerprint: (await adapterFingerprint(app)).sha256,
        index: await Promise.all(
          [
            app.adapter.sourceDir,
            repoRelative(root, app.adapterPath),
            repoRelative(root, app.patch),
          ].map((file) => indexEntry(git, root, file)),
        ),
      });
    }
    scratch = await fs.mkdtemp(path.join(cache, 'upgrade-check-'));
    for (const state of states) {
      const { app } = state;
      const branch = app.adapter.branch;
      const remoteRef = `refs/remotes/origin/${branch}`;
      await checked(app.source, [
        'fetch',
        '--no-tags',
        '--recurse-submodules=no',
        'origin',
        `+refs/heads/${branch}:${remoteRef}`,
      ]);
      state.newPin = await checked(app.source, [
        'rev-parse',
        '--verify',
        '--end-of-options',
        `${ref || remoteRef}^{commit}`,
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
          remoteRef,
        ]);
      } catch (cause) {
        const tip = await checked(app.source, [
          'rev-parse',
          '--verify',
          '--end-of-options',
          `${remoteRef}^{commit}`,
        ]);
        // --ref 可以指向分支上的旧提交或旁支。那种选择仍必须是快进，不能借分支切换绕过。
        // 没指定 ref、候选就是 adapter.branch 的远端尖端时，pin 不在这条历史上就是切换子模块分支：
        // 移到尖端并重算补丁，而不是把回退当成升级失败。
        if (ref || state.newPin !== tip) {
          throw new Error(
            `${app.id} 候选必须在 ${branch} 历史中且相对原 pin 为快进；不自动回退或接收分叉提交`,
            { cause },
          );
        }
        state.branchSwitch = true;
        log(
          `[upgrade] ${app.id} 按 ${branch} 切换子模块：当前 pin 不是 origin/${branch} 的快进，改到该分支尖端并重算适配补丁`,
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
        const conflicted = [];
        try {
          const patchText = await fs.readFile(snapshot.snapshot.patch, 'utf8');
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
        const fail = (extra = '') =>
          new Error(
            `${app.id} adapter patch 与候选 ${branch} 冲突，请先调整适配` +
              (conflicted.length
                ? `\n冲突文件（适配需基于新候选重制这些段）：\n${conflicted.join(
                    '\n',
                  )}`
                : '') +
              `\n上游：${state.oldPin.slice(0, 9)} -> ${state.newPin.slice(
                0,
                9,
              )}${
                state.oldPin === state.newPin
                  ? '（本次为本地适配未重制，非上游前进）'
                  : ''
              }` +
              extra +
              `\n处置：微应用适配负责人基于新候选重制 adapter.patch 并随构建提交；` +
              `其他同事无需本地处理，拉取最新分支（dev/版本分支）后重跑构建即可。` +
              (cause?.stderr
                ? `\ngit apply 原始输出：\n${String(cause.stderr).trim()}`
                : ''),
            { cause },
          );
        if (!rebasePatch) throw fail();
        try {
          const remade = await rebasePatchOnto(
            execute,
            app.source,
            state.newPin,
            snapshot.snapshot.patch,
            path.join(cache, 'patch-rebase'),
            log,
          );
          const remadePath = path.join(scratch, `${app.id}-rebased.patch`);
          await fs.writeFile(remadePath, remade);
          if (/^diff --git /m.test(remade.toString())) {
            await checked(working, ['apply', '--check', remadePath]);
          }
          state.rebasedPatch = remade;
        } catch (rebaseCause) {
          throw fail(
            `\n三方自动重算失败：${
              rebaseCause instanceof Error ? rebaseCause.message : rebaseCause
            }`,
          );
        }
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
          state.branchSwitch
            ? '（分支切换'
            : ''
        }${
          state.rebasedPatch
            ? `${state.branchSwitch ? '，' : '（'}适配补丁已自动重算）`
            : state.branchSwitch
            ? '）'
            : state.oldPin === state.newPin
            ? '（无变化）'
            : ''
        }${
          state.recordedBranch !== app.adapter.branch
            ? `（.gitmodules 分支 ${state.recordedBranch} -> ${app.adapter.branch}）`
            : ''
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
      patchRebased: Boolean(state.rebasedPatch),
      overlayChanged: state.overlayChanged,
    }));
    if (dryRun) return { status: 'dry-run', apps: summaries };
    const changed = states.filter(
      (state) =>
        state.oldPin !== state.newPin ||
        state.rebasedPatch ||
        state.recordedBranch !== state.app.adapter.branch,
    );
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
    const branchRecords = changed.filter(
      (state) => state.recordedBranch !== state.app.adapter.branch,
    );
    if (branchRecords.length) {
      const gitmodulesPath = path.join(root, '.gitmodules');
      const oldGitmodules = await fs.readFile(gitmodulesPath);
      for (const state of branchRecords) {
        await checked(root, [
          'config',
          '-f',
          '.gitmodules',
          `${state.moduleKey}.branch`,
          state.app.adapter.branch,
        ]);
      }
      const newGitmodules = await fs.readFile(gitmodulesPath);
      for (const state of branchRecords) {
        state.gitmodulesTouched = true;
        state.oldGitmodules = oldGitmodules;
        state.newGitmodules = newGitmodules;
      }
    }
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
      if (state.rebasedPatch) {
        await fs.writeFile(state.app.patch, state.rebasedPatch);
        state.newPatchOid = await checked(root, [
          'hash-object',
          state.app.patch,
        ]);
      }
    }
    await checked(root, [
      'add',
      '--',
      ...changed.flatMap((state) => [
        state.app.adapter.sourceDir,
        repoRelative(root, state.app.adapterPath),
        ...(state.rebasedPatch ? [repoRelative(root, state.app.patch)] : []),
      ]),
      ...(changed.some((state) => state.gitmodulesTouched)
        ? ['.gitmodules']
        : []),
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
