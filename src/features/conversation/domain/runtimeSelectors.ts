import { TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

const DEFAULT_RECENT_MESSAGE_COUNT = 5;

/** 最后一条消息是否仍在 live/sub 流中。 */
export function hasActiveStreamingInMessages(
  messageList: MessageInfo[] | undefined | null,
): boolean {
  if (!messageList?.length) {
    return false;
  }
  const lastMessage = messageList[messageList.length - 1];
  return (
    lastMessage.status === MessageStatusEnum.Loading ||
    lastMessage.status === MessageStatusEnum.Incomplete
  );
}

/** 最近消息中是否仍有执行中的 processing。 */
export function hasExecutingProcessingInRecentMessages(
  messageList: MessageInfo[] | undefined | null,
  recentCount = DEFAULT_RECENT_MESSAGE_COUNT,
): boolean {
  if (!messageList?.length) {
    return false;
  }
  return messageList
    .slice(-recentCount)
    .some((message) =>
      message.processingList?.some(
        (item) => item.status === ProcessingEnum.EXECUTING,
      ),
    );
}

/**
 * 消息投影出的 UI 流式活跃态。
 *
 * 该 selector 不读取 taskStatus 或协议终态：三者属于不同状态维度。
 */
export function isSessionStreamBusy(
  messageList: MessageInfo[] | undefined | null,
): boolean {
  return (
    hasActiveStreamingInMessages(messageList) ||
    hasExecutingProcessingInRecentMessages(messageList)
  );
}

/** model 信号与消息投影合并后的 live/sub 流式活跃态。 */
export function selectSessionStreamActive(
  modelStreamActive: boolean | undefined,
  messageList: MessageInfo[] | undefined | null,
): boolean {
  return Boolean(modelStreamActive) || isSessionStreamBusy(messageList);
}

export function isTaskExecuting(taskStatus: TaskStatus | undefined): boolean {
  return taskStatus === TaskStatus.EXECUTING;
}

/** 停止按钮、无队列发送拦截使用的完整活跃态。 */
export function selectSessionActive(
  modelStreamActive: boolean | undefined,
  messageList: MessageInfo[] | undefined | null,
  taskStatus: TaskStatus | undefined,
): boolean {
  return (
    selectSessionStreamActive(modelStreamActive, messageList) ||
    isTaskExecuting(taskStatus)
  );
}

export interface QueueGate {
  streamActive: boolean;
  taskExecuting: boolean;
  enqueueBlocked: boolean;
  consumeBlocked: boolean;
}

/** 队列入队/消费的统一门禁；Intervention 只额外阻塞消费。 */
export function selectQueueGate(
  modelStreamActive: boolean | undefined,
  messageList: MessageInfo[] | undefined | null,
  taskStatus: TaskStatus | undefined,
  hasPendingIntervention = false,
): QueueGate {
  const streamActive = selectSessionStreamActive(
    modelStreamActive,
    messageList,
  );
  const taskExecuting = isTaskExecuting(taskStatus);
  const enqueueBlocked = streamActive || taskExecuting;
  return {
    streamActive,
    taskExecuting,
    enqueueBlocked,
    consumeBlocked: enqueueBlocked || hasPendingIntervention,
  };
}

export function shouldShowTaskExecutingWait(
  taskStatus: TaskStatus | undefined,
  messageList: MessageInfo[] | undefined | null,
): boolean {
  return (
    isTaskExecuting(taskStatus) && !hasActiveStreamingInMessages(messageList)
  );
}

export function shouldShowSessionSuggest(
  messageList: MessageInfo[] | undefined | null,
  hasQueuedMessages: boolean,
  streamActive: boolean,
): boolean {
  return Boolean(messageList?.length) && !hasQueuedMessages && !streamActive;
}
