import { message } from 'antd';

type CopyCallback = (text: string, result?: boolean) => void;

// 静态样式定义
const STYLES = {
  TEXTAREA: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '2em',
    height: '2em',
    padding: '0',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    background: 'transparent',
    fontSize: '16px', // 防止在iPhone上缩放
  } as const,
};

// 错误信息常量
const MESSAGES = {
  COPY_FAILED: '复制失败，请手动复制',
  COPY_SUCCESS: '复制成功',
  NO_CONTENT: '没有可复制的内容',
};

/**
 * 传统复制方法（降级方案）
 * @param text 要复制的文本
 * @param callback 成功回调
 */
export const fallbackCopyTextToClipboard = (
  text: string,
  callback?: CopyCallback,
): void => {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // 避免在iOS上出现缩放
  Object.assign(textArea.style, STYLES.TEXTAREA);

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful && callback) {
      callback(text, true);
    } else if (!successful) {
      message.error(MESSAGES.COPY_FAILED);
      if (callback) {
        callback(text, false);
      }
    }
  } catch (err) {
    console.error(MESSAGES.COPY_FAILED, err);
    message.error(MESSAGES.COPY_FAILED);
    if (callback) {
      callback(text, false);
    }
  }

  document.body.removeChild(textArea);
};

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @param callback 成功回调
 * @param showSuccessMsg 是否显示成功消息
 */
export const copyTextToClipboard = async (
  text: string,
  callback?: CopyCallback,
  showSuccessMsg: boolean = false,
): Promise<void> => {
  if (!text) {
    message.error(MESSAGES.NO_CONTENT);
    if (callback) {
      callback(text, false);
    }
    return;
  }

  // 使用现代剪贴板API或降级到传统方法
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      if (showSuccessMsg) {
        message.success(MESSAGES.COPY_SUCCESS);
      }
      if (callback) {
        callback(text, true);
      }
    } catch (err) {
      console.error(MESSAGES.COPY_FAILED, err);
      message.error(MESSAGES.COPY_FAILED);
      fallbackCopyTextToClipboard(text, callback);
    }
  } else {
    fallbackCopyTextToClipboard(text, callback);
  }
};

/**
 * 检查剪贴板API是否可用
 * @returns 是否可用
 */
export const isClipboardAvailable = (): boolean => {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
};
