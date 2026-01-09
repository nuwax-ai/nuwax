/**
 * 消息处理工具函数
 * 纯函数，用于处理 SSE 事件中的消息转换
 */

import { getCustomBlock } from '@/plugins/ds-markdown-process';
import { MessageModeEnum } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';

/**
 * 处理 PROCESSING 事件
 * @param currentMessage 当前消息
 * @param data SSE 事件数据
 * @returns 消息更新对象
 */
export const processProcessingEvent = (
  currentMessage: MessageInfo,
  data: any,
): Partial<MessageInfo> => {
  const processingResult = data.result || {};
  data.executeId = processingResult.executeId;

  return {
    text: getCustomBlock(currentMessage.text || '', data),
    status: MessageStatusEnum.Loading,
    processingList: [
      ...(currentMessage?.processingList || []),
      data,
    ] as ProcessingInfo[],
  };
};

/**
 * 处理 MESSAGE 事件
 * @param currentMessage 当前消息
 * @param data SSE 事件数据
 * @returns 消息更新对象
 */
export const processMessageEvent = (
  currentMessage: MessageInfo,
  data: any,
): Partial<MessageInfo> => {
  const { text, type, finished } = data;

  // 思考 think
  if (type === MessageModeEnum.THINK) {
    return {
      think: `${currentMessage.think || ''}${text}`,
      status: MessageStatusEnum.Incomplete,
    };
  }

  // 问答 question
  if (type === MessageModeEnum.QUESTION) {
    return {
      text: `${currentMessage.text || ''}${text}`,
      // 如果 finished 为 true，则状态为 null，此时不会显示运行状态组件
      status: finished ? null : MessageStatusEnum.Incomplete,
    };
  }

  // 普通消息
  return {
    text: `${currentMessage.text || ''}${text}`,
    status: finished
      ? MessageStatusEnum.Complete
      : MessageStatusEnum.Incomplete,
  };
};

/**
 * 处理 FINAL_RESULT 事件
 * @param currentMessage 当前消息
 * @param data SSE 事件数据
 * @param requestId 请求 ID
 * @returns 消息更新对象
 */
export const processFinalResultEvent = (
  currentMessage: MessageInfo,
  data: any,
  requestId: string,
): Partial<MessageInfo> => {
  return {
    status: MessageStatusEnum.Complete,
    finalResult: data,
    requestId,
  };
};

/**
 * 处理 ERROR 事件
 * @returns 消息更新对象
 */
export const processErrorEvent = (): Partial<MessageInfo> => {
  return {
    status: MessageStatusEnum.Error,
  };
};

/**
 * 更新消息列表中的指定消息
 * @param messageList 消息列表
 * @param messageId 消息 ID
 * @param updates 更新内容
 * @returns 更新后的消息列表
 */
export const updateMessageInList = (
  messageList: MessageInfo[],
  messageId: string,
  updates: Partial<MessageInfo>,
): MessageInfo[] => {
  return messageList.map((msg) =>
    msg.id === messageId ? { ...msg, ...updates } : msg,
  );
};

/**
 * 将 Loading 或 Incomplete 状态的消息更新为 Stopped 状态
 * 将所有 EXECUTING 状态的 processing 更新为 FAILED
 * @param messageList 消息列表
 * @returns 更新后的消息列表
 */
export const stopActiveMessages = (
  messageList: MessageInfo[],
): MessageInfo[] => {
  if (messageList.length === 0) return messageList;

  const copyList = JSON.parse(JSON.stringify(messageList));
  const lastMessage = copyList[copyList.length - 1];

  // 将 Loading 或 Incomplete 状态更新为 Stopped
  if (
    lastMessage.status === MessageStatusEnum.Loading ||
    lastMessage.status === MessageStatusEnum.Incomplete
  ) {
    lastMessage.status = MessageStatusEnum.Stopped;
  }

  // 将所有 EXECUTING 状态更新为 FAILED
  if (lastMessage.processingList && Array.isArray(lastMessage.processingList)) {
    lastMessage.processingList = lastMessage.processingList.map(
      (item: ProcessingInfo) => {
        if (item.status === ProcessingEnum.EXECUTING) {
          return { ...item, status: ProcessingEnum.FAILED };
        }
        return item;
      },
    );
  }

  return copyList;
};

/**
 * 将所有 Incomplete 状态的消息改为 Complete 状态
 * @param messageList 消息列表
 * @returns 更新后的消息列表
 */
export const completeIncompleteMessages = (
  messageList: MessageInfo[],
): MessageInfo[] => {
  return messageList.map((item) => {
    if (item.status === MessageStatusEnum.Incomplete) {
      return { ...item, status: MessageStatusEnum.Complete };
    }
    return item;
  });
};
