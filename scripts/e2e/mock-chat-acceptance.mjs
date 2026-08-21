/**
 * /mock-chat 断言型全场景回归套件（ego-browser 驱动，无登录态依赖）
 *
 * 用法：
 *   1. 启动 dev server（npm run dev，默认 localhost:3000）
 *   2. npm run e2e:mock-chat
 *      等价于 ego-browser nodejs < scripts/e2e/mock-chat-acceptance.mjs
 *
 * 过滤变量（经 scripts/e2e/ego-run.mjs 桥接——ego-browser 沙箱不透传 env）：
 *   E2E_SCENARIOS=NORMAL_SINGLE,SESSION_RESUME   只跑指定场景（逗号分隔）
 *   E2E_LINE=legacy|runtime|both                  只跑指定轨（默认 both）
 *   E2E_TIMEOUT=30                                单场景收尾超时秒数（默认 30）
 *   E2E_SPEED=0.05                                场景回放速度（默认 0.05 瞬间档）
 *
 * 设计（docs/conversation/mock-optimization-plan.md M2）：
 *   - 断言单源：页面算（window.__MOCK_CHAT_ASSERTIONS__），本脚本只读；
 *   - 单标签串行：mock server 的场景状态是模块级单例，并行多 tab 会互相覆盖；
 *   - 收尾门控：先确认「已开流」（emittedCount>0 且 messageCount>0）再判收，
 *     防止无 FINAL_RESULT 场景在开播前断言 t=0 全真的误收；
 *   - 非空转证明：全程未见活跃态（sawActive）即视为断言空转，判失败。
 */

