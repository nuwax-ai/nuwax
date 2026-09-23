import { businessCredentials } from './businessCookie';
import { hostBridge, isDesktopHost } from './hostBridge';

// 与 home.constants 中的持久化键保持一致，避免认证入口加载整组首页常量。
const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';

type BusinessAuthMode = 'desktop-cookie' | 'local-dev-token' | 'browser-cookie';

export type LoginAuthResult =
  | 'ready'
  | 'missing-dev-token'
  | 'host-cookie-sync-failed';

/** 客户端优先；只有 Umi 开发服务中的普通浏览器使用 Token。 */
function getBusinessAuthMode(): BusinessAuthMode {
  if (isDesktopHost()) return 'desktop-cookie';
  if (
    typeof window !== 'undefined' &&
    process.env.NUWAX_UMI_DEV_SERVER === 'true'
  ) {
    return 'local-dev-token';
  }
  return 'browser-cookie';
}

/** Cookie 环境丢弃升级前的 Token；Nuwax 宿主同时确认 ticket。 */
export async function restoreBusinessAuthSession(): Promise<boolean> {
  const mode = getBusinessAuthMode();
  if (mode === 'local-dev-token') return true;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  return mode === 'desktop-cookie' ? hostBridge.auth.syncSession() : true;
}

/** 登录响应中的 Token 只允许本地开发浏览器保存。 */
export async function finishBusinessLogin(
  token: string | null | undefined,
): Promise<LoginAuthResult> {
  const mode = getBusinessAuthMode();
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  if (mode === 'local-dev-token') {
    if (!token) return 'missing-dev-token';
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return 'ready';
  }
  if (mode === 'desktop-cookie' && !(await hostBridge.auth.syncSession())) {
    return 'host-cookie-sync-failed';
  }
  return 'ready';
}

/** 仅把本地调试 Token 发往配置的业务 API 域名。 */
function localDevBearerHeaders(url: string): Record<string, string> {
  try {
    const pageOrigin = window.location.origin;
    const targetOrigin = new URL(url, pageOrigin).origin;
    const businessOrigin = new URL(
      process.env.BASE_URL || pageOrigin,
      pageOrigin,
    ).origin;
    if (targetOrigin !== businessOrigin) return {};
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/** 通用接口层按环境选择 Token Header 或业务 Cookie。 */
export function getBusinessRequestAuth(url: string): {
  credentials: RequestCredentials;
  headers: Record<string, string>;
} {
  if (getBusinessAuthMode() === 'local-dev-token') {
    return {
      credentials: 'same-origin',
      headers: localDevBearerHeaders(url),
    };
  }
  return { credentials: businessCredentials(url), headers: {} };
}
