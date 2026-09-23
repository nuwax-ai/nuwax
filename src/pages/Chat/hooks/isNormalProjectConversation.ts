import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';

/** 常规项目会话判定所需的最小字段集（便于单测与复用） */
export type NormalProjectConversationLike = Partial<
  Pick<ConversationInfo, 'id' | 'devTargetType' | 'devTargetId'>
>;

/**
 * 常规项目（NormalProject）会话判定（范式对齐 useChatNormalProjectNameSync）。
 *
 * 守恒条件 conversationInfo.id === routeConversationId：全局 conversationInfo
 * （useModel）与路由 id 在切换会话时存在不同步窗口（Chat 页内多处守卫为此而设），
 * 窗口期宁可按普通会话处理，也不要产出「新会话 id + 旧会话判定」的
 * service_type 错配终端 URL（错配会触发一次失败/错目录的终端连接后才自愈）。
 *
 * @param conversationInfo 会话详情（可能尚未加载完成）
 * @param routeConversationId 路由会话 id（number）
 */
export function isNormalProjectConversation(
  conversationInfo: NormalProjectConversationLike | undefined,
  routeConversationId?: number,
): boolean {
  if (!conversationInfo || routeConversationId === undefined) {
    return false;
  }
  // ConversationInfo.id 为 string、路由 id 为 number，统一字符串形态比较
  if (String(conversationInfo.id) !== String(routeConversationId)) {
    return false;
  }
  if (conversationInfo.devTargetType !== AgentComponentTypeEnum.NormalProject) {
    return false;
  }
  const projectId = Number(conversationInfo.devTargetId);
  return Number.isFinite(projectId) && projectId > 0;
}

export default isNormalProjectConversation;
