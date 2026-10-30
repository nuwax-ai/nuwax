import { hostBridge, isDesktopHost } from '@/utils/hostBridge';
import { history } from 'umi';
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
  try {
    const destination = new URL(target, window.location.origin);
    // 本站登录页由 SPA 承载，整页跳转会重复启动、鉴权和加载登录资源。
    // 外部 SSO 与后端 /auth/ 中间页仍须走文档导航。
    if (
      destination.origin === window.location.origin &&
      !destination.username &&
      !destination.password &&
      /^\/login\/?$/i.test(destination.pathname)
    ) {
      history.replace(
        destination.pathname + destination.search + destination.hash,
      );
      return;
    }
  } catch {
    // 非标准 URL 沿用原导航行为。
  }
  window.location.href = target;
}
