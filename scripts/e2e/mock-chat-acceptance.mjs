/**
 * /mock-chat 断言型 + 交互型全场景回归套件（ego-browser 驱动，无登录态依赖）
 *
 * 用法：
 *   1. 启动 dev server（npm run dev，默认 localhost:3000）
 *   2. npm run e2e:mock-chat
 *      等价于 ego-browser nodejs < scripts/e2e/mock-chat-acceptance.mjs（经
 *      ego-run.mjs 桥接 env）
 *
 * 过滤/门控变量（经 scripts/e2e/ego-run.mjs 桥接——ego-browser 沙箱不透传 env）：
 *   E2E_SCENARIOS=NORMAL_SINGLE,SESSION_RESUME   只跑指定场景（逗号分隔）
 *   E2E_LINE=legacy|runtime|both                  只跑指定轨（默认 both）
 *   E2E_TIMEOUT=30                                单场景收尾超时秒数（默认 30）
 *   E2E_SPEED=0.05                                场景回放速度（默认 0.05 瞬间档）
 *   E2E_REAL_TIMING=1                             追加真实时长子集（60~154s/场景）
 *
 * 设计（docs/conversation/mock-optimization-plan.md M2/M3）：
 *   - 断言单源：页面算（window.__MOCK_CHAT_ASSERTIONS__），本脚本只读；
 *   - 单标签串行：mock server 的场景状态是模块级单例，并行多 tab 会互相覆盖；
 *   - 收尾门控：先确认「已开流」（emittedCount>0 且 messageCount>0）再判收，
 *     防止无 FINAL_RESULT 场景在开播前断言 t=0 全真的误收；终态场景额外等
 *     emittedCount ≥ scriptLength（回放完毕），防迟到事件未发完提前收尾；
 *   - 非空转证明：全程未见活跃态（sawActive）即视为断言空转，判失败；
 *   - console 观测：收尾断言零 [Conv:Status] 级 console.error；
 *   - 交互型（M3）：干预卡双击审批 / ask 填表提交 / 堆叠逐卡 / 队列面板，
 *     交互等待窗靠 speed 放大（如 PERMISSION_REQUEST 用 speed=5 → 10s 窗）。
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
/** 真实时长场景（HEARTBEAT_REAL ~80s / LATE_CHUNK_SLOW ~154s）的收尾预算 */
const REAL_TIMING_TIMEOUT_SEC = 360;
/** 已知真实行为差异（mock-optimization-plan.md 风险表）：不算失败但醒目报告。
 * interactive: true 仅匹配交互型用例（断言型快照层不受该缺口影响照常跑） */
const KNOWN_ISSUES = [
  {
    scenario: 'SESSION_RESUME',
    line: 'runtime',
    reason:
      'runtime 续接不清快照 EXECUTING（mock-optimization-plan.md 风险表，另行立项）',
  },
  // runtime 轨干预/OpenUI 渲染缺口（M3 探针确证：事件全发、消息投影正常，
  // 但 dockExists=false、OpenUI inline 无 DOM——干预事件未桥接
  // AgentIntervention dock 数据源。R6 默认切换前的阻塞级修复项）
  {
    scenario: 'PERMISSION_REQUEST',
    line: 'runtime',
    interactive: true,
    reason:
      'runtime 轨干预 dock 未渲染（ask 模式审批卡不出，事件已到但 DOM 无卡）——runtime 干预桥接另行立项',
  },
  {
    scenario: 'ASK_QUESTION',
    line: 'runtime',
    interactive: true,
    reason: 'runtime 轨干预 dock 未渲染（同 PERMISSION_REQUEST 桥接缺口）',
  },
  {
    scenario: 'INTERVENTION_STACK',
    line: 'runtime',
    interactive: true,
    reason: 'runtime 轨干预 dock 未渲染（同 PERMISSION_REQUEST 桥接缺口）',
  },
  {
    scenario: 'OPENUI_RENDER',
    line: 'runtime',
    interactive: true,
    reason:
      'runtime 轨 OpenUI inline 组件未渲染（消息投影未接 OpenUI applier，legacy 正常）——另行立项',
  },
  // 终态守卫在 154s 真实时长（心跳维活）场景未丢弃迟到分片（两轨一致，
  // 消息列表渲染了迟到文本）——压缩版 LATE_CHUNK 的断言只查 EXECUTING 残留
  // 从未验证守卫证据，M3 真实时长首次暴露。初步定位：shouldDropLateMessageChunk
  // 的 messageIdRefCurrent 非空分支或消息 status 判定在终态后放行。终态收敛线
  // 专项修复，修后移除本条目。
  {
    scenario: 'LATE_CHUNK_SLOW',
    line: 'legacy',
    reason:
      '终态守卫未丢弃 154s 迟到分片（两轨一致，真实 bug 首次暴露）——终态收敛线专项修复',
  },
  {
    scenario: 'LATE_CHUNK_SLOW',
    line: 'runtime',
    reason:
      '终态守卫未丢弃 154s 迟到分片（同 legacy，两轨一致）——终态收敛线专项修复',
  },
];

