#!/usr/bin/env node
// nuwa-sdlc-kit v1.2.0 · engine file — 托管件（安装位置 scripts/sdlc-evals.mjs）
// 规则层 evals 门禁：对已安装的引擎 hooks 灌样本 PreToolUse 事件，断言 exit code。
// 用法：node scripts/sdlc-evals.mjs [--dir <repo>]；exit 1 = 有失败。CI 于规则文件变更时触发。
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const i = process.argv.indexOf('--dir');
const dir = resolve(i >= 0 ? process.argv[i + 1] : '.');
const hook = name => join(dir, '.claude/hooks', name);
const ev = (tool_name, cwd, tool_input, session_id) =>
  JSON.stringify({ tool_name, cwd, tool_input, ...(session_id ? { session_id } : {}) });

// 用例顺序是契约：plan-gate 的 marker 用例依赖同 session 首改用例先执行。
// [名称, hook 文件, 事件工厂(fixture 目录→事件 JSON), 预期 exit, 附加 env]
const CASES = [
  ['guard: write .env → 2', 'guard-paths.mjs', f => ev('Write', f, { file_path: join(f, '.env') }), 2, {}],
  ['guard: write .env.example → 0', 'guard-paths.mjs', f => ev('Write', f, { file_path: join(f, '.env.example') }), 0, {}],
  ['guard: bash cat *.pem → 2', 'guard-paths.mjs', f => ev('Bash', f, { command: 'cat /etc/certs/server.pem' }), 2, {}],
  ['guard: protectedWrite → 2', 'guard-paths.mjs', f => ev('Edit', f, { file_path: join(f, 'docs/spec.md') }), 2, {}],
  ['gate: src 首改无 plans → 2', 'plan-gate.mjs', f => ev('Edit', f, { file_path: join(f, 'packages/a/src/x.ts') }, 'eval1'), 2, {}],
  ['gate: 同会话二改 → 0(marker)', 'plan-gate.mjs', f => ev('Edit', f, { file_path: join(f, 'packages/a/src/y.ts') }, 'eval1'), 0, {}],
  ['gate: SKIP env → 0', 'plan-gate.mjs', f => ev('Edit', f, { file_path: join(f, 'packages/a/src/x.ts') }, 'eval2'), 0, { SDLC_SKIP_PLAN_GATE: '1' }],
  ['deploy: force push → 2', 'deploy-gate.mjs', f => ev('Bash', f, { command: 'git push origin main --force' }), 2, {}],
  ['deploy: block+批准env 仍 → 2', 'deploy-gate.mjs', f => ev('Bash', f, { command: 'git push origin main --force' }), 2, { SDLC_APPROVE_DEPLOY: '1' }],
  ['deploy: ask 未批准 → 2', 'deploy-gate.mjs', f => ev('Bash', f, { command: 'docker push repo:1' }), 2, {}],
  ['deploy: ask+批准 → 0', 'deploy-gate.mjs', f => ev('Bash', f, { command: 'docker push repo:1' }), 0, { SDLC_APPROVE_DEPLOY: '1' }],
];

// fixture：临时"仓" + 最小 .sdlc.json（protectedWrite/srcPaths/deployGate 各命中一组用例）
const fx = mkdtempSync(join(tmpdir(), 'sdlc-evals-'));
writeFileSync(join(fx, '.sdlc.json'), JSON.stringify({
  name: 'evalfx',
  srcPaths: ['packages/[^/]+/src/'],
  protectedWrite: ['docs/spec.md'],
  deployGate: { patterns: [
    { re: '\\bgit push\\b[^&|;]*(--force|-f)(\\s|$)', mode: 'block' },
    { re: '\\bdocker push\\b', mode: 'ask' },
  ] },
}));
mkdirSync(join(fx, 'packages/a/src'), { recursive: true });

let fails = 0;
for (const [name, file, make, want, env] of CASES) {
  const r = spawnSync(process.execPath, [hook(file)], {
    input: make(fx), encoding: 'utf8', env: { ...process.env, ...env },
  });
  const got = r.status;
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} ${name}  (exit ${got}${ok ? '' : `, want ${want}${r.stderr ? ` — ${String(r.stderr).split('\n')[0]}` : ''}`})`);
}
rmSync(fx, { recursive: true, force: true });
if (fails) { console.error(`\n${fails} 个 eval 失败`); process.exit(1); }
console.log('\n全部 eval 通过');
