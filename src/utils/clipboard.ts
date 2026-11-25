import { dict } from '@/services/i18nRuntime';
import { hostBridge } from '@/utils/hostBridge';
import { message } from 'antd';

async function shareableUrl(text: string): Promise<string> {
  try {
    const url = new URL(text);
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return text;
    const context = await hostBridge.auth.getContext();
    if (context?.gatewayOrigin && url.origin === context.gatewayOrigin)
      return new URL(
        url.pathname + url.search + url.hash,
        context.businessOrigin,
      ).toString();
  } catch {
    /* plain text */
  }
  return text;
}

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
const getMessages = () => ({
  COPY_FAILED: dict('PC.Utils.Clipboard.copyFailed'),
  COPY_SUCCESS: dict('PC.Utils.Clipboard.copySuccess'),
  NO_CONTENT: dict('PC.Utils.Clipboard.noContent'),
});

/**
 * 传统复制方法（降级方案）
 * @param text 要复制的文本
 * @param callback 成功回调
 * @param cause 触发降级的原因（Clipboard API 的报错），降级也失败时一并输出
 */
export const fallbackCopyTextToClipboard = (
  text: string,
  callback?: CopyCallback,
  cause?: unknown,
): void => {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // 避免在iOS上出现缩放
  Object.assign(textArea.style, STYLES.TEXTAREA);

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  // execCommand 返回 false 时不抛错，触发降级的原因只能靠 cause 留痕
  const notifyFailure = (err?: unknown) => {
    if (err !== undefined) {
      console.error(getMessages().COPY_FAILED, err);
    }
    message.error(getMessages().COPY_FAILED);
    if (callback) {
      callback(text, false);
    }
  };

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      if (callback) {
        callback(text, true);
      }
    } else {
      notifyFailure(cause);
    }
  } catch (err) {
    notifyFailure(cause ?? err);
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
    message.error(getMessages().NO_CONTENT);
    if (callback) {
      callback(text, false);
    }
    return;
  }

  const copiedText = await shareableUrl(text);

  // 成功提示与回调只看最终结果：Clipboard API 走不通时转传统复制，两条路径成功后的表现一致
  const handleResult: CopyCallback = (resultText, result) => {
    if (result && showSuccessMsg) {
      message.success(getMessages().COPY_SUCCESS);
    }
    if (callback) {
      callback(resultText, result);
    }
  };

  // 使用现代剪贴板API或降级到传统方法
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(copiedText);
      handleResult(copiedText, true);
    } catch (err) {
      // Clipboard API 被权限策略拦截（嵌入到未授权剪贴板的跨域 iframe）或被浏览器拒绝时转降级；
      // 降级可能成功，不能在这里提前弹「复制失败」
      fallbackCopyTextToClipboard(copiedText, handleResult, err);
    }
  } else {
    fallbackCopyTextToClipboard(copiedText, handleResult);
  }
};

/**
 * 检查剪贴板API是否可用
 * @returns 是否可用
 */
export const isClipboardAvailable = (): boolean => {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
};
