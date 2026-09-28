/** 只按明确的资源权限码判断；登录失效、普通业务错误不能显示为无权限。 */
export function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const requestError = error as {
    info?: { code?: string | number };
    response?: { status?: number };
  };
  return (
    String(requestError.info?.code) === '4030' ||
    requestError.response?.status === 403
  );
}
