/**
 * 思考流式期间用户滚动探针（一次性诊断脚本，不进回归矩阵）。
 *
 * 现象：正在思考渲染时内容区无法滚动（疑似重复渲染/自动置底打断用户滚动）。
 * 排查状态（2026-08-26）：代码二分冷启动对照全部干净（M1 前/M1 五件套/
 * pc-client-bridge 合并/当前头均 0~1 个 longtask），异常仅出现在长时间热更的
 * dev server（17 个 longtask/峰值 977ms）——判定为 HMR 污染而非代码回归，
 * 问题跳过未修。本探针保留待真实环境复现时使用。
 *
 * 注意：mock 页复现窗口未调通——mock 布局下消息区固定高 562px，
 * 「正在思考 && 内容可滚（scrollHeight > clientHeight + 20）」的交集短暂，
 * 轮询易错过；若要 mock 复现需先改造场景（更长历史或缩小视口），
 * 或直接在真实 Chat 页注入本脚本的探测逻辑。
 *
 * 打开 /mock-chat?scenario=COLLAPSE_SHOWCASE，在「正在思考」且消息区可滚时：
 * 1. 定位会话滚动容器（chat-wrapper-content，必要时向上找可滚祖先）
 * 2. 模拟用户向上滚动（scrollTop 上移 + wheel deltaY<0 派发）
 * 3. 等待 1.5s（覆盖流式分片 + 60/150/400/800ms 多级置底兜底）
 * 4. 断言 scrollTop 仍停留在上方（未被拽回底部）且 wheel 后仍可继续上移
 *
 * 用法：
 *   E2E_BASE_URL=http://localhost:3000 node scripts/e2e/ego-run.mjs scripts/e2e/think-scroll-probe.mjs
 */

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
      setTimeout(
        () => reject(new Error(`ego 调用超时（${label}，${ms}ms）`)),
        ms,
      ),
    ),
  ]);

const pageJs = (code, label = 'js') => withTimeout(js(code), 15000, label);
const pause = (s) => withTimeout(wait(s), 10000, `wait ${s}s`);

const BASE = loadE2eEnv().E2E_BASE_URL || 'http://localhost:3000';

const task = await useOrCreateTaskSpace('think scroll probe');
await openOrReuseTab(
  `${BASE}/mock-chat?scenario=COLLAPSE_SHOWCASE&speed=6&autoplay=1&conversationRuntime=0`,
  { wait: true, timeout: 40 },
);

// 探测可滚动容器：从消息区向上找 overflow 为 auto/scroll 且内容溢出的元素
const findScroller = String.raw`(() => {
  const seed = document.querySelector('[class*="chat-wrapper-content"]')
    || document.querySelector('[class*="chat-wrapper"]');
  if (!seed) return JSON.stringify({ error: 'seed not found' });
  let el = seed;
  for (let i = 0; i < 8 && el; i++) {
    const style = window.getComputedStyle(el);
    const scrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll')
      && el.scrollHeight > el.clientHeight + 4;
    if (scrollable) {
      return JSON.stringify({
        found: true,
        tag: el.tagName,
        className: String(el.className).slice(0, 80),
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      });
    }
    el = el.parentElement;
  }
  return JSON.stringify({
    error: 'no scrollable ancestor',
    seedClass: String(seed.className).slice(0, 80),
    seedH: seed.scrollHeight,
    seedCH: seed.clientHeight,
  });
})()`;

// 1. 等待「正在思考」出现且消息区已可滚动（中后段思考：前面工具/正文已撑高内容）
let thinkingSeen = false;
for (let i = 0; i < 180; i++) {
  await pause(0.2);
  const state = await pageJs(
    String.raw`(() => {
      const s = window.__MOCK_CHAT_ASSERTIONS__;
      const el = document.querySelector('[class*="chat-wrapper-content"]');
      const thinking = document.body.textContent.includes('正在思考');
      const scrollable = !!el && el.scrollHeight > el.clientHeight + 20;
      return JSON.stringify({
        settled: !!s?.settled,
        thinking,
        scrollable,
        h: el ? el.scrollHeight : 0,
        ch: el ? el.clientHeight : 0,
      });
    })()`,
    'poll thinking',
  );
  const parsed = JSON.parse(state);
  if (parsed.thinking && parsed.scrollable) {
    thinkingSeen = true;
    console.log(
      `[probe] 思考中且可滚: h=${parsed.h} ch=${parsed.ch} (${(i * 0.2).toFixed(1)}s)`,
    );
    break;
  }
  if (parsed.settled) {
    console.log(
      `[probe] 回放已结束（thinking=${parsed.thinking} scrollable=${parsed.scrollable} h=${parsed.h}）`,
    );
    break;
  }
}
const scrollerInfo = await pageJs(findScroller, 'find scroller');
console.log(`[probe] 滚动容器: ${scrollerInfo}`);

// 2. 模拟用户向上滚动并采样行为（复用同一探测逻辑定位滚动容器）
const firstScroll = await pageJs(
  String.raw`(() => {
    const seed = document.querySelector('[class*="chat-wrapper-content"]');
    if (!seed) return JSON.stringify({ error: 'seed not found' });
    let el = seed;
    for (let i = 0; i < 8 && el; i++) {
      const style = window.getComputedStyle(el);
      const scrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll')
        && el.scrollHeight > el.clientHeight + 4;
      if (scrollable) break;
      el = el.parentElement;
    }
    if (!el) return JSON.stringify({ error: 'no scrollable ancestor' });
    const before = {
      className: String(el.className).slice(0, 80),
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    };
    // 模拟用户上滚：派发向上滚轮 + 直接上移 scrollTop（触发 scroll 检测）
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }));
    el.scrollTop = Math.max(0, el.scrollTop - 400);
    window.__PROBE_SCROLL_EL__ = el;
    return JSON.stringify({ before, after: el.scrollTop });
  })()`,
  'user scroll up',
);
console.log(`[probe] 首次上滚: ${firstScroll}`);

// 3. 等待流式分片 + 多级置底兜底窗口
await pause(1.5);

const check = await pageJs(
  String.raw`(() => {
    const el = window.__PROBE_SCROLL_EL__;
    if (!el) return JSON.stringify({ error: 'el gone' });
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // 再次模拟上滚，验证仍可继续向上
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }));
    const prevTop = el.scrollTop;
    el.scrollTop = Math.max(0, el.scrollTop - 200);
    const movedAgain = el.scrollTop < prevTop;
    const thinkingNow = document.body.textContent.includes('正在思考');
    return JSON.stringify({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      distanceFromBottom,
      draggedBack: distanceFromBottom <= 50,
      movedAgain,
      thinkingNow,
    });
  })()`,
  'after 1.5s',
);
console.log(`[probe] 1.5s 后: ${check}`);

const parsed = JSON.parse(check);
if (parsed.error) {
  console.log('❌ 探针异常:', parsed.error, '| 首滚:', firstScroll);
  cliLog('FAIL');
} else if (parsed.draggedBack) {
  console.log(
    '❌ 复现：用户上滚 1.5s 后被自动置底拽回（distanceFromBottom<=50），思考流式期间无法停留滚动位置',
  );
  cliLog('FAIL');
} else {
  console.log(
    `✅ 未复现：上滚后停住（距底部 ${Math.round(parsed.distanceFromBottom)}px），可继续上移=${parsed.movedAgain}，当时仍在思考=${parsed.thinkingNow}`,
  );
  cliLog('PASS');
}
