import type { ConversationDraftData } from '@/features/conversation/domain/conversationPageCache';
import { conversationPageCacheManager } from '@/features/conversation/react/useConversationPageCache';

/** 输入草稿的兼容入口；存储与生命周期统一交给会话页面缓存 manager。 */

/** 会话详情路由：/home/chat/:id/:agentId */
const CHAT_PATH = /^\/home\/chat(?:\/|$)/;
/** 智能体详情路由（会话面板承载会话）：/agent/* */
const AGENT_PATH = /^\/agent(?:\/|$)/;
/** 工作空间域路由（app-pro 等全栈 IDE 会话面板）：/space/:spaceId/* */
const SPACE_PATH = /^\/space(?:\/|$)/;

/**
 * 会话草稿作用面：结合会话页面地址分桶（2026-09-15 定调「以会话框组件为标准
 * 接入 + 结合会话页面地址」）。同一会话在不同路由面（/home/chat 会话页、
 * /agent 智能体面板、/space 全栈 IDE）各自独立草稿互不串扰；其余承载面
 * （插件/技能/EditAgent 预览等）落 'page' 兜底桶。
 */
export const resolveDraftSurface = (pathname: string): string => {
  if (CHAT_PATH.test(pathname)) return 'chat';
  if (AGENT_PATH.test(pathname)) return 'agent';
  if (SPACE_PATH.test(pathname)) return 'apppro';
  return 'page';
};

export type ChatDraftData = ConversationDraftData;

/** 读取某会话草稿；无草稿 / 结构非法 / 超过 TTL 时返回 null */
export const loadDraft = (
  conversationId: string | number | null | undefined,
): ChatDraftData | null =>
  conversationPageCacheManager.loadDraft(conversationId);

/** 持久化某会话草稿；空文本且无技能时删除存储键。localStorage 不可用时静默降级。 */
export const saveDraft = (
  conversationId: string | number | null | undefined,
  draft: Omit<ChatDraftData, 'savedAt'>,
): void => conversationPageCacheManager.saveDraft(conversationId, draft);

/** 清除某会话草稿（发送成功后调用） */
export const clearDraft = (
  conversationId: string | number | null | undefined,
): void => conversationPageCacheManager.clearDraft(conversationId);
