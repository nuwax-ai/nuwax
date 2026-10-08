import { getBusinessBase } from './authIdp';

type LoginHistory = {
  replace: (url: string, state?: Record<string, unknown>) => void;
  go: (delta: number) => void;
};

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
