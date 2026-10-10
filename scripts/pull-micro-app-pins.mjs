/**
 * 把已登记微应用的远端 main 最新提交拉到本地，并同时写入 gitlink 与 adapter.pin。
 * 只接受相对当前 gitlink 的快进，不把指针退回更旧的提交。
 * 补丁若不能直接贴到这份新源码上，就按三方合并重算 adapter.patch 并一起暂存。
 * 同一处被两边改过、合并不了时停止，不猜测冲突结果。
 * 不提交、不推送。
 * 在线执行时先 git submodule update --init 检出全部子模块，再逐个刷新 pin，
 * 因此这一个命令就能把所有微应用代码落到本地。
 *
 * 离线模式（--offline 或环境变量 MICRO_APP_PINS_OFFLINE=1）：
 * 镜像构建/CI/离线交付机访问不了远端（无凭证、无网络），跳过远端刷新，
 * 只校验 adapter.pin 与 gitlink 一致、适配补丁能贴到已检出的提交上，
 * 校验不过仍报错停止（fail fast），不改动任何文件。
 * 需要刷新 pin 时，在有凭证的开发机上正常执行本脚本后提交结果。
 *
 * 用法：pnpm pull:micro-app-pins
 *       pnpm pull:micro-app-pins -- repo
 *       pnpm pull:micro-app-pins -- message
 *       pnpm pull:micro-app-pins -- --offline
 *       MICRO_APP_PINS_OFFLINE=1 pnpm pull:micro-app-pins
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 离线模式：镜像构建/CI/离线交付机没有远端凭证与网络，跳过远端刷新只做本地校验。
const offline =
  process.argv.includes('--offline') ||
  ['1', 'true'].includes(
    String(process.env.MICRO_APP_PINS_OFFLINE ?? '').toLowerCase(),
  );

/**
 * 在指定目录执行 git，返回去掉首尾空白的标准输出。
 *
 * @param cwd 工作目录
 * @param args git 参数
 * @returns 命令输出
 */
const git = (cwd, args) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

/**
 * 判断 ancestor 是否为 descendant 的祖先（含两者相同）。
 *
 * @param cwd 子模块目录
 * @param ancestor 较早的提交
 * @param descendant 较新的提交
 * @returns 是否为祖先关系
 */
const isAncestor = (cwd, ancestor, descendant) => {
  try {
    git(cwd, ['merge-base', '--is-ancestor', ancestor, descendant]);
    return true;
  } catch {
    return false;
  }
};

/**
 * 读取主仓索引里的 gitlink。构建用的就是这一份，不是子模块工作区 HEAD。
 *
 * @param sourceDir 子模块路径
 * @returns 40 位提交号
 */
const readGitlink = (sourceDir) => {
  const line = git(root, ['ls-files', '--stage', '--', sourceDir]);
  const match = line.match(/^160000 ([a-f0-9]{40}) 0\t/);
  if (!match) {
    throw new Error(`${sourceDir} 没有登记 gitlink，请先 git submodule update --init`);
  }
  return match[1];
};

/**
 * 只替换 pin 字段，保留 adapter.json 的其余内容。
 *
 * @param file adapter.json 路径
 * @param nextPin 新的提交号
 */
const writePin = (file, nextPin) => {
  const text = readFileSync(file, 'utf8');
  const current = JSON.parse(text).pin;
  if (typeof current !== 'string' || !/^[a-f0-9]{40}$/.test(current)) {
    throw new Error(`${file} 的 pin 不是 40 位提交号`);
  }
  if (current === nextPin) {
    return;
  }
  const replaced = text.replace(
    new RegExp(`("pin"\\s*:\\s*")${current}(")`),
    `$1${nextPin}$2`,
  );
  if (replaced === text) {
    throw new Error(`${file} 未能写回 pin`);
  }
  writeFileSync(file, replaced);
};

/**
 * 执行命令。失败时抛出 stderr，便于看到 git apply 对不上的文件。
 *
 * @param command 可执行文件
 * @param args 参数
 * @param options.cwd 工作目录
 * @param options.input 标准输入
 * @param options.encoding 输出编码；二进制归档不传
 * @returns spawn 结果
 */
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    input: options.input,
    encoding: options.encoding,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const detail = `${result.stderr || ''}${result.stdout || ''}`.trim();
    throw new Error(detail || `${command} ${args.join(' ')} 失败`);
  }
  return result;
};

/**
 * 构建使用的是空仓库里的 git apply --check，这里用同样方式判断补丁能否直接贴上。
 *
 * @param source 子模块目录
 * @param commit 要贴补丁的提交
 * @param patchFile 补丁绝对路径
 * @returns 能否直接应用
 */
