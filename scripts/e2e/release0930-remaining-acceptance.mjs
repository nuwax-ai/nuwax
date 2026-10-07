/**
 * 9.30 剩余业务的真实页面验收。需要 pnpm run dev:release0930-mock。
 * 示例：E2E_BASE_URL=http://localhost:3102 E2E_TASK_SPACE_ID=4 E2E_PAGE_LABEL=p3
 *       pnpm run e2e:release0930
 * E2E_CASES=sensitive,auth,idp,scope,captcha 可选择用例组；使用共享空间时不关闭它。
 * 所有业务修改均通过真实页面；控制 API 仅负责本地假数据重置、故障与权限配置。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let env = {};
try {
  env = JSON.parse(readFileSync(join(tmpdir(), 'ego-e2e-env.json'), 'utf8'));
} catch {}
const base = env.E2E_BASE_URL || 'http://localhost:3102';
const shared = !!env.E2E_TASK_SPACE_ID;
const caseNames = ['sensitive', 'auth', 'idp', 'scope', 'captcha'];
const selected = (env.E2E_CASES ?? caseNames.join(','))
  .split(',')
  .map((name) => name.trim());
assert.ok(
  selected.length > 0 && selected.every((name) => caseNames.includes(name)),
  `E2E_CASES 必须是 ${caseNames.join(',')} 中的用例组，收到 ${JSON.stringify(
    selected,
  )}`,
);
// 先拒绝未知/空用例，再获取浏览器；避免误拼变量导致零用例假通过。
const task = await taskSpace(
  shared ? Number(env.E2E_TASK_SPACE_ID) : '9.30 剩余业务验收',
);
const page = task.page(env.E2E_PAGE_LABEL || 'p1');
const passed = [];
const control = async (name, body) => {
  const response = await fetch(`${base}/api/mock/release0930/${name}`, {
    method: name === 'state' ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(name === 'state' ? {} : { body: JSON.stringify(body || {}) }),
  });
  assert.equal(response.status, 200, '请启动 dev:release0930-mock');
  const result = await response.json();
  assert.equal(result.code, '0000');
  return result.data;
};
const state = () => control('state');
const lastRequest = async (path) =>
  (await state()).requests.filter((r) => r.path === path).at(-1);
const waitState = async (predicate, message) => {
  const until = Date.now() + 12000;
  while (Date.now() < until) {
    const value = await state();
    if (predicate(value)) return value;
    await new Promise((r) => setTimeout(r, 150));
  }
  assert.fail(message);
};
const visible = (text) =>
  page.waitForFunction((t) => document.body.innerText.includes(t), text, {
    timeout: 20000,
  });
const gone = (selector) =>
  page.waitForFunction(
    (s) =>
      !Array.from(document.querySelectorAll(s)).some(
        (n) => n.getClientRects().length,
      ),
    selector,
    { timeout: 12000 },
  );
const clickButton = (text) =>
  page.click(`button:has-text(${JSON.stringify(text)})`);
const goto = async (path) => {
  await page.goto(base + path);
  await page.waitForLoadState();
};
const pass = (name) => {
  passed.push(name);
  console.log(`PASS ${name}`);
};
const row = (id, selector) => `tr[data-row-key="${id}"] ${selector}`;
const requestCount = async (path) =>
  (await state()).requests.filter((r) => r.path === path).length;

async function sensitive() {
  await control('reset');
  await passwordLogin();
  await goto('/system/config/sensitive-word');
  await visible('验收敏感词');
  await clickButton('新增敏感词');
  await page.fill('input[placeholder="输入词语或正则表达式"]', 'E2E新增词');
  await clickButton('确 认');
  await gone('[role="dialog"]');
  await visible('E2E新增词');
  let data = await state();
  let item = data.words.find((w) => w.word === 'E2E新增词');
  assert.ok(item);
  assert.equal(item.action, 'DISCONNECT');
  await page.click(row(item.id, 'button:has-text("编辑")'));
  await page.fill('input[placeholder="输入词语或正则表达式"]', 'E2E编辑词');
  await page.click('input[value="REPLACE"]');
  await clickButton('确 认');
  await gone('[role="dialog"]');
  await visible('E2E编辑词');
  data = await state();
  item = data.words.find((w) => w.id === item.id);
  assert.equal(item.action, 'REPLACE');
  await page.click(row(item.id, '[role="switch"]'));
  await waitState(
    (s) => s.words.find((w) => w.id === item.id)?.status === 0,
    '停用敏感词未落库',
  );
  await page.waitForFunction(
    (id) =>
      document
        .querySelector(`tr[data-row-key="${id}"] [role="switch"]`)
        ?.getAttribute('aria-checked') === 'false',
    item.id,
  );
  pass('敏感词新增/编辑 DISCONNECT→REPLACE/停用');
  await control('configure', {
    failNext: {
      path: '/api/system/sensitive/word/update',
      message: 'E2E保存失败',
    },
  });
  await page.click(row(item.id, 'button:has-text("编辑")'));
  await page.fill('input[placeholder="输入词语或正则表达式"]', 'E2E失败未保存');
  await clickButton('确 认');
  await visible('E2E保存失败');
  assert.equal(
    (await state()).words.find((w) => w.id === item.id).word,
    'E2E编辑词',
  );
  assert.ok(
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('[role="dialog"]')).some(
        (n) => n.getClientRects().length,
      ),
    ),
    '失败后应保留编辑弹窗',
  );
  await clickButton('取 消');
  await gone('[role="dialog"]');
  pass('敏感词保存失败保留弹窗和原值');
  await page.click(row(item.id, 'button:has-text("删除")'));
  await clickButton('确 定');
  await waitState(
    (s) => !s.words.some((w) => w.id === item.id),
    '删除敏感词未落库',
  );
  await visible('共 1 条');
  pass('敏感词删除确认');
  await control('configure', { permissionMode: 'read-only' });
  await page.reload();
  await visible('验收敏感词');
  const permissions = await page.evaluate(() => ({
    add: Array.from(document.querySelectorAll('button')).some((n) =>
      n.innerText.includes('新增敏感词'),
    ),
    edits: Array.from(document.querySelectorAll('tr[data-row-key] button'))
      .filter((n) => /编辑|删除/.test(n.innerText))
      .map((n) => n.disabled),
    switches: Array.from(
      document.querySelectorAll('tr[data-row-key] [role="switch"]'),
    ).map((n) => n.disabled),
  }));
  assert.equal(permissions.add, false);
  assert.ok(permissions.edits.length && permissions.edits.every(Boolean));
  assert.ok(permissions.switches.length && permissions.switches.every(Boolean));
  pass('敏感词只读权限隐藏新增并禁用修改');
  await control('configure', { permissionMode: 'admin' });
}

async function auth() {
  await control('reset');
  await passwordLogin({ target: '/system/config/auth-method' });
  await goto('/system/config/auth-method');
  await visible('验收 GitHub');
  await page.click(row(2, 'button:has-text("编辑")'));
  await visible('Client Secret');
  const fields = await page.evaluate(() => ({
    locked: Array.from(document.querySelectorAll('input[name="type"]')).map(
      (n) => n.disabled,
    ),
    secret: document.querySelector('input[id$="oauth2ClientSecret"]')?.value,
    inputs: Array.from(document.querySelectorAll('[role="dialog"] input')).map(
      (n) => ({ id: n.id, type: n.type, name: n.name }),
    ),
  }));
  assert.equal(fields.secret, '');
  assert.ok(
    fields.locked.length && fields.locked.every(Boolean),
    '编辑登录方式时类型应锁定',
  );
  await page.fill('input[id$="name"]', '验收 GitHub 编辑');
  await control('clear-requests');
  await clickButton('确 认');
  await gone('[role="dialog"]');
  await visible('验收 GitHub 编辑');
  const saved = await lastRequest('/api/system/idp/update');
  assert.equal(saved.body.type, 'OAUTH2');
  assert.equal(Object.hasOwn(saved.body.oauth2Config, 'clientSecret'), false);
  pass('登录方式编辑类型锁定/secret留空不提交');
  await page.click(row(1, '[role="switch"] >> nth=1'));
  await waitState(
    (s) => s.idps.find((i) => i.id === 1).autoRedirect === 1,
    'CAS自动跳转未保存',
  );
  await page.click(row(2, '[role="switch"] >> nth=1'));
  await waitState(
    (s) =>
      s.idps.find((i) => i.id === 2).autoRedirect === 1 &&
      s.idps.filter((i) => i.autoRedirect).length === 1,
    '自动跳转未保持租户唯一',
  );
  await page.click(row(2, '[role="switch"] >> nth=0'));
  await waitState(
    (s) =>
      s.idps.find((i) => i.id === 2).enabled === 0 &&
      s.idps.find((i) => i.id === 2).autoRedirect === 0,
    '停用未清除自动跳转',
  );
  await page.waitForFunction(
    () =>
      document
        .querySelector('tr[data-row-key="2"] [role="switch"]')
        ?.getAttribute('aria-checked') === 'false',
  );
  await page.click(row(2, '[role="switch"] >> nth=0'));
  await waitState(
    (s) => s.idps.find((i) => i.id === 2).enabled === 1,
    '重新启用失败',
  );
  pass('登录方式自动跳转唯一/停用联动清除');
}

async function agree() {
  const checked = await page.evaluate(
    () => document.querySelector('form input[type="checkbox"]')?.checked,
  );
  if (!checked) await page.click('form .ant-checkbox-wrapper');
}
async function logout() {
  await page.click('[aria-label="用户头像"]');
  await visible('退出登录');
  // Popover 的入场动画会改变点击位置；等它稳定后再派发真实鼠标事件。
  await page.waitForFunction(() => {
    const popover = document.querySelector(
      '.ant-popover:not(.ant-popover-hidden)',
    );
    return (
      popover &&
      getComputedStyle(popover).opacity === '1' &&
      popover
        .getAnimations({ subtree: true })
        .every((animation) => animation.playState !== 'running')
    );
  });
  const beforeLogout = await requestCount('/api/user/logout');
  await page.click('.ant-popover:not(.ant-popover-hidden) [class*="log-out"]');
  await page.waitForFunction(() => location.pathname === '/login');
  await visible('密码登录');
  assert.equal(
    await requestCount('/api/user/logout'),
    beforeLogout + 1,
    '退出登录必须发出本次真实退出请求',
  );
}
async function passwordLogin({
  captcha = false,
  target = '/system/config/sensitive-word',
} = {}) {
  await goto(`/login?local=1&redirect=${encodeURIComponent(target)}`);
  await visible('密码登录');
  await page.fill('input[placeholder="用户名/邮箱/手机号"]', '13800009300');
  await page.fill(
    'input[placeholder="请输入不少于 6 位的密码"]',
    'MockPass2468!',
  );
  if (captcha) await typeCaptcha();
  await agree();
  const beforeLogin = await requestCount('/api/user/passwordLogin');
  await clickButton('登 录');
  await page.waitForFunction(
    (path) => location.pathname === path,
    target.split('?')[0],
    { timeout: 20000 },
  );
  await visible('前端验收账号');
  assert.equal(
    await requestCount('/api/user/passwordLogin'),
    beforeLogin + 1,
    '密码登录前置必须发出本次真实表单请求',
  );
}
async function idp() {
  await control('reset');
  await passwordLogin({ target: '/system/config/auth-method' });
  await goto('/system/config/auth-method');
  await visible('验收 CAS');
  await page.click(row(1, '[role="switch"] >> nth=1'));
  await waitState(
    (s) => s.idps.find((i) => i.id === 1).autoRedirect === 1,
    'CAS自动跳转未设置',
  );
  await logout();
  await control('clear-requests');
  await goto('/login?local=1&redirect=%2Fsystem%2Fconfig%2Fauth-method');
  await visible('密码登录');
  assert.equal(
    await requestCount('/api/auth/idp/authorize'),
    0,
    'local=1应阻止自动跳转',
  );
  assert.equal(
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).some((n) =>
        n.innerText.includes('验收微信公众号'),
      ),
    ),
    false,
    'PC普通UA不展示公众号登录',
  );
  await page.click('form .ant-checkbox-wrapper');
  await page.waitForFunction(
    () =>
      document.querySelector('form input[type="checkbox"]')?.checked === false,
  );
  await clickButton('验收 CAS');
  await visible('服务协议与隐私保护');
  assert.equal(
    await requestCount('/api/auth/idp/authorize'),
    0,
    '未同意协议不得发起授权',
  );
  await clickButton('同 意');
  await page.waitForFunction(
    () => location.pathname === '/system/config/auth-method',
  );
  await visible('验收 CAS');
  assert.equal(await requestCount('/api/auth/idp/authorize'), 1);
  pass('本地登录兜底/PC过滤公众号/协议确认后IdP回跳');
  await logout();
  await control('clear-requests');
  await goto('/login?redirect=%2Fsystem%2Fconfig%2Fauth-method');
  await page.waitForFunction(
    () => location.pathname === '/system/config/auth-method',
  );
  await visible('验收 CAS');
  assert.equal(await requestCount('/api/auth/idp/authorize'), 1);
  pass('未登录自动跳转IdP并返回业务目标');
  await logout();
  await control('configure', { idpError: 'E2E授权失败' });
  await control('clear-requests');
  await goto('/login?local=1&redirect=%2Fsystem%2Fconfig%2Fauth-method');
  await visible('密码登录');
  await page.click('form .ant-checkbox-wrapper');
  await page.waitForFunction(
    () =>
      document.querySelector('form input[type="checkbox"]')?.checked === false,
  );
  await clickButton('验收 CAS');
  await clickButton('同 意');
  await visible('E2E授权失败');
  assert.ok((await page.url()).includes('idpError='));
  assert.equal(
    await requestCount('/api/auth/idp/authorize'),
    1,
    'idpError回跳不得再次自动授权',
  );
  pass('IdP错误回登录页并阻止重定向循环');
  await control('configure', { idpError: '' });
  await passwordLogin({ target: '/system/config/auth-method' });
  await goto('/system/config/auth-method?setting=account-bind');
  await visible('可绑定');
  await control('configure', { idpError: 'E2E绑定失败' });
  await page.click('button:has-text("验收 CAS")');
  await visible('E2E绑定失败');
  assert.equal((await state()).identities.length, 0, '绑定错误不得新增身份');
  assert.equal((await page.url()).includes('setting='), false);
  assert.equal(
    (await page.url()).includes('idpError='),
    false,
    '绑定错误回跳应清理一次性错误参数',
  );
  await control('configure', { idpError: '' });
  await page.click('button:has-text("验收 CAS")');
  await visible('mock-external-user');
  assert.equal((await state()).identities.length, 1);
  assert.equal(
    (await page.url()).includes('setting='),
    false,
    '绑定回跳应清理一次性打开参数',
  );
  pass('账号绑定错误/成功回跳与一次性参数清理');
  await control('configure', { hasPassword: false });
  await page.click('button:has-text("解绑")');
  await clickButton('确 定');
  await visible('请先设置账号密码后再解绑');
  assert.equal((await state()).identities.length, 1);
  pass('仅一身份未设密码时拒绝解绑并保留绑定');
  // 业务拒绝已由页面消费，确认框正常结束；绑定仍保留，可重新确认重试。
  await gone('.ant-modal-confirm');
  await control('configure', { hasPassword: true });
  await page.click('button:has-text("解绑")');
  await clickButton('确 定');
  await waitState((s) => s.identities.length === 0, '解绑未保存');
  await visible('暂未绑定三方账号');
  pass('账号解绑成功刷新列表');
  await goto('/system/config/auth-method');
}

async function scope() {
  await control('reset');
  await passwordLogin();
  for (const [id, path, label] of [
    [9301, '/space/93/third-app-detail/9301', '三方应用'],
    [9302, '/space/93/app-project-detail/9302', '全栈应用'],
  ]) {
    await goto(path);
    if (id === 9302) {
      await visible('设置');
      await page.click('[role="tab"]:has-text("设置")');
    }
    await visible('审核中');
    await page.waitForFunction(
      () => !!document.querySelector('input[value="chat:read"]'),
    );
    assert.equal(
      await page.evaluate(
        () => document.querySelector('input[value="chat:read"]').checked,
      ),
      true,
      `${label}应显示待审B`,
    );
    await page.fill(
      'input[placeholder="请输入主页地址"]',
      `https://app.example.test/address-${id}`,
    );
    await control('clear-requests');
    await page.click('button:has-text("保 存") >> nth=0');
    await waitState(
      (s) =>
        s.requests.some(
          (r) => r.path === '/api/user-project/oauth2/setting/save',
        ),
      '地址保存未发出',
    );
    await visible('保存成功');
    let request = await lastRequest('/api/user-project/oauth2/setting/save');
    assert.equal(
      Object.hasOwn(request.body, 'scopes'),
      false,
      `${label}仅改地址不得重提scope`,
    );
    assert.equal((await state()).projects[id].scopeApplyStatus, 'Pending');
    assert.equal(
      await page.evaluate(() =>
        document.body.innerText.includes('授权范围变更已提交审核'),
      ),
      false,
      '地址保存不得误提示重新提交审核',
    );
    pass(`${label} Pending只改地址省略scopes`);
    await page.click('label:has-text("chat:read")');
    await control('clear-requests');
    await page.click('button:has-text("保 存") >> nth=0');
    await waitState(
      (s) =>
        s.requests.some(
          (r) => r.path === '/api/user-project/oauth2/setting/save',
        ),
      'B回A未保存',
    );
    request = await lastRequest('/api/user-project/oauth2/setting/save');
    assert.deepEqual(
      request.body.scopes,
      ['profile'],
      `${label}待审B回生效A须显式发送A`,
    );
    await waitState(
      (s) => JSON.stringify(s.projects[id].pendingScopes) === '["profile"]',
      '待审目标未更新为A',
    );
    pass(`${label} Pending B回A显式发送profile`);
  }
  // 用页面先重新申请含chat:read的范围，管理员通过后回详情检查生效值。
  await goto('/space/93/third-app-detail/9301');
  await visible('审核中');
  await page.click('label:has-text("chat:read")');
  await page.click('button:has-text("保 存") >> nth=0');
  await waitState(
    (s) => s.projects[9301].pendingScopes?.includes('chat:read'),
    '申请新增scope未保存',
  );
  let application = (await state()).applications.find(
    (a) => a.projectId === 9301 && a.status === 'Pending',
  );
  await goto('/system/oauth2/scope-audit');
  await visible('验收三方应用');
  await page.click(row(application.id, 'button:has-text("通过")'));
  await clickButton('确 定');
  await waitState(
    (s) => s.projects[9301].scopeApplyStatus === 'Approved',
    '管理员通过未保存',
  );
  await goto('/space/93/third-app-detail/9301');
  await visible('授权范围（Scope）');
  await page.waitForFunction(
    () => document.querySelector('input[value="chat:read"]')?.checked === true,
  );
  assert.equal(
    await page.evaluate(() => document.body.innerText.includes('审核中')),
    false,
  );
  pass('管理员通过→详情生效范围与待审标识刷新');
  application = (await state()).applications.find(
    (a) => a.projectId === 9302 && a.status === 'Pending',
  );
  await goto('/system/oauth2/scope-audit');
  await visible('验收全栈应用');
  await page.click(row(application.id, 'button:has-text("拒绝")'));
  await page.waitForSelector('textarea');
  await page.fill('textarea', 'E2E范围过宽');
  await clickButton('确 认');
  await gone('[role="dialog"]');
  await waitState(
    (s) => s.projects[9302].scopeApplyStatus === 'Rejected',
    '管理员拒绝未保存',
  );
  await goto('/space/93/app-project-detail/9302');
  await visible('设置');
  await page.click('[role="tab"]:has-text("设置")');
  await visible('E2E范围过宽');
  assert.equal(
    await page.evaluate(
      () => document.querySelector('input[value="chat:read"]')?.checked,
    ),
    false,
  );
  pass('管理员拒绝→全栈详情显示拒绝原因与原范围');
}

async function openSettings(tab) {
  await page.click('[aria-label="用户头像"]');
  await visible('个人中心');
  await page.click('text="个人中心"');
  await visible('个人资料');
  await page.click(`li:has-text(${JSON.stringify(tab)})`);
}
const captchaInput = 'input[placeholder="请输入图形验证码"]';
async function waitCaptchaReady() {
  await page.waitForFunction(() => {
    const button = document.querySelector('button[aria-label="换一张"]');
    const image = button?.querySelector('img');
    return (
      !!image?.complete &&
      image.naturalWidth > 0 &&
      !button.querySelector('.ant-spin-spinning')
    );
  });
}
async function waitCodeNoticeGone() {
  await page.waitForFunction(
    () =>
      !Array.from(document.querySelectorAll('.ant-message-success')).some(
        (n) =>
          n.getClientRects().length && n.innerText.trim() === '验证码已发送',
      ),
  );
}
async function waitCodeSuccess() {
  // VerifyCode 的静态说明也包含“验证码已发送”，只接受新出现的成功通知。
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('.ant-message-success')).some(
      (n) => n.getClientRects().length && n.innerText.trim() === '验证码已发送',
    ),
  );
}
async function typeCaptcha(answer = '2468') {
  // 按用户输入速度填写新图；密码登录本身有 800ms 重复提交保护。
  await waitCaptchaReady();
  await page.fill(captchaInput, '');
  await page.focus(captchaInput);
  await page.keyboard.type(answer, { delay: 220 });
  await page.waitForFunction(
    (expected) =>
      document.querySelector('input[placeholder="请输入图形验证码"]')?.value ===
      expected,
    answer,
  );
}
async function verifyImageRefresh(previousCount, message) {
  await waitState(
    (s) =>
      s.requests.filter((r) => r.path === '/api/user/captcha/image').length >
      previousCount,
    message,
  );
  await page.waitForFunction(
    () =>
      document.querySelector('input[placeholder="请输入图形验证码"]')?.value ===
      '',
  );
}
async function sendFailureThenRetry(type, fillRecipient) {
  if (fillRecipient) await fillRecipient();
  const imageCount = await requestCount('/api/user/captcha/image');
  const sends = await requestCount('/api/user/code/send');
  await typeCaptcha();
  await control('configure', {
    failNext: { path: '/api/user/code/send', message: `E2E${type}发码失败` },
  });
  await waitCodeNoticeGone();
  await clickButton('发送验证码');
  await visible(`E2E${type}发码失败`);
  await verifyImageRefresh(imageCount, '发码失败后未换图');
  const first = await lastRequest('/api/user/code/send');
  assert.equal(first.body.type, type);
  assert.equal(first.body.captchaCode, '2468');
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('button')).some(
      (n) => n.innerText.replace(/\s/g, '') === '发送验证码' && !n.disabled,
    ),
  );
  await typeCaptcha();
  await waitCodeNoticeGone();
  await clickButton('发送验证码');
  await waitState(
    (s) =>
      s.requests.filter((r) => r.path === '/api/user/code/send').length ===
      sends + 2,
    '发码失败后未立即重试',
  );
  await waitCodeSuccess();
  const second = await lastRequest('/api/user/code/send');
  assert.equal(second.body.type, type);
  assert.equal(second.body.captchaCode, '2468');
  assert.notEqual(second.body.captchaId, first.body.captchaId);
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('button')).some(
      (n) => n.disabled && /^\d+s$/.test(n.innerText.trim()),
    ),
  );
  return second;
}
async function codeStep({ image = true, fail = true } = {}) {
  await goto('/login?local=1&redirect=%2Fsystem%2Fconfig%2Fsensitive-word');
  await visible('验证码登录/注册');
  await page.click('text="验证码登录/注册"');
  await page.fill('input[placeholder="请输入手机号"]', '13800009300');
  if (image) await typeCaptcha();
  await agree();
  if (fail)
    await control('configure', {
      failNext: { path: '/api/user/code/send', message: 'E2E首次发码失败' },
    });
  const before = await requestCount('/api/user/code/send');
  await clickButton('下一步');
  await page.waitForFunction(() => location.pathname.includes('verify'));
  await waitState(
    (s) =>
      s.requests.filter((r) => r.path === '/api/user/code/send').length >
      before,
    '登录页带图码进入VerifyCode后未首次发码',
  );
  const first = await lastRequest('/api/user/code/send');
  assert.equal(first.body.type, 'LOGIN_OR_REGISTER');
  assert.equal(first.body.phone, '13800009300');
  if (image) {
    assert.ok(first.body.captchaId);
    assert.equal(first.body.captchaCode, '2468');
  } else {
    assert.equal(Object.hasOwn(first.body, 'captchaId'), false);
    assert.equal(Object.hasOwn(first.body, 'captchaCode'), false);
  }
  if (fail) await visible('E2E首次发码失败');
  return first;
}
async function captcha() {
  await control('reset');
  await control('configure', { imageCaptcha: true });
  await goto('/login?local=1&redirect=%2Fsystem%2Fconfig%2Fsensitive-word');
  await visible('密码登录');
  await page.fill('input[placeholder="用户名/邮箱/手机号"]', '13800009300');
  await page.fill(
    'input[placeholder="请输入不少于 6 位的密码"]',
    'MockPass2468!',
  );
  await agree();
  await waitCaptchaReady();
  const images = await requestCount('/api/user/captcha/image');
  await page.fill(captchaInput, '0000');
  await clickButton('登 录');
  await visible('图形验证码错误或已失效');
  await verifyImageRefresh(images, '密码登录图码错误后未换图');
  const failed = await lastRequest('/api/user/passwordLogin');
  assert.equal(failed.body.captchaCode, '0000');
  await typeCaptcha();
  await clickButton('登 录');
  await page.waitForFunction(
    () => location.pathname === '/system/config/sensitive-word',
  );
  await visible('前端验收账号');
  const succeeded = await lastRequest('/api/user/passwordLogin');
  assert.equal(succeeded.body.captchaCode, '2468');
  assert.notEqual(succeeded.body.captchaId, failed.body.captchaId);
  pass('图码密码登录错误换图/清空/新图重试成功');
  await logout();
  const initial = await codeStep();
  await page.waitForSelector(captchaInput);
  await page.waitForFunction(() => !/\d+\s*秒后/.test(document.body.innerText));
  assert.equal(
    await page.evaluate(
      () =>
        document.querySelector('input[placeholder="请输入图形验证码"]')?.value,
    ),
    '',
  );
  pass('首次验证码发码携带登录页图码/失败可立即重发');
  await typeCaptcha();
  const sends = await requestCount('/api/user/code/send');
  await waitCodeNoticeGone();
  await page.click('text="重新发送"');
  await waitState(
    (s) =>
      s.requests.filter((r) => r.path === '/api/user/code/send').length ===
      sends + 1,
    'VerifyCode重发未发出',
  );
  await waitCodeSuccess();
  const resent = await lastRequest('/api/user/code/send');
  assert.equal(resent.body.captchaCode, '2468');
  assert.notEqual(resent.body.captchaId, initial.body.captchaId);
  await page.waitForFunction(() => /\d+\s*秒后/.test(document.body.innerText));
  await gone(captchaInput);
  pass('VerifyCode重发使用新图码/发送后恢复倒计时');
  await passwordLogin({ captcha: true });
  await openSettings('重置密码');
  const reset = await sendFailureThenRetry('RESET_PASSWORD');
  assert.equal(reset.body.phone, '13800009300');
  pass('设置重置密码发码含图码/失败换图并立即重试');
  await page.click('li:has-text("邮箱绑定")');
  const bind = await sendFailureThenRetry('BIND_EMAIL', () =>
    page.fill('input[placeholder="请输入邮箱地址"]', 'bind@example.test'),
  );
  assert.equal(bind.body.email, 'bind@example.test');
  pass('设置绑定邮箱发码含图码/失败换图并立即重试');
  await control('configure', { imageCaptcha: false });
  await passwordLogin();
  assert.equal(
    Object.hasOwn(
      (await lastRequest('/api/user/passwordLogin')).body,
      'captchaId',
    ),
    false,
  );
  assert.equal(
    Object.hasOwn(
      (await lastRequest('/api/user/passwordLogin')).body,
      'captchaCode',
    ),
    false,
  );
  await logout();
  await codeStep({ image: false });
  assert.equal(
    await page.evaluate(
      () => !!document.querySelector('input[placeholder="请输入图形验证码"]'),
    ),
    false,
  );
  const offSends = await requestCount('/api/user/code/send');
  await waitCodeNoticeGone();
  await page.click('text="重新发送"');
  await waitState(
    (s) =>
      s.requests.filter((r) => r.path === '/api/user/code/send').length ===
      offSends + 1,
    '图码关闭后的重发未发出',
  );
  await waitCodeSuccess();
  let offRequest = await lastRequest('/api/user/code/send');
  assert.equal(Object.hasOwn(offRequest.body, 'captchaId'), false);
  assert.equal(Object.hasOwn(offRequest.body, 'captchaCode'), false);
  await passwordLogin();
  await openSettings('重置密码');
  assert.equal(
    await page.evaluate(
      () => !!document.querySelector('input[placeholder="请输入图形验证码"]'),
    ),
    false,
  );
  let count = await requestCount('/api/user/code/send');
  await waitCodeNoticeGone();
  await clickButton('发送验证码');
  await waitState(
    (s) =>
      s.requests.filter((r) => r.path === '/api/user/code/send').length ===
      count + 1,
    '关闭图码后重置密码未发码',
  );
  await waitCodeSuccess();
  offRequest = await lastRequest('/api/user/code/send');
  assert.equal(Object.hasOwn(offRequest.body, 'captchaId'), false);
  assert.equal(Object.hasOwn(offRequest.body, 'captchaCode'), false);
  await page.click('li:has-text("邮箱绑定")');
  await page.fill('input[placeholder="请输入邮箱地址"]', 'bind@example.test');
  assert.equal(
    await page.evaluate(
      () => !!document.querySelector('input[placeholder="请输入图形验证码"]'),
    ),
    false,
  );
  count = await requestCount('/api/user/code/send');
  await waitCodeNoticeGone();
  await clickButton('发送验证码');
  await waitState(
    (s) =>
      s.requests.filter((r) => r.path === '/api/user/code/send').length ===
      count + 1,
    '关闭图码后绑定邮箱未发码',
  );
  await waitCodeSuccess();
  offRequest = await lastRequest('/api/user/code/send');
  assert.equal(Object.hasOwn(offRequest.body, 'captchaId'), false);
  assert.equal(Object.hasOwn(offRequest.body, 'captchaCode'), false);
  pass('关闭图码开关后五入口均恢复原流程且请求省略图码字段');
  await goto('/system/config/sensitive-word');
}

try {
  const readyUntil = Date.now() + 90000;
  while (true) {
    try {
      await state();
      break;
    } catch (error) {
      if (Date.now() > readyUntil) throw error;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  for (const [name, run, expected] of [
    ['sensitive', sensitive, 4],
    ['auth', auth, 2],
    ['idp', idp, 6],
    ['scope', scope, 6],
    ['captcha', captcha, 6],
  ]) {
    if (!selected.includes(name)) continue;
    const previous = passed.length;
    await run();
    assert.equal(passed.length - previous, expected, `${name} 用例未全部完成`);
  }
  console.log(`业务浏览器验收：${passed.length} 项通过`);
  if (!shared) await task.finish({ keep: [] });
} catch (error) {
  console.error(`FAIL ${error.message}`);
  try {
    console.error((await page.snapshot()).slice(-8000));
  } catch {}
  throw error;
}
