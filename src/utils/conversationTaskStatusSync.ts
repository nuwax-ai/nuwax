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
    return;
  }
  setConversationInfo((prev) => {
    if (!prev || String(prev.id) !== String(conversationId)) {
      return prev;
    }
    return prev.taskStatus === taskStatus ? prev : { ...prev, taskStatus };
  });
}

/**
 * 从 FINAL_RESULT 数据解析终态 taskStatus。
 *
 * FINAL_RESULT（completed:true）是 100% 确定的结束信号，直接据此落终态，
 * 不依赖 onClose 后再轮询后端接口——避免「后端把 COMPLETE 写库有延迟，
 * onClose 瞬间轮询仍返回 EXECUTING」导致本地 taskStatus 固化在 EXECUTING
 * （「智能体正在执行」文案 / 发送按钮进行中长期不消失）。
 *
 * - success === true → COMPLETE
 * - error 含「用户主动取消任务」→ CANCEL
 * - error 含「正在执行任务」→ EXECUTING（任务冲突，上一轮仍在跑，非真正结束，调用方据此跳过写回）
 * - 其余 !success → FAILED
 */
export function resolveTerminalTaskStatus(
  success: boolean | undefined,
  error: string | null | undefined,
): TaskStatus {
  if (success) {
    return TaskStatus.COMPLETE;
  }
  if (error?.includes('用户主动取消任务')) {
    return TaskStatus.CANCEL;
  }
  if (error?.includes('正在执行任务')) {
    return TaskStatus.EXECUTING;
  }
  return TaskStatus.FAILED;
}

/**
 * SSE onClose / ChatFinished 兜底：拉取后端 taskStatus 并写回终态。
 * 经 applyTerminalTaskStatus，自动跳过 EXECUTING（避免固化）且未变化不重渲染。
 */
export async function syncTerminalConversationTaskStatus(
  conversationId: number | string,
  setConversationInfo: Dispatch<
    SetStateAction<ConversationInfo | null | undefined>
  >,
): Promise<void> {
  const taskStatus = await fetchConversationTaskStatus(conversationId);
  applyTerminalTaskStatus(setConversationInfo, conversationId, taskStatus);
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
