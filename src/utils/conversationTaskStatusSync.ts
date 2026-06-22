import { SUCCESS_CODE } from '@/constants/codes.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import { apiAgentConversation } from '@/services/agentConfig';
import { TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import type { Dispatch, SetStateAction } from 'react';

/** ChatFinished 事件载荷 */
export type ChatFinishedPayload = { conversationId: string };

/**
 * 订阅 ChatFinished 事件
 * @returns 取消订阅函数
 */
export function subscribeChatFinished(
  handler: (data: ChatFinishedPayload) => void,
): () => void {
  eventBus.on(EVENT_TYPE.ChatFinished, handler);
  return () => {
    eventBus.off(EVENT_TYPE.ChatFinished, handler);
  };
}

/**
 * 列表中是否存在 taskStatus === EXECUTING 的会话
 */
export function hasExecutingTaskInList(
  list: Array<{ taskStatus?: TaskStatus }> | undefined | null,
): boolean {
  return !!list?.some((item) => item.taskStatus === TaskStatus.EXECUTING);
}

/**
 * 拉取会话当前 taskStatus（轻量查询，不替换 messageList）
 */
export async function fetchConversationTaskStatus(
  conversationId: number | string,
): Promise<TaskStatus | undefined> {
  try {
    const result = await apiAgentConversation(Number(conversationId));
    if (
      result?.code === SUCCESS_CODE &&
      result?.data?.taskStatus !== undefined &&
      result?.data?.taskStatus !== null
    ) {
      return result.data.taskStatus;
    }
  } catch (error) {
    console.error('[fetchConversationTaskStatus]', error);
  }
  return undefined;
}

/**
 * 创建 taskStatus 同步函数，仅 merge taskStatus 字段
 */
export function createSyncConversationTaskStatus(
  setConversationInfo: Dispatch<
    SetStateAction<ConversationInfo | null | undefined>
  >,
) {
  return async (conversationId: number | string) => {
    const taskStatus = await fetchConversationTaskStatus(conversationId);
    if (taskStatus === undefined) {
      return;
    }
    setConversationInfo((prev) =>
      prev && String(prev.id) === String(conversationId)
        ? { ...prev, taskStatus }
        : prev,
    );
  };
}

/**
 * taskStatus 为 EXECUTING 时订阅 ChatFinished，收到后触发同步
 * @returns 取消订阅函数
 */
export function subscribeChatFinishedTaskSync(
  conversationId: number | string | undefined | null,
  taskStatus: TaskStatus | undefined,
  onSync: (conversationId: number | string) => void,
): () => void {
  if (!conversationId || taskStatus !== TaskStatus.EXECUTING) {
    return () => {};
  }

  const handler = (data: ChatFinishedPayload) => {
    if (data.conversationId === String(conversationId)) {
      onSync(conversationId);
    }
  };

  return subscribeChatFinished(handler);
}
