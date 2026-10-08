/**
 * 9.30 剩余业务前端验收供数。仅 UMI_ENV=release0930Mock 的 dev 服务启用。
 * 使用真实页面，不替换鉴权/权限组件；所有身份和密钥均为本地假数据。
 */
import type {
  AuthIdpInfo,
  UserIdentityInfo,
} from '../src/types/interfaces/authIdp';
import type { SensitiveWordInfo } from '../src/types/interfaces/sensitiveWord';
import { projectLicenseSnapshot } from '../src/utils/license';

const TOKEN = 'release0930-mock-token';
const CREATED = '2026-10-02T00:00:00Z';
const PREFIX = '/api/mock/release0930';
type Handler = (req: any, res: any) => void;
type PermissionMode = 'admin' | 'read-only' | 'no-access';
type ScopeSetting = {
  projectId: number;
  projectType: string;
  name: string;
  clientId: string;
  hasClientSecret: boolean;
  homepageUrl: string;
  redirectUri: string;
  scopes: string[];
  enabled: boolean;
  scopeApplyStatus: string | null;
  pendingScopes?: string[];
  scopeRejectReason?: string;
};

const user = {
  id: 930,
  tenantId: 93,
  userName: 'mock-admin',
  nickName: '前端验收账号',
  avatar: '',
  resetPass: 0,
  status: 'Enabled',
  role: 'Admin',
  email: 'mock@example.test',
  phone: '13800009300',
  lang: 'zh-cn',
};
const scopes = [
  { scope: 'profile', description: '读取基础资料', sensitive: false },
  { scope: 'chat:read', description: '读取会话', sensitive: true },
  { scope: 'chat:write', description: '发送消息', sensitive: true },
];
const resources = {
  license_config: ['license_query', 'license_import'],
  sensitive_word_config: ['query', 'add', 'modify', 'delete', 'enable'].map(
    (s) => `sensitive_word_${s}`,
  ),
  auth_method_config: ['query', 'add', 'modify', 'delete', 'enable'].map(
    (s) => `auth_method_${s}`,
  ),
  oauth2_scope_audit: ['query', 'pass', 'reject'].map(
    (s) => `oauth2_scope_audit_${s}`,
  ),
};
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const success = (res: any, data: unknown = null) =>
  res.json({ code: '0000', data, message: '成功', success: true });
const fail = (res: any, message: string, code = '0001') =>
  res.json({ code, data: null, message, success: false });
const normalScopes = (value: string[]) => [
  ...new Set(value.length ? value : ['profile']),
];

// 记录可断言的请求，防止密码、token、IdP secret 随调试记录暴露。
function redact(value: any): any {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      /password|secret|token|ticket|captchaVerifyParam|licenseContent/i.test(
        key,
      )
        ? '[redacted]'
        : redact(item),
    ]),
  );
}

