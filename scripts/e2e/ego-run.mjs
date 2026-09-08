/**
 * ego-browser nodejs 的 env 桥接器。
 *
 * ego-browser 沙箱不透传父进程环境变量（process.env.E2E_* 在脚本内恒
 * undefined），套件脚本的过滤/覆盖变量改为落临时 JSON 文件传入：
 *   E2E_SCENARIOS=NORMAL_SINGLE npm run e2e:mock-chat
 *   → 本脚本把 E2E_* 写入 <tmpdir>/ego-e2e-env.json
 *   → 套件脚本经 loadE2eEnv() 读回（见 mock-chat-acceptance.mjs）。
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const E2E_ENV_FILE = join(tmpdir(), 'ego-e2e-env.json');

const [target, ...forwardArgs] = process.argv.slice(2);
if (!target) {
  console.error('用法: node scripts/e2e/ego-run.mjs <suite.mjs>');
  process.exit(2);
}

const e2eEnv = {};
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('E2E_')) e2eEnv[key] = value;
}
writeFileSync(E2E_ENV_FILE, JSON.stringify(e2eEnv));

const result = spawnSync(
  'ego-browser',
  ['nodejs', '<', target, ...forwardArgs],
  { stdio: 'inherit', shell: true },
);
process.exit(result.status ?? 1);
