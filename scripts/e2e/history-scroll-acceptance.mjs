/** 只读长会话验收：实际历史请求、前插锚定、请求期间和安置窗口内的用户滚动。 */
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let env = {};
try {
  env = JSON.parse(readFileSync(join(tmpdir(), 'ego-e2e-env.json'), 'utf8'));
} catch {}
const base = env.E2E_BASE_URL || 'http://localhost:3000';
const chat = env.E2E_CHAT_URL || `${base}/home/chat/1560617/3994`;
const task = await taskSpace(
  env.E2E_TASK_SPACE_ID
    ? Number(env.E2E_TASK_SPACE_ID)
    : 'history scroll acceptance',
);
const page = task.page(env.E2E_PAGE_LABEL || 'p1');
const results = [];
const output =
  env.E2E_OUTPUT || join(tmpdir(), 'nuwax-history-scroll-acceptance.json');
console.log({ spaceId: task.spaceId });
await page.cdp('Network.enable');
try {
  for (const runtime of [0, 1]) {
    await page.cdp('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    const url = new URL(chat);
    url.searchParams.set('conversationRuntime', String(runtime));
    url.searchParams.set('conversationRenderer', 'v2');
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => {
        const e = document.querySelector('[class*="chat-wrapper-content"]');
        const signature =
          e &&
          `${e.scrollHeight}:${e.firstElementChild?.children.length}:${e.scrollTop}`;
        const previous = window.__HISTORY_SCROLL_READY__;
        if (!previous || previous.signature !== signature) {
          window.__HISTORY_SCROLL_READY__ = {
            signature,
            at: performance.now(),
          };
        }
        return (
          e?.clientHeight > 0 &&
          e.scrollHeight > e.clientHeight + 100 &&
          e.querySelector('[data-history-scroll-sentinel]') &&
          !e
            .querySelector('[data-history-scroll-sentinel]')
            .textContent.trim() &&
          !e.__isProgrammaticScroll &&
          Math.abs(e.scrollHeight - e.clientHeight - e.scrollTop) < 2 &&
          performance.now() - window.__HISTORY_SCROLL_READY__.at > 500
        );
      },
      undefined,
      { timeout: 30000 },
    );
    await page.cdp('Network.emulateNetworkConditions', {
      offline: false,
      // 真实请求增加固定网络延迟，确保能在请求尚未返回时投递第二次滚轮输入。
      latency: 5000,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    const rect = await page.evaluate(() => {
      const e = document.querySelector('[class*="chat-wrapper-content"]');
      e.scrollTop = 60;
      e.dispatchEvent(new Event('scroll'));
      const r = e.getBoundingClientRect();
      // 留白处接收滚轮，避免长回答中的代码块/表格先消费滚动。
      return { x: r.x + 20, y: r.y + 100 };
    });
    await page.mouse.move(rect.x, rect.y);
    await page.mouse.wheel(0, -40, { label: '上滑加载历史' });
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-history-scroll-sentinel]')
          ?.textContent.trim(),
      undefined,
      { timeout: 10000 },
    );
    await page.evaluate(() => {
      const e = document.querySelector('[class*="chat-wrapper-content"]');
      const a = [...e.firstElementChild.children].find(
        (n) =>
          !n.hasAttribute('data-history-scroll-sentinel') &&
          n.offsetHeight > 0 &&
          n.getBoundingClientRect().bottom > e.getBoundingClientRect().top + 1,
      );
      window.__HISTORY_SCROLL_AUDIT__ = {
        anchor: a,
        count: e.firstElementChild.children.length,
        top: e.scrollTop,
      };
    });
    await page.mouse.wheel(0, -8, { label: '加载期间继续上滚' });
    await page.waitForFunction(
      () =>
        document.querySelector('[class*="chat-wrapper-content"]').scrollTop <
        window.__HISTORY_SCROLL_AUDIT__.top,
    );
    const reading = await page.evaluate(() => {
      const e = document.querySelector('[class*="chat-wrapper-content"]');
      const a = window.__HISTORY_SCROLL_AUDIT__;
      a.readingOffset =
        a.anchor.getBoundingClientRect().top - e.getBoundingClientRect().top;
      return { top: e.scrollTop, offset: a.readingOffset, count: a.count };
    });
    await page.waitForFunction(
      () => {
        const e = document.querySelector('[class*="chat-wrapper-content"]');
        return (
          e.firstElementChild.children.length >
            window.__HISTORY_SCROLL_AUDIT__.count &&
          !e.querySelector('[data-history-scroll-sentinel]')?.textContent.trim()
        );
      },
      undefined,
      { timeout: 15000 },
    );
    const landed = await page.evaluate(() => {
      const e = document.querySelector('[class*="chat-wrapper-content"]');
      return {
        top: e.scrollTop,
        offset:
          window.__HISTORY_SCROLL_AUDIT__.anchor.getBoundingClientRect().top -
          e.getBoundingClientRect().top,
        count: e.firstElementChild.children.length,
      };
    });
    if (Math.abs(landed.offset - reading.offset) > 1)
      throw new Error(
        `历史前插失锚：${JSON.stringify({ runtime, reading, landed })}`,
      );
    await page.mouse.wheel(0, 20, { label: '落地后主动滚动' });
    await page.waitForFunction(
      (before) =>
        document.querySelector('[class*="chat-wrapper-content"]').scrollTop >
        before + 5,
      landed.top,
    );
    const user = await page.evaluate(() => {
      const e = document.querySelector('[class*="chat-wrapper-content"]');
      window.__HISTORY_SCROLL_AUDIT__.userAt = performance.now();
      return {
        top: e.scrollTop,
        offset:
          window.__HISTORY_SCROLL_AUDIT__.anchor.getBoundingClientRect().top -
          e.getBoundingClientRect().top,
      };
    });
    await page.waitForFunction(
      () => performance.now() - window.__HISTORY_SCROLL_AUDIT__.userAt > 1000,
    );
    const settled = await page.evaluate(() => {
      const e = document.querySelector('[class*="chat-wrapper-content"]');
      return {
        top: e.scrollTop,
        offset:
          window.__HISTORY_SCROLL_AUDIT__.anchor.getBoundingClientRect().top -
          e.getBoundingClientRect().top,
      };
    });
    if (Math.abs(user.offset - settled.offset) > 1)
      throw new Error(
        `安置窗口拉回用户：${JSON.stringify({ runtime, user, settled })}`,
      );
    results.push({ runtime, renderer: 'v2', reading, landed, user, settled });
    writeFileSync(
      output,
      JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2),
    );
    console.log(results.at(-1));
  }
} finally {
  await page.cdp('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
}
writeFileSync(
  output,
  JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2),
);
console.log({ output });
if (!env.E2E_TASK_SPACE_ID) await task.finish({ keep: [] });
