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
  const path = redirect
    ? `/${step}?redirect=${encodeURIComponent(redirect)}`
    : `/${step}`;
  history.replace(path, state);
}

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
  } else {
    history.replace(redirect || '/');
  }
}
