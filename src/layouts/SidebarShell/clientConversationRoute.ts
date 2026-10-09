import type { ClientConversationRouteSnapshot } from '@/models/appTabKeepAlive';

interface RouteLocation {
  pathname: string;
  search?: string;
  state?: unknown;
  navigationAction?: 'PUSH' | 'POP' | 'REPLACE';
}

const numericId = (value: string | null | undefined): string | null =>
  value && /^\d+$/.test(value) && Number(value) > 0 ? value : null;

/** 仅识别左栏能回到的三个完整会话宿主；无会话 ID 的创建页照常走路由。 */
export function parseClientConversationRoute(
  location: RouteLocation,
): ClientConversationRouteSnapshot | null {
  const { pathname, search = '', state, navigationAction } = location;
  const chat = pathname.match(/^\/home\/chat\/(\d+)\/(\d+)$/);
  if (chat) {
    const id = numericId(chat[1]);
    const agentId = numericId(chat[2]);
    if (!id || !agentId) return null;
    return {
      key: `conversation:${id}`,
      kind: 'conversation',
      conversationId: Number(id),
      pathname,
      search,
      state,
      navigationAction,
      params: { id, agentId },
    };
  }

  const appPro = pathname.match(/^\/space\/(\d+)\/app-pro\/(\d+)\/(\d+)$/);
  if (appPro) {
    const [, spaceId, appId, conversationId] = appPro;
    if (![spaceId, appId, conversationId].every((id) => numericId(id))) {
      return null;
    }
    return {
      key: `ide-workspace:${spaceId}:${appId}:${conversationId}`,
      kind: 'ide-workspace',
      conversationId: Number(conversationId),
      pathname,
      search,
      state,
      navigationAction,
      params: { spaceId, appId, conversationId },
    };
  }

  const agentDev = pathname.match(/^\/space\/(\d+)\/agent-dev$/);
  if (agentDev) {
    const spaceId = numericId(agentDev[1]);
    const query = new URLSearchParams(search);
    const agentId = numericId(query.get('agentId'));
    const conversationId = numericId(query.get('conversationId'));
    if (!spaceId || !agentId || !conversationId) return null;
    return {
      key: `agent-workspace:${spaceId}:${agentId}:${conversationId}`,
      kind: 'agent-workspace',
      conversationId: Number(conversationId),
      pathname,
      search,
      state,
      navigationAction,
      params: { spaceId, agentId, conversationId },
    };
  }

  return null;
}