function initialState() {
  const idps: AuthIdpInfo[] = [
    {
      id: 1,
      type: 'CAS' as AuthIdpInfo['type'],
      name: '验收 CAS',
      enabled: 1,
      autoRedirect: 0,
      autoRegisterBind: 0,
      config: { serverUrl: 'https://idp.example.test/cas' },
    },
    {
      id: 2,
      type: 'OAUTH2' as AuthIdpInfo['type'],
      name: '验收 GitHub',
      enabled: 1,
      autoRedirect: 0,
      autoRegisterBind: 0,
      config: {
        provider: 'GITHUB' as any,
        clientId: 'mock-client',
        clientSecret: 'mock-secret',
      },
    },
    {
      id: 3,
      type: 'WECHAT' as AuthIdpInfo['type'],
      name: '验收微信扫码',
      enabled: 1,
      autoRedirect: 0,
      autoRegisterBind: 0,
      config: {
        mode: 'QRCODE' as any,
        appId: 'mock-wechat',
        appSecret: 'mock-secret',
      },
    },
    {
      id: 4,
      type: 'WECHAT' as AuthIdpInfo['type'],
      name: '验收微信公众号',
      enabled: 1,
      autoRedirect: 0,
      autoRegisterBind: 0,
      config: {
        mode: 'OA' as any,
        appId: 'mock-wechat-oa',
        appSecret: 'mock-secret',
      },
    },
  ];
  const projects: Record<number, ScopeSetting> = {};
  for (const [id, type, name] of [
    [9301, 'ThirdApp', '验收三方应用'],
    [9302, 'UserApp', '验收全栈应用'],
  ] as const) {
    projects[id] = {
      projectId: id,
      projectType: type,
      name,
      clientId: `mock-client-${id}`,
      hasClientSecret: true,
      homepageUrl: 'https://app.example.test',
      redirectUri: 'https://app.example.test/callback',
      scopes: ['profile'],
      enabled: true,
      scopeApplyStatus: 'Pending',
      pendingScopes: ['profile', 'chat:read'],
    };
  }
  return {
    license: projectLicenseSnapshot({
      state: 'VALID',
      subject: '前端验收组织（本地样例）',
      maskedId: 'MOCK-****-0930',
      validFrom: CREATED,
      expiresAt: '2027-10-02T00:00:00Z',
      updatedAt: CREATED,
      canImport: true,
      features: [{ code: 'demo_feature', name: '样例功能', enabled: true }],
    }),
    config: {
      permissionMode: 'admin' as PermissionMode,
      imageCaptcha: false,
      hasPassword: true,
      registrationRequired: false,
      idpError: '',
    },
    failNext: null as { path: string; message?: string; code?: string } | null,
    words: [
      {
        id: 1,
        word: '验收敏感词',
        category: 'ADVERTISING',
        matchType: 'CONTAIN',
        action: 'REPLACE',
        status: 1,
        created: CREATED,
      },
    ] as SensitiveWordInfo[],
    idps,
    identities: [] as UserIdentityInfo[],
    projects,
    applications: Object.values(projects).map((p, i) => ({
      id: i + 1,
      projectId: p.projectId,
      projectType: p.projectType,
      projectName: p.name,
      clientId: p.clientId,
      applyUserId: user.id,
      oldScopes: ['profile'],
      scopes: [...p.pendingScopes!],
      status: 'Pending',
      created: CREATED,
      rejectReason: '',
      reviewedAt: '',
    })),
    captchas: new Set<string>(),
    sequence: 100,
    requests: [] as { method: string; path: string; body: any }[],
  };
}

