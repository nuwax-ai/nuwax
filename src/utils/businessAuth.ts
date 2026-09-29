import { hostBridge } from './hostBridge';

// 与 home.constants 中的持久化键保持一致，避免认证入口加载整组首页常量。
const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';

export type LoginAuthResult =
  | 'ready'
  | 'missing-dev-token'
  | 'host-cookie-sync-failed';

/** 商业客户端宿主（nuwax/nuwawork，含 loopback 加载 dev server 的联调形态）。 */
function isDesktopCookieHost(): boolean {
  // isDesktopHost 还包含纯浏览器中的桌面外观预览；鉴权只能按真实宿主桥判断。
  const product = hostBridge.host.getProduct();
  return product === 'nuwax' || product === 'nuwawork';
}

/** 唯一走本地 Token 的环境：Umi 开发服务里的普通浏览器。 */
function isLocalDevBrowser(): boolean {
  // NODE_ENV 是 umi 核心 define：启动已久的 dev server 热编译新代码时依然存在，
  // 同事拉取代码无需重启即生效；max dev 恒为 development，build:dev/build:prod
  // 构建期为 production（UMI_ENV 只影响加载哪份 config，不改 NODE_ENV）。
  return (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    !isDesktopCookieHost()
  );
}

function readLocalDevToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/** 本地调试 ticket 由前端种植，失效时清除；线上 Cookie 仍由后端失效。 */
export function clearMicroAppDevSession(): void {
  if (isLocalDevBrowser()) {
    document.cookie = 'ticket=; Path=/; Max-Age=0; SameSite=Lax';
  }
}

/** 子应用以同源 Cookie 请求；只在普通浏览器开发环境镜像当前调试会话。 */
export async function prepareMicroAppAuthSession(): Promise<boolean> {
  if (isLocalDevBrowser()) {
    const token = readLocalDevToken();
    if (!token) {
      clearMicroAppDevSession();
      return false;
    }
    document.cookie = `ticket=${encodeURIComponent(
      token,
    )}; Path=/; SameSite=Lax`;
    return true;
  }
  return isDesktopCookieHost() ? hostBridge.auth.syncSession() : true;
}

/** URL 是否指向配置的业务 API 域名——Cookie 与本地 Token 都只发给它。 */
function isBusinessApiUrl(url: string): boolean {
  try {
    const base = window.location.origin;
    const business = new URL(process.env.BASE_URL || base, base);
    return new URL(url, base).origin === business.origin;
  } catch {
    return false;
  }
}

function discardLocalDevToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/** 开机恢复登录态：本地开发看 Token 在不在，Cookie 环境丢弃旧 Token 并同步宿主会话。 */
export async function restoreBusinessAuthSession(): Promise<boolean> {
  if (isLocalDevBrowser()) return !!readLocalDevToken();
  discardLocalDevToken();
  return isDesktopCookieHost() ? hostBridge.auth.syncSession() : true;
}

/** 登录收尾：本地开发保存登录响应里的 Token，Cookie 环境只同步宿主会话。 */
export async function finishBusinessLogin(
  token: string | null | undefined,
): Promise<LoginAuthResult> {
  if (isLocalDevBrowser()) {
    if (!token) {
      discardLocalDevToken();
      return 'missing-dev-token';
    }
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return 'ready';
  }
  discardLocalDevToken();
  if (isDesktopCookieHost() && !(await hostBridge.auth.syncSession())) {
    return 'host-cookie-sync-failed';
  }
  return 'ready';
}

/** 通用接口层鉴权：本地开发对业务域名带 Bearer Token，其余环境对业务域名带 Cookie。 */
/** 仅把本地调试 Token 发往配置的业务 API 域名。 */
function localDevBearerHeaders(url: string): Record<string, string> {
  const token = isBusinessApiUrl(url) ? readLocalDevToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getBusinessRequestAuth(url: string): {
  credentials: RequestCredentials;
  headers: Record<string, string>;
} {
  if (isLocalDevBrowser()) {
    return {
      credentials: 'same-origin',
      headers: localDevBearerHeaders(url),
    };
  }
  return {
    credentials: isBusinessApiUrl(url) ? 'include' : 'omit',
    headers: {},
  };
}

/**
 * 文件内容请求在首跳同源时只向该源发送 Cookie，避免重定向到对象存储后
 * 仍以 include 模式读取响应，触发对象存储的凭证 CORS 限制。
 */
export function getBusinessFileRequestAuth(url: string): {
  credentials: RequestCredentials;
  headers: Record<string, string>;
} {
  const auth = getBusinessRequestAuth(url);
  try {
    if (
      typeof window !== 'undefined' &&
      new URL(url, window.location.origin).origin === window.location.origin
    ) {
      return { ...auth, credentials: 'same-origin' };
    }
  } catch {
    // 非标准 URL 沿用通用鉴权策略，由 fetch 负责报告无效地址。
  }
  return auth;
}
