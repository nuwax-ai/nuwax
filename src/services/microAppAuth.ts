import { navigateToAuthUrl } from '@/utils/authNavigation';
import { clearStoragePreservingUserPrefs } from '@/utils/authStorageCleanup';
import { hostBridge } from '@/utils/hostBridge';
import { clearLoginStatusCache } from './userService';

/** 沿用消息平台的 SSO 地址合同；开发时业务域登录页回到当前宿主。 */
export function resolveMicroAppAuthTarget(raw: string): string | null {
  if (
    !raw ||
    raw.length > 2048 ||
    /\s/.test(raw) ||
    [...raw].some(
      (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
    ) ||
    (!/^https?:\/\//i.test(raw) && !/^\/(?!\/)/.test(raw))
  ) {
    return null;
  }
  try {
    const target = new URL(raw, window.location.origin);
    if (target.username || target.password) return null;
    if (
      target.protocol !== 'https:' &&
      !(
        target.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
      )
    ) {
      return null;
    }
    if (process.env.NODE_ENV === 'development' && process.env.BASE_URL) {
      const business = new URL(process.env.BASE_URL);
      if (target.origin === business.origin) {
        return `${window.location.origin}${target.pathname}${target.search}${target.hash}`;
      }
    }
    return target.href;
  } catch {
    return null;
  }
}

/** 会话失效与主站共用清理入口，释放隐藏实例后再交还认证页面。 */
export async function expireMicroAppSession(raw: string): Promise<void> {
  const target = resolveMicroAppAuthTarget(raw);
  if (!target) return;
  const sourceHref = window.location.href;
  clearStoragePreservingUserPrefs();
  clearLoginStatusCache();
  try {
    await hostBridge.auth.clear();
  } catch (error) {
    console.warn('[micro-app] 宿主会话清理失败', error);
  }
  if (window.location.href === sourceHref) await navigateToAuthUrl(target);
}
