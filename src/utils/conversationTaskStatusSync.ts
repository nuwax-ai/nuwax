import { SUCCESS_CODE } from '@/constants/codes.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import {
  isTerminalTaskStatus,
  mergeConversationInfoTaskStatus,
  resolveTaskStatusFromMessageList,
  resolveTaskStatusFromMessageLists,
  resolveTerminalTaskStatus,
} from '@/features/conversation/domain/taskStatus';
import { apiAgentConversation } from '@/services/agentConfig';
import { TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import { conversationErrorTerminalLogger } from '@/utils/logger';
import type { Dispatch, SetStateAction } from 'react';

/** ChatFinished 事件载荷 */
export type ChatFinishedPayload = { conversationId: string };

// 兼容现有调用方；迁移期间旧 Interface 继续从该路径导出纯领域规则。
export {
  isTerminalTaskStatus,
  mergeConversationInfoTaskStatus,
  resolveTaskStatusFromMessageList,
  resolveTaskStatusFromMessageLists,
  resolveTerminalTaskStatus,
};

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
 * 拉取完整会话快照。状态轮询需要同时消费 messageList，避免接口已经返回新消息、
 * 前端却只读取 taskStatus 而导致历史会话更新滞后。
 */
export async function fetchConversationSnapshot(
  conversationId: number | string,
): Promise<ConversationInfo | undefined> {
  try {
    const result = await apiAgentConversation(Number(conversationId));
    if (result?.code === SUCCESS_CODE && result?.data) {
      return result.data;
    }
  } catch (error) {
    console.error('[fetchConversationSnapshot]', error);
  }
  return undefined;
}

/**
 * 拉取会话当前 taskStatus（轻量查询，不替换 messageList）
 */
export async function fetchConversationTaskStatus(
  conversationId: number | string,
): Promise<TaskStatus | undefined> {
  const snapshot = await fetchConversationSnapshot(conversationId);
  return snapshot?.taskStatus;
}

/**
 * 把终态 taskStatus 写回指定会话的统一入口（所有终态写回路径都应经此）。
 *
 * - 跳过 undefined / EXECUTING：非终态，避免后端落库竞态把 EXECUTING 固化到本地；
 * - 仅写 conversationId 匹配的会话，防跨会话覆盖；
 * - taskStatus 未变化时返回原引用 prev，让 React bail-out、不触发 re-render
 *   （空闲态轮询每 5s 拿到同值终态时不再产生无谓重渲染）。
 */
export function applyTerminalTaskStatus(
  setConversationInfo: Dispatch<
    SetStateAction<ConversationInfo | null | undefined>
  >,
  conversationId: number | string,
  taskStatus: TaskStatus | undefined,
): void {
  if (taskStatus === undefined || taskStatus === TaskStatus.EXECUTING) {
    // undefined / EXECUTING 跳过是设计行为；不打日志，避免轮询/兜底刷屏
    return;
  }
  setConversationInfo((prev) => {
    if (!prev || String(prev.id) !== String(conversationId)) {
      if (taskStatus === TaskStatus.FAILED) {
        conversationErrorTerminalLogger.warn('applyTerminalTaskStatus skip', {
          conversationId,
          taskStatus,
          reason: !prev ? 'no_conversationInfo' : 'conversationId_mismatch',
          prevId: prev?.id,
        });
      }
      return prev;
    }
    if (prev.taskStatus === taskStatus) {
      if (taskStatus === TaskStatus.FAILED) {
        conversationErrorTerminalLogger.warn('applyTerminalTaskStatus noop', {
          conversationId,
          taskStatus,
          reason: 'unchanged',
          prev: prev.taskStatus,
        });
      }
      return prev;
    }
    conversationErrorTerminalLogger.warn('applyTerminalTaskStatus', {
      conversationId,
      prev: prev.taskStatus,
      next: taskStatus,
    });
    return { ...prev, taskStatus };
  });
}

/**
 * 把终态 taskStatus 同步到「最近使用/会话记录」列表（本地补丁，不发网络请求）。
 *
 * 场景：会话执行完毕后，侧栏列表可能因后端落库延迟，在重新拉取后仍返回 EXECUTING，
 * 导致列表显示「执行中」。当前会话页的轮询会反复观察到终态并补发本事件，由列表
 * 处理器幂等合并——任何一次落在轮询之后的 stale 刷新都会在下个轮询周期内被纠正。
 *
 * - undefined / EXECUTING 跳过：非终态，避免把执行中状态固化到列表；
 * - 仅由终态（COMPLETE / CANCEL / FAILED）触发本地补丁。
 */
export function emitConversationListTaskStatus(
  conversationId: number | string,
  taskStatus: TaskStatus | undefined,
): void {
  if (taskStatus === undefined || taskStatus === TaskStatus.EXECUTING) {
    return;
  }
  // 仅 FAILED 打验证日志：轮询会对 COMPLETE 等终态反复 emit，避免刷屏
  if (taskStatus === TaskStatus.FAILED) {
    conversationErrorTerminalLogger.warn('emitConversationListTaskStatus', {
      conversationId,
      taskStatus,
    });
  }
  eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
    conversationId,
    taskStatus,
  });
}

/**
 * SSE onClose / ChatFinished 兜底：拉取后端 taskStatus 并写回终态。
 * 经 applyTerminalTaskStatus，自动跳过 EXECUTING（避免固化）且未变化不重渲染。
 * 后端已确认终态时，同时补偿「最近使用/会话记录」列表，避免其停留在执行中。
 */
export async function syncTerminalConversationTaskStatus(
  conversationId: number | string,
  setConversationInfo: Dispatch<
    SetStateAction<ConversationInfo | null | undefined>
  >,
): Promise<void> {
  const taskStatus = await fetchConversationTaskStatus(conversationId);
  applyTerminalTaskStatus(setConversationInfo, conversationId, taskStatus);
  emitConversationListTaskStatus(conversationId, taskStatus);
}

/**
 * 创建 taskStatus 同步函数（仅 merge taskStatus 字段）。
 * 复用 syncTerminalConversationTaskStatus：同样跳过 EXECUTING，避免 ChatFinished
 * 兜底把后端落库延迟返回的 EXECUTING 固化到本地。
 */
export function createSyncConversationTaskStatus(
  setConversationInfo: Dispatch<
    SetStateAction<ConversationInfo | null | undefined>
  >,
) {
  return (conversationId: number | string) =>
    syncTerminalConversationTaskStatus(conversationId, setConversationInfo);
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
