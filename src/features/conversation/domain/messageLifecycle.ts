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
