import type { HostAuthContext } from '@/types/interfaces/hostAuth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { completeDesktopIdpReturn, startIdpNavigation } from './idpNavigation';

const business = 'https://tenant.example:8443';
const gateway = 'http://127.0.0.1:46801';
const context: HostAuthContext = {
  businessOrigin: business,
  gatewayOrigin: gateway,
  loadMode: 'gateway',
};
let getContext: ReturnType<typeof vi.fn>,
  beginLogin: ReturnType<typeof vi.fn>,
  syncSession: ReturnType<typeof vi.fn>;
let assign: ReturnType<typeof vi.fn>, replace: ReturnType<typeof vi.fn>;
function setPage(origin: string, search = '') {
  vi.stubGlobal('window', {
    location: {
      origin,
      search,
      href: `${origin}/login${search}`,
      assign,
      replace,
    },
    NuwaClawBridge: {
      host: { getProduct: () => 'nuwax' },
      auth: { getContext, beginLogin, syncSession },
    },
  });
}
const start = (more = {}) =>
  startIdpNavigation({
    providerId: 3,
    redirect: '/space/93?tab=files#details',
    ...more,
  });
const returned = (path = '/space/93?tab=files#details', marker = '1') =>
  `?desktopIdpReturn=${marker}&redirect=${encodeURIComponent(path)}`;
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
beforeEach(() => {
  getContext = vi.fn().mockResolvedValue(context);
  beginLogin = vi.fn().mockResolvedValue(true);
  syncSession = vi.fn().mockResolvedValue(true);
  assign = vi.fn();
  replace = vi.fn();
  setPage(gateway);
});
afterEach(() => vi.unstubAllGlobals());