const patchApplies = (source, commit, patchFile) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'nuwax-patch-check-'));
  try {
    const archive = run('git', ['archive', '--format=tar', commit], {
      cwd: source,
    });
    run('tar', ['-xf', '-'], { cwd: dir, input: archive.stdout });
    run('git', ['init', '--quiet', '--template='], { cwd: dir });
    run('git', ['apply', '--check', patchFile], { cwd: dir });
    return true;
  } catch {
    return false;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

/**
 * 在仍保留旧文件版本的子仓里三方合并补丁，再导出相对新提交的 diff。
 * 构建目录是新建的空仓库，没有这些旧版本，所以不能在那边重算。
 *
 * @param id 应用 id
 * @param source 子模块目录
 * @param commit 新的 main 提交
 * @param patchFile 当前补丁
 * @returns 重算后的补丁内容
 */
const rebasePatch = (id, source, commit, patchFile) => {
  const parent = mkdtempSync(path.join(tmpdir(), 'nuwax-patch-rebase-'));
  const work = path.join(parent, 'work');
  try {
    run('git', ['worktree', 'add', '--detach', '--quiet', work, commit], {
      cwd: source,
    });
    try {
      run('git', ['apply', '--3way', patchFile], { cwd: work });
    } catch (error) {
      const conflicts = spawnSync(
        'git',
        ['diff', '--name-only', '--diff-filter=U'],
        { cwd: work, encoding: 'utf8' },
      ).stdout;
      const files = (conflicts || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      throw new Error(
        `${id} 的适配补丁无法自动合并到 ${commit.slice(0, 9)}。` +
          (files.length ? `\n冲突文件：\n${files.join('\n')}` : '') +
          `\n${error instanceof Error ? error.message : ''}`,
      );
    }
    run('git', ['add', '-A'], { cwd: work });
    const diff = run(
      'git',
      ['diff', '--cached', '--binary', '--find-renames'],
      { cwd: work, encoding: 'utf8' },
    );
    const text = diff.stdout.endsWith('\n') ? diff.stdout : `${diff.stdout}\n`;
    return Buffer.from(text);
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', work], {
      cwd: source,
      stdio: 'ignore',
    });
    rmSync(parent, { recursive: true, force: true });
  }
};

/**
 * 补丁能直接贴上就保持原文件。贴不上则重算；重算结果仍贴不上时恢复原文件并停止。
 *
 * @param id 应用 id
 * @param source 子模块目录
 * @param commit 新的 main 提交
 * @param patchFile 补丁绝对路径
 * @returns 是否写回了新补丁
 */
const refreshAdapterPatch = (id, source, commit, patchFile) => {
  if (patchApplies(source, commit, patchFile)) {
    console.log(
      `[pull-pins] ${id}: 适配补丁可直接应用到 ${commit.slice(0, 9)}`,
    );
    return false;
  }
  const original = readFileSync(patchFile);
  const next = rebasePatch(id, source, commit, patchFile);
  if (next.equals(original)) {
    throw new Error(
      `${id} 的适配补丁无法直接应用到 ${commit.slice(0, 9)}，三方合并也没有产生新补丁`,
    );
  }
  writeFileSync(patchFile, next);
  if (!patchApplies(source, commit, patchFile)) {
    writeFileSync(patchFile, original);
    throw new Error(
      `${id} 重算后的适配补丁仍无法直接应用到 ${commit.slice(0, 9)}，已恢复原补丁`,
    );
  }
  console.log(`[pull-pins] ${id}: 适配补丁已按 ${commit.slice(0, 9)} 重算`);
  return true;
};

/**
 * 拉取一个应用的远端 main，快进 gitlink，并把 pin 写成同一个提交号。
 *
 * @param id 应用 id，仅用于输出
 * @param adapterPath adapter.json 相对路径
 */
