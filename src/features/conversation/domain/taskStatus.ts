import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';

/** 会话任务终态集合；CREATE / EXECUTING 不属于终态。 */
const TERMINAL_TASK_STATUSES = new Set<TaskStatus>([
  TaskStatus.COMPLETE,
  TaskStatus.CANCEL,
  TaskStatus.FAILED,
]);

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
 * 从 FINAL_RESULT 解析协议终态。
 *
 * success=true 是确定的 COMPLETE。失败只接受结构化终态字段，不根据后端文案猜测；
 * 无法确认时返回 undefined，由 Runtime 的一致性流程查询持久化任务状态兜底。
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

/** 从消息列表最后一条 ASSISTANT 的 finalResult 解析当前轮次终态。 */
export function resolveTaskStatusFromMessageList(
  messageList: MessageInfo[] | undefined | null,
): TaskStatus | undefined {
  if (!messageList?.length) {
    return undefined;
  }
  for (let index = messageList.length - 1; index >= 0; index -= 1) {
    const message = messageList[index];
    if (message.role !== AssistantRoleEnum.ASSISTANT) {
      continue;
    }
    if (message.finalResult) {
      return resolveTerminalTaskStatus(
        message.finalResult.success,
        message.finalResult,
      );
    }
    return undefined;
  }
  return undefined;
}

/** 按参数顺序解析消息列表，首个可确认终态优先。 */
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
 * 合并会话详情中的任务状态，防止迟到的 EXECUTING 快照覆盖已确认终态。
 */
export function mergeConversationInfoTaskStatus(
  previous: ConversationInfo | null | undefined,
  incoming: ConversationInfo,
): ConversationInfo {
  if (!incoming || incoming.taskStatus !== TaskStatus.EXECUTING) {
    return incoming;
  }
  const sameConversation =
    previous !== undefined &&
    previous !== null &&
    String(previous.id) === String(incoming.id);
  const resolved =
    resolveTaskStatusFromMessageList(incoming.messageList) ||
    (sameConversation
      ? resolveTaskStatusFromMessageList(previous.messageList)
      : undefined);
  if (resolved) {
    return { ...incoming, taskStatus: resolved };
  }
  if (sameConversation && isTerminalTaskStatus(previous.taskStatus)) {
    return { ...incoming, taskStatus: previous.taskStatus };
  }
  return incoming;
}
