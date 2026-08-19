import { findCurrentRoundStart } from '@/models/conversationInfoMessageList';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

/** 默认检查最近 N 条消息中的 processing 执行态 */

/** 消息列表末尾是否仍在流式输出（Loading / Incomplete） */
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

/**
 * 最近若干条消息中是否存在 processingList 仍在 EXECUTING 的块。
 * 流式 chunk 间 message.status 可能短暂为 null，但工具/页面调用仍在执行。
 */
export function hasExecutingProcessingInMessages(
  messageList: MessageInfo[] | undefined | null,
): boolean {
  if (!messageList?.length) {
    return false;
  }
  // 精确到当前轮次：从最后一条 USER 之后的所有 assistant 消息检查
  // EXECUTING 残留——覆盖任意深度的多步输出，替代此前的固定 5 条窗口
  const roundStart = findCurrentRoundStart(messageList);
  const roundMessages = messageList.slice(roundStart);
  return roundMessages.some((message) =>
    message.processingList?.some(
      (item) => item.status === ProcessingEnum.EXECUTING,
    ),
  );
}

/**
 * 消息列表是否表明会话仍在流式/处理中（与 model isConversationActive 对齐的兜底信号）
 */
export function isSessionStreamBusy(
  messageList: MessageInfo[] | undefined | null,
): boolean {
  return (
    hasActiveStreamingInMessages(messageList) ||
    hasExecutingProcessingInMessages(messageList)
  );
}
