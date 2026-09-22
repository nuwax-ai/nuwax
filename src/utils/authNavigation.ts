import { hostBridge, isDesktopHost } from '@/utils/hostBridge';

/** 后端认证跳转在商业客户端网关形态下保持同源，保留路径、查询和 hash。 */
export async function resolveAuthRedirectUrl(url: string): Promise<string> {
  if (!isDesktopHost() || !/^https?:\/\//i.test(url)) return url;

  const context = await hostBridge.auth.getContext();
  if (context?.loadMode !== 'gateway' || !context.gatewayOrigin) return url;

  try {
    const target = new URL(url);
    const business = new URL(context.businessOrigin);
    const gateway = new URL(context.gatewayOrigin);
    if (
      !/^https?:$/.test(business.protocol) ||
      !/^https?:$/.test(gateway.protocol) ||
      target.username ||
      target.password ||
      target.origin !== business.origin ||
      window.location.origin !== gateway.origin
    ) {
      return url;
    }
    return `${gateway.origin}${target.pathname}${target.search}${target.hash}`;
  } catch {
    return url;
  }
}

let navigationGeneration = 0;

/** 防止桥异步返回后覆盖用户刚完成的导航或另一条更新的认证跳转。 */
export async function navigateToAuthUrl(url: string): Promise<void> {
  const generation = ++navigationGeneration;
  const sourceHref = window.location.href;
  const target = await resolveAuthRedirectUrl(url);
  if (
    generation !== navigationGeneration ||
    window.location.href !== sourceHref
  ) {
    return;
  }
  window.location.href = target;
}
