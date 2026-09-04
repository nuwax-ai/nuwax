/**
 * 升级资料库子应用（submodules/nuwax-repo-web）的 submodule pin 并重建产物。
 *
 * 用法：
 *   npm run upgrade:repo-web                     # 跟踪 origin/main 升到最新
 *   npm run upgrade:repo-web -- --ref <name>     # 指定分支/tag（如 --ref v1.2.0）
 *   npm run upgrade:repo-web -- --commit <sha>   # 精确 pin 到某 commit
 *   npm run upgrade:repo-web -- --skip-build     # 只动 pin 不重建产物
 *
 * 安全检查：子仓有本地改动时中止（防止 checkout 吞掉未提交修改）；已是最新时直接退出。
 * 默认不自动提交 gitlink（完成后打印待执行命令），保持升级提交的可审性。
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const subDir = resolve(root, 'submodules/nuwax-repo-web');

function run(cmd, args, options = {}) {
  const label = `[cmd] ${cmd} ${args.join(' ')}`;
  const res = spawnSync(cmd, args, {
    cwd: options.cwd ?? root,
    stdio: options.inherit ? 'inherit' : 'pipe',
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    if (res.error) console.error(res.error.message);
    if (!options.inherit) {
      console.error(res.stdout ?? '');
      console.error(res.stderr ?? '');
    }
    console.error(`[upgrade-repo-web] 命令失败（exit ${res.status}）：${label}`);
    process.exit(res.status ?? 1);
  }
  return res;
}

function output(cmd, args) {
  const res = spawnSync(cmd, args, { cwd: subDir, encoding: 'utf8' });
  return res.status === 0 ? res.stdout.trim() : '';
}

function argValue(name) {
  const i = process.argv.indexOf(name);
  if (i < 0) return undefined;
  const v = process.argv[i + 1];
  // fail-closed：显式选项缺值时中止，不静默回退 origin/main（否则"精确 pin"意图被替换）
  if (!v || v.startsWith('--')) {
    console.error(`[upgrade-repo-web] 选项 ${name} 缺少取值（当前值：${v ?? '无'}）。`);
    process.exit(1);
  }
  return v;
}

const skipBuild = process.argv.includes('--skip-build');
const explicitCommit = argValue('--commit');
const ref = argValue('--ref') ?? 'origin/main';

if (!existsSync(resolve(subDir, 'package.json'))) {
  console.log('[upgrade-repo-web] 子模块未初始化，执行 git submodule update --init ...');
  run('git', ['submodule', 'update', '--init', '--', 'submodules/nuwax-repo-web']);
}

// 安全检查：子仓本地改动会随 checkout 丢失，中止并提示
if (output('git', ['status', '--porcelain']) !== '') {
  console.error('[upgrade-repo-web] 子仓存在本地改动，请先处理（提交/stash）后再升级：');
  console.error(output('git', ['status', '--porcelain']));
  process.exit(1);
}

console.log(`[upgrade-repo-web] 拉取远端（git fetch origin --tags）...`);
run('git', ['fetch', 'origin', '--tags'], { cwd: subDir });

const current = output('git', ['rev-parse', 'HEAD']);
let target;
if (explicitCommit) {
  // 支持完整/短 sha：经 rev-parse --verify 解析（fetch 已完成，新对象可解析）
  const resolved = output('git', ['rev-parse', '--verify', `${explicitCommit}^{commit}`]);
  if (!/^[0-9a-f]{40}$/.test(resolved)) {
    console.error(`[upgrade-repo-web] --commit ${explicitCommit} 无法解析为子仓 commit。`);
    process.exit(1);
  }
  target = resolved;
} else {
  target = output('git', ['rev-parse', ref]);
  if (!/^[0-9a-f]{40}$/.test(target)) {
    console.error(`[upgrade-repo-web] 无法解析目标（ref=${ref}）：${target || '空'}`);
    process.exit(1);
  }
}

if (target === current) {
  console.log(`[upgrade-repo-web] 已是最新（${ref} = ${current.slice(0, 9)}），无需升级。`);
  process.exit(0);
}

// 展示两 pin 之间的变更，便于升级决策；区分前进/回退
const between = output('git', ['log', '--oneline', '--reverse', `HEAD..${target}`]);
const rollbackCount = Number(output('git', ['rev-list', '--count', `${target}..HEAD`]) || 0);
const targetDesc = explicitCommit ? `--commit ${explicitCommit.slice(0, 9)}` : ref;
if (rollbackCount > 0) {
  console.log(`[upgrade-repo-web] 注意：这是回退（丢弃当前 pin 之后的 ${rollbackCount} 个提交）。`);
}
console.log(`[upgrade-repo-web] 升级 ${current.slice(0, 9)} → ${target.slice(0, 9)}（${targetDesc}），新增 ${between ? between.split('\n').length : 0} 个提交：`);
console.log(between || '(无新增提交日志)');

run('git', ['checkout', '--detach', target], { cwd: subDir });
console.log(`[upgrade-repo-web] submodule pin 已更新。`);

if (!skipBuild) {
  console.log('[upgrade-repo-web] 重建产物（npm run sync:repo-web）...');
  run('npm', ['run', 'sync:repo-web'], { inherit: true });
}

console.log('[upgrade-repo-web] 完成。后续步骤（主仓提交 gitlink，建议单独提交）：');
console.log(`  git add submodules/nuwax-repo-web`);
console.log(`  git commit -m "chore(repo-web): bump submodule pin ${current.slice(0, 9)}..${target.slice(0, 9)}"`);
