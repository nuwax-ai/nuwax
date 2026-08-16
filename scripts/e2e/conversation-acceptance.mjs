/**
 * 会话模块真实页面验收套件（ego-browser 驱动）
 *
 * 用法：
 *   1. 启动 dev server（npm run dev，默认 localhost:3000）
 *   2. ego-browser 已安装且用户浏览器持有登录态（套件继承登录态）
 *   3. npm run e2e:conversation
 *      等价于 ego-browser nodejs < scripts/e2e/conversation-acceptance.mjs
 *
 * 场景对应 docs/conversation-refactor-plan.md §9.2 的页面级断言
 * （Browser 层：乐观上屏、流式收尾、DOM 行数、flag 双线切换、加载更多、TaskAgent）。
 * 全部通过 exit 0；任一失败 exit 1（可接 CI / 本地回归）。
 */

const APP_BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';
/** 验收用会话（女娲Nuwax 测试智能体；从环境覆盖） */
const CHAT_URL =
  process.env.E2E_CHAT_URL ||
  `${APP_BASE}/home/chat/1560617/3994`;
const TASKAGENT_URL =
  process.env.E2E_TASKAGENT_URL ||
  `${APP_BASE}/home/chat/1560607/1596`;
const FLAG_PARAM = 'conversationRuntime=1';
const MSG_PREFIX = '[E2E验收]';
const TASK_SPACE = 'conversation e2e acceptance';

// ---------- 前置探测：dev server 未启动时给出清晰指引 ----------
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
        `   或通过环境变量指定已运行的地址: E2E_BASE_URL=http://<host:port> npm run e2e:conversation`,
    );
    throw new Error('dev server unreachable');
  }
}

// ---------- 断言与报告 ----------
const results = [];
const pass = (name) => results.push({ name, ok: true });
const fail = (name, error) =>
  results.push({ name, ok: false, error: String(error).slice(0, 300) });

async function scenario(name, fn) {
  try {
    await fn();
    pass(name);
    cliLog(`✅ ${name}`);
  } catch (error) {
    fail(name, error);
    cliLog(`❌ ${name} — ${String(error).slice(0, 200)}`);
  }
}

const expect = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

// ---------- 页面探针（与手测轮一致的方法） ----------
/** 消息行计数（DOM 探针） */
const countMessages = async () =>
  js(
    String.raw`document.querySelectorAll('[class*="message-item"], [class*="chat-message"], [data-message-id]').length`,
  );

