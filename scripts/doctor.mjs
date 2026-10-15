/**
 * 本地环境体检（只读）：子模块 / 微应用产物 / 工具链 / umi 生成物 / 远端配置。
 * 不 fetch、不改 index、不写文件；只给出「哪里不对 + 一条修复命令」。
 *
 * 用法：
 *   npm run doctor            完整体检，有 ❌ 时退出码 1
 *   node scripts/doctor.mjs --quick   predev 用：只查本地状态，永远退出 0（只提示不拦截）
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  adapterFingerprint,
  assertPatchHygiene,
  isSubmoduleInitialized,
  readMicroAppRegistry,
  runCommand,
} from './sync-micro-apps.mjs';

const scriptRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const exists = (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );

/**
 * @returns {Promise<Array<{level: 'ok'|'warn'|'error', title: string, fix?: string}>>}
 */
export async function collectDoctorReport({
  root = scriptRoot,
  execute = runCommand,
  quick = false,
} = {}) {
  const items = [];
  const add = (level, title, fix) => items.push({ level, title, fix });
  const git = (cwd, args) => execute('git', args, { cwd, capture: true });

  const packages = JSON.parse(
    await fs.readFile(path.join(root, 'package.json'), 'utf8'),
  );
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 18)
    add(
      'error',
      `Node ${process.version} 过低（要求 > 18）`,
      '升级 Node 后重装依赖',
    );
  else add('ok', `Node ${process.version}`);

  if (!quick) {
    const expected = /^pnpm@(.+)$/.exec(packages.packageManager ?? '')?.[1];
    const actual = await execute('pnpm', ['--version'], {
      cwd: root,
      capture: true,
    }).catch(() => '');
    if (!actual)
      add('warn', '未找到全局 pnpm', `corepack enable 后使用 pnpm@${expected}`);
    else if (expected && actual !== expected)
      add(
        'warn',
        `全局 pnpm ${actual} 与 packageManager ${expected} 不一致（微应用构建固定走 corepack，主包依赖安装可能产生锁文件漂移）`,
        `corepack enable && corepack prepare pnpm@${expected} --activate`,
      );
    else add('ok', `pnpm ${actual}`);
  }

  if (!(await exists(path.join(root, 'node_modules'))))
    add('error', 'node_modules 缺失', 'pnpm install');
  if (!(await exists(path.join(root, 'src/.umi/tsconfig.json'))))
    add(
      'warn',
      'src/.umi 缺失：vitest 会整文件加载失败、tsc 无法解析别名',
      'pnpm run setup',
    );

  let apps = [];
  try {
    apps = await readMicroAppRegistry(root);
  } catch (error) {
    add(
      'error',
      `微应用登记无效：${error.message}`,
      '核对 micro-frontends/apps.json 与 adapter.json',
    );
  }

  for (const app of apps) {
    const label = `微应用 ${app.id}（${app.adapter.sourceDir}）`;
    try {
      assertPatchHygiene(app, await fs.readFile(app.patch, 'utf8'));
    } catch (error) {
      add(
        'error',
        error.message.split('\n')[0],
        '删除 adapter.patch 中 *.rej / *.orig 的 diff 段',
      );
    }
    if (!(await isSubmoduleInitialized(app))) {
      add(
        'warn',
        `${label} 子模块未初始化：构建会跳过该微应用（开源社区版无仓库权限属预期）`,
        'git submodule update --init --recursive',
      );
      continue;
    }
    const staged = await git(root, [
      'ls-files',
      '--stage',
      '--',
      app.adapter.sourceDir,
    ]).catch(() => '');
    const gitlink = /^160000 ([a-f0-9]{40}) 0\t/.exec(staged)?.[1];
    if (!gitlink) {
      add(
        'error',
        `${label} 主仓 index 缺少 gitlink`,
        'git submodule update --init',
      );
      continue;
    }
    if (gitlink !== app.adapter.pin) {
      add(
        'error',
        `${label} gitlink ${gitlink.slice(
          0,
          9,
        )} 与 adapter.pin ${app.adapter.pin.slice(
          0,
          9,
        )} 不一致（构建会在 install 前失败）`,
        '以 gitlink 为准修正 adapter.json 的 pin，或重跑 npm run upgrade:micro-apps',
      );
    }
    const head = await git(app.source, ['rev-parse', 'HEAD']).catch(() => '');
    if (head && head !== gitlink)
      add(
        'warn',
        `${label} 子仓 HEAD ${head.slice(0, 9)} 偏离 gitlink ${gitlink.slice(
          0,
          9,
        )}（构建以 gitlink 为准不受影响；升级工具会拒绝运行）`,
        'git submodule update --init（子仓有本地提交先自行保留）',
      );
    const dirty = await git(app.source, ['status', '--porcelain']).catch(
      () => '',
    );
    if (dirty)
      add(
        'warn',
        `${label} 子仓有未提交改动（构建不受影响，升级工具会拒绝运行）`,
      );

    const versionFile = path.join(
      root,
      'public/micro-apps',
      app.id,
      'version.json',
    );
    if (!(await exists(versionFile))) {
      add(
        'warn',
        `${label} 本地无产物：npm run dev 下该微应用页面会 404`,
        'npm run sync:micro-apps',
      );
      continue;
    }
    try {
      const manifest = JSON.parse(await fs.readFile(versionFile, 'utf8'));
      const fingerprint = await adapterFingerprint(app);
      if (
        manifest.source?.commit !== gitlink ||
        manifest.adapter?.sha256 !== fingerprint.sha256
      )
        add(
          'warn',
          `${label} 本地产物已过期（产物 main@${String(
            manifest.source?.commit,
          ).slice(0, 9)}，当前登记 ${gitlink.slice(0, 9)} / 适配有变化）`,
          'npm run sync:micro-apps',
        );
      else add('ok', `${label} 产物与登记版本一致`);
    } catch (error) {
      add(
        'warn',
        `${label} 产物 version.json 无法解析：${error.message}`,
        'npm run sync:micro-apps',
      );
    }
  }

  if (!quick) {
    const remotes = (await git(root, ['remote']).catch(() => '')).split('\n');
    if (!remotes.includes('gitlab'))
      add(
        'warn',
        '未配置 gitlab 远端（提测脚本会自动补配，手动提测需要）',
        'git remote add gitlab <内网仓库地址>',
      );
    if (!(await exists(path.join(root, 'scripts/deploy_sync_test.env'))))
      add(
        'warn',
        '未生成提测配置 scripts/deploy_sync_test.env（全链提测首次运行会交互生成）',
        'INIT_ONLY=1 bash scripts/deploy_sync_test.sh',
      );
  }
  return items;
}

const icon = { ok: '✅', warn: '⚠️ ', error: '❌' };

export function formatDoctorReport(items, { quick = false } = {}) {
  const shown = quick ? items.filter((item) => item.level !== 'ok') : items;
  return shown
    .map(
      (item) =>
        `${icon[item.level]} ${item.title}${
          item.fix ? `\n     → ${item.fix}` : ''
        }`,
    )
    .join('\n');
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const quick = process.argv.includes('--quick');
  try {
    const items = await collectDoctorReport({ quick });
    const text = formatDoctorReport(items, { quick });
    if (text) console.info(`[doctor]\n${text}`);
    if (!quick) {
      const errors = items.filter((item) => item.level === 'error').length;
      const warnings = items.filter((item) => item.level === 'warn').length;
      console.info(`[doctor] ${errors} 个错误，${warnings} 个提醒`);
      if (errors) process.exitCode = 1;
    } else if (text) {
      console.info('[doctor] 以上为提醒，不影响启动；完整体检：npm run doctor');
    }
  } catch (error) {
    // quick 模式挂在 predev 上，体检自身出错也不能挡住开发启动
    console.warn(`[doctor] 体检未完成：${error.message}`);
    if (!quick) process.exitCode = 1;
  }
}