// ---------- 前置探测：dev server / mock 层未就绪时给出清晰指引 ----------
{
  const { default: http } = await import('node:http');
  const probeOnce = () =>
    new Promise((resolve) => {
      // 编译期响应可能超过单次预算，给 8s 并在失败后重试
      const req = http.get(APP_BASE, { timeout: 8000 }, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  let reachable = false;
  for (let attempt = 0; attempt < 3 && !reachable; attempt++) {
    reachable = await probeOnce();
    if (!reachable) await new Promise((r) => setTimeout(r, 5000));
  }
  if (!reachable) {
    cliLog(
      `❌ dev server 未启动或编译未完成（${APP_BASE} 不可达）。\n` +
        `   请先运行: npm run dev（等待首次 Compiled 完成后再跑套件）\n` +
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

// ---------- 断言与报告 ----------
const results = [];
const knownFails = [];
const fail = (name, error) =>
  results.push({ name, ok: false, error: String(error).slice(0, 500) });

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

/**
 * ego 调用（js/click/doubleClick 等）无内建超时，页面导航窗口期的
 * evaluate 可能永久 pending——统一包超时兜底，防单次挂起卡死整套
 */
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`ego 调用超时（${label}，${ms}ms）`)),
        ms,
      ),
    ),
  ]);

const pageJs = (code, label = 'js') => withTimeout(js(code), 10000, label);

/** ego 的 wait() 也走串行通道——同受队列堵塞影响，包超时兜底 */
const pause = (seconds) =>
  withTimeout(wait(seconds), 15000, `wait ${seconds}s`);

