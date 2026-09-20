import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { buildAppProRoute } from '@/utils/appProRoute';

/**
 * 项目会话点击路由分流（复刻 useHomeSectionData.handleConversationClick，
 * 不直接复用该 hook：耦合首页 space 上下文）：
 * - Agent 开发会话 → 智能体开发页
 * - PageApp 开发会话 → 网页应用 IDE
 * - UserApp 开发会话 → 全栈应用 IDE（conversationId 恢复会话）
 * - 其余（常规项目会话等）→ home/chat 会话详情
 * 纯函数只算路径，跳转由调用方执行（便于单测）。
 */
export function resolveConversationRoute(
  conversation: ConversationInfo,
): string {
  const { id, agentId, devTargetType, devTargetId, devSpaceId } = conversation;

  if (devTargetType === 'Agent' && devSpaceId && id) {
    return `/space/${devSpaceId}/agent-dev?agentId=${devTargetId}&conversationId=${id}`;
  }
  if (devTargetType === 'PageApp' && devSpaceId && devTargetId) {
    return `/space/${devSpaceId}/app-dev/${devTargetId}`;
  }
  if (devTargetType === 'UserApp' && devSpaceId && devTargetId) {
    return buildAppProRoute(devSpaceId, devTargetId, id);
  }
  return `/home/chat/${id}/${agentId}`;
}
