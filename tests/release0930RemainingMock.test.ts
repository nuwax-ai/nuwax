import { describe, expect, it } from 'vitest';
import disabledHandlers, {
  createRelease0930Mock,
} from '../mock/release0930Remaining';

const CONTROL = '/api/mock/release0930';
const AUTH = {
  authorization: 'Bearer release0930-mock-token',
  host: 'localhost:3102',
};

function client() {
  const handlers = createRelease0930Mock();
  return (
    method: string,
    path: string,
    body: any = {},
    authenticated = true,
  ) => {
    const url = new URL(path, 'http://localhost:3102');
    const entry = Object.entries(handlers).find(([key]) => {
      const [verb, route] = key.split(' ');
      return (
        verb === method &&
        new RegExp(`^${route.replace(/:[^/]+/g, '([^/]+)')}$`).test(
          url.pathname,
        )
      );
    });
    if (!entry) throw new Error(`Missing handler: ${method} ${path}`);
    const route = entry[0].split(' ')[1];
    const names = [...route.matchAll(/:([^/]+)/g)].map((match) => match[1]);
    const values = url.pathname
      .match(new RegExp(`^${route.replace(/:[^/]+/g, '([^/]+)')}$`))!
      .slice(1);
    let result: any;
    const res: any = {
      json: (value: any) => {
        result = JSON.parse(JSON.stringify(value));
      },
      redirect: (value: string) => {
        result = { redirect: value };
      },
      cookie: () => res,
      type: () => res,
      send: (value: string) => {
        result = { html: value };
      },
    };
    entry[1](
      {
        body,
        path: url.pathname,
        params: Object.fromEntries(names.map((name, i) => [name, values[i]])),
        query: Object.fromEntries(url.searchParams),
        headers: authenticated ? AUTH : { host: AUTH.host },
        protocol: 'http',
      },
      res,
    );
    return result;
  };
}

