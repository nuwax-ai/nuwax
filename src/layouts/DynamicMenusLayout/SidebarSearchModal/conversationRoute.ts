import type {
  ConversationMessageLocation,
  ConversationSearchRouteInfo,
} from '@/types/interfaces/conversationSearch';
import { buildAppProRoute } from '@/utils/appProRoute';
import { withConversationMessageLocation } from '@/utils/conversationMessageLocation';

/** 正文命中保留标题命中的宿主入口，定位窗不改变编辑/运行语义。 */
export function buildSearchConversationRoute(
  conv: ConversationSearchRouteInfo,
  target?: ConversationMessageLocation,
): string {
  const { id, agentId, devTargetType, devTargetId, devSpaceId } = conv;
  let path = `/home/chat/${id}/${agentId}`;
  if (devTargetType === 'Agent' && devSpaceId && id) {
    path = `/space/${devSpaceId}/agent-dev?agentId=${devTargetId}&conversationId=${id}`;
  } else if (devTargetType === 'PageApp' && devSpaceId && devTargetId) {
    path = `/space/${devSpaceId}/app-dev/${devTargetId}`;
    if (target) path += `?conversationId=${id}`;
  } else if (devTargetType === 'UserApp' && devSpaceId && devTargetId) {
    path = buildAppProRoute(devSpaceId, devTargetId, id);
  }
  return withConversationMessageLocation(path, target);
}
