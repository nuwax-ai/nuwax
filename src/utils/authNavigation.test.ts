import type { HostAuthContext } from '@/types/interfaces/hostAuth';
import { history } from 'umi';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { navigateToAuthUrl, resolveAuthRedirectUrl } from './authNavigation';

vi.mock('umi', () => ({ history: { replace: vi.fn() } }));

const context: HostAuthContext = {
  businessOrigin: 'https://tenant.example:8443',
  gatewayOrigin: 'http://127.0.0.1:46801',
  loadMode: 'gateway',
};

describe('认证导航同源映射', () => {
  let getContext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    getContext = vi.fn().mockResolvedValue(context);
    vi.stubGlobal('window', {
      location: {
        origin: context.gatewayOrigin,
        href: `${context.gatewayOrigin}/login`,
      },
      NuwaClawBridge: {
        host: { getProduct: () => 'nuwax' },
        auth: { getContext },
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('使用运行时企业域和随机网关端口，保留 path/query/hash', async () => {
    await expect(
      resolveAuthRedirectUrl(
        'https://tenant.example:8443/login?redirect=%2Frepo%2Fdoc#section',
      ),
    ).resolves.toBe(
      'http://127.0.0.1:46801/login?redirect=%2Frepo%2Fdoc#section',
    );
  });

  it.each([
    'https://idp.example/login',
    'http://tenant.example:8443/login',
    'https://tenant.example/login',
    'https://tenant.example.evil:8443/login',
    'https://user@tenant.example:8443/login',
    '/login?redirect=%2F',
    '//tenant.example:8443/login',
    'mailto:login@example.com',
    'https://[invalid',
  ])('保留非精确业务 origin、相对路径或非 HTTP URL：%s', async (url) => {
    await expect(resolveAuthRedirectUrl(url)).resolves.toBe(url);
  });

  it.each([
    { ...context, loadMode: 'direct' as const },
    { ...context, gatewayOrigin: null },
    null,
  ])('direct、网关不可用或旧宿主不改写：%j', async (value) => {
    getContext.mockResolvedValue(value);
    const url = `${context.businessOrigin}/login`;
    await expect(resolveAuthRedirectUrl(url)).resolves.toBe(url);
  });

  it('普通浏览器不查询宿主', async () => {
    delete window.NuwaClawBridge;
    const url = `${context.businessOrigin}/login`;
    await expect(resolveAuthRedirectUrl(url)).resolves.toBe(url);
    expect(getContext).not.toHaveBeenCalled();
  });

  it('社区宿主与网关之外的页面保持原跳转', async () => {
    window.NuwaClawBridge!.host!.getProduct = () => 'nuwaclaw';
    const url = `${context.businessOrigin}/login`;
    await expect(resolveAuthRedirectUrl(url)).resolves.toBe(url);
    window.NuwaClawBridge!.host!.getProduct = () => 'nuwax';
    Object.assign(window.location, { origin: 'https://idp.example' });
    await expect(resolveAuthRedirectUrl(url)).resolves.toBe(url);
  });

  it('正常导航使用映射后的地址', async () => {
    await navigateToAuthUrl(`${context.businessOrigin}/repo/doc?x=1#heading`);
    expect(window.location.href).toBe(
      `${context.gatewayOrigin}/repo/doc?x=1#heading`,
    );
  });

  it.each([
    '/license-expired',
    '/license-expired/?from=login#expired',
    '/login?redirect=%2F',
  ])('站内认证页面 %s 使用 SPA 导航，不重载文档', async (path) => {
    delete window.NuwaClawBridge;
    window.location.href = `${context.gatewayOrigin}/home`;
    await navigateToAuthUrl(path);
    expect(history.replace).toHaveBeenCalledWith(path);
    expect(window.location.href).toBe(`${context.gatewayOrigin}/home`);
  });

  it('桌面网关映射后的授权过期页也使用 SPA 导航', async () => {
    await navigateToAuthUrl(`${context.businessOrigin}/license-expired`);
    expect(history.replace).toHaveBeenCalledWith('/license-expired');
    expect(window.location.href).toBe(`${context.gatewayOrigin}/login`);
  });

  it.each([
    '/license-expired',
    '/login?redirect=%2Fhome',
    '/auth/bind?state=fixture#account',
    '/home',
  ])('已在目标地址 %s 时重复认证响应不触发任何导航', async (path) => {
    delete window.NuwaClawBridge;
    let href = `${context.gatewayOrigin}${path}`;
    const assignHref = vi.fn((value: string) => {
      href = value;
    });
    Object.defineProperty(window.location, 'href', {
      get: () => href,
      set: assignHref,
    });
    await navigateToAuthUrl(path);
    await navigateToAuthUrl(href);
    expect(history.replace).not.toHaveBeenCalled();
    expect(assignHref).not.toHaveBeenCalled();
  });

  it.each(['/auth/bind?state=new#account', '/auth/bind?state=fixture#new'])(
    '目标地址的参数或 hash 变化时仍正常导航：%s',
    async (path) => {
      delete window.NuwaClawBridge;
      window.location.href = `${context.gatewayOrigin}/auth/bind?state=fixture#account`;
      await navigateToAuthUrl(path);
      expect(window.location.href).toBe(path);
    },
  );

  it('相对地址按当前完整 URL 解析，相同目标也不导航', async () => {
    delete window.NuwaClawBridge;
    window.location.href = `${context.gatewayOrigin}/auth/bind?state=fixture`;
    await navigateToAuthUrl('bind?state=fixture');
    expect(history.replace).not.toHaveBeenCalled();
    expect(window.location.href).toBe(
      `${context.gatewayOrigin}/auth/bind?state=fixture`,
    );
  });

  it('相对地址解析到其他路径时仍导航，不按根路径误判为当前页', async () => {
    delete window.NuwaClawBridge;
    window.location.href = `${context.gatewayOrigin}/auth/bind`;
    await navigateToAuthUrl('auth/bind');
    expect(window.location.href).toBe('auth/bind');
  });

  it('外部授权过期地址仍通过文档导航访问', async () => {
    await navigateToAuthUrl('https://idp.example/license-expired');
    expect(history.replace).not.toHaveBeenCalled();
    expect(window.location.href).toBe('https://idp.example/license-expired');
  });

  it.each(['/auth/bind?state=fixture', '/api/auth/idp/authorize?provider=3'])(
    '后端认证中间页保留业务域：%s',
    async (path) => {
      await expect(resolveAuthRedirectUrl(path)).resolves.toBe(
        `${context.businessOrigin}${path}`,
      );
      await expect(
        resolveAuthRedirectUrl(`${context.businessOrigin}${path}`),
      ).resolves.toBe(`${context.businessOrigin}${path}`);
    },
  );

  it('构建期业务域中的绑定中间页使用当前企业域', async () => {
    const base = process.env.BASE_URL;
    process.env.BASE_URL = 'https://compiled.example';
    try {
      await expect(
        resolveAuthRedirectUrl(
          'https://compiled.example/auth/bind?state=fixture',
        ),
      ).resolves.toBe(`${context.businessOrigin}/auth/bind?state=fixture`);
      await expect(
        resolveAuthRedirectUrl('https://outside.example/auth/bind'),
      ).resolves.toBe('https://outside.example/auth/bind');
    } finally {
      process.env.BASE_URL = base;
    }
  });

  it('等待桥期间用户已离开页面，迟到结果不得覆盖导航', async () => {
    let complete!: (value: HostAuthContext) => void;
    getContext.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const pending = navigateToAuthUrl(`${context.businessOrigin}/login`);
    window.location.href = `${context.gatewayOrigin}/new-page`;
    complete(context);
    await pending;
    expect(window.location.href).toBe(`${context.gatewayOrigin}/new-page`);
  });

  it('并发认证跳转只执行最新一条', async () => {
    let complete!: (value: HostAuthContext) => void;
    getContext.mockReturnValueOnce(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const first = navigateToAuthUrl(`${context.businessOrigin}/old-login`);
    await navigateToAuthUrl(`${context.businessOrigin}/new-login`);
    complete(context);
    await first;
    expect(window.location.href).toBe(`${context.gatewayOrigin}/new-login`);
  });
});
