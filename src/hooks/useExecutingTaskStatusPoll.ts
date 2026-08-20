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
  // 架构决策：工具调用状态（processingList EXECUTING）不驱动会话按钮状态。
  // 按钮由三层信号决定：连接生命周期（isConversationActive）、消息流状态
  // （末条 Loading/Incomplete）、后端权威状态（taskStatus===EXECUTING）。
  // 工具状态仅影响 UI 展示（RunOver 进度指示），不参与 busy 判定——
  // 否则单个工具的 FINISHED 事件丢失就会导致按钮永久卡死（1678835 案例），
  // 且需要 sweep 精确对齐检查范围（轮次边界），增加不必要的耦合。
  return hasActiveStreamingInMessages(messageList);
}
