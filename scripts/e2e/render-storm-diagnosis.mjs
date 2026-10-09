/** 一次性诊断：思考流式期间渲染负载（longtask 计数/时长 + 消息区 DOM 变更频率） */
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const loadE2eEnv = () => {
  try {
    const file = join(tmpdir(), 'ego-e2e-env.json');
    if (!existsSync(file)) return {};
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
};
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`超时 ${label}`)), ms),
    ),
  ]);
const pageJs = (code, label = 'js') => withTimeout(js(code), 15000, label);
const pause = (s) => withTimeout(wait(s), 10000, `wait ${s}s`);
const BASE = loadE2eEnv().E2E_BASE_URL || 'http://localhost:3000';

const task = await useOrCreateTaskSpace('render storm diagnosis');
await openOrReuseTab(
  `${BASE}/mock-chat?scenario=LONG_TASK_INTERLEAVED&speed=6&autoplay=1&conversationRuntime=0`,
  { wait: true, timeout: 40 },
);

// 安装观测器：longtask + 消息区 mutation 计数
await pageJs(
  String.raw`(() => {
    window.__DIAG__ = { longTasks: [], mutations: 0, mutationBatches: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__DIAG__.longTasks.push(Math.round(e.duration));
        }
      }).observe({ entryTypes: ['longtask'] });
    } catch (e) {}
    const seed = document.querySelector('[class*="chat-wrapper-content"]');
    if (seed) {
      let batchTimer = null;
      new MutationObserver(() => {
        window.__DIAG__.mutations++;
        if (!batchTimer) {
          window.__DIAG__.mutationBatches++;
          batchTimer = setTimeout(() => { batchTimer = null; }, 100);
        }
      }).observe(seed, { childList: true, subtree: true, characterData: true });
    }
    return 'observers installed';
  })()`,
  'install observers',
);

// 观测整个回放窗口（思考流式含在内）
let settled = false;
for (let i = 0; i < 200; i++) {
  await pause(0.3);
  const s = await pageJs(
    `!!window.__MOCK_CHAT_ASSERTIONS__?.settled`,
    'settled?',
  );
  if (s === true) {
    settled = true;
    break;
  }
}

const diag = await pageJs(
  String.raw`(() => {
    const d = window.__DIAG__;
    const longs = d.longTasks;
    return JSON.stringify({
      settled: !!window.__MOCK_CHAT_ASSERTIONS__?.settled,
      mutationBatches: d.mutationBatches,
      mutations: d.mutations,
      longTaskCount: longs.length,
      longTaskTotalMs: longs.reduce((a, b) => a + b, 0),
      longTaskMax: longs.length ? Math.max(...longs) : 0,
      longTasksOver100: longs.filter((x) => x > 100).length,
      longTaskList: longs.slice(0, 30),
    });
  })()`,
  'collect diag',
);
console.log(diag);
cliLog('DONE');
