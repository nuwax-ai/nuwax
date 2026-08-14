import { SUCCESS_CODE } from '@/constants/codes.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import { apiAgentConversation } from '@/services/agentConfig';
import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import type { Dispatch, SetStateAction } from 'react';

/** ChatFinished 事件载荷 */
export type ChatFinishedPayload = { conversationId: string };

/** 会话 taskStatus 终态（非 EXECUTING / CREATE） */
const TERMINAL_TASK_STATUSES = new Set<TaskStatus>([
  TaskStatus.COMPLETE,
  TaskStatus.CANCEL,
  TaskStatus.FAILED,
]);

/** 判断 taskStatus 是否为终态 */
export function isTerminalTaskStatus(
  status: TaskStatus | undefined | null,
): boolean {
  return (
    status !== undefined &&
    status !== null &&
    TERMINAL_TASK_STATUSES.has(status)
  );
}

function normalizeTaskStatus(value: unknown): TaskStatus | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toUpperCase();
  if (
    normalized === TaskStatus.COMPLETE ||
    normalized === TaskStatus.CANCEL ||
    normalized === TaskStatus.FAILED
  ) {
    return normalized as TaskStatus;
  }
  return undefined;
}

function normalizeStopReason(value: unknown): TaskStatus | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[-_\s]/g, '');
  if (
    normalized === 'endturn' ||
    normalized === 'complete' ||
    normalized === 'completed' ||
    normalized === 'success'
  ) {
    return TaskStatus.COMPLETE;
  }
  if (
    normalized === 'cancel' ||
    normalized === 'cancelled' ||
    normalized === 'canceled'
  ) {
    return TaskStatus.CANCEL;
  }
  if (
    normalized === 'error' ||
    normalized === 'fail' ||
    normalized === 'failed'
  ) {
    return TaskStatus.FAILED;
  }
  return undefined;
}

function resolveStructuredTerminalStatus(
  signal: unknown,
): TaskStatus | undefined {
  const directStatus = normalizeTaskStatus(signal);
  if (directStatus) {
    return directStatus;
  }

  if (!signal || typeof signal !== 'object') {
    return undefined;
  }

  const payload = signal as Record<string, unknown>;
  const status =
    normalizeTaskStatus(payload.taskStatus) ||
    normalizeTaskStatus(payload.task_status) ||
    normalizeTaskStatus(payload.status) ||
    normalizeTaskStatus(payload.terminalStatus);
  if (status) {
    return status;
  }

  return (
    normalizeStopReason(payload.stop_reason) ||
    normalizeStopReason(payload.stopReason) ||
    normalizeStopReason(payload.reason)
  );
}

/**
 * 从 FINAL_RESULT 解析终态 taskStatus。
 *
 * FINAL_RESULT（completed:true）是确定结束信号，但只在 success=true 时落 COMPLETE——
 * 正常完成是「后端落库 COMPLETE 有延迟」的高风险场景，直接落终态绕过后端轮询，
 * 修复 taskStatus 固化 EXECUTING（UI 长期显示「智能体正在执行」/ 发送按钮进行中）。
 *
 * success=false（取消/冲突/失败）不在前端据 error/message 文案猜终态——文案匹配脆弱、
 * 与后端措辞强耦合。仅接受结构化 taskStatus / stop_reason / reason 等协议字段；
 * 未命中则返回 undefined，由 applyTerminalTaskStatus 跳过写回，交 onClose 的
 * syncTerminalConversationTaskStatus 拉后端真实 taskStatus；
 * 此时后端已返回 FINAL_RESULT，终态通常已落库，轮询可拿到正确值。
 *
 * - success === true → COMPLETE
 * - taskStatus/status/task_status/terminalStatus 为终态枚举 → 对应终态
 * - stop_reason/stopReason/reason 为协议终止原因枚举 → 对应终态
 * - 其它 → undefined（不落，交后端轮询兜底）
 */
export function resolveTerminalTaskStatus(
  success: boolean | undefined,
  ...terminalSignals: unknown[]
): TaskStatus | undefined {
  if (success) {
    return TaskStatus.COMPLETE;
  }

  for (const signal of terminalSignals) {
    const status = resolveStructuredTerminalStatus(signal);
    if (status) {
      return status;
    }
  }

  return undefined;
}

/**
 * 从消息列表【最后一条 assistant】的 finalResult 解析终态 taskStatus。
 * 若最后一条 assistant 尚无 finalResult，视为当前轮仍在执行，不沿用历史轮次结果。
 */
export function resolveTaskStatusFromMessageList(
  messageList: MessageInfo[] | undefined | null,
): TaskStatus | undefined {
  if (!messageList?.length) {
    return undefined;
  }
  for (let i = messageList.length - 1; i >= 0; i -= 1) {
    const message = messageList[i];
    if (message.role !== AssistantRoleEnum.ASSISTANT) {
      continue;
    }
    const { finalResult } = message;
    if (finalResult) {
      return resolveTerminalTaskStatus(finalResult.success, finalResult);
    }
    // 命中最后一条 assistant 但无 finalResult → 当前轮仍在流式/执行中
    return undefined;
  }
  return undefined;
}

/**
 * 依次从传入的 messageList 解析终态（前者优先）。
 * 取最后一条 assistant 的 finalResult 判定；sub 关闭后传入本地 messageList
 * （FINAL_RESULT 已落本地）即可解析，无需额外 reload。
 */
export function resolveTaskStatusFromMessageLists(
  ...messageLists: Array<MessageInfo[] | undefined | null>
): TaskStatus | undefined {
  for (const list of messageLists) {
    const status = resolveTaskStatusFromMessageList(list);
    if (status !== undefined) {
      return status;
    }
  }
  return undefined;
}

/**
 * reload 历史时合并 taskStatus：接口仍返回 EXECUTING 时，优先从消息 finalResult
 * 经 resolveTerminalTaskStatus 落终态；解析失败则保留 prev 已落下的终态，避免覆盖。
 */
export function mergeConversationInfoTaskStatus(
  prev: ConversationInfo | null | undefined,
  incoming: ConversationInfo,
): ConversationInfo {
  if (!incoming || incoming.taskStatus !== TaskStatus.EXECUTING) {
    return incoming;
  }
  const sameConversation =
    prev !== undefined &&
    prev !== null &&
    String(prev.id) === String(incoming.id);
  const resolved =
    resolveTaskStatusFromMessageList(incoming.messageList) ||
    (sameConversation
      ? resolveTaskStatusFromMessageList(prev.messageList)
      : undefined);
  if (resolved) {
    return { ...incoming, taskStatus: resolved };
  }
  if (sameConversation && isTerminalTaskStatus(prev.taskStatus)) {
    return { ...incoming, taskStatus: prev.taskStatus };
  }
  return incoming;
}

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
