type AuthNavigationAction =
  | { kind: 'none' }
  | { kind: 'spa'; url: string }
  | { kind: 'document'; url: string };

// 新增认证终态页时在此登记，启动鉴权、事件轮询和认证导航共用同一规则。
const AUTH_PAGES = [
  { path: /^\/login\/?$/i, terminal: false },
  { path: /^\/license-expired\/?$/i, terminal: true },
] as const;

export function isAuthTerminalPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => page.terminal && page.path.test(pathname));
}

/** 只决定导航方式，不访问浏览器或宿主；target 已完成桌面网关地址映射。 */
export function resolveAuthNavigationAction(
  sourceHref: string,
  target: string,
): AuthNavigationAction {
  try {
    const destination = new URL(target, sourceHref);
    // 比较完整 URL：查询参数或 hash 的真实变化仍需导航。
    if (destination.href === sourceHref) return { kind: 'none' };
    if (
      destination.origin === new URL(sourceHref).origin &&
      !destination.username &&
      !destination.password &&
      AUTH_PAGES.some((page) => page.path.test(destination.pathname))
    ) {
      return {
        kind: 'spa',
        url: destination.pathname + destination.search + destination.hash,
      };
    }
  } catch {
    // 非标准 URL 沿用文档导航，由浏览器处理。
  }
  // 外部 SSO 与后端 /auth/ 中间页必须通过文档导航访问。
  return { kind: 'document', url: target };
}
