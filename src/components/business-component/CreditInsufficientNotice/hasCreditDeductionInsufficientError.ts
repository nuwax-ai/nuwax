import { dict } from '@/services/i18nRuntime';

/** FINAL_RESULT.error 里表示积分不足的错误码，和当前语言的「积分不足」是或关系 */
export const CREDIT_INSUFFICIENT_ERROR_CODE = 'NW_CREDIT_INSUFFICIENT';

/** FINAL_RESULT.errorReason 等于该值时提示增购 */
export const CREDIT_INSUFFICIENT_ERROR_REASON = 'CREDIT_INSUFFICIENT';

/** 历史消息正文：积分已用完 */
const HISTORY_CREDIT_EXHAUSTED_KEY =
  'PC.Components.CreditInsufficientNotice.historyExhausted';

/** 历史消息正文：积分不足。和上面是或关系 */
const HISTORY_CREDIT_INSUFFICIENT_KEY =
  'PC.Components.CreditInsufficientNotice.historyInsufficient';

/** 历史会话最后一条消息正文是否包含积分用完或积分不足 */
export function lastMessageIndicatesCreditExhausted(
  messageList?: Array<{ text?: string | null }>,
): boolean {
  const text = messageList?.[messageList.length - 1]?.text;
  if (!text) {
    return false;
  }
  return [HISTORY_CREDIT_EXHAUSTED_KEY, HISTORY_CREDIT_INSUFFICIENT_KEY].some(
    (key) => {
      const keyword = dict(key);
      return Boolean(keyword) && text.includes(keyword);
    },
  );
}

export function hasCreditDeductionInsufficientError(
  messageList?: Array<{
    finalResult?: { error?: string; errorReason?: string } | null;
  }>,
): boolean {
  return (messageList ?? []).some((message) => {
    const finalResult = message.finalResult;
    const errorReason = finalResult?.errorReason?.trim();
    if (errorReason === CREDIT_INSUFFICIENT_ERROR_REASON) {
      return true;
    }
    const error = finalResult?.error;
    const insufficientText = dict(HISTORY_CREDIT_INSUFFICIENT_KEY);
    return (
      !!error &&
      ((Boolean(insufficientText) && error.includes(insufficientText)) ||
        error.includes(CREDIT_INSUFFICIENT_ERROR_CODE))
    );
  });
}
