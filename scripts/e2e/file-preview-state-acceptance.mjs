/**
 * NW-383：真实 Chat 页面 + 只读文件接口夹具，不向平台创建任务或写文件。
 * 先启动 dev server，再运行：
 * node scripts/e2e/ego-run.mjs scripts/e2e/file-preview-state-acceptance.mjs
 * 可用 E2E_CHAT_URL 指定有权读取的 TaskAgent 会话。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let env = {};
try {
  env = JSON.parse(readFileSync(join(tmpdir(), 'ego-e2e-env.json'), 'utf8'));
} catch {}
const base = env.E2E_BASE_URL || 'http://localhost:3000';
const chat = env.E2E_CHAT_URL || `${base}/home/chat/1560607/1596`;
const conversationId = new URL(chat).pathname.split('/')[3];
const task = await taskSpace(
  env.E2E_TASK_SPACE_ID
    ? Number(env.E2E_TASK_SPACE_ID)
    : 'NW-383 file preview acceptance',
);
const page = task.page(env.E2E_PAGE_LABEL || 'p1');
console.log({ spaceId: task.spaceId, chat });
const output = env.E2E_OUTPUT || join(tmpdir(), 'nw383-acceptance');
mkdirSync(output, { recursive: true });
const results = [];
const assert = (value, description) => {
  if (!value) throw new Error(description);
  results.push(description);
  console.log(`PASS ${description}`);
};
const fixtures = {
  'nw383-reading.html':
    '<!doctype html><html><head><meta charset="UTF-8"></head><body><h1>NW-383 HTML 阅读恢复</h1>' +
    Array.from(
      { length: 50 },
      (_, i) =>
        `<section style="height:150px"><h2>第${
          i + 1
        }节</h2><p>文件预览状态恢复验证</p></section>`,
    ).join('') +
    '</body></html>',
  'nw383-reading.md':
    '# NW-383 Markdown 阅读恢复\n\n' +
    Array.from(
      { length: 100 },
      (_, i) => `## 第${i + 1}节\n\n文件预览应恢复原文件和阅读位置。\n\n`,
    ).join(''),
};
const files = Object.keys(fixtures).map((name) => ({
  name,
  isDir: false,
  fileProxyUrl: `${base}/__nw383_e2e__/${name}`,
}));
let fileRequests = 0;
async function pump() {
  for (const event of await page.events()) {
    if (event.method !== 'Fetch.requestPaused') continue;
    const { requestId, request } = event.params;
    const url = new URL(request.url);
    const file = fixtures[url.pathname.split('/').pop()];
    let body;
    let contentType = 'application/json';
    if (url.pathname.startsWith('/__nw383_e2e__/') && file) {
      body = file;
      contentType = url.pathname.endsWith('.html')
        ? 'text/html; charset=utf-8'
        : 'text/plain; charset=utf-8';
      fileRequests += 1;
    } else if (url.searchParams.get('cId') === conversationId) {
      body = JSON.stringify({
        code: '0000',
        success: true,
        data: { files, recursive: false },
      });
    } else {
      await page.cdp('Fetch.continueRequest', { requestId });
      continue;
    }
    try {
      await page.cdp('Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        responseHeaders: [
          { name: 'Content-Type', value: contentType },
          { name: 'Access-Control-Allow-Origin', value: new URL(base).origin },
          { name: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
        body: Buffer.from(body).toString('base64'),
      });
    } catch (error) {
      // 切页/刷新会取消已排入事件队列的旧请求，只忽略这类已失效拦截。
      if (!String(error).includes('Invalid InterceptionId')) throw error;
    }
  }
}
async function until(fn, description, timeout = 20000, ready = () => true) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    await pump();
    if (ready() && (await page.evaluate(fn))) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(description);
}
async function flushScroll() {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function roundTrip() {
  await page.click('text="资料库"');
  await page.evaluate(() => history.back());
}

try {
  await page.goto(chat);
  await page.cdp('Fetch.enable', {
    patterns: [
      { urlPattern: '*/api/computer/static/file-list*' },
      { urlPattern: '*/api/computer/static/search-files*' },
      { urlPattern: `${base}/__nw383_e2e__/*` },
    ],
  });
  await until(
    () =>
      !!document.querySelector(
        '[aria-label="打开产物"],[aria-label="关闭产物"]',
      ),
    '会话未就绪',
  );
  if (
    await page.evaluate(
      () => !!document.querySelector('[aria-label="打开产物"]'),
    )
  )
    await page.click('loc=css:[aria-label="打开产物"]');
  await until(
    () => !!document.querySelector('button svg[data-icon="menu-unfold"]'),
    '文件预览未打开',
  );
  assert(
    await page.evaluate(
      () =>
        ![
          ...document.querySelectorAll('input[placeholder="搜索文件..."]'),
        ].some((e) => e.getClientRects().length),
    ),
    '文件树默认收起',
  );
  await page.click('loc=css:button:has(svg[data-icon="menu-unfold"]) >> nth=0');
  await until(
    () => document.body.innerText.includes('nw383-reading.html'),
    '文件列表未到达',
  );
  await page.click('text="nw383-reading.html"');
  await until(
    () =>
      !!document
        .querySelector('iframe[title="HTML Preview"]')
        ?.contentDocument?.body?.innerText.includes('NW-383'),
    'HTML 正文未加载',
  );
  await page.evaluate(() =>
    document
      .querySelector('iframe[title="HTML Preview"]')
      .contentWindow.scrollTo(0, 1200),
  );
  await flushScroll();
  await roundTrip();
  await until(
    () =>
      document.querySelector('iframe[title="HTML Preview"]')?.contentWindow
        ?.scrollY === 1200,
    'HTML 切回未恢复',
  );
  assert(true, 'HTML 切回恢复原文件和 1200px 阅读位置');
  assert(
    await page.evaluate(() =>
      [...document.querySelectorAll('input[placeholder="搜索文件..."]')].some(
        (e) => e.getClientRects().length,
      ),
    ),
    '手动展开文件树后切回仍展开',
  );
  const beforeHtmlRefresh = fileRequests;
  await page.click('loc=css:button[aria-label="刷新"]');
  await until(
    () =>
      document.querySelector('iframe[title="HTML Preview"]')?.contentWindow
        ?.scrollY === 1200 &&
      !!document
        .querySelector('iframe[title="HTML Preview"]')
        ?.contentDocument?.body?.innerText.includes('NW-383'),
    'HTML 刷新未恢复',
    20000,
    () => fileRequests > beforeHtmlRefresh,
  );
  await pump();
  assert(fileRequests > beforeHtmlRefresh, 'HTML 重新加载正文后保留阅读位置');
  await page.click('text="nw383-reading.md"');
  await until(
    () => !!document.querySelector('[data-file-preview-viewport] .ds-markdown'),
    'Markdown 正文未加载',
  );
  await page.evaluate(() => {
    document.querySelector(
      '[data-file-preview-viewport] .ds-markdown',
    ).scrollTop = 900;
  });
  await flushScroll();
  await page.click('loc=css:button:has(svg[data-icon="menu-fold"]) >> nth=0');
  await roundTrip();
  await until(
    () =>
      document.querySelector('[data-file-preview-viewport] .ds-markdown')
        ?.scrollTop === 900,
    'Markdown 切回未恢复',
  );
  assert(true, 'Markdown 切回恢复原文件和 900px 阅读位置');
  assert(
    await page.evaluate(
      () =>
        ![
          ...document.querySelectorAll('input[placeholder="搜索文件..."]'),
        ].some((e) => e.getClientRects().length),
    ),
    '手动收起文件树后切回仍收起',
  );
  await page.screenshot({ path: join(output, 'restored.png') });
  await page.click('text="资料库"');
  console.log('等待已完成会话的 60 秒缓存宽限期释放');
  await new Promise((resolve) => setTimeout(resolve, 30000));
  await pump();
  await new Promise((resolve) => setTimeout(resolve, 31000));
  await until(
    () => !document.querySelector('[data-file-preview-viewport]'),
    '会话实例未释放',
  );
  assert(true, '完成会话的缓存实例已释放');
  await page.evaluate(() => history.back());
  await until(
    () =>
      document.querySelector('[data-file-preview-viewport] .ds-markdown')
        ?.scrollTop === 900,
    '实例重建未恢复阅读状态',
  );
  assert(true, '实例释放后重新进入仍恢复原文件、阅读位置和收起偏好');
  assert(
    await page.evaluate(
      () => !document.body.innerText.includes('没有匹配到对应的文件'),
    ),
    '没有残留文件匹配失败空态',
  );
  writeFileSync(
    join(output, 'result.json'),
    JSON.stringify({ chat, results, fileRequests, fixture: true }, null, 2),
  );
  console.log({ output, passed: results.length });
  await page.cdp('Fetch.disable');
  if (!env.E2E_TASK_SPACE_ID) await task.finish({ keep: [] });
} catch (error) {
  await page.screenshot({ path: join(output, 'failure.png') });
  console.log((await page.snapshot()).slice(-3000));
  throw error;
}