/** 线归属决定性探针：消费 onSendMessage 的组件 props 源码含 session.send = 新线 */
const probeLine = async () =>
  js(String.raw`(() => {
    const editor = document.querySelector('.mention-editor___tr1OZ');
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

/** 在输入框发送一条消息 */
const sendMessage = async (text) => {
  await click('.mention-editor___tr1OZ', { label: `send: ${text.slice(0, 16)}` });
  await wait(0.5);
  await typeText(text);
  await pressKey('Enter');
};

/** 等待流式收尾：停止按钮/执行中提示消失且消息条数稳定 */
const waitForStreamSettled = async (timeoutSec = 40) => {
  const deadline = Date.now() + timeoutSec * 1000;
  let lastCount = -1;
  let stableSince = 0;
  while (Date.now() < deadline) {
    await wait(2);
    const state = await js(String.raw`(() => ({
      count: document.querySelectorAll('[class*="message-item"], [class*="chat-message"], [data-message-id]').length,
      executing: document.body.textContent.includes('正在执行'),
    }))()`);
    if (state.count === lastCount && !state.executing) {
      if (!stableSince) stableSince = Date.now();
      if (Date.now() - stableSince >= 4000) return state; // 稳定 4s 视为收尾
    } else {
      stableSince = 0;
      lastCount = state.count;
    }
  }
  throw new Error('流式未在超时内收尾');
};

// ---------- 套件 ----------
const task = await useOrCreateTaskSpace(TASK_SPACE);
cliLog(`task space: ${task.id} | base: ${APP_BASE}`);

// E2E-01 登录态与首页可用
await scenario('E2E-01 登录态加载（home 最近使用可见）', async () => {
  await openOrReuseTab(APP_BASE + '/home', { wait: true, timeout: 40 });
  await wait(4);
  const state = await js(String.raw`(() => ({
    hasRecent: document.body.textContent.includes('最近使用'),
    editorEnv: !!document.querySelector('[class*="conversation"], [class*="chat"]'),
  }))()`);
  expect(state.hasRecent, 'home 未出现「最近使用」——登录态可能失效');
});

// E2E-02 legacy 线发送全流程
await scenario('E2E-02 legacy 线：乐观追加 + 流式回复 + 收尾干净', async () => {
  await gotoAndWait(CHAT_URL, { timeout: 40 });
  await wait(5);
  expect((await probeLine()) === 'LEGACY', '默认应为 LEGACY 线');
  const before = await countMessages();
  const stamp = Date.now().toString().slice(-6);
  await sendMessage(`${MSG_PREFIX}${stamp} legacy线 请回复收到`);
  await wait(2);
  const immediate = await countMessages();
  expect(
    immediate >= before + 2,
    `乐观追加失败：before=${before} immediate=${immediate}`,
  );
  const settled = await waitForStreamSettled();
  expect(settled.count >= immediate, '收尾后消息数不应回退');
  expect(!settled.executing, '收尾后不应残留「正在执行」');
});

// E2E-03 runtime 线发送全流程（fiber 探针决定性判定）
await scenario('E2E-03 runtime 线：探针 RUNTIME + 发送流式 + 收尾干净', async () => {
  const url = CHAT_URL + (CHAT_URL.includes('?') ? '&' : '?') + FLAG_PARAM;
  await gotoAndWait(url, { timeout: 40 });
  await wait(5);
  expect((await probeLine()) === 'RUNTIME', 'flag=1 应为 RUNTIME 线');
  const before = await countMessages();
  const stamp = Date.now().toString().slice(-6);
  await sendMessage(`${MSG_PREFIX}${stamp} runtime线 请回复收到`);
  await wait(2);
  const immediate = await countMessages();
  expect(
    immediate >= before + 2,
    `runtime 乐观追加失败：before=${before} immediate=${immediate}`,
  );
  const settled = await waitForStreamSettled();
  expect(!settled.executing, 'runtime 收尾后不应残留「正在执行」');
  // 流后仍是新线（覆盖顺序稳定）
  expect((await probeLine()) === 'RUNTIME', '流后线归属漂移');
});

// E2E-04 runtime 线上滑加载更多
await scenario('E2E-04 runtime 线：上滑加载更多（历史前插）', async () => {
  const before = await countMessages();
  await js(String.raw`(() => {
    const list = [...document.querySelectorAll('div')].find(
      e => e.scrollHeight > e.clientHeight + 100 && e.clientHeight > 200 && e.className.includes('chat-wrapper-content')
    ) || document.querySelector('.chat-wrapper-content___yewhr');
    if (!list) return false;
    list.scrollTop = 0;
    list.dispatchEvent(new Event('scroll', { bubbles: true }));
    return true;
  })()`);
  await wait(4);
  const after = await countMessages();
  expect(after > before, `加载更多未生效：before=${before} after=${after}`);
});

// E2E-05 flag 回落
await scenario('E2E-05 flag 回落：去 param 重载回 LEGACY', async () => {
  await gotoAndWait(CHAT_URL, { timeout: 40 });
  await wait(5);
  expect((await probeLine()) === 'LEGACY', '去 param 应回落 LEGACY');
});

// E2E-06 localStorage 粘性
await scenario('E2E-06 flag 粘性：localStorage 开启 → RUNTIME；清除 → LEGACY', async () => {
  await js(String.raw`localStorage.setItem('conversation_runtime_enabled', '1')`);
  await gotoAndWait(CHAT_URL, { timeout: 40 });
  await wait(5);
  expect((await probeLine()) === 'RUNTIME', 'localStorage 粘性应生效');
  await js(String.raw`localStorage.removeItem('conversation_runtime_enabled')`);
  await gotoAndWait(CHAT_URL, { timeout: 40 });
  await wait(5);
  expect((await probeLine()) === 'LEGACY', '清除粘性应回落 LEGACY');
});

// E2E-07 TaskAgent 会话（runtime 线）
await scenario('E2E-07 TaskAgent（runtime 线）：发送 + 思考流 + 收尾', async () => {
  const url =
    TASKAGENT_URL +
    (TASKAGENT_URL.includes('?') ? '&' : '?') +
    FLAG_PARAM;
  await gotoAndWait(url, { timeout: 40 });
  await wait(5);
  expect((await probeLine()) === 'RUNTIME', 'TaskAgent flag=1 应为 RUNTIME');
  const stamp = Date.now().toString().slice(-6);
  await sendMessage(`${MSG_PREFIX}${stamp} 回复收到即可`);
  await wait(2);
  const settled = await waitForStreamSettled(60);
  expect(!settled.executing, 'TaskAgent 收尾后不应残留执行中');
});

// ---------- 汇总 ----------
const failed = results.filter((r) => !r.ok);
cliLog('\n========== 验收汇总 ==========');
for (const r of results) {
  cliLog(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  ← ' + r.error}`);
}
cliLog(`共 ${results.length} 项，通过 ${results.length - failed.length}，失败 ${failed.length}`);

await completeTaskSpace(task.id, { keep: false });

if (failed.length > 0) {
  throw new Error(`E2E 验收失败 ${failed.length} 项`);
}