const pullApp = (id, adapterPath) => {
  const adapterFile = path.join(root, adapterPath);
  const adapter = JSON.parse(readFileSync(adapterFile, 'utf8'));
  const sourceDir = adapter.sourceDir;
  const source = path.join(root, sourceDir);
  const gitlink = readGitlink(sourceDir);
  const toplevel = git(source, ['rev-parse', '--show-toplevel']);
  if (path.resolve(toplevel) !== path.resolve(source)) {
    throw new Error(
      `${id} 的 ${sourceDir} 不是独立 Git 仓库，当前命令落到了 ${toplevel}。镜像构建里没有子模块检出，不能在这里拉取远端；请在本机初始化子模块后单独执行 pnpm pull:micro-app-pins。`,
    );
  }

  if (offline) {
    const pinned = adapter.pin;
    if (typeof pinned !== 'string' || !/^[a-f0-9]{40}$/.test(pinned)) {
      throw new Error(`${adapterFile} 的 pin 不是 40 位提交号`);
    }
    if (pinned !== gitlink) {
      throw new Error(
        `${id} 离线模式：adapter.pin ${pinned.slice(0, 9)} 与 gitlink ${gitlink.slice(
          0,
          9,
        )} 不一致，请在有网络的开发机执行 pnpm pull:micro-app-pins 对齐后提交`,
      );
    }
    const patchFile = path.resolve(path.dirname(adapterFile), adapter.patch);
    if (!patchApplies(source, gitlink, patchFile)) {
      throw new Error(
        `${id} 离线模式：适配补丁无法应用到已检出的 ${gitlink.slice(
          0,
          9,
        )}，后续构建同样会失败；请在有网络的开发机重算补丁后提交`,
      );
    }
    console.log(
      `[pull-pins] ${id}: 离线模式，跳过远端刷新，沿用已检出的 pin ${gitlink.slice(0, 9)}`,
    );
    return false;
  }

  git(source, [
    'fetch',
    '--no-tags',
    '--recurse-submodules=no',
    'origin',
    '+refs/heads/main:refs/remotes/origin/main',
  ]);
  const remote = git(source, ['rev-parse', 'refs/remotes/origin/main^{commit}']);

  if (!isAncestor(source, gitlink, remote)) {
    throw new Error(
      `${id} 远端 main ${remote.slice(0, 9)} 不是本地 gitlink ${gitlink.slice(
        0,
        9,
      )} 的快进，已停止，避免把指针退回旧提交`,
    );
  }

  if (remote !== gitlink) {
    const status = git(source, ['status', '--porcelain', '--untracked-files=no']);
    if (status) {
      throw new Error(`${id} 子模块工作区有未提交改动，请先处理后再拉取：\n${status}`);
    }
    git(source, [
      'checkout',
      '--detach',
      '--no-overwrite-ignore',
      '--no-recurse-submodules',
      remote,
    ]);
  }

  writePin(adapterFile, remote);
  const patchFile = path.resolve(path.dirname(adapterFile), adapter.patch);
  const patchRefreshed = refreshAdapterPatch(id, source, remote, patchFile);
  const stagePaths = [sourceDir, adapterPath];
  if (patchRefreshed) {
    stagePaths.push(path.relative(root, patchFile));
  }
  git(root, ['add', '--', ...stagePaths]);

  const pinned = JSON.parse(readFileSync(adapterFile, 'utf8')).pin;
  const linked = readGitlink(sourceDir);
  if (pinned !== remote || linked !== remote) {
    throw new Error(`${id} 写入后 gitlink 与 pin 仍不一致`);
  }
  console.log(
    `[pull-pins] ${id}: gitlink ${gitlink.slice(0, 9)} / pin ${String(
      adapter.pin,
    ).slice(0, 9)} -> ${remote.slice(0, 9)}`,
  );
  return patchRefreshed;
};

const wanted = process.argv
  .slice(2)
  .filter((arg) => arg !== '--' && arg !== '--offline');
const registry = JSON.parse(
  readFileSync(path.join(root, 'micro-frontends/apps.json'), 'utf8'),
);
const apps = wanted.length
  ? registry.filter((item) => wanted.includes(item.id))
  : registry;
if (wanted.length && apps.length !== wanted.length) {
  throw new Error(
    `未知应用：${wanted.join(', ')}。可选 ${registry.map((item) => item.id).join('、')}`,
  );
}

if (!offline) {
  // 先把登记的子模块检出到 gitlink：本命令负责把所有微应用代码拉到本地。
  git(root, ['submodule', 'update', '--init']);
}

let refreshedPatch = false;
for (const app of apps) {
  refreshedPatch = pullApp(app.id, app.adapter) || refreshedPatch;
}
if (offline) {
  console.log('[pull-pins] 离线模式完成：未访问远端，未改动任何文件。');
} else if (refreshedPatch) {
  console.log(
    '[pull-pins] 已暂存 gitlink、adapter.pin，以及本次重算过的适配补丁。尚未提交。',
  );
} else {
  console.log(
    '[pull-pins] 已暂存 gitlink 与 adapter.pin。适配补丁可直接应用，尚未提交。',
  );
}
