/** AppDevPro 路由 pathname 匹配：/space/:spaceId/app-pro/:appId/:conversationId */
export const APP_PRO_PATH_REGEX = /^\/space\/(\d+)\/app-pro\/(\d+)\/(\d+)/;

export interface AppProRouteParams {
  spaceId: number;
  appId: number;
  conversationId: number;
}

/**
 * 解析 AppDevPro 路由 pathname。
 *
 * @param pathname 当前 pathname（不含 search）
 * @returns 解析结果；非 app-pro 路由返回 null
 */
export const parseAppProRoute = (
  pathname: string,
): AppProRouteParams | null => {
  const match = pathname.match(APP_PRO_PATH_REGEX);
  if (!match) {
    return null;
  }
  return {
    spaceId: Number(match[1]),
    appId: Number(match[2]),
    conversationId: Number(match[3]),
  };
};

/**
 * 构建 AppDevPro 路由。
 *
 * @param spaceId 空间 ID
 * @param appId 全栈应用 ID
 * @param conversationId 会话 ID
 */
export const buildAppProRoute = (
  spaceId: number | string,
  appId: number | string,
  conversationId: number | string,
): string => `/space/${spaceId}/app-pro/${appId}/${conversationId}`;

/**
 * 创建会话成功后拼接 conversationId 的 URL 前缀（末尾带 `/`）。
 */
export const buildAppProRedirectPrefix = (
  spaceId: number | string,
  appId: number | string,
): string => `/space/${spaceId}/app-pro/${appId}/`;

/**
 * 删除 app-pro 当前会话后离开 IDE，回到全栈应用详情页。
 */
export const removeAppProConversationFromLocation = (
  pathname: string,
  search = '',
): { pathname: string; search: string } => {
  const parsed = parseAppProRoute(pathname);
  if (!parsed) {
    return { pathname, search };
  }
  return {
    pathname: `/space/${parsed.spaceId}/app-project-detail/${parsed.appId}`,
    search: '',
  };
};
