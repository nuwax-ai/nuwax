/**
 * 消息列表管理 Hook
 * 管理消息列表的增删改查、状态管理
 */

import { MessageStatusEnum } from '@/types/enums/common';
import type { GuidQuestionDto } from '@/types/interfaces/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useRef, useState } from 'react';
import type { MessageListReturn } from '../types';

export const useMessageList = (): MessageListReturn => {
  // 会话消息列表
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 缓存消息列表，用于消息会话错误时修改消息状态
  const messageListRef = useRef<MessageInfo[]>([]);
  // 消息ID
  const messageIdRef = useRef<string>('');
  // 是否还有更多消息，默认没有更多消息
  const [isMoreMessage, setIsMoreMessage] = useState<boolean>(false);
  // 加载更多消息的状态
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  // 会话是否正在进行中（有消息正在处理）
  const [isConversationActive, setIsConversationActive] =
    useState<boolean>(false);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<
    string[] | GuidQuestionDto[]
  >([]);

  /**
   * 检查会话是否正在进行中（有消息正在处理）
   * 只检查最后几条消息的状态，而不是所有消息
   */
  const checkConversationActive = useCallback((messages: MessageInfo[]) => {
    const recentMessages = messages?.slice(-5) || [];
    const hasActiveMessage =
      recentMessages.some(
        (message) =>
          message.status === MessageStatusEnum.Loading ||
          message.status === MessageStatusEnum.Incomplete,
      ) || false;
    setIsConversationActive(hasActiveMessage);
  }, []);

  /**
   * 禁用会话活跃状态
   */
  const disabledConversationActive = useCallback(() => {
    setIsConversationActive(false);
  }, []);

  return {
    messageList,
    setMessageList,
    messageListRef,
    messageIdRef,
    isMoreMessage,
    setIsMoreMessage,
    loadingMore,
    setLoadingMore,
    isConversationActive,
    setIsConversationActive,
    checkConversationActive,
    disabledConversationActive,
    chatSuggestList,
    setChatSuggestList,
  };
};
