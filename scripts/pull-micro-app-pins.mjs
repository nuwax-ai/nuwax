/**
 * 把已登记微应用的远端 main 最新提交拉到本地，并同时写入 gitlink 与 adapter.pin。
 * 只接受相对当前 gitlink 的快进，不把指针退回更旧的提交。
 * 会暂存这两处，不提交、不推送。
 *
 * 用法：pnpm pull:micro-app-pins
 *       pnpm pull:micro-app-pins -- repo
 *       pnpm pull:micro-app-pins -- message
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
  git(root, ['add', '--', sourceDir, adapterPath]);

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
};

const wanted = process.argv.slice(2).filter((arg) => arg !== '--');
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

for (const app of apps) {
  pullApp(app.id, app.adapter);
}
console.log('[pull-pins] 已暂存 gitlink 与 adapter.pin，尚未提交。');