describe('桌面 IdP 发起', () => {
  it.each(['gateway', 'direct'] as const)(
    '运行时企业域授权，%s 不把 IdP state 留在 gateway',
    async (loadMode) => {
      getContext.mockResolvedValue({ ...context, loadMode });
      setPage(loadMode === 'direct' ? business : gateway);
      expect(await start()).toBe('started');
      const url = new URL(assign.mock.calls[0][0]);
      expect(url.origin).toBe(business);
      expect(url.pathname).toBe('/api/auth/idp/authorize');
      expect(url.searchParams.get('provider')).toBe('3');
      const callback = new URL(url.searchParams.get('redirect')!, business);
      expect(callback.pathname).toBe('/login');
      expect(callback.searchParams.get('desktopIdpReturn')).toBe('1');
      expect(callback.searchParams.get('redirect')).toBe(
        '/space/93?tab=files#details',
      );
      expect(beginLogin).toHaveBeenCalledOnce();
    },
  );
  it('绑定保留登录会话，后端绑定和返回都在业务域', async () => {
    expect(await start({ mode: 'bind' })).toBe('started');
    expect(beginLogin).not.toHaveBeenCalled();
    const url = new URL(assign.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/user/identity/bind/3');
    expect(
      new URL(url.searchParams.get('redirect')!, business).searchParams.get(
        'desktopIdpReturn',
      ),
    ).toBe('bind');
  });
  it('自动跳转替换历史；非法业务目标回首页', async () => {
    expect(await start({ replace: true, redirect: '//evil.example/' })).toBe(
      'started',
    );
    expect(assign).not.toHaveBeenCalled();
    const callback = new URL(
      new URL(replace.mock.calls[0][0]).searchParams.get('redirect')!,
      business,
    );
    expect(callback.searchParams.get('redirect')).toBe('/');
  });
  it.each([
    null,
    { ...context, businessOrigin: 'javascript:alert(1)' },
    { ...context, businessOrigin: 'https://user@tenant.example:8443' },
    { ...context, gatewayOrigin: 'https://evil.example' },
  ])('坏上下文不发起登录 (%#)', async (ctx) => {
    getContext.mockResolvedValue(ctx);
    expect(await start()).toBe('failed');
    expect(beginLogin).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });
  it('外部页面不得用受信上下文开始登录', async () => {
    setPage('https://idp.example');
    expect(await start()).toBe('failed');
    expect(beginLogin).not.toHaveBeenCalled();
  });
  it('beginLogin 失败保留页面，恢复后可重试', async () => {
    beginLogin.mockResolvedValueOnce(false);
    expect(await start()).toBe('failed');
    expect(assign).not.toHaveBeenCalled();
    expect(await start()).toBe('started');
  });
  it('宿主调用拒绝被消费', async () => {
    getContext.mockRejectedValueOnce(new Error('IPC'));
    expect(await start()).toBe('failed');
    beginLogin.mockRejectedValueOnce(new Error('IPC'));
    expect(await start()).toBe('failed');
  });
  it('并发点击只清一次旧会话，迟到上下文不覆盖新导航', async () => {
    const d = deferred<HostAuthContext>();
    getContext.mockReturnValueOnce(d.promise);
    const first = start();
    expect(await start()).toBe('cancelled');
    window.location.href = `${gateway}/other`;
    d.resolve(context);
    expect(await first).toBe('cancelled');
    expect(assign).not.toHaveBeenCalled();
    expect(beginLogin).not.toHaveBeenCalled();
  });
  it('beginLogin 等待期间离开页面不发起授权', async () => {
    const d = deferred<boolean>();
    beginLogin.mockReturnValueOnce(d.promise);
    const pending = start();
    await vi.waitFor(() => expect(beginLogin).toHaveBeenCalledOnce());
    window.location.href = `${gateway}/other`;
    d.resolve(true);
    expect(await pending).toBe('cancelled');
    expect(assign).not.toHaveBeenCalled();
  });
  it.each(['nuwaclaw', null])(
    '社区和普通浏览器沿用 Web 授权，不调用商业会话桥 (%s)',
    async (product) => {
      window.NuwaClawBridge!.host!.getProduct = () => product as 'nuwaclaw';
      expect(await start()).toBe('started');
      expect(getContext).not.toHaveBeenCalled();
      expect(beginLogin).not.toHaveBeenCalled();
      expect(
        new URL(assign.mock.calls[0][0], business).searchParams.get('redirect'),
      ).toBe('/space/93?tab=files#details');
    },
  );
});

describe('桌面 IdP 返回', () => {
  it.each(['gateway', 'direct'] as const)(
    '%s 同步 Cookie 后回业务深链',
    async (loadMode) => {
      getContext.mockResolvedValue({ ...context, loadMode });
      setPage(business, returned());
      expect(await completeDesktopIdpReturn()).toBe('started');
      expect(syncSession).toHaveBeenCalledOnce();
      expect(replace).toHaveBeenCalledWith(
        `${
          loadMode === 'gateway' ? gateway : business
        }/space/93?tab=files#details`,
      );
    },
  );
  it.each(['//evil.example', '/\\evil.example', 'https://evil.example'])(
    '拒绝跨域返回 %s',
    async (path) => {
      setPage(business, returned(path));
      expect(await completeDesktopIdpReturn()).toBe('started');
      expect(replace).toHaveBeenCalledWith(`${gateway}/`);
    },
  );
  it('绑定中间页保持业务域，不被本地 SPA 吃掉', async () => {
    setPage(business, returned('/auth/bind?state=fixture'));
    expect(await completeDesktopIdpReturn()).toBe('started');
    expect(replace).toHaveBeenCalledWith(`${business}/auth/bind?state=fixture`);
  });
  it('同步失败不离开回调页，允许普通登录兜底', async () => {
    syncSession.mockResolvedValueOnce(false);
    setPage(business, returned());
    expect(await completeDesktopIdpReturn()).toBe('failed');
    expect(replace).not.toHaveBeenCalled();
  });
  it('同步拒绝被消费', async () => {
    syncSession.mockRejectedValueOnce(new Error('IPC'));
    setPage(business, returned());
    expect(await completeDesktopIdpReturn()).toBe('failed');
  });
  it('等待同步期间的新导航不会被覆盖', async () => {
    const d = deferred<boolean>();
    syncSession.mockReturnValueOnce(d.promise);
    setPage(business, returned());
    const pending = completeDesktopIdpReturn();
    await vi.waitFor(() => expect(syncSession).toHaveBeenCalledOnce());
    window.location.href = `${business}/other`;
    d.resolve(true);
    expect(await pending).toBe('cancelled');
    expect(replace).not.toHaveBeenCalled();
  });
  it('后端不保留返回参数的错误仍可回 gateway 普通登录，不触发自动跳转', async () => {
    setPage(business, '?idpError=denied');
    expect(await completeDesktopIdpReturn()).toBe('started');
    expect(syncSession).not.toHaveBeenCalled();
    const url = new URL(replace.mock.calls[0][0]);
    expect(url.origin).toBe(gateway);
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('local')).toBe('1');
    expect(url.searchParams.get('idpError')).toBe('denied');
  });
  it('绑定拒绝回原页并保留面板和错误', async () => {
    setPage(
      business,
      `${returned(
        '/home?setting=account-bind#details',
        'bind',
      )}&idpError=denied`,
    );
    expect(await completeDesktopIdpReturn()).toBe('started');
    expect(replace).toHaveBeenCalledWith(
      `${gateway}/home?setting=account-bind&idpError=denied#details`,
    );
    expect(syncSession).not.toHaveBeenCalled();
  });
  it.each(['1', 'bind'])(
    '失败回跳原样带回成功 redirect 包装时解开目标 (%s)',
    async (mode) => {
      const callback = `/login${returned('/home?setting=account-bind', mode)}`;
      setPage(
        business,
        `?idpError=denied&redirect=${encodeURIComponent(callback)}`,
      );
      expect(await completeDesktopIdpReturn()).toBe('started');
      const target = new URL(replace.mock.calls[0][0]);
      if (mode === 'bind') {
        expect(target.pathname).toBe('/home');
        expect(target.searchParams.get('setting')).toBe('account-bind');
      } else {
        expect(target.searchParams.get('redirect')).toBe(
          '/home?setting=account-bind',
        );
      }
      expect(target.searchParams.has('desktopIdpReturn')).toBe(false);
    },
  );
  it('已经在目标源的普通登录错误不重复返回', async () => {
    setPage(gateway, '?idpError=denied');
    expect(await completeDesktopIdpReturn()).toBe('none');
    expect(replace).not.toHaveBeenCalled();
  });
  it('外部/网关页面不能用 marker 提升 Cookie', async () => {
    setPage(gateway, returned());
    expect(await completeDesktopIdpReturn()).toBe('failed');
    expect(syncSession).not.toHaveBeenCalled();
  });
  it('普通浏览器和无返回标记不处理桌面回跳', async () => {
    expect(await completeDesktopIdpReturn()).toBe('none');
    setPage(business, returned());
    delete window.NuwaClawBridge;
    expect(await completeDesktopIdpReturn()).toBe('none');
    expect(syncSession).not.toHaveBeenCalled();
  });
});
