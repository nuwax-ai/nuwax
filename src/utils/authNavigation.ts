import { hostBridge, isDesktopHost } from '@/utils/hostBridge';
import { getBusinessBase } from './authIdp';

/** 后端认证跳转在商业客户端网关形态下保持同源，保留路径、查询和 hash。 */
export async function resolveAuthRedirectUrl(url: string): Promise<string> {
  if (!isDesktopHost()) return url;

  const context = await hostBridge.auth.getContext();
  if (!context) return url;

  try {
    const business = new URL(context.businessOrigin);
    const target = new URL(url, window.location.origin);
    // IdP 绑定/注册页由业务后端渲染；相对 /auth/ 也不能落进本地 dist。
    const backendAuth = /^\/(auth|api\/auth\/idp)\//.test(target.pathname);
    const configured = new URL(
      getBusinessBase() || window.location.origin,
      window.location.origin,
    );
    if (
      backendAuth &&
      /^https?:$/.test(business.protocol) &&
      !business.username &&
      !business.password &&
      !target.username &&
      !target.password &&
      [business.origin, window.location.origin, configured.origin].includes(
        target.origin,
      )
    ) {
      return `${business.origin}${target.pathname}${target.search}${target.hash}`;
    }
    if (
      context.loadMode !== 'gateway' ||
      !context.gatewayOrigin ||
      !/^https?:\/\//i.test(url)
    )
      return url;
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
