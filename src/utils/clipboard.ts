import { message } from 'antd';

type CopyCallback = (text: string) => void;

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
  COPY_FAILED_NO_CONTENT: '没有可复制的内容',
  COPY_SUCCESS: '复制成功',
};

/**
 * HTML实体解码
 * @param text HTML编码的文本
 * @returns 解码后的文本
 */
export const decodeHTMLEntities = (text: string): string => {
  if (!text) return '';

  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
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
      callback(text);
    } else if (!successful) {
      message.error(MESSAGES.COPY_FAILED);
    }
  } catch (err) {
    console.error(MESSAGES.COPY_FAILED, err);
    message.error(MESSAGES.COPY_FAILED);
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
    message.error(MESSAGES.COPY_FAILED_NO_CONTENT);
    return;
  }

  const decodedText = decodeHTMLEntities(text);

  // 使用现代剪贴板API或降级到传统方法
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(decodedText);
      if (showSuccessMsg) {
        message.success(MESSAGES.COPY_SUCCESS);
      }
      if (callback) {
        callback(decodedText);
      }
    } catch (err) {
      console.error(MESSAGES.COPY_FAILED, err);
      message.error(MESSAGES.COPY_FAILED);
      fallbackCopyTextToClipboard(decodedText, callback);
    }
  } else {
    fallbackCopyTextToClipboard(decodedText, callback);
  }
};

/**
 * 复制JSON对象到剪贴板
 * @param data 要复制的JSON对象
 * @param space 缩进空格数
 * @param callback 成功回调
 * @param showSuccessMsg 是否显示成功消息
 */
export const copyJSONToClipboard = async (
  data: Record<string, any>,
  space: number = 2,
  callback?: CopyCallback,
  showSuccessMsg: boolean = false,
): Promise<void> => {
  try {
    const jsonString = JSON.stringify(data, null, space);
    await copyTextToClipboard(jsonString, callback, showSuccessMsg);
  } catch (err) {
    console.error('JSON格式化失败', err);
    message.error('JSON格式化失败');
  }
};
