import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';

function failExecutingProcessing(
  processingList: ProcessingInfo[] | undefined,
): ProcessingInfo[] | undefined {
  if (!Array.isArray(processingList)) {
    return processingList;
  }
  return processingList.map((item) =>
    item.status === ProcessingEnum.EXECUTING
      ? { ...item, status: ProcessingEnum.FAILED }
      : item,
  );
}

function stopTransientMessageStatus(
  status: MessageInfo['status'],
): MessageInfo['status'] {
  return status === MessageStatusEnum.Loading ||
    status === MessageStatusEnum.Incomplete
    ? MessageStatusEnum.Stopped
    : status;
}

/**
 * 主动停止或当前 live 流关闭后的消息收尾。
 *
 * 所有遗留的执行中 processing 都失败；仅列表尾消息结束思考态，并将临时消息态置为 Stopped。
 */
export function finalizeMessagesOnStreamClose(
  messageList: MessageInfo[],
): MessageInfo[] {
  if (!messageList.length) {
    return messageList;
  }

  // 保留原 model 的深拷贝语义，避免此次边界抽取改变嵌套消息对象的引用行为。
  const copiedMessages = JSON.parse(
    JSON.stringify(messageList),
  ) as MessageInfo[];
  const lastIndex = copiedMessages.length - 1;
  return copiedMessages.map((message, index) => ({
    ...message,
    ...(index === lastIndex
      ? {
          thinkingFinished: true,
          status: stopTransientMessageStatus(message.status),
        }
      : {}),
    processingList: failExecutingProcessing(message.processingList),
  }));
}

/** 过期 live 连接关闭时，只收尾该连接所属的助手消息，不能影响新一轮。 */
export function finalizeOwnedMessageOnStaleClose(
  messageList: MessageInfo[],
  messageId: string,
): MessageInfo[] {
  return messageList.map((message) =>
    message.id === messageId
      ? {
          ...message,
          thinkingFinished: true,
          status: stopTransientMessageStatus(message.status),
          processingList: failExecutingProcessing(message.processingList),
        }
      : message,
  );
}

/** live 连接错误时，只将该连接所属消息置为 Error，并清理执行中的 processing。 */
export function markOwnedMessageStreamError(
  messageList: MessageInfo[],
  messageId: string,
): MessageInfo[] {
  return messageList.map((message) =>
    message.id === messageId
      ? {
          ...message,
          status: MessageStatusEnum.Error,
          processingList: failExecutingProcessing(message.processingList),
        }
      : message,
  );
}

/**
 * 终态确认后的消息收敛。轮询、live FINAL/ERROR 与 sub 恢复必须共用同一规则，
 * 避免 taskStatus 已完成但末条恢复占位仍为 Loading。
 */
export function finalizeMessagesOnTerminalTaskStatus(
  messageList: MessageInfo[],
  taskStatus: TaskStatus,
): MessageInfo[] {
  if (!messageList.length || taskStatus === TaskStatus.EXECUTING) {
    return messageList;
  }

  let currentRoundStart = 0;
  for (let index = messageList.length - 1; index >= 0; index -= 1) {
    if (messageList[index].role === AssistantRoleEnum.USER) {
      currentRoundStart = index + 1;
      break;
    }
  }

  const messageTerminalStatus =
    taskStatus === TaskStatus.FAILED
      ? MessageStatusEnum.Error
      : MessageStatusEnum.Complete;
  const processingTerminalStatus =
    taskStatus === TaskStatus.FAILED
      ? ProcessingEnum.FAILED
      : ProcessingEnum.FINISHED;
  const next = messageList.slice();
  const lastIndex = next.length - 1;
  let changed = false;

  for (let index = lastIndex; index >= currentRoundStart; index -= 1) {
    const message = next[index];
    const isTail = index === lastIndex;
    const incomplete =
      isTail &&
      (message.status === MessageStatusEnum.Loading ||
        message.status === MessageStatusEnum.Incomplete);
    let processingChanged = false;
    const processingList = message.processingList?.map((item) => {
      if (item.status !== ProcessingEnum.EXECUTING) {
        return item;
      }
      processingChanged = true;
      return { ...item, status: processingTerminalStatus };
    });
    const settleFailedInteraction = <T extends { responseStatus?: string }>(
      interaction: T,
    ): T => {
      if (
        taskStatus !== TaskStatus.FAILED ||
        (interaction.responseStatus !== undefined &&
          interaction.responseStatus !== 'pending' &&
          interaction.responseStatus !== 'submitting')
      ) {
        return interaction;
      }
      return { ...interaction, responseStatus: 'failed' };
    };
    const mcpAskInteractions = message.mcpAskInteractions?.map(
      settleFailedInteraction,
    );
    const acpPermissionInteractions = message.acpPermissionInteractions?.map(
      settleFailedInteraction,
    );
    const interventionChanged =
      mcpAskInteractions?.some(
        (item, itemIndex) => item !== message.mcpAskInteractions?.[itemIndex],
      ) ||
      acpPermissionInteractions?.some(
        (item, itemIndex) =>
          item !== message.acpPermissionInteractions?.[itemIndex],
      );

    if (!incomplete && !processingChanged && !interventionChanged) {
      continue;
    }
    next[index] = {
      ...message,
      thinkingFinished: isTail ? true : message.thinkingFinished,
      status: incomplete ? messageTerminalStatus : message.status,
      processingList,
      mcpAskInteractions,
      acpPermissionInteractions,
    };
    changed = true;
  }

  return changed ? next : messageList;
}
