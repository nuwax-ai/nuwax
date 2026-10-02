import {
  AuthIdpTypeEnum,
  AuthIdpWechatModeEnum,
  type AuthIdpLoginItem,
} from '@/types/interfaces/authIdp';

/**
 * 三方登录（CAS / OAuth2 / 微信）前端纯函数。
 * 发起授权均为整页跳转：成功后后端种 Cookie 并 302 回 redirect，失败回 /login?idpError=。
 */

/** redirectToLogin 收到数字（历史回退偏移）时暂存的业务路径：整页跳 IdP 后偏移失效，用它回原页 */
export const IDP_RETURN_PATH_KEY = 'IDP_RETURN_PATH';

/**
 * 业务后端域：dev 为测试域，线上同源为空串。
 * 去掉尾部斜杠，避免与 `/api/...` 拼出协议相对地址（`//api/...`）。
 */
export const getBusinessBase = () =>
  (process.env.BASE_URL || '').replace(/\/+$/, '');

/** 用户在微信内置浏览器（含 PC 版微信）中打开 */
export const isWechatBrowser = (ua: string) => /MicroMessenger/i.test(ua);

/**
 * 按 UA 过滤：微信内只保留公众号授权（免扫码），其它环境只保留网站扫码；非微信类型不受影响。
 */
export function filterIdpByUa(
  items: AuthIdpLoginItem[],
  ua: string,
): AuthIdpLoginItem[] {
  const wantMode = isWechatBrowser(ua)
    ? AuthIdpWechatModeEnum.OA
    : AuthIdpWechatModeEnum.QrCode;
  return items.filter(
    (item) =>
      item.type !== AuthIdpTypeEnum.Wechat || item.wechatMode === wantMode,
  );
}

/** 只接受本站相对路径；反斜杠或控制字符可能被浏览器归一化为跨域地址。 */
const toSafeRelativePath = (value?: string | null) => {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return '/';
  }
  // 固定基准仅供 URL 解析，不请求网络；保留业务深链接的原始 query/hash。
  const origin = 'https://idp-redirect.invalid';
  try {
    return new URL(value, origin).origin === origin ? value : '/';
  } catch {
    return '/';
  }
};

/**
 * 解析登录完成后的回跳目标。
 * - 相对路径：原样使用
 * - 数字（SPA 历史偏移）/ 空：用暂存的业务路径，没有则回首页
 * - 其它（绝对地址、协议相对地址等）：回首页
 */
export function resolveIdpRedirect(
  redirectParam: string | null | undefined,
  storedPath?: string | null,
): string {
  const raw = (redirectParam ?? '').trim();
  if (!raw || !Number.isNaN(Number(raw))) {
    return toSafeRelativePath(storedPath);
  }
  return toSafeRelativePath(raw);
}

/** 发起三方登录的整页跳转地址 */
export const buildIdpAuthorizeUrl = (
  base: string,
  providerId: number,
  redirect: string,
) =>
  `${base}/api/auth/idp/authorize?provider=${providerId}&redirect=${encodeURIComponent(
    redirect,
  )}`;

/** 登录态下发起绑定外部身份的整页跳转地址 */
export const buildIdentityBindUrl = (
  base: string,
  providerId: number,
  redirect: string,
) =>
  `${base}/api/user/identity/bind/${providerId}?redirect=${encodeURIComponent(
    redirect,
  )}`;

/**
 * 是否直接跳转 IdP（不展示登录表单）。
 * 逃生门：?local 显示普通登录；带 idpError 说明刚从 IdP 失败回来，再跳会死循环；
 * 桌面客户端本期不接三方登录。
 */
export function shouldAutoRedirect(options: {
  autoRedirectIdpId?: number | null;
  search: string;
  isDesktop: boolean;
}): boolean {
  const params = new URLSearchParams(options.search);
  return (
    !!options.autoRedirectIdpId &&
    !params.has('local') &&
    !params.has('idpError') &&
    !options.isDesktop
  );
}
