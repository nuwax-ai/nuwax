import type { HostAuthContext } from '@/types/interfaces/hostAuth';
import {
  buildIdentityBindUrl,
  buildIdpAuthorizeUrl,
  getBusinessBase,
  resolveIdpRedirect,
} from './authIdp';
import { hostBridge } from './hostBridge';

export const DESKTOP_IDP_RETURN_PARAM = 'desktopIdpReturn';
type NavigationResult = 'started' | 'cancelled' | 'failed';

const isCookieHost = () =>
  ['nuwax', 'nuwawork'].includes(hostBridge.host.getProduct() || '');

function validContext(
  context: HostAuthContext | null,
): context is HostAuthContext {
  if (!context) return false;
  try {
    const business = new URL(context.businessOrigin);
    if (
      !/^https?:$/.test(business.protocol) ||
      business.username ||
      business.password
    )
      return false;
    if (context.loadMode === 'gateway') {
      const gateway = new URL(context.gatewayOrigin || '');
      if (
        !/^https?:$/.test(gateway.protocol) ||
        gateway.username ||
        gateway.password ||
        !['127.0.0.1', 'localhost', '[::1]'].includes(gateway.hostname)
      )
        return false;
    }
    return context.loadMode === 'direct' || context.loadMode === 'gateway';
  } catch {
    return false;
  }
}

const callbackPath = (redirect: string, mode?: 'login' | 'bind') =>
  `/login?${DESKTOP_IDP_RETURN_PARAM}=${
    mode === 'bind' ? 'bind' : '1'
  }&redirect=${encodeURIComponent(resolveIdpRedirect(redirect))}`;

let navigating = false;

/** 桌面授权始终在配置的业务域进行，保持 IdP state Cookie 和后端回调同源。 */
export async function startIdpNavigation(options: {
  providerId: number;
  redirect: string;
  mode?: 'login' | 'bind';
  replace?: boolean;
}): Promise<NavigationResult> {
  if (navigating) return 'cancelled';
  navigating = true;
  const source = window.location.href;
  try {
    const desktop = isCookieHost();
    const context = desktop ? await hostBridge.auth.getContext() : null;
    if (window.location.href !== source) return 'cancelled';
    if (
      desktop &&
      (!validContext(context) ||
        ![context.businessOrigin, context.gatewayOrigin].includes(
          window.location.origin,
        ))
    )
      return 'failed';
    const redirect = resolveIdpRedirect(options.redirect);
    const base = desktop ? context!.businessOrigin : getBusinessBase();
    // 三方登录替换原会话；绑定保留现有会话和设备状态。
    if (
      desktop &&
      options.mode !== 'bind' &&
      !(await hostBridge.auth.beginLogin())
    )
      return 'failed';
    if (window.location.href !== source) return 'cancelled';
    const build =
      options.mode === 'bind' ? buildIdentityBindUrl : buildIdpAuthorizeUrl;
    const target = build(
      base,
      options.providerId,
      desktop ? callbackPath(redirect, options.mode) : redirect,
    );
    if (options.replace) window.location.replace(target);
    else window.location.assign(target);
    return 'started';
  } catch {
    return 'failed';
  } finally {
    navigating = false;
  }
}

/** 仅受信业务页面处理桌面返回；所有 origin 都来自宿主，参数只携带安全相对路径。 */
export async function completeDesktopIdpReturn(): Promise<
  'none' | NavigationResult
> {
  if (!isCookieHost()) return 'none';
  const params = new URLSearchParams(window.location.search);
  const marker = params.get(DESKTOP_IDP_RETURN_PARAM);
  const marked = marker === '1' || marker === 'bind';
  const error = params.get('idpError');
  if (!marked && !error) return 'none';
  const source = window.location.href;
  try {
    const context = await hostBridge.auth.getContext();
    if (window.location.href !== source) return 'cancelled';
    if (!validContext(context)) return marked ? 'failed' : 'none';
    const origin =
      context.loadMode === 'gateway'
        ? context.gatewayOrigin!
        : context.businessOrigin;
    // 普通 gateway 登录错误已经在正确页面，不重复导航。
    if (!marked && window.location.origin === origin) return 'none';
    if (window.location.origin !== context.businessOrigin) return 'failed';
    let redirect = resolveIdpRedirect(params.get('redirect'));
    let returnMode = marker;
    // 失败回跳可能把本次成功 redirect 原样塞回参数；解开我们的回调包装，
    // 避免普通登录完成后又进入桌面回调页，绑定错误也应回原面板。
    const nested = new URL(redirect, context.businessOrigin);
    const nestedMode = nested.searchParams.get(DESKTOP_IDP_RETURN_PARAM);
    if (
      nested.pathname === '/login' &&
      ['1', 'bind'].includes(nestedMode || '')
    ) {
      redirect = resolveIdpRedirect(nested.searchParams.get('redirect'));
      returnMode = nestedMode;
      if (
        new URL(redirect, context.businessOrigin).searchParams.has(
          DESKTOP_IDP_RETURN_PARAM,
        )
      )
        redirect = '/';
    }
    if (error) {
      if (returnMode === 'bind') {
        const target = new URL(`${origin}${redirect}`);
        target.searchParams.set('idpError', error);
        window.location.replace(target.href);
        return 'started';
      }
      const escape = new URLSearchParams({
        local: '1',
        idpError: error,
        redirect,
      });
      window.location.replace(`${origin}/login?${escape}`);
      return 'started';
    }
    if (!(await hostBridge.auth.syncSession())) return 'failed';
    if (window.location.href !== source) return 'cancelled';
    // 后端中间页在业务域；本地 dist 不承载 /auth/ 页面。
    const destination = /^\/(auth|api)\//.test(redirect)
      ? context.businessOrigin
      : origin;
    window.location.replace(`${destination}${redirect}`);
    return 'started';
  } catch {
    return 'failed';
  }
}