export function createRelease0930Mock() {
  let state = initialState();
  const handlers: Record<string, Handler> = {};
  const allowed = (resource: string) =>
    state.config.permissionMode === 'admin' ||
    (state.config.permissionMode === 'read-only' && /_query$/.test(resource));
  const authenticated = (req: any) =>
    req.headers?.authorization === `Bearer ${TOKEN}` ||
    String(req.headers?.cookie || '').includes(`ticket=${TOKEN}`);
  const add = (
    method: string,
    path: string,
    fn: Handler,
    resource?: string,
    publicApi = false,
  ) => {
    handlers[`${method} ${path}`] = (req, res) => {
      const requestPath = String(req.path || req.url?.split('?')[0] || path);
      state.requests.push({
        method,
        path: requestPath,
        body: redact(req.body || {}),
      });
      if (!publicApi && !authenticated(req))
        return fail(res, '请先登录', '4010');
      if (resource && !allowed(resource))
        return fail(res, '无此资源权限', '4033');
      if (state.failNext?.path === requestPath) {
        const error = state.failNext;
        state.failNext = null;
        if (/passwordLogin|code\/send/.test(requestPath))
          state.captchas.delete(req.body?.captchaId);
        return fail(res, error.message || '验收模拟失败', error.code || '0001');
      }
      fn(req, res);
    };
  };
  const page = (rows: any[], body: any, res: any) => {
    const current = Math.max(1, Number(body.current || body.pageNo || 1));
    const size = Math.max(1, Number(body.pageSize || 10));
    success(res, {
      records: rows.slice((current - 1) * size, current * size),
      total: rows.length,
      current,
      size,
    });
  };
  const origin = (req: any) =>
    `${req.protocol || 'http'}://${req.headers?.host || 'localhost:3102'}`;
  const targetOf = (req: any) => {
    try {
      const target = new URL(
        String(req.query?.redirect || '/system/config/auth-method'),
        origin(req),
      );
      return target.origin === origin(req)
        ? target.pathname + target.search + target.hash
        : '/system/config/auth-method';
    } catch {
      return '/system/config/auth-method';
    }
  };
  const maskedIdps = (req: any) =>
    state.idps.map((item) => ({
      ...copy(item),
      config: {
        ...item.config,
        ...(item.config?.clientSecret ? { clientSecret: '******' } : {}),
        ...(item.config?.appSecret ? { appSecret: '******' } : {}),
      },
      callbackUrl: `${origin(req)}/api/auth/idp/callback/${item.id}`,
    }));
  const completeLogin = (req: any, res: any, middle = false) => {
    const target = JSON.stringify(targetOf(req)).replace(/</g, '\\u003c');
    const script = `localStorage.setItem('ACCESS_TOKEN','${TOKEN}');location.replace(${target});`;
    res.cookie('ticket', TOKEN, { sameSite: 'lax', path: '/' });
    res
      .type('html')
      .send(
        middle
          ? `<html lang="zh-CN"><title>关联账号（本地 mock）</title><h1>关联账号</h1><p>前端回跳验收，不模拟真实 IdP 校验。</p><button onclick="${script.replace(
              /"/g,
              '&quot;',
            )}">完成绑定并返回</button></html>`
          : `<html><title>本地授权完成</title><script>${script}</script></html>`,
      );
  };
  const captchaValid = (body: any, res: any) => {
    if (!state.config.imageCaptcha) return true;
    const existed = state.captchas.delete(body.captchaId);
    if (existed && body.captchaCode === '2468') return true;
    fail(res, '图形验证码错误或已失效');
    return false;
  };
  const updateIdp = (req: any, res: any, create: boolean) => {
    const body = req.body || {};
    const current = create
      ? undefined
      : state.idps.find((item) => item.id === Number(body.id));
    if (!create && !current) return fail(res, '登录方式不存在');
    if (!body.name || !['CAS', 'OAUTH2', 'WECHAT'].includes(body.type))
      return fail(res, '请填写登录方式名称与类型');
    if (current && current.type !== body.type)
      return fail(res, '登录方式类型不可修改');
    const config =
      body.casConfig || body.oauth2Config || body.wechatConfig || {};
    const value: AuthIdpInfo = {
      ...current,
      id: current?.id || ++state.sequence,
      type: body.type,
      name: body.name,
      icon: body.icon,
      sort: body.sort,
      autoRegisterBind: body.autoRegisterBind || 0,
      enabled: current?.enabled || 0,
      autoRedirect: current?.autoRedirect || 0,
      config: { ...current?.config, ...config },
    };
    if (create) state.idps.push(value);
    else state.idps[state.idps.indexOf(current!)] = value;
    success(
      res,
      maskedIdps(req).find((item) => item.id === value.id),
    );
  };

  // 本地控制面：不经过生产鉴权；只有显式启动的 mock 服务具有这些路由。
  handlers[`POST ${PREFIX}/reset`] = (_req, res) => {
    state = initialState();
    success(res);
  };
  handlers[`GET ${PREFIX}/state`] = (req, res) =>
    success(res, {
      config: state.config,
      license: state.license,
      words: state.words,
      idps: maskedIdps(req),
      identities: state.identities,
      projects: state.projects,
      applications: state.applications,
      requests: state.requests,
    });
  handlers[`POST ${PREFIX}/configure`] = (req, res) => {
    const body = req.body || {};
    if (
      body.permissionMode &&
      !['admin', 'read-only', 'no-access'].includes(body.permissionMode)
    )
      return fail(res, '未知权限模式');
    // 只接受完整的最小快照，不将任意输入字段复制到可查询状态。
    if (body.license !== undefined) {
      try {
        state.license = projectLicenseSnapshot(body.license);
      } catch {
        return fail(res, '授权样例格式无效');
      }
    }
    for (const key of [
      'permissionMode',
      'imageCaptcha',
      'hasPassword',
      'registrationRequired',
      'idpError',
    ] as const) {
      if (body[key] !== undefined) (state.config as any)[key] = body[key];
    }
    if (body.failNext !== undefined) state.failNext = body.failNext;
    success(res, state.config);
  };
  handlers[`POST ${PREFIX}/clear-requests`] = (_req, res) => {
    state.requests = [];
    success(res);
  };

  add(
    'GET',
    `${PREFIX}/license/info`,
    (_req, res) => success(res, state.license),
    'license_query',
  );
  add(
    'POST',
    `${PREFIX}/license/import`,
    (req, res) => {
      if (!state.license.canImport)
        return fail(res, '当前账号不能导入授权', '4033');
      const content = req.body?.licenseContent;
      if (
        typeof content !== 'string' ||
        !content.length ||
        Buffer.byteLength(content, 'utf8') > 1024 * 1024
      )
        return fail(res, '授权样例文件大小无效');
      try {
        // 仅本地 fixture 使用 JSON 投影；这不是实际授权签名格式或校验实现。
        const next = projectLicenseSnapshot(JSON.parse(content));
        state.license = projectLicenseSnapshot({
          ...next,
          updatedAt: new Date().toISOString(),
        });
        success(res, state.license);
      } catch {
        fail(res, '授权样例格式无效');
      }
    },
    'license_import',
  );

  add(
    'GET',
    '/api/tenant/config',
    (_req, res) =>
      success(res, {
        siteName: '女娲前端验收',
        siteLogo: '',
        faviconUrl: '',
        loginBanner: '',
        loginBannerText: '',
        openImageCaptcha: state.config.imageCaptcha ? 1 : 0,
        openCaptcha: 0,
        openRegister: 1,
        authType: 1,
        enableSubscription: 0,
        commercialEdition: true,
        enabledSandbox: true,
        supportCustomDomain: false,
        homeRecommendQuestions: [],
        officialAgentIds: [],
        domainNames: [],
      }),
    undefined,
    true,
  );
  add(
    'GET',
    '/api/i18n/query',
    (_req, res) => success(res, {}),
    undefined,
    true,
  );
  add(
    'GET',
    '/api/i18n/lang/list',
    (_req, res) =>
      success(res, [
        {
          id: 1,
          lang: 'zh-cn',
          name: '简体中文',
          status: 1,
          isDefault: 1,
          sort: 1,
          created: CREATED,
          modified: CREATED,
        },
      ]),
    undefined,
    true,
  );
  add('GET', '/api/user/getLoginInfo', (_req, res) => success(res, user));
  add('GET', '/api/user/list-menu', (_req, res) => {
    const menu = (
      id: number,
      code: string,
      name: string,
      path: string,
      children: any[] = [],
    ) => ({
      id,
      code,
      name,
      path,
      status: 1,
      source: 1,
      openType: 1,
      children,
      resourceTree: (resources[code as keyof typeof resources] || [])
        .filter(allowed)
        .map((code, i) => ({
          id: id * 10 + i,
          code,
          name: code,
          children: [],
        })),
    });
    success(res, [
      menu(93, 'workspace', '工作空间', '/space', [
        menu(94, 'create_project', '项目', '/space/93/project-manage'),
      ]),
      menu(100, 'system_manage', '系统管理', '/system', [
        menu(101, 'system_config', '系统配置', '/system/config', [
          menu(105, 'license_config', 'License 授权', '/system/config/license'),
          menu(
            102,
            'sensitive_word_config',
            '敏感词管控',
            '/system/config/sensitive-word',
          ),
          menu(
            103,
            'auth_method_config',
            '登录方式管理',
            '/system/config/auth-method',
          ),
          menu(
            104,
            'oauth2_scope_audit',
            '授权范围审核',
            '/system/oauth2/scope-audit',
          ),
        ]),
      ]),
    ]);
  });
  add('GET', '/api/space/list', (_req, res) =>
    success(res, [
      {
        id: 93,
        name: '验收空间',
        type: 'Personal',
        userId: user.id,
        creatorId: user.id,
      },
    ]),
  );
  add('GET', '/api/space/get/:id', (_req, res) =>
    success(res, {
      id: 93,
      name: '验收空间',
      type: 'Personal',
      creatorId: user.id,
    }),
  );
  add('GET', '/api/notify/event/collect/batch', (_req, res) =>
    success(res, { hasEvent: false, eventList: [] }),
  );
  add('GET', '/api/notify/event/clear', (_req, res) => success(res));
  add('GET', '/api/user/config/get', (_req, res) => success(res, null));
  add('GET', '/api/published/category/list', (_req, res) => success(res, []));
  add('GET', '/api/notify/message/unread/count', (_req, res) =>
    success(res, 0),
  );
  add('POST', '/api/agent/conversation/list', (req, res) =>
    page([], req.body || {}, res),
  );
  add('POST', '/api/user-project/page-query', (req, res) =>
    page([], req.body || {}, res),
  );
  add('POST', '/api/user/config/set', (_req, res) => success(res));
  add('GET', '/api/user/logout', (_req, res) => success(res));
  add('POST', '/api/user/update', (_req, res) => success(res));
  add(
    'GET',
    '/api/user/captcha/image',
    (_req, res) => {
      if (!state.config.imageCaptcha) return fail(res, '图形验证码未开启');
      const captchaId = `mock-captcha-${++state.sequence}`;
      state.captchas.add(captchaId);
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="110" height="40"><rect width="110" height="40" fill="#eef2ff"/><text x="16" y="29" font-size="26" fill="#253a73">2468</text></svg>';
      success(res, {
        captchaId,
        image: `data:image/svg+xml;base64,${Buffer.from(svg).toString(
          'base64',
        )}`,
      });
    },
    undefined,
    true,
  );
  add(
    'POST',
    '/api/user/passwordLogin',
    (req, res) => {
      if (!captchaValid(req.body || {}, res)) return;
      res.cookie('ticket', TOKEN, { sameSite: 'lax', path: '/' });
      success(res, {
        token: TOKEN,
        expireDate: '2099-01-01T00:00:00Z',
        resetPass: 0,
        redirect: null,
      });
    },
    undefined,
    true,
  );
  add(
    'POST',
    '/api/user/code/send',
    (req, res) => {
      if (captchaValid(req.body || {}, res)) success(res);
    },
    undefined,
    true,
  );
  add(
    'POST',
    '/api/user/codeLogin',
    (_req, res) => {
      res.cookie('ticket', TOKEN, { sameSite: 'lax', path: '/' });
      success(res, {
        token: TOKEN,
        expireDate: '2099-01-01T00:00:00Z',
        resetPass: 0,
        redirect: null,
      });
    },
    undefined,
    true,
  );
  add('POST', '/api/user/password/reset', (_req, res) => {
    state.config.hasPassword = true;
    success(res);
  });
  add('POST', '/api/user/email/bind', (_req, res) => success(res));

  add(
    'POST',
    '/api/system/sensitive/word/page',
    (req, res) => {
      const filter = req.body?.queryFilter || {};
      const rows = state.words.filter((item) =>
        Object.entries(filter).every(
          ([key, value]) =>
            value === undefined ||
            value === '' ||
            (key === 'word'
              ? item.word.includes(String(value))
              : (item as any)[key] === value),
        ),
      );
      page(rows, req.body || {}, res);
    },
    'sensitive_word_query',
  );
  add(
    'POST',
    '/api/system/sensitive/word/create',
    (req, res) => {
      state.words.push({
        ...req.body,
        id: ++state.sequence,
        status: 1,
        created: CREATED,
      });
      success(res);
    },
    'sensitive_word_add',
  );
  add(
    'POST',
    '/api/system/sensitive/word/update',
    (req, res) => {
      const item = state.words.find((item) => item.id === Number(req.body?.id));
      if (!item) return fail(res, '敏感词不存在');
      const { word, category, matchType, action } = req.body;
      Object.assign(item, { word, category, matchType, action });
      success(res);
    },
    'sensitive_word_modify',
  );
  add(
    'POST',
    '/api/system/sensitive/word/updateStatus',
    (req, res) => {
      const item = state.words.find((item) => item.id === Number(req.body?.id));
      if (!item) return fail(res, '敏感词不存在');
      item.status = req.body.status;
      success(res);
    },
    'sensitive_word_enable',
  );
  add(
    'POST',
    '/api/system/sensitive/word/delete/:id',
    (req, res) => {
      state.words = state.words.filter(
        (item) => item.id !== Number(req.params.id),
      );
      success(res);
    },
    'sensitive_word_delete',
  );

  add(
    'GET',
    '/api/system/idp/list',
    (req, res) => success(res, maskedIdps(req)),
    'auth_method_query',
  );
  add(
    'POST',
    '/api/system/idp/create',
    (req, res) => updateIdp(req, res, true),
    'auth_method_add',
  );
  add(
    'POST',
    '/api/system/idp/update',
    (req, res) => updateIdp(req, res, false),
    'auth_method_modify',
  );
  add(
    'POST',
    '/api/system/idp/updateStatus',
    (req, res) => {
      const item = state.idps.find((item) => item.id === Number(req.body?.id));
      if (!item) return fail(res, '登录方式不存在');
      if (
        item.type === 'CAS' &&
        req.body.enabled === 1 &&
        state.idps.some(
          (other) =>
            other.id !== item.id && other.type === 'CAS' && other.enabled === 1,
        )
      )
        return fail(res, 'CAS 同时只能启用一个');
      item.enabled = req.body.enabled;
      if (!item.enabled) item.autoRedirect = 0;
      success(res);
    },
    'auth_method_enable',
  );
  add(
    'POST',
    '/api/system/idp/auto-redirect',
    (req, res) => {
      const id = req.body?.id;
      const item = state.idps.find((item) => item.id === id);
      if (id !== null && !item?.enabled)
        return fail(res, '只能设置已启用的登录方式');
      state.idps.forEach((item) => {
        item.autoRedirect = item.id === id ? 1 : 0;
      });
      success(res);
    },
    'auth_method_enable',
  );
  add(
    'POST',
    '/api/system/idp/delete/:id',
    (req, res) => {
      const id = Number(req.params.id);
      if (state.identities.some((item) => item.idpId === id))
        return fail(res, '仍有用户绑定该登录方式');
      state.idps = state.idps.filter((item) => item.id !== id);
      success(res);
    },
    'auth_method_delete',
  );
  add(
    'GET',
    '/api/auth/idp/list',
    (_req, res) =>
      success(res, {
        items: state.idps
          .filter((item) => item.enabled)
          .map((item) => ({
            id: item.id,
            type: item.type,
            name: item.name,
            icon: item.icon,
            wechatMode: item.config?.mode,
          })),
        autoRedirectIdpId:
          state.idps.find((item) => item.enabled && item.autoRedirect)?.id ||
          null,
      }),
    undefined,
    true,
  );
  add('GET', '/api/user/identity/list', (_req, res) =>
    success(res, state.identities),
  );
  add('POST', '/api/user/identity/unbind/:id', (req, res) => {
    if (!state.config.hasPassword && state.identities.length === 1)
      return fail(res, '请先设置账号密码后再解绑');
    state.identities = state.identities.filter(
      (item) => item.id !== Number(req.params.id),
    );
    success(res);
  });
  const authReturn: Handler = (req, res) => {
    const binding = req.params?.providerId;
    if (state.config.idpError) {
      const target = new URL(binding ? targetOf(req) : '/login', origin(req));
      target.searchParams.set('idpError', state.config.idpError);
      if (!binding) target.searchParams.set('redirect', targetOf(req));
      return res.redirect(target.pathname + target.search);
    }
    const providerId = Number(binding || req.query?.provider);
    if (!state.idps.some((item) => item.id === providerId && item.enabled))
      return fail(res, '登录方式不可用');
    if (binding) {
      const idp = state.idps.find((item) => item.id === Number(binding));
      if (!idp?.enabled) return fail(res, '登录方式不可用');
      if (!state.identities.some((item) => item.idpId === idp.id))
        state.identities.push({
          id: ++state.sequence,
          idpId: idp.id,
          idpType: idp.type,
          providerName: idp.name,
          externalUserName: 'mock-external-user',
          externalIdMasked: 'mock-***',
          created: CREATED,
          lastLoginTime: CREATED,
        });
    }
    if (!binding && state.config.registrationRequired) {
      return res.redirect(
        `/auth/bind-or-register?redirect=${encodeURIComponent(targetOf(req))}`,
      );
    }
    completeLogin(req, res);
  };
  add('GET', '/api/auth/idp/authorize', authReturn, undefined, true);
  add('GET', '/api/user/identity/bind/:providerId', authReturn);
  add(
    'GET',
    '/auth/bind-or-register',
    (req, res) => completeLogin(req, res, true),
    undefined,
    true,
  );

  add('GET', '/api/user-project/oauth2/scopes', (_req, res) =>
    success(res, scopes),
  );
  add('GET', '/api/user-project/oauth2/setting/:id', (req, res) =>
    success(res, state.projects[Number(req.params.id)]),
  );
  add('GET', '/api/user-project/oauth2/info/:id', (req, res) => {
    const item = state.projects[Number(req.params.id)];
    success(
      res,
      item
        ? {
            ...item,
            spaceId: 93,
            creatorId: user.id,
            description: '本地验收应用',
            icon: '',
            created: CREATED,
            modified: CREATED,
            publishStatus: 'Developing',
          }
        : null,
    );
  });
  add('GET', '/api/user-project/oauth2/secret/:id', (_req, res) =>
    success(res, 'mock-client-secret'),
  );
  add('POST', '/api/user-project/oauth2/setting/save', (req, res) => {
    const body = req.body || {};
    const setting = state.projects[Number(body.projectId)];
    if (!setting) return fail(res, '应用不存在');
    if (body.homepageUrl !== undefined) setting.homepageUrl = body.homepageUrl;
    if (body.redirectUri !== undefined) setting.redirectUri = body.redirectUri;
    if (Array.isArray(body.scopes)) {
      setting.pendingScopes = normalScopes(body.scopes);
      setting.scopeApplyStatus = 'Pending';
      delete setting.scopeRejectReason;
      state.applications = state.applications.filter(
        (item) =>
          !(item.projectId === setting.projectId && item.status === 'Pending'),
      );
      state.applications.push({
        id: ++state.sequence,
        projectId: setting.projectId,
        projectType: setting.projectType,
        projectName: setting.name,
        clientId: setting.clientId,
        applyUserId: user.id,
        oldScopes: [...setting.scopes],
        scopes: [...setting.pendingScopes],
        status: 'Pending',
        created: CREATED,
        reviewedAt: '',
        rejectReason: '',
      });
    }
    success(res, setting);
  });
  add(
    'POST',
    '/api/system/oauth2/page-query',
    (req, res) => {
      const filter = req.body?.queryFilter || {};
      page(
        state.applications.filter(
          (item) =>
            (!filter.status || item.status === filter.status) &&
            (!filter.projectId || item.projectId === Number(filter.projectId)),
        ),
        req.body || {},
        res,
      );
    },
    'oauth2_scope_audit_query',
  );
  const createScopeAuditHandler =
    (operation: 'approve' | 'reject'): Handler =>
    (req, res) => {
      const application = state.applications.find(
        (item) => item.id === Number(req.params.id),
      );
      if (!application || application.status !== 'Pending')
        return fail(res, '申请不存在或已审核');
      if (operation === 'reject' && !req.body?.reason?.trim())
        return fail(res, '请填写拒绝原因');
      const setting = state.projects[application.projectId];
      application.status = operation === 'approve' ? 'Approved' : 'Rejected';
      application.reviewedAt = CREATED;
      application.rejectReason = req.body?.reason || '';
      setting.scopeApplyStatus = application.status;
      delete setting.pendingScopes;
      if (operation === 'approve') {
        setting.scopes = [...application.scopes];
        delete setting.scopeRejectReason;
      } else setting.scopeRejectReason = application.rejectReason;
      success(res);
    };
  for (const operation of ['approve', 'reject'] as const)
    add(
      'POST',
      `/api/system/oauth2/${operation}/:id`,
      createScopeAuditHandler(operation),
      operation === 'approve'
        ? 'oauth2_scope_audit_pass'
        : 'oauth2_scope_audit_reject',
    );
  add('GET', '/api/userapp/get/:id', (req, res) => {
    const setting = state.projects[Number(req.params.id)];
    success(
      res,
      setting
        ? {
            id: setting.projectId,
            name: setting.name,
            spaceId: 93,
            creatorId: user.id,
            userId: user.id,
            description: '本地验收全栈应用',
            icon: '',
            deployType: 'platform',
            created: CREATED,
            modified: CREATED,
          }
        : null,
    );
  });
  add('GET', '/api/user-project/conversations/:id', (_req, res) =>
    success(res, []),
  );
  add('GET', '/api/userapp/domain/list', (_req, res) => success(res, []));
  return handlers;
}

export default process.env.UMI_ENV === 'release0930Mock' &&
process.env.NODE_ENV !== 'production'
  ? createRelease0930Mock()
  : {};
