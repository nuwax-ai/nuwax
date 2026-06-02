/** 日志表格列中 input/output 最大展示字符数，避免超长内容导致渲染卡顿 */
export const MAX_LOG_CONTENT_LENGTH = 2000;

/**
 * 将日志内容在过长时截断
 * @param content 原始 input/output 内容
 * @returns 未超长时返回原值，超长时返回截断后的字符串
 */
export const getTruncatedLogContent = (
  content?: string,
): string | undefined => {
  if (!content) {
    return content;
  }

  if (content.length <= MAX_LOG_CONTENT_LENGTH) {
    return content;
  }

  return `${content.slice(0, MAX_LOG_CONTENT_LENGTH)}...`;
};
