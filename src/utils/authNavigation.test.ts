import type { HostAuthContext } from '@/types/interfaces/hostAuth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { navigateToAuthUrl, resolveAuthRedirectUrl } from './authNavigation';

const context: HostAuthContext = {
  businessOrigin: 'https://tenant.example:8443',
  gatewayOrigin: 'http://127.0.0.1:46801',
  loadMode: 'gateway',
};

describe('认证导航同源映射', () => {
  let getContext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
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