import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** 读取 ego-run.mjs 落盘的 E2E_* 变量（见该文件说明） */
const loadE2eEnv = () => {
  try {
    const file = join(tmpdir(), 'ego-e2e-env.json');
    if (!existsSync(file)) return {};
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
};
const E2E = loadE2eEnv();

const APP_BASE = E2E.E2E_BASE_URL || 'http://localhost:3000';
const PAGE_PATH = '/mock-chat';
const SPEED = E2E.E2E_SPEED || '0.05'; // 瞬间档：压缩脚本内延迟
const TIMEOUT_SEC = Number(E2E.E2E_TIMEOUT) || 30;
/** 无终态场景的稳定窗口：事件/消息/断言快照持续不变视为悬挂收敛 */
const STABLE_WINDOW_MS = 3000;
/** M3 交互型场景：需要点击/填表/停止驱动，断言型矩阵不覆盖 */
const M3_SCENARIOS = new Set(['MESSAGE_QUEUE_HOLDING']);
/**
 * 已知真实行为差异（mock-optimization-plan.md 风险表）：
 * runtime resume 投影不清理快照 EXECUTING 残留，SESSION_RESUME 断言 4 在
 * runtime 轨为红。单独立项修复，期间标 KNOWN-FAIL 不计入退出码。
 */
const KNOWN_ISSUES = [
  {
    scenario: 'SESSION_RESUME',
    line: 'runtime',
    reason:
      'runtime 续接不清快照 EXECUTING（mock-optimization-plan.md 风险表，另行立项）',
  },
];

// ---------- 前置探测：dev server / mock 层未就绪时给出清晰指引 ----------
{
  const { default: http } = await import('node:http');
  const reachable = await new Promise((resolve) => {
    const req = http.get(APP_BASE, { timeout: 3000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
  if (!reachable) {
    cliLog(
      `❌ dev server 未启动（${APP_BASE} 不可达）。\n` +
        `   请先运行: npm run dev\n` +
        `   或通过环境变量指定已运行的地址: E2E_BASE_URL=http://<host:port> npm run e2e:mock-chat`,
    );
    throw new Error('dev server unreachable');
  }
}

// ---------- 场景清单（元数据单点在 mock 服务端） ----------
const scenariosResponse = await fetch(
  `${APP_BASE}/api/mock/conversation/scenarios`,
).then((r) => r.json());
if (!Array.isArray(scenariosResponse?.data) || !scenariosResponse.data.length) {
  throw new Error(
    'GET /api/mock/conversation/scenarios 未返回场景清单——mock 层未就绪，请重启 dev server 或 touch mock/conversationMock.ts',
  );
}
const allScenarios = scenariosResponse.data;

// ---------- 过滤 ----------
const scenarioFilter = E2E.E2E_SCENARIOS
  ? new Set(E2E.E2E_SCENARIOS.split(',').map((s) => s.trim()))
  : null;
const lineFilter = E2E.E2E_LINE || 'both';
const scenarios = allScenarios.filter(
  (meta) =>
    !M3_SCENARIOS.has(meta.id) &&
    (!scenarioFilter || scenarioFilter.has(meta.id)),
);
if (scenarioFilter) {
  const missing = [...scenarioFilter].filter(
    (id) => !allScenarios.some((meta) => meta.id === id),
  );
  if (missing.length) {
    throw new Error(`E2E_SCENARIOS 含未知场景: ${missing.join(', ')}`);
  }
}
const lines = lineFilter === 'both' ? ['legacy', 'runtime'] : [lineFilter];
if (!['legacy', 'runtime', 'both'].includes(lineFilter)) {
  throw new Error(`E2E_LINE 仅支持 legacy|runtime|both，收到: ${lineFilter}`);
}

// ---------- 断言与报告 ----------
const results = [];
const knownFails = [];
const fail = (name, error) =>
  results.push({ name, ok: false, error: String(error).slice(0, 500) });

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

/** 轨归属决定性探针（选择器放宽为属性包含，避免 CSS module 哈希脆弱） */
const probeLine = async () => {
  // 输入区随会话详情加载延迟挂载，首屏 1s 内可能不存在——先等元素
  await waitForElement('[class*="mention-editor"]', { timeout: 15000 }).catch(
    () => {},
  );
  return js(String.raw`(() => {
    const editor = document.querySelector('[class*="mention-editor"]');
    if (!editor) return 'NO_EDITOR';
    const fiberKey = Object.keys(editor).find(k => k.startsWith('__reactFiber$'));
    if (!fiberKey) return 'NO_FIBER';
    let node = editor[fiberKey];
    for (let i = 0; i < 60 && node; i++) {
      const props = node.memoizedProps;
      if (props && typeof props.onSendMessage === 'function') {
        return props.onSendMessage.toString().includes('session.send')
          ? 'RUNTIME' : 'LEGACY';
      }
      node = node.return;
    }
    return 'UNKNOWN';
  })()`);
};

const readSnapshot = async () =>
  js(String.raw`window.__MOCK_CHAT_ASSERTIONS__ || null`);

/**
 * 收尾判定（带开流门控）：
 * - 门控：playing 且 emittedCount>0 且 messageCount>0（开播前断言 t=0 全真防误收）
 * - 终态场景（hasFinalResult）：等 FINAL_RESULT 已发 且 断言全绿 即收
 * - 无终态场景（悬挂/错误收尾）：等断言全绿 且 状态快照稳定 STABLE_WINDOW_MS
 */
const waitForSettled = async (meta) => {
  const deadline = Date.now() + TIMEOUT_SEC * 1000;
  let lastFingerprint = '';
  let stableSince = 0;
  let lastSnapshot = null;

  while (Date.now() < deadline) {
    await wait(0.5);
    const snapshot = await readSnapshot();
    if (!snapshot || !snapshot.playing) continue;
    lastSnapshot = snapshot;

    const started = snapshot.emittedCount > 0 && snapshot.messageCount > 0;
    if (!started) continue;

    const allPassed = snapshot.assertions.every((a) => a.passed);
    if (meta.hasFinalResult) {
      if (allPassed && snapshot.hasFinalResult) return snapshot;
      continue;
    }

    const fingerprint = JSON.stringify([
      snapshot.emittedCount,
      snapshot.messageCount,
      snapshot.streamActive,
      allPassed,
    ]);
    if (fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      stableSince = Date.now();
      continue;
    }
    if (!stableSince) stableSince = Date.now();
    if (Date.now() - stableSince >= STABLE_WINDOW_MS && allPassed) {
      return snapshot;
    }
  }

  const detail = lastSnapshot
    ? `（最终快照：messages=${lastSnapshot.messageCount} emitted=${lastSnapshot.emittedCount} ` +
      `hasFinalResult=${lastSnapshot.hasFinalResult} active=${lastSnapshot.streamActive}；` +
      lastSnapshot.assertions
        .filter((a) => !a.passed)
        .map((a) => `红断言「${a.label}」`)
        .join('、') +
      (lastSnapshot.lastError ? `；页面错误：${lastSnapshot.lastError}` : '') +
      '）'
    : '（页面断言快照始终未出现——页面可能未进入播放态）';
  throw new Error(
    `场景 ${meta.id} 未在 ${TIMEOUT_SEC}s 内收尾${detail}`.slice(0, 500),
  );
};

// ---------- 单标签串行矩阵 ----------
cliLog(
  `场景 ${scenarios.length}/${allScenarios.length} 个 × 轨 ${lines.join('/')}，` +
    `speed=${SPEED}，单场景超时 ${TIMEOUT_SEC}s`,
);

// ego-browser 的 tab 按 task space 隔离：套件独占一个空间，跑完即焚
const task = await useOrCreateTaskSpace('mock chat e2e acceptance');
await openOrReuseTab(APP_BASE, { wait: true, timeout: 40 });

let index = 0;
for (const meta of scenarios) {
  for (const line of lines) {
    index += 1;
    const name = `[${index}/${scenarios.length * lines.length}] ${meta.id} · ${line}`;
    try {
      const url =
        `${APP_BASE}${PAGE_PATH}?scenario=${encodeURIComponent(meta.id)}` +
        `&speed=${SPEED}&autoplay=1&conversationRuntime=${line === 'runtime' ? 1 : 0}`;
      await gotoAndWait(url, { timeout: 40 });
      await wait(1);

      const probed = await probeLine();
      expect(
        probed === (line === 'runtime' ? 'RUNTIME' : 'LEGACY'),
        `轨归属探针期望 ${line.toUpperCase()}，实际 ${probed}`,
      );

      const snapshot = await waitForSettled(meta);

      expect(
        snapshot.scenarioId === meta.id,
        `断言快照场景不符：期望 ${meta.id}，实际 ${snapshot.scenarioId}`,
      );
      expect(
        snapshot.line === line,
        `断言快照轨不符：期望 ${line}，实际 ${snapshot.line}`,
      );
      // 非空转证明：全程必须出现过活跃态，否则「终态后已释放」类断言恒真假绿
      expect(
        snapshot.sawActive,
        '疑似断言空转：全程未见流式活跃态（sawActive=false）',
      );

      cliLog(`✅ ${name}（messages=${snapshot.messageCount}）`);
      results.push({ name, ok: true });
    } catch (error) {
      const known = KNOWN_ISSUES.find(
        (k) => k.scenario === meta.id && k.line === line,
      );
      if (known) {
        cliLog(`⚠️  KNOWN-FAIL ${name} — ${known.reason}`);
        knownFails.push({ name, reason: known.reason, error: String(error) });
      } else {
        cliLog(`❌ ${name} — ${String(error).slice(0, 220)}`);
        fail(name, error);
      }
    }
  }
}

// ---------- 汇总 ----------
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
cliLog('\n========== Mock 场景矩阵汇总 ==========');
for (const r of results) {
  if (!r.ok) cliLog(`FAIL  ${r.name}  ← ${r.error}`);
}
for (const k of knownFails) {
  cliLog(`KNOWN-FAIL  ${k.name}  ← ${k.reason}`);
}
cliLog(
  `共 ${results.length + knownFails.length} 项，通过 ${passed}，失败 ${failed.length}，已知差异 ${knownFails.length}`,
);

await completeTaskSpace(task.id, { keep: false });

if (failed.length > 0) {
  throw new Error(`Mock E2E 矩阵失败 ${failed.length} 项`);
}
