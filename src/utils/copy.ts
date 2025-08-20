/**
 * 统一拷贝工具 - 简化版
 * 提供最常用的拷贝功能，API 简洁易用
 * 使用者需要自己预处理数据（如 JSON.stringify）
 */

import { message } from 'antd';
import { copyTextToClipboard } from './clipboard';

// 默认消息
const MESSAGES = {
  SUCCESS: '复制成功',
  FAILED: '复制失败',
  NO_CONTENT: '没有可复制的内容',
};

/**
 * 拷贝文本到剪贴板
 * @param text 要复制的文本
 * @param showMessage 是否显示提示消息
 * @param successMessage 自定义成功消息
 * @param errorMessage 自定义错误消息
 */
export const copyText = async (
  text: string,
  showMessage: boolean = true,
  successMessage?: string,
  errorMessage?: string,
): Promise<boolean> => {
  if (!text) {
    if (showMessage) {
      message.error(errorMessage || MESSAGES.NO_CONTENT);
    }
    return false;
  }

  try {
    await copyTextToClipboard(text, undefined, showMessage);
    if (showMessage && successMessage) {
      message.success(successMessage);
    }
    return true;
  } catch (error) {
    if (showMessage) {
      message.error(errorMessage || MESSAGES.FAILED);
    }
    return false;
  }
};

/**
 * 拷贝 JSON 到剪贴板
 * @param data 要复制的数据
 * @param space 缩进空格数
 * @param showMessage 是否显示提示消息
 * @param successMessage 自定义成功消息
 * @param errorMessage 自定义错误消息
 */
export const copyJSON = async (
  data: Record<string, any> | any[],
  space: number = 2,
  showMessage: boolean = true,
  successMessage?: string,
  errorMessage?: string,
): Promise<boolean> => {
  try {
    // 使用者自己处理 JSON 格式化
    const jsonString = JSON.stringify(data, null, space);
    await copyTextToClipboard(jsonString, undefined, showMessage);
    if (showMessage && successMessage) {
      message.success(successMessage);
    }
    return true;
  } catch (error) {
    if (showMessage) {
      message.error(errorMessage || MESSAGES.FAILED);
    }
    return false;
  }
};

/**
 * 智能拷贝 - 自动判断内容类型
 * @param content 要复制的内容
 * @param showMessage 是否显示提示消息
 * @param successMessage 自定义成功消息
 * @param errorMessage 自定义错误消息
 */
export const copy = async (
  content: string | Record<string, any> | any[] | number | boolean,
  showMessage: boolean = true,
  successMessage?: string,
  errorMessage?: string,
): Promise<boolean> => {
  try {
    if (typeof content === 'string') {
      return await copyText(content, showMessage, successMessage, errorMessage);
    } else if (typeof content === 'object' && content !== null) {
      return await copyJSON(
        content,
        2,
        showMessage,
        successMessage,
        errorMessage,
      );
    } else {
      return await copyText(
        String(content),
        showMessage,
        successMessage,
        errorMessage,
      );
    }
  } catch (error) {
    if (showMessage) {
      message.error(errorMessage || MESSAGES.FAILED);
    }
    return false;
  }
};

// 默认导出主要的拷贝函数
export default copy;
