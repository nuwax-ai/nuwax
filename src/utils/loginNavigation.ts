import { getBusinessBase } from './authIdp';

type LoginHistory = {
  replace: (url: string, state?: Record<string, unknown>) => void;
  go: (delta: number) => void;
};

/**
 * 当前文档是否由「刷新验证码页」加载。
 *
 * 阿里云 captchaVerifyParam 与图形验证码都是一次性的。从登录页进入时
 * history.state 里的参数可用；整页刷新后 state 仍在，但凭证已被第一次发码核销。
 * Navigation Timing 的 name 是本次文档加载的 URL：只有刷新落在验证码页才为真。
 * 先刷新登录页再进验证码页时，name 仍是登录页，不能当成验证码页刷新。
 */
export function isVerifyCodePageReload(): boolean {
  const entry = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (!entry || entry.type !== 'reload') return false;
  try {
    const path = new URL(entry.name).pathname.replace(/\/+$/, '');
    return path.endsWith('/verify-code');
  } catch {
    return false;
  }
}

/** 登录和验证码共享一个历史条目，保留进入登录时的业务返回偏移。 */
export function replaceLoginStep(
  history: LoginHistory,
  step: 'login' | 'verify-code',
  redirect: string | null,
  state?: Record<string, unknown>,
): void {
  const params: string[] = [];
  if (redirect) params.push(`redirect=${encodeURIComponent(redirect)}`);
  // 普通登录模式（逃生门或三方登录失败回跳）跨步骤保留，否则回到登录页会被「未登录自动跳转」带走
  const current = new URLSearchParams(window.location.search);
  if (current.has('local') || current.has('idpError')) params.push('local=1');
  history.replace(
    params.length ? `/${step}?${params.join('&')}` : `/${step}`,
    state,
  );
}

/** 后端渲染的页面（如三方登录绑定/注册中间页），不在 SPA 路由内，须整页跳转 */
const isServerRenderedPath = (path: string) => /^\/(auth|api)\//.test(path);

/** 密码与验证码登录使用相同的返回优先级。 */
export function navigateAfterLogin(
  history: LoginHistory,
  redirectParam: string | null,
  responseRedirectUrl: string | null | undefined,
  navigateToAuthUrl: (url: string) => void,
): void {
  const redirect = decodeURIComponent(redirectParam || '');
  if (redirect && !Number.isNaN(Number(redirect))) {
    history.go(Number(redirect));
  } else if (responseRedirectUrl?.includes('://')) {
    navigateToAuthUrl(responseRedirectUrl);
  } else if (isServerRenderedPath(redirect)) {
    navigateToAuthUrl(`${getBusinessBase()}${redirect}`);
  } else {
    history.replace(redirect || '/');
  }
}