/** 轨归属决定性探针（选择器放宽为属性包含，避免 CSS module 哈希脆弱） */
const probeLine = async () => {
  // 输入区随会话详情加载延迟挂载，首屏 1s 内可能不存在——先等元素
  await withTimeout(
    waitForElement('[class*="mention-editor"]', { timeout: 15000 }),
    20000,
    'waitForElement editor',
  ).catch(() => {});
  return pageJs(String.raw`(() => {
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
  pageJs(String.raw`window.__MOCK_CHAT_ASSERTIONS__ || null`, 'readSnapshot');

/**
 * 收尾判定（带开流门控）：
 * - 门控：playing 且 emittedCount>0 且 messageCount>0（开播前断言 t=0 全真防误收）
 * - 终态场景（hasFinalResult）：等 FINAL_RESULT 已发 且 断言全绿 且 回放完毕
 *   （emittedCount ≥ scriptLength，防 LATE_CHUNK 类迟到事件未发完提前收尾）
 * - 无终态场景（悬挂/错误收尾）：等断言全绿 且 状态快照稳定 STABLE_WINDOW_MS
 */
const waitForSettled = async (meta, timeoutSec = TIMEOUT_SEC) => {
  const deadline = Date.now() + timeoutSec * 1000;
  let lastFingerprint = '';
  let stableSince = 0;
  let lastSnapshot = null;

  while (Date.now() < deadline) {
    await pause(0.5);
    const snapshot = await readSnapshot();
    if (!snapshot || !snapshot.playing) continue;
    lastSnapshot = snapshot;

    const started = snapshot.emittedCount > 0 && snapshot.messageCount > 0;
    if (!started) continue;

    const allPassed = snapshot.assertions.every((a) => a.passed);
    // 回放完毕：优先 mock 的 replaySettled（续连轮只发终态时 emitted 计数
    // 永远到不了 scriptLength）；快照字段缺失时退回计数比较（兼容）
    const replayDone =
      snapshot.replaySettled === undefined
        ? !snapshot.scriptLength ||
          snapshot.emittedCount >= snapshot.scriptLength
        : snapshot.replaySettled;
    if (meta.hasFinalResult) {
      if (allPassed && snapshot.hasFinalResult && replayDone) return snapshot;
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
    ? `（最终快照：messages=${lastSnapshot.messageCount} emitted=${lastSnapshot.emittedCount}/${lastSnapshot.scriptLength} ` +
      `hasFinalResult=${lastSnapshot.hasFinalResult} active=${lastSnapshot.streamActive}；` +
      lastSnapshot.assertions
        .filter((a) => !a.passed)
        .map((a) => `红断言「${a.label}」`)
        .join('、') +
      (lastSnapshot.lastError ? `；页面错误：${lastSnapshot.lastError}` : '') +
      '）'
    : '（页面断言快照始终未出现——页面可能未进入播放态）';
  throw new Error(
    `场景 ${meta.id} 未在 ${timeoutSec}s 内收尾${detail}`.slice(0, 500),
  );
};

/** console 观测（M3）：会话路径零 [Conv:Status] 级 console.error */
const checkConsole = (snapshot) => {
  const convErrors = (snapshot.consoleErrors || []).filter((e) =>
    e.includes('Conv:Status'),
  );
  expect(
    convErrors.length === 0,
    `[Conv:Status] 级 console.error ×${convErrors.length}，首条：${(
      convErrors[0] || ''
    ).slice(0, 180)}`,
  );
};

// ---------- 交互 helpers（M3） ----------
const E2E_ATTR = 'data-e2e-target';

/** 按文本给目标元素打临时标记属性，转成稳定选择器供 click/doubleClick 用 */
const markByText = async (selector, text) =>
  pageJs(
    `(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find(e => (e.textContent || '').includes(${JSON.stringify(text)}));
    if (!el) return false;
    el.setAttribute('${E2E_ATTR}', '1');
    return true;
  })()`,
  );

const clearMark = async () =>
  pageJs(
    `document.querySelectorAll('[${E2E_ATTR}]').forEach(e => e.removeAttribute('${E2E_ATTR}'))`,
  );

const clickText = async (selector, text, label) => {
  const marked = await markByText(selector, text);
  if (!marked) throw new Error(`未找到元素：${selector} 含「${text}」`);
  await withTimeout(
    click(`[${E2E_ATTR}]`, { label: label || `click ${text}` }),
    15000,
    `click ${text}`,
  );
  await clearMark();
};

const doubleClickText = async (selector, text, label) => {
  const marked = await markByText(selector, text);
  if (!marked) throw new Error(`未找到元素：${selector} 含「${text}」`);
  await withTimeout(
    doubleClick(`[${E2E_ATTR}]`, { label: label || `dblclick ${text}` }),
    15000,
    `dblclick ${text}`,
  );
  await clearMark();
};

const textVisible = async (text) =>
  pageJs(
    `document.body.textContent.includes(${JSON.stringify(text)})`,
    'textVisible',
  );

const waitForText = async (text, timeoutSec = 6) => {
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    if (await textVisible(text)) return;
    await pause(0.5);
  }
  throw new Error(`等待文本「${text}」超时（${timeoutSec}s）`);
};

const waitForTextGone = async (text, timeoutSec = 6) => {
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    if (!(await textVisible(text))) return;
    await pause(0.5);
  }
  throw new Error(`等待文本「${text}」消失超时（${timeoutSec}s）`);
};

// ---------- 交互驱动（M3） ----------
const DOCK = '[data-agent-intervention-dock]';

/**
 * 干预卡处理生效断言。生效形态（实测）：
 * - 卡片直接移除/堆叠重排（单卡场景 dock 清空；堆叠场景 front 卡消失）
 * - 部分形态保留「已提交」Tag
 * DockPanel 只给 front 卡渲染完整 role 结构（back 卡为迷你预览），故用
 * dock 内容签名（卡片 aria-label 集合）变化而非卡片计数判定
 */
const dockSignature = async () =>
  pageJs(String.raw`(() => {
    const dock = document.querySelector('[data-agent-intervention-dock]');
    if (!dock) return '';
    return [...dock.querySelectorAll('[aria-label]')]
      .map(e => e.getAttribute('aria-label'))
      .filter(l => l && !l.startsWith('arrow'))
      .sort().join('|');
  })()`);

const waitForCardHandled = async (baselineSignature, timeoutSec = 6) => {
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    const signature = await dockSignature();
    const submitted = await textVisible('已提交');
    if (signature !== baselineSignature || submitted) return signature;
    await pause(0.5);
  }
  throw new Error(
    `干预卡处理后未生效（dock 签名未变化，基线「${baselineSignature.slice(
      0,
      120,
    )}」）`,
  );
};

/**
 * 权限卡快捷键提交：useAcpPermissionShortcuts（数字 1/2/3 选中选项、Enter
 * 提交，window 级 capture）。键盘路径不依赖元素点击稳定性——doubleClick
 * 在卡片重渲染窗口会永久 pending 并堵塞 ego 串行队列（实测），权限交互
 * 统一走键盘
 */
const submitPermissionViaKeyboard = async (label) => {
  await withTimeout(pressKey('1'), 10000, `${label} 按键 1 选中允许一次`);
  await pause(0.2);
  await withTimeout(pressKey('Enter'), 10000, `${label} 按键 Enter 提交`);
};

/** 权限卡：快捷键「1 + Enter」允许一次 → 断言处理生效 */
const drivePermissionAllow = async () => {
  await withTimeout(
    waitForElement(DOCK, { timeout: 10000 }),
    15000,
    'waitForDock',
  ).catch(() => {});
  const baseline = await dockSignature();
  await submitPermissionViaKeyboard('权限卡');
  await waitForCardHandled(baseline);
};

/** ask 卡：点 radio 选方案 → 点「确认」提交（Enter 在 radio 焦点下不触发卡提交，实测） */
const driveAskSubmit = async () => {
  await withTimeout(
    waitForElement(`${DOCK} [role="region"]`, { timeout: 10000 }),
    15000,
    'waitForAskRegion',
  ).catch(() => {});
  const baseline = await dockSignature();
  await clickText('.ant-radio-wrapper', '方案A', '选择方案A');
  await pause(0.2);
  await clickText('[role="region"] button', '确认', '提交问答表单');
  await waitForCardHandled(baseline);
};

/**
 * 堆叠逐卡 FIFO（场景 3 张卡：权限 ×2 + ask ×1）：循环处理 front 可交互卡
 * （权限卡快捷键允许；ask 卡选 radio + 确认），直到 dock 清空。
 * 实测一次 Enter 可能连续提交两张权限卡（第一张关闭瞬间第二张转 front，
 * 全局快捷键重复命中）——处理轮数与卡片数非 1:1，以 dock 清空为成功判定
 */
const driveInterventionStack = async () => {
  // dock 必须真实出现过（runtime 桥接缺失时 dock 恒无，循环会把「无 dock」
  // 误判为 EMPTY 假绿——先验证存在再进入清空循环）
  await withTimeout(
    waitForElement(DOCK, { timeout: 10000 }),
    15000,
    'waitForDock',
  );
  for (let round = 0; round < 8; round++) {
    const state = await pageJs(String.raw`(() => {
      const dock = document.querySelector('[data-agent-intervention-dock]');
      if (!dock || !dock.textContent.trim()) return 'EMPTY';
      if ([...dock.querySelectorAll('button')].some(b => !b.disabled && b.textContent.includes('允许一次'))) return 'PERMISSION';
      if (dock.querySelector('.ant-radio-wrapper')) return 'ASK';
      return 'PENDING';
    })()`);
    if (state === 'EMPTY') return; // 全部卡片处理完毕（dock 清空）
    if (state === 'PENDING') {
      await pause(1); // 卡片轮转间隙
      continue;
    }
    const baseline = await dockSignature();
    if (state === 'PERMISSION') {
      await submitPermissionViaKeyboard(`堆叠权限卡（第 ${round + 1} 轮）`);
    } else {
      await clickText('.ant-radio-wrapper', '全部变更', '选择执行范围');
      await pause(0.2);
      await clickText('[role="region"] button', '确认', '提交执行范围');
    }
    await waitForCardHandled(baseline);
    await pause(0.5);
  }
  throw new Error('堆叠卡 8 轮内未清空（FIFO 轮转异常）');
};

/**
 * 队列：流式执行中连发 2 条（第一条执行中 → 后续排队）→ 断言「待发送」
 * 面板出现 → 「清空全部」→ 断言面板消失
 */
const driveQueueHolding = async () => {
  for (let i = 0; i < 20; i++) {
    const snapshot = await readSnapshot();
    if (snapshot && snapshot.emittedCount > 0) break;
    await pause(0.5);
  }
  await withTimeout(
    click('[class*="mention-editor"]', { label: '聚焦输入框' }),
    15000,
    '聚焦输入框',
  );
  await pause(0.3);
  await withTimeout(typeText('E2E 排队消息 2'), 15000, '输入排队消息 2');
  await withTimeout(pressKey('Enter'), 15000, '回车发送 2');
  await pause(0.6);
  await withTimeout(typeText('E2E 排队消息 3'), 15000, '输入排队消息 3');
  await withTimeout(pressKey('Enter'), 15000, '回车发送 3');
  await waitForText('待发送', 10);
  await clickText('button', '清空全部', '清空待发送队列');
  await waitForTextGone('待发送', 10);
};

/** OpenUI 容器挂载：断言组件渲染证据（value 文本 + 容器节点；title 走样式层不在 textContent） */
const driveOpenuiRender = async () => {
  await waitForText('结果数值：42', 15);
  const nodes = await pageJs(
    String.raw`document.querySelectorAll('[class*="openui"], [class*="open-ui"], iframe').length`,
    'openui nodes',
  );
  expect(nodes > 0, `未见 OpenUI 容器节点（openui/iframe 选择器 ×0）`);
};

/**
 * 渲染探针通用前置：等回放收尾（replaySettled + FINAL 已到）再断言 DOM 终态。
 * 渲染探针与交互驱动不同——不操作页面，只读形态；speed 用瞬间档即可。
 */
const waitForReplaySettled = async (timeoutSec = 30) => {
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    const snapshot = await readSnapshot();
    if (snapshot && snapshot.replaySettled && snapshot.hasFinalResult) {
      return snapshot;
    }
    await pause(0.3);
  }
  throw new Error(
    '渲染探针等待回放收尾超时（replaySettled/hasFinalResult 未满足）',
  );
};

/**
 * 渲染稳定窗：replaySettled 只代表服务端事件发完，大消息（如 RENDER_SHOWCASE）
 * 的 MarkdownCMD clear+全量重推需要时间消化；等思考/过程/分组三类节点计数在
 * 稳定窗内不再变化后再断言。文本断言用 textContent（innerText 会排除折叠
 * 容器内的内容，可见性由折叠行为的组件单测覆盖）。
 */
const waitForRenderStable = async (timeoutSec = 25) => {
  const signature = () =>
    pageJs(
      String.raw`JSON.stringify([
        document.querySelectorAll('[class*="think-header"]').length,
        document.querySelectorAll('[class*="markdown-custom-process-group"]').length,
        document.querySelectorAll('[class*="markdown-custom-process"]').length,
      ])`,
      'render signature',
    ).catch(() => '');
  const deadline = Date.now() + timeoutSec * 1000;
  let last = '';
  let stableSince = 0;
  while (Date.now() < deadline) {
    const current = await signature();
    if (current === last) {
      if (!stableSince) stableSince = Date.now();
      if (Date.now() - stableSince >= 1500) return;
    } else {
      last = current;
      stableSince = 0;
    }
    await pause(0.3);
  }
};

/**
 * 思考内联渲染探针（LONG_TASK_INTERLEAVED，双轨）：
 * 终态断言思考块按轮次成块、旧顶部思考区退场、工具组存在、终态全收起。
 * 活动思考块的实时展开态由组件单测覆盖（mock 事件连发快于 DOM 采样步长）。
 */
const driveThinkRenderProbe = async () => {
  await waitForReplaySettled();
  await waitForRenderStable();
  const probe = await pageJs(
    String.raw`(() => {
      const headers = [...document.querySelectorAll('[class*="think-header"]')];
      return JSON.stringify({
        thinkCount: headers.length,
        allThought: headers.every((h) => (h.textContent || '').includes('已思考')),
        legacyHeader: !!document.querySelector('[class*="thinking-header"]'),
        groupCount: document.querySelectorAll('[class*="markdown-custom-process-group"]').length,
        expandedCount: [...document.querySelectorAll('[class*="think-content"]')].filter(
          (c) => c.className.includes('is-expanded'),
        ).length,
        contentOk: [...document.querySelectorAll('[class*="think-content-inner"]')].some(
          (c) => (c.textContent || '').includes('第一轮思考'),
        ),
      });
    })()`,
    'think render probe',
  );
  const parsed = JSON.parse(probe);
  expect(
    parsed.thinkCount === 2,
    `期望 2 个思考块（两轮思考），实际 ${parsed.thinkCount}`,
  );
  expect(parsed.allThought, `思考块标题应全部为「已思考」：${probe}`);
  expect(!parsed.legacyHeader, '旧顶部思考区（thinking-header）不应出现');
  expect(parsed.groupCount >= 1, `应存在工具调用组，实际 ${parsed.groupCount}`);
  expect(
    parsed.expandedCount === 0,
    `终态后思考块应全部收起，实际展开 ${parsed.expandedCount} 个`,
  );
  expect(parsed.contentOk, '思考内容解码异常（未见「第一轮思考」文本）');
};

/**
 * 渲染类型全景探针（RENDER_SHOWCASE，双轨）：
 * Plan 步骤与进度、diff 标题、工具组、耗时徽标、终端输出、task-result、
 * conversation 链接逐一断言；OpenUI inline 断言仅 legacy 轨执行
 * （runtime 轨投影未接 OpenUI applier，已知缺口）。
 */
const driveRenderShowcaseProbe = async () => {
  await waitForReplaySettled();
  await waitForRenderStable();
  const probe = await pageJs(
    String.raw`(() => {
      const bodyText = document.body.textContent;
      return JSON.stringify({
        planStepText: bodyText.includes('部署发布上线'),
        planFirstStep: bodyText.includes('拉取订单数据'),
        planProgress: bodyText.includes('3/3'),
        diffTitle: bodyText.includes('report/index.html'),
        groupCount: document.querySelectorAll('[class*="markdown-custom-process-group"]').length,
        groupLabel: bodyText.includes('工具调用'),
        durationText: /(^|[^0-9])(1\.8s|2\.4s|3\.2s|6s)([^0-9]|$)/.test(bodyText),
        terminalCmd: bodyText.includes('$ pnpm build'),
        exitOkBadge: bodyText.includes('exit 0'),
        taskResultText: bodyText.includes('月度报表页面'),
        conversationLink: bodyText.includes('查看任务详情'),
        thinkCount: document.querySelectorAll('[class*="think-header"]').length,
      });
    })()`,
    'render showcase probe',
  );
  const parsed = JSON.parse(probe);
  expect(
    parsed.planStepText && parsed.planFirstStep,
    `Plan 步骤应渲染：${probe}`,
  );
  expect(parsed.planProgress, `Plan 进度摘要（3/3）应渲染：${probe}`);
  expect(parsed.diffTitle, '文件 diff 标题（report/index.html）应渲染');
  expect(
    parsed.groupCount >= 1 && parsed.groupLabel,
    `工具调用组应渲染：${probe}`,
  );
  expect(parsed.durationText, `工具耗时徽标应渲染：${probe}`);
  expect(
    parsed.terminalCmd && parsed.exitOkBadge,
    `终端输出卡片应渲染（命令行 + exit 徽标）：${probe}`,
  );
  expect(parsed.taskResultText, 'task-result 行应渲染');
  expect(parsed.conversationLink, 'conversation 链接应渲染');
  expect(parsed.thinkCount >= 1, `思考块应渲染：${probe}`);

  const line = await probeLine();
  if (line === 'LEGACY') {
    await waitForText('订单总量：12,480', 15);
  }
};

/**
 * 终端输出探针（TERMINAL_OUTPUT，双轨）：
 * 命令行标题、退出码徽标（0 绿 / 1 红）、耗时徽标、点击展开全量输出。
 */
const driveTerminalOutputProbe = async () => {
  await waitForReplaySettled();
  await waitForRenderStable();
  const probe = await pageJs(
    String.raw`(() => {
      const bodyText = document.body.textContent;
      return JSON.stringify({
        installCmd: bodyText.includes('$ npm install'),
        exitOk: bodyText.includes('exit 0'),
        exitErr: bodyText.includes('exit 1'),
        testCmd: bodyText.includes('$ npm test'),
        finalText: bodyText.includes('测试全部通过'),
        collapsedOutputHidden: !bodyText.includes('found 0 vulnerabilities'),
      });
    })()`,
    'terminal output probe',
  );
  const parsed = JSON.parse(probe);
  expect(parsed.installCmd, '命令行标题应渲染（$ npm install）');
  expect(parsed.testCmd, '命令行标题应渲染（$ npm test）');
  expect(parsed.exitOk, 'exit 0 徽标应渲染');
  expect(parsed.exitErr, 'exit 1 徽标应渲染');
  expect(parsed.finalText, '终态正文应渲染');
  expect(
    parsed.collapsedOutputHidden,
    `终态下未展开的终端输出不应露出全文：${probe}`,
  );

  // 点击第一个终端卡片标题 → 展开全量输出块
  const terminalTitles = await pageJs(
    String.raw`(() => {
      const titles = [...document.querySelectorAll(
        '[class*="process-title"][class*="is-terminal"]',
      )];
      if (!titles.length) return 0;
      titles[0].click();
      return titles.length;
    })()`,
    'click terminal title',
  );
  await pause(0.4);
  const fullBlockCount = await pageJs(
    String.raw`document.querySelectorAll('[class*="terminal-output"]').length`,
    'terminal full blocks',
  );
  expect(
    Number(terminalTitles) >= 3,
    `应有 ≥3 个终端卡片（install/test/retest），实际 ${terminalTitles}`,
  );
  expect(
    Number(fullBlockCount) >= 1,
    `点击展开后应出现终端输出块，实际 ${fullBlockCount}`,
  );
};

/**
 * 交互型用例：speed 放大留出点击窗口（delayMs × speed = 等待窗）；
 * 干预类走 ask 模式（审批 DockPanel 的业务门禁——会话框开启审批才出现）；
 * 渲染探针（×RenderProbe）speed 用瞬间档，收尾后只读断言终态 DOM。
 */
const INTERACTIVE_CASES = [
  {
    id: 'PERMISSION_REQUEST',
    speed: 5,
    drive: drivePermissionAllow,
    agentMode: 'ask',
  },
  { id: 'ASK_QUESTION', speed: 5, drive: driveAskSubmit, agentMode: 'ask' },
  {
    id: 'INTERVENTION_STACK',
    speed: 0.25,
    drive: driveInterventionStack,
    agentMode: 'ask',
  },
  { id: 'MESSAGE_QUEUE_HOLDING', speed: 0.25, drive: driveQueueHolding },
  { id: 'OPENUI_RENDER', speed: 0.05, drive: driveOpenuiRender },
  { id: 'LONG_TASK_INTERLEAVED', speed: 0.05, drive: driveThinkRenderProbe },
  { id: 'RENDER_SHOWCASE', speed: 0.05, drive: driveRenderShowcaseProbe },
  { id: 'TERMINAL_OUTPUT', speed: 0.05, drive: driveTerminalOutputProbe },
];

// ---------- 过滤 ----------
const interactiveIds = new Set(INTERACTIVE_CASES.map((c) => c.id));
const scenarioFilter = E2E.E2E_SCENARIOS
  ? new Set(E2E.E2E_SCENARIOS.split(',').map((s) => s.trim()))
  : null;
const lineFilter = E2E.E2E_LINE || 'both';
if (!['legacy', 'runtime', 'both'].includes(lineFilter)) {
  throw new Error(`E2E_LINE 仅支持 legacy|runtime|both，收到: ${lineFilter}`);
}
const lines = lineFilter === 'both' ? ['legacy', 'runtime'] : [lineFilter];
// MESSAGE_QUEUE_HOLDING 无 autoplay 断言型意义（单发不排队），仅交互段覆盖
const scenarios = allScenarios.filter(
  (meta) =>
    meta.id !== 'MESSAGE_QUEUE_HOLDING' &&
    !meta.realTiming &&
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

// ---------- 通用 case 执行 ----------
const runCase = async (
  meta,
  line,
  { speed = SPEED, timeoutSec, drive, agentMode } = {},
) => {
  const url =
    `${APP_BASE}${PAGE_PATH}?scenario=${encodeURIComponent(meta.id)}` +
    `&speed=${speed}&autoplay=1&conversationRuntime=${
      line === 'runtime' ? 1 : 0
    }` +
    (agentMode ? `&agentMode=${agentMode}` : '');
  await withTimeout(gotoAndWait(url, { timeout: 40 }), 60000, 'gotoAndWait');
  await pause(1);

  const probed = await probeLine();
  expect(
    probed === (line === 'runtime' ? 'RUNTIME' : 'LEGACY'),
    `轨归属探针期望 ${line.toUpperCase()}，实际 ${probed}`,
  );

  // 交互驱动先于收尾判定：审批/填表需在场景等待窗内完成，交互后流继续
  if (drive) await drive();

  const snapshot = await waitForSettled(meta, timeoutSec);
  expect(
    snapshot.scenarioId === meta.id,
    `断言快照场景不符：期望 ${meta.id}，实际 ${snapshot.scenarioId}`,
  );
  expect(
    snapshot.line === line,
    `断言快照轨不符：期望 ${line}，实际 ${snapshot.line}`,
  );
  expect(
    snapshot.sawActive,
    '疑似断言空转：全程未见流式活跃态（sawActive=false）',
  );
  checkConsole(snapshot);
  return snapshot;
};

const runNamedCase = async (name, meta, line, options = {}) => {
  try {
    const snapshot = await runCase(meta, line, options);
    cliLog(`✅ ${name}（messages=${snapshot.messageCount}）`);
    results.push({ name, ok: true });
  } catch (error) {
    const isInteractive = name.includes('交互');
    const known = KNOWN_ISSUES.find(
      (k) =>
        k.scenario === meta.id &&
        k.line === line &&
        Boolean(k.interactive) === isInteractive,
    );
    if (known) {
      cliLog(`⚠️  KNOWN-FAIL ${name} — ${known.reason}`);
      knownFails.push({ name, reason: known.reason, error: String(error) });
    } else {
      cliLog(`❌ ${name} — ${String(error).slice(0, 220)}`);
      fail(name, error);
    }
  }
};

// ---------- 单标签串行矩阵 ----------
cliLog(
  `断言型 ${scenarios.length}/${allScenarios.length} 场景 × 轨 ${lines.join(
    '/',
  )}，` +
    `交互型 ${INTERACTIVE_CASES.length} 用例，speed=${SPEED}，超时 ${TIMEOUT_SEC}s` +
    (E2E.E2E_REAL_TIMING === '1' ? '，含真实时长子集' : ''),
);

// ego-browser 的 tab 按 task space 隔离：套件独占一个空间，跑完即焚
const task = await useOrCreateTaskSpace('mock chat e2e acceptance');
await openOrReuseTab(APP_BASE, { wait: true, timeout: 40 });

let index = 0;
const total =
  scenarios.length * lines.length + INTERACTIVE_CASES.length * lines.length;

// 断言型矩阵
for (const meta of scenarios) {
  for (const line of lines) {
    index += 1;
    await runNamedCase(`[${index}/${total}] ${meta.id} · ${line}`, meta, line);
  }
}

// 交互型用例（M3）：goto → 交互驱动 → 收尾判定
for (const line of lines) {
  for (const testCase of INTERACTIVE_CASES) {
    index += 1;
    await runNamedCase(
      `[${index}/${total}] ${testCase.id} · ${line} · 交互`,
      allScenarios.find((meta) => meta.id === testCase.id),
      line,
      {
        speed: testCase.speed,
        drive: testCase.drive,
        agentMode: testCase.agentMode,
      },
    );
  }
}

// 真实时长子集（M3）：默认不跑，E2E_REAL_TIMING=1 时以真实速度追加
if (E2E.E2E_REAL_TIMING === '1') {
  const realTimingScenarios = allScenarios.filter((meta) => meta.realTiming);
  for (const meta of realTimingScenarios) {
    for (const line of lines) {
      index += 1;
      await runNamedCase(
        `[${index}] ${meta.id} · ${line} · 真实时长`,
        meta,
        line,
        { speed: 1, timeoutSec: REAL_TIMING_TIMEOUT_SEC },
      );
      // LATE_CHUNK_SLOW 守卫证据：迟到分片不得上屏（终态守卫丢弃）。
      // 限定消息列表区域——mock 页右侧「SSE 事件」面板会展示服务端发出的
      // 全部事件文本（含迟到分片），查整个 body 会误报
      if (meta.id === 'LATE_CHUNK_SLOW') {
        const leaked = await pageJs(
          String.raw`(() => {
            const items = [...document.querySelectorAll(
              '[class*="message-item"], [class*="chat-message"], [data-message-id]'
            )];
            return items.some(el => el.textContent.includes('迟到分片'));
          })()`,
          '守卫证据消息区探查',
        );
        try {
          expect(
            !leaked,
            '迟到分片未被终态守卫丢弃（消息列表出现「迟到分片」文本）',
          );
          cliLog(
            `✅ [${index}] LATE_CHUNK_SLOW 守卫证据 · ${line}（迟到分片已丢弃）`,
          );
          results.push({
            name: `[${index}] LATE_CHUNK_SLOW 守卫证据 · ${line}`,
            ok: true,
          });
        } catch (error) {
          const known = KNOWN_ISSUES.find(
            (k) => k.scenario === 'LATE_CHUNK_SLOW' && k.line === line,
          );
          if (known) {
            cliLog(
              `⚠️  KNOWN-FAIL [${index}] LATE_CHUNK_SLOW 守卫证据 · ${line} — ${known.reason}`,
            );
            knownFails.push({
              name: `[${index}] LATE_CHUNK_SLOW 守卫证据 · ${line}`,
              reason: known.reason,
              error: String(error),
            });
          } else {
            cliLog(
              `❌ [${index}] LATE_CHUNK_SLOW 守卫证据 · ${line} — ${error}`,
            );
            fail(`[${index}] LATE_CHUNK_SLOW 守卫证据 · ${line}`, error);
          }
        }
      }
    }
  }
} else {
  const skipped = allScenarios.filter((meta) => meta.realTiming).length;
  if (skipped) {
    cliLog(`⏭️  真实时长场景 ×${skipped} 已跳过（E2E_REAL_TIMING=1 启用）`);
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
  `共 ${results.length + knownFails.length} 项，通过 ${passed}，失败 ${
    failed.length
  }，已知差异 ${knownFails.length}`,
);

await completeTaskSpace(task.id, { keep: false });

if (failed.length > 0) {
  throw new Error(`Mock E2E 矩阵失败 ${failed.length} 项`);
}
