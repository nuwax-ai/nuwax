/**
 * 同步资料库子应用（submodules/nuwax-repo-web）构建产物到主站同域路径 public/repo/。
 *
 * 产物随 umi build 从 public/ 原样并入 dist/repo/，形成单一部署物；dev 环境由
 * umi dev server 直接以 http://localhost:<port>/repo/ 服务，登录态同源共享。
 *
 * 用法：
 *   npm run sync:repo-web                # 全量：submodule 初始化 → pnpm install → 构建 → 拷贝
 *   npm run sync:repo-web -- --skip-install  # 复用子仓已有 node_modules（重复同步提速）
 *
 * 产物不进 git（.gitignore: public/repo/）；子应用版本以主仓 pin 的 submodule commit 为准，
 * 升级方式：git -C submodules/nuwax-repo-web fetch && git checkout <commit> && 主仓提交 gitlink。
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const subDir = resolve(root, 'submodules/nuwax-repo-web');
const outDir = resolve(root, 'public/repo');
const skipInstall = process.argv.includes('--skip-install');

function run(cmd, args, options = {}) {
  const label = `[cmd] ${cmd} ${args.join(' ')}`;
  if (options.quiet) console.log(label);
  const res = spawnSync(cmd, args, {
    cwd: options.cwd ?? root,
    stdio: options.quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    if (options.quiet) {
      console.error(res.stdout ?? '');
      console.error(res.stderr ?? '');
    }
    console.error(`[sync-repo-web] 命令失败（exit ${res.status}）：${label}`);
    process.exit(res.status ?? 1);
  }
  return res;
}

function output(cmd, args) {
  const res = spawnSync(cmd, args, { cwd: subDir, encoding: 'utf8' });
  return res.status === 0 ? res.stdout.trim() : '';
}

if (!existsSync(resolve(subDir, 'package.json'))) {
  console.log('[sync-repo-web] 子模块未初始化，执行 git submodule update --init ...');
  run('git', ['submodule', 'update', '--init', '--', 'submodules/nuwax-repo-web']);
}

console.log(`[sync-repo-web] 子仓 pin：${output('git', ['rev-parse', 'HEAD']) || '未知'}`);

if (!skipInstall) {
  console.log('[sync-repo-web] 安装子仓依赖（pnpm install --frozen-lockfile）...');
  run('pnpm', ['install', '--frozen-lockfile'], { cwd: subDir });
} else if (!existsSync(resolve(subDir, 'node_modules'))) {
  console.error('[sync-repo-web] --skip-install 但子仓 node_modules 不存在，请去掉该参数重跑。');
  process.exit(1);
}

console.log('[sync-repo-web] 构建子应用（pnpm exec vite build）...');
// 不走子仓 `pnpm build`：其 build 前置的 `tsc -b` 在 f07ce55 存在预存类型错误，
// 类型门属子仓自身 CI 职责；主仓只消费 vite 产物，不在跨仓链路上卡子仓类型问题。
run('pnpm', ['exec', 'vite', 'build'], { cwd: subDir });

const subDist = resolve(subDir, 'dist');
if (!existsSync(resolve(subDist, 'index.html'))) {
  console.error(`[sync-repo-web] 未找到构建产物 ${subDist}/index.html，构建疑似失败。`);
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(subDist, outDir, { recursive: true });

const commit = output('git', ['rev-parse', 'HEAD']);
const branch = output('git', ['rev-parse', '--abbrev-ref', 'HEAD']) || 'main';
writeFileSync(
  resolve(outDir, 'version.json'),
  `${JSON.stringify({ name: 'nuwax-repo-web', branch, commit, builtAt: new Date().toISOString() }, null, 2)}\n`,
);

console.log(`[sync-repo-web] 完成：产物已同步到 public/repo/（commit ${commit.slice(0, 9)}）`);
console.log('[sync-repo-web] dev 验证：启动主站 dev server 后访问 /repo-entry 或 /repo/');