describe('9.30 本地业务 mock 合同', () => {
  it('默认不注册业务 handler，不改变普通开发链路', () => {
    expect(disabledHandlers).toEqual({});
  });
  it('读权限与写权限独立，未登录不提供管理数据', () => {
    const request = client();
    expect(request('GET', '/api/system/idp/list', {}, false).code).toBe('4010');
    request('POST', `${CONTROL}/configure`, { permissionMode: 'read-only' });
    expect(request('GET', '/api/system/idp/list').code).toBe('0000');
    expect(
      request('POST', '/api/system/idp/auto-redirect', { id: 2 }).code,
    ).toBe('4033');
    const menus = request('GET', '/api/user/list-menu').data;
    const resourceCodes = JSON.stringify(menus);
    expect(resourceCodes).toContain('auth_method_query');
    expect(resourceCodes).not.toContain('auth_method_modify');
  });
  it('敏感词操作与筛选真实更新数据，重置可恢复', () => {
    const request = client();
    request('POST', '/api/system/sensitive/word/create', {
      word: '测试正则',
      category: 'ILLEGAL',
      matchType: 'REGEX',
      action: 'DISCONNECT',
    });
    const added = request('POST', '/api/system/sensitive/word/page', {
      current: 1,
      pageSize: 10,
      queryFilter: { word: '正则', matchType: 'REGEX' },
    }).data;
    expect(added.total).toBe(1);
    request('POST', '/api/system/sensitive/word/updateStatus', {
      id: added.records[0].id,
      status: 0,
    });
    expect(
      request('POST', '/api/system/sensitive/word/page', {
        queryFilter: { status: 0 },
      }).data.total,
    ).toBe(1);
    request('POST', `/api/system/sensitive/word/delete/${added.records[0].id}`);
    expect(request('POST', '/api/system/sensitive/word/page').data.total).toBe(
      1,
    );
    request('POST', `${CONTROL}/reset`);
    expect(request('GET', `${CONTROL}/state`).data.requests).toEqual([]);
  });
  it('自动跳转只允许启用项且唯一，停用同步清除', () => {
    const request = client();
    request('POST', '/api/system/idp/auto-redirect', { id: 1 });
    request('POST', '/api/system/idp/auto-redirect', { id: 2 });
    expect(
      request('GET', '/api/system/idp/list')
        .data.filter((item: any) => item.autoRedirect)
        .map((item: any) => item.id),
    ).toEqual([2]);
    request('POST', '/api/system/idp/updateStatus', { id: 2, enabled: 0 });
    expect(
      request('GET', '/api/auth/idp/list', {}, false).data.autoRedirectIdpId,
    ).toBeNull();
    expect(
      request('POST', '/api/system/idp/auto-redirect', { id: 2 }).code,
    ).toBe('0001');
  });
  it('新增 CAS 默认停用，不能与已有 CAS 同时启用', () => {
    const request = client();
    const item = request('POST', '/api/system/idp/create', {
      type: 'CAS',
      name: '第二 CAS',
      casConfig: { serverUrl: 'https://idp.example.test' },
    }).data;
    expect(item.enabled).toBe(0);
    expect(
      request('POST', '/api/system/idp/updateStatus', {
        id: item.id,
        enabled: 1,
      }).message,
    ).toContain('只能启用一个');
  });
  it('绑定使删除失败，唯一绑定且无密码时拒绝解绑', () => {
    const request = client();
    request(
      'GET',
      '/api/user/identity/bind/2?redirect=%2Fsystem%2Fconfig%2Fauth-method%3Fsetting%3Daccount-bind',
    );
    const identity = request('GET', '/api/user/identity/list').data[0];
    expect(request('POST', '/api/system/idp/delete/2').message).toContain(
      '仍有用户绑定',
    );
    request('POST', `${CONTROL}/configure`, { hasPassword: false });
    expect(
      request('POST', `/api/user/identity/unbind/${identity.id}`).message,
    ).toContain('先设置账号密码');
  });
  it('回跳限制为同源路径，未绑定中间页仍使用真实 /auth 前缀', () => {
    const request = client();
    const result = request(
      'GET',
      '/api/auth/idp/authorize?provider=2&redirect=https%3A%2F%2Fevil.example%2F',
      {},
      false,
    );
    expect(result.html).toContain('/system/config/auth-method');
    expect(result.html).not.toContain('evil.example');
    request('POST', `${CONTROL}/configure`, { registrationRequired: true });
    expect(
      request(
        'GET',
        '/api/auth/idp/authorize?provider=2&redirect=%2Fspace%2F93',
        {},
        false,
      ).redirect,
    ).toBe('/auth/bind-or-register?redirect=%2Fspace%2F93');
  });
  it('敏感内容不进入请求记录或配置回显', () => {
    const request = client();
    request(
      'POST',
      '/api/user/passwordLogin',
      { password: 'do-not-record' },
      false,
    );
    request('POST', '/api/system/idp/update', {
      id: 2,
      type: 'OAUTH2',
      name: '新名称',
      oauth2Config: { clientSecret: 'do-not-record' },
    });
    const snapshot = JSON.stringify(request('GET', `${CONTROL}/state`).data);
    expect(snapshot).not.toContain('do-not-record');
    expect(snapshot).toContain('[redacted]');
    expect(snapshot).toContain('******');
  });
  it.each([9301, 9302])(
    '应用 %i：地址保存保留原申请，变更后审核通过/拒绝回写状态',
    (projectId) => {
      const request = client();
      const before = request('GET', `${CONTROL}/state`).data.applications;
      const setting = request('POST', '/api/user-project/oauth2/setting/save', {
        projectId,
        homepageUrl: 'https://updated.example.test',
      }).data;
      expect(setting.pendingScopes).toEqual(['profile', 'chat:read']);
      expect(request('GET', `${CONTROL}/state`).data.applications).toEqual(
        before,
      );
      request('POST', '/api/user-project/oauth2/setting/save', {
        projectId,
        scopes: ['profile'],
      });
      const application = request('POST', '/api/system/oauth2/page-query', {
        queryFilter: { projectId, status: 'Pending' },
      }).data.records[0];
      expect(application.scopes).toEqual(['profile']);
      request('POST', `/api/system/oauth2/approve/${application.id}`);
      expect(
        request('GET', `/api/user-project/oauth2/setting/${projectId}`).data,
      ).toMatchObject({ scopes: ['profile'], scopeApplyStatus: 'Approved' });
      request('POST', '/api/user-project/oauth2/setting/save', {
        projectId,
        scopes: ['profile', 'chat:write'],
      });
      const next = request('POST', '/api/system/oauth2/page-query', {
        queryFilter: { projectId, status: 'Pending' },
      }).data.records[0];
      expect(
        request('POST', `/api/system/oauth2/reject/${next.id}`, { reason: '' })
          .code,
      ).toBe('0001');
      request('POST', `/api/system/oauth2/reject/${next.id}`, {
        reason: '权限说明不足',
      });
      const rejected = request(
        'GET',
        `/api/user-project/oauth2/setting/${projectId}`,
      ).data;
      expect(rejected.scopeRejectReason).toBe('权限说明不足');
      expect(rejected.scopes).toEqual(['profile']);
      expect(rejected.pendingScopes).toBeUndefined();
    },
  );
  it('图形验证码错误或成功均一次性消费，服务失败后也不能重用', () => {
    const request = client();
    request('POST', `${CONTROL}/configure`, { imageCaptcha: true });
    const first = request('GET', '/api/user/captcha/image', {}, false).data;
    expect(
      request(
        'POST',
        '/api/user/code/send',
        { captchaId: first.captchaId, captchaCode: 'wrong' },
        false,
      ).code,
    ).toBe('0001');
    expect(
      request(
        'POST',
        '/api/user/code/send',
        { captchaId: first.captchaId, captchaCode: '2468' },
        false,
      ).code,
    ).toBe('0001');
    const second = request('GET', '/api/user/captcha/image', {}, false).data;
    expect(
      request(
        'POST',
        '/api/user/code/send',
        { captchaId: second.captchaId, captchaCode: '2468' },
        false,
      ).code,
    ).toBe('0000');
    request('POST', `${CONTROL}/configure`, {
      failNext: { path: '/api/user/passwordLogin', message: '临时失败' },
    });
    const third = request('GET', '/api/user/captcha/image', {}, false).data;
    expect(
      request(
        'POST',
        '/api/user/passwordLogin',
        { captchaId: third.captchaId, captchaCode: '2468' },
        false,
      ).message,
    ).toBe('临时失败');
    expect(
      request(
        'POST',
        '/api/user/passwordLogin',
        { captchaId: third.captchaId, captchaCode: '2468' },
        false,
      ).code,
    ).toBe('0001');
  });
});
