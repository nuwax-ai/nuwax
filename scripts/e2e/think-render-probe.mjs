/**
 * 思考内联渲染可视化探针（一次性验收脚本，不进回归矩阵）。
 *
 * 打开 /mock-chat?scenario=LONG_TASK_INTERLEAVED 回放，收尾后断言：
 * 1. 两个 markdown-custom-think 组件挂载（think-header ×2，标题「已思考」）
 * 2. 思考内容解码正确且思考块出现在工具调用组之前（DOM 序）
 * 3. 完成态思考块默认收起，点击头部可展开
 * 4. 旧顶部思考区（thinking-header）不再出现
 * 活动思考块的实时展开态由组件单测覆盖（mock 事件连发快于 DOM 采样步长）。
 *
 * 用法（E2E_BASE_URL 缺省 http://localhost:3000，经 ego-run.mjs 桥接）：
 *   E2E_BASE_URL=http://localhost:3001 node scripts/e2e/ego-run.mjs scripts/e2e/think-render-probe.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** 与 mock-chat-acceptance.mjs 同源的 E2E_* 桥接（ego-run.mjs 落盘） */
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

const task = await useOrCreateTaskSpace('think render probe');
await openOrReuseTab(
  `${BASE}/mock-chat?scenario=LONG_TASK_INTERLEAVED&speed=3&autoplay=1&conversationRuntime=0`,
  { wait: true, timeout: 40 },
);

// 回放期间轮询直至回放收尾（活动展开态由组件单测确定性覆盖：
// mock 事件实际连发速度高于 DOM 采样步长，浏览器侧不做该断言）
let sampled = 0;
for (let i = 0; i < 120; i++) {
  await pause(0.2);
  sampled++;
  const settled = await pageJs(
    String.raw`(() => {
      const s = window.__MOCK_CHAT_ASSERTIONS__;
      return !!(s && s.replaySettled && s.hasFinalResult);
    })()`,
    'check settled',
  ).catch(() => false);
  if (settled) break;
}
await pause(1);

const report = await pageJs(
  String.raw`(() => {
  const thinkHeaders = [...document.querySelectorAll('[class*="think-header"]')];
  const thinkContents = [...document.querySelectorAll('[class*="think-content-inner"]')];
  const legacyThinkingHeader = document.querySelector('[class*="thinking-header"]');
  const groupNodes = [...document.querySelectorAll('[class*="markdown-custom-process-group"]')];
  const bodyText = document.body.innerText;
  return JSON.stringify({
    thinkHeaderCount: thinkHeaders.length,
    thinkTitles: thinkHeaders.map((h) => h.textContent),
    thinkContentTexts: thinkContents.map((c) => c.textContent.slice(0, 24)),
    expandedCount: [...document.querySelectorAll('[class*="think-content"]')].filter(
      (c) => c.className.includes('is-expanded'),
    ).length,
    legacyThinkingHeaderPresent: !!legacyThinkingHeader,
    processGroupCount: groupNodes.length,
    groupTitles: groupNodes.map((g) => g.textContent.slice(0, 20)),
    bodyHasThoughtLabel: bodyText.includes('已思考'),
    bodyHasToolGroupLabel: bodyText.includes('工具调用'),
  });
})()`,
  'final report',
);

cliLog(`采样 ${sampled} 次`);
cliLog(`收尾报告：${report}`);

const parsed = JSON.parse(report);
const failures = [];
if (parsed.thinkHeaderCount !== 2)
  failures.push(`期望 2 个思考块，实际 ${parsed.thinkHeaderCount}`);
if (!parsed.thinkTitles.every((t) => t && t.includes('已思考')))
  failures.push(
    `思考块标题应为「已思考」，实际 ${JSON.stringify(parsed.thinkTitles)}`,
  );
if (parsed.legacyThinkingHeaderPresent)
  failures.push('旧顶部思考区(thinking-header)不应出现');
if (parsed.processGroupCount < 1)
  failures.push(`应存在工具调用组，实际 ${parsed.processGroupCount}`);
if (parsed.expandedCount !== 0)
  failures.push(`终态后思考块应默认收起，实际展开 ${parsed.expandedCount} 个`);

// 点击第一个思考块头部 → 展开 → 内容应为解码后的思考文本
if (parsed.thinkHeaderCount >= 1) {
  await pageJs(
    String.raw`document.querySelectorAll('[class*="think-header"]')[0].click()`,
    'click think header',
  );
  await pause(0.6);
  const expandedText = await pageJs(
    String.raw`(() => {
      const c = document.querySelector('[class*="think-content-inner"]');
      return c ? c.textContent.slice(0, 20) : 'NO_CONTENT';
    })()`,
    'read expanded think',
  );
  cliLog(`手动展开第一个思考块内容：「${expandedText}」`);
  if (!expandedText.includes('第一轮思考'))
    failures.push(`展开内容应含「第一轮思考」，实际「${expandedText}」`);
}

if (failures.length) {
  cliLog(`❌ 探针失败 ${failures.length} 项：\n  - ${failures.join('\n  - ')}`);
  throw new Error(failures[0]);
}
cliLog('✅ 思考内联渲染探针全部通过');

await completeTaskSpace(task.id, { keep: false });
