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
