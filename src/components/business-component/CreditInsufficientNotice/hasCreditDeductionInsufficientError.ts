/** 后端在 FINAL_RESULT.error 里返回的积分扣减失败文案 */
export const CREDIT_DEDUCTION_INSUFFICIENT_TEXT =
  '积分不足以完成扣减，请增购积分后继续';

/** 历史消息正文里表示积分已用完的文案 */
export const HISTORY_CREDIT_EXHAUSTED_TEXT = '403 您的积分已用完';

/** 历史会话最后一条消息正文是否包含积分用完提示 */
export function lastMessageIndicatesCreditExhausted(
  messageList?: Array<{ text?: string | null }>,
): boolean {
  const lastMessage = messageList?.[messageList.length - 1];
  return Boolean(lastMessage?.text?.includes(HISTORY_CREDIT_EXHAUSTED_TEXT));
}

export function hasCreditDeductionInsufficientError(
  messageList?: Array<{ finalResult?: { error?: string } | null }>,
): boolean {
  return (messageList ?? []).some((message) =>
    message.finalResult?.error?.includes(CREDIT_DEDUCTION_INSUFFICIENT_TEXT),
  );
}
