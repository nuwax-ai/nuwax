// nuwa-sdlc-kit v1.2.0 · engine file — 托管件，upgrade 会覆盖手工修改
// SDLC Stage-3 计划门禁：源码区（.sdlc.json srcPaths 正则）会话首改追问一次；
// plans/specs 类工件目录有在途改动即放行；marker 记账同会话只问一次；
// <ENVPREFIX>_SKIP_PLAN_GATE=1 停用（envPrefix 读 .sdlc.json，默认 SDLC）。
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { relative, isAbsolute, resolve, sep } from 'node:path';
import { readFileSync } from 'node:fs';

const loadCfg = cwd => {
  try { return JSON.parse(readFileSync(resolve(cwd, '.sdlc.json'), 'utf8')); } catch { return {}; }
};

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(raw); } catch { process.exit(0); }

  const tool = ev.tool_name ?? '';
  const cwd = ev.cwd || process.cwd();
  const cfg = loadCfg(cwd);
  const prefix = cfg.envPrefix ?? 'SDLC';
  if (process.env[`${prefix}_SKIP_PLAN_GATE`] === '1') process.exit(0);
  if (!['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) process.exit(0);

  const fp = String(ev.tool_input?.file_path ?? '');
  if (!fp) process.exit(0);
  const rel = (() => {
    const abs = isAbsolute(fp) ? fp : resolve(cwd, fp);
    return relative(cwd, abs).split(sep).join('/');
  })();

  const srcPatterns = cfg.srcPaths ?? ['packages/[^/]+/src/', 'apps/[^/]+/src/'];
  if (!srcPatterns.some(p => new RegExp(p).test(rel))) process.exit(0);

  const session = String(ev.session_id ?? 'anon').replace(/[^A-Za-z0-9_-]/g, '_');
  const cacheDir = resolve(cwd, '.claude/cache/plan-gate');
  const marker = `${cacheDir}/${session}.flag`;
  if (existsSync(marker)) process.exit(0);

  const workDirs = cfg.plansDirs ?? ['plans', 'specs'];
  let inflow = false;
  try {
    const out = execFileSync('git', ['status', '--porcelain', '--', ...workDirs], { cwd, encoding: 'utf8' });
    inflow = out.trim().length > 0;
  } catch { /* git 不可用时宁放勿拦 */ }

  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(marker, new Date().toISOString());

  if (inflow) process.exit(0);
  console.error(
    `[plan-gate:${cfg.name ?? 'repo'}] 本次仅提醒一次：检测到对源码「${rel}」的编辑，但工作区没有进行中的 ${workDirs.join('/')} 工件。\n` +
    `· 新任务：先用 templates/plan.md 建计划（完整链见 .claude/skills/requirement-analysis → grill-with-docs）；\n` +
    `· 计划内小修：直接重试刚才的编辑即可放行（同会话不再追问）；\n` +
    `· 停用门禁：设置环境变量 ${prefix}_SKIP_PLAN_GATE=1。`
  );
  process.exit(2);
});
