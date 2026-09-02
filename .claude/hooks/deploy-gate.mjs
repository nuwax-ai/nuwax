// nuwa-sdlc-kit v1.1.0 · engine file — 托管件，upgrade 会覆盖手工修改
// Deploy 闸门（SDLC Stage 4）：发布/破坏性 Bash 命令按 .sdlc.json deployGate 分带拦截。
//   { "deployGate": { "patterns": [{ "re": "...", "mode": "ask|block|allow" }, ...] } }
// mode 语义：ask（默认）= 需 <ENVPREFIX>_APPROVE_DEPLOY=1 人工批准后放行；
//           block = 硬禁（不受环境变量影响，只认 .sdlc.json 修改）；
//           allow = 显式放行（用于在默认带中开洞）。
// 协议：stdin 事件 JSON；exit 0 放行 / exit 2 阻断（stderr 给 agent）。
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const loadCfg = cwd => {
  try { return JSON.parse(readFileSync(resolve(cwd, '.sdlc.json'), 'utf8')); } catch { return {}; }
};

// 缺省带：force push 属改写历史永不自动放行；其余发布入口一律走人工批准
const DEFAULTS = [
  { re: '\\bgit push\\b[^&|;]*(--force|-f)(\\s|$)', mode: 'block' },
  { re: '\\b(pnpm|npm|yarn|bun) run deploy\\b', mode: 'ask' },
  { re: '\\bkubectl (apply|delete|rollout)\\b', mode: 'ask' },
  { re: '\\baws s3 (cp|sync|rm)\\b', mode: 'ask' },
  { re: '\\bdocker push\\b', mode: 'ask' },
];

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(raw); } catch { process.exit(0); }
  if ((ev.tool_name ?? '') !== 'Bash') process.exit(0);
  const cwd = ev.cwd || process.cwd();
  const cfg = loadCfg(cwd);
  const prefix = cfg.envPrefix ?? 'SDLC';
  const command = String(ev.tool_input?.command ?? '');
  if (!command) process.exit(0);

  const patterns = cfg.deployGate?.patterns ?? DEFAULTS;
  const approved = process.env[`${prefix}_APPROVE_DEPLOY`] === '1';
  const deny = msg => { console.error(msg); process.exit(2); };
  const head = command.length > 80 ? command.slice(0, 80) + '…' : command;

  for (const p of patterns) {
    if (!new RegExp(p.re, 'i').test(command)) continue;
    const mode = p.mode ?? 'ask';
    if (mode === 'allow') process.exit(0);
    if (mode === 'block') {
      deny(`[deploy-gate:${cfg.name ?? 'repo'}] 「block」带命令被拒：${head}\n` +
        `发布属人工决策：请人评审后调整 .sdlc.json deployGate.patterns（本带不受 ${prefix}_APPROVE_DEPLOY 影响）。`);
    }
    if (!approved) {
      deny(`[deploy-gate:${cfg.name ?? 'repo'}] 「ask」带命令需人工批准：${head}\n` +
        `· 人工批准：export ${prefix}_APPROVE_DEPLOY=1 后重跑本命令；\n` +
        `· 永久放行/收紧：改 .sdlc.json deployGate.patterns（样例见 samples/deploy-gate.example.json）。`);
    }
    process.exit(0); // ask 带 + 已批准
  }
  process.exit(0);
});
