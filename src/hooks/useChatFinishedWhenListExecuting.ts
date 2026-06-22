import { TaskStatus } from '@/types/enums/agent';
import {
  hasExecutingTaskInList,
  subscribeChatFinished,
  type ChatFinishedPayload,
} from '@/utils/conversationTaskStatusSync';
import { useEffect } from 'react';

export type { ChatFinishedPayload };

export interface UseChatFinishedWhenListExecutingOptions {
  /**
   * 会话列表（侧栏历史、OpenApp 等）
   * 仅当列表中存在 taskStatus === EXECUTING 时才订阅 ChatFinished
   */
  conversationList?: Array<{ taskStatus?: TaskStatus }> | null;
  /** ChatFinished 回调，通常来自 conversationHistory.handleConversationUpdate */
  onChatFinished: (data: ChatFinishedPayload) => void;
  /** 额外开关，默认 true */
  enabled?: boolean;
}

/**
 * 会话列表侧栏：存在执行中任务时订阅 ChatFinished，任务结束后刷新列表项状态
 *
 * 用于 HomeSection、OpenApp BaseTemplate 等展示历史会话列表的场景，
 * 与 subscribeChatFinishedTaskSync（单会话 taskStatus 同步）互补。
 */
export function useChatFinishedWhenListExecuting({
  conversationList,
  onChatFinished,
  enabled = true,
}: UseChatFinishedWhenListExecutingOptions): void {
  useEffect(() => {
    if (!enabled || !hasExecutingTaskInList(conversationList)) {
      return;
    }
    return subscribeChatFinished(onChatFinished);
  }, [conversationList, onChatFinished, enabled]);
}
