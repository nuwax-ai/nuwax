/**
 * 会话状态管理 Hook
 * 管理会话核心状态：会话信息、变量参数、请求状态等
 */

import { EditAgentShowType } from '@/types/enums/space';
import type { AgentManualComponentInfo } from '@/types/interfaces/agent';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import type {
  CardInfo,
  ConversationFinalResult,
  ConversationInfo,
} from '@/types/interfaces/conversationInfo';
import { useCallback, useRef, useState } from 'react';
import type { ConversationStateReturn } from '../types';

export const useConversationState = (): ConversationStateReturn => {
  // 会话信息
  const [conversationInfo, setConversationInfo] =
    useState<ConversationInfo | null>();
  // 当前会话ID
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);
  // 会话消息请求ID
  const [currentConversationRequestId, setCurrentConversationRequestId] =
    useState<string>('');
  // 请求ID
  const [requestId, setRequestId] = useState<string>('');
  // 调试结果
  const [finalResult, setFinalResult] =
    useState<ConversationFinalResult | null>(null);
  // 变量参数
  const [variables, setVariables] = useState<BindConfigWithSub[]>([]);
  // 必填变量参数name列表
  const [requiredNameList, setRequiredNameList] = useState<string[]>([]);
  // 用户填写的变量参数
  const [userFillVariables, setUserFillVariables] = useState<Record<
    string,
    string | number
  > | null>(null);
  // 是否需要更新主题
  const needUpdateTopicRef = useRef<boolean>(true);
  // 是否开启用户问题建议
  const isSuggest = useRef(false);
  // 可手动选择的组件列表
  const [manualComponents, setManualComponents] = useState<
    AgentManualComponentInfo[]
  >([]);
  // 展示台类型
  const [showType, setShowType] = useState<EditAgentShowType>(
    EditAgentShowType.Hide,
  );
  // 展示台卡片列表
  const [cardList, setCardList] = useState<CardInfo[]>([]);
  // 是否正在加载会话
  const [isLoadingConversation, setIsLoadingConversation] =
    useState<boolean>(false);
  // 其它调用接口的情况下判断是否正在加载中用于禁用聊天发送按钮
  const [isLoadingOtherInterface, setIsLoadingOtherInterface] =
    useState<boolean>(false);

  // 设置是否开启问题建议
  const setIsSuggest = useCallback((suggest: boolean) => {
    isSuggest.current = suggest;
  }, []);

  // 处理变量参数
  const handleVariables = useCallback((_variables: BindConfigWithSub[]) => {
    setVariables(_variables);
    // 必填参数name列表（非系统变量且必填）
    const _requiredNameList = _variables
      ?.filter(
        (item: BindConfigWithSub) => !item.systemVariable && item.require,
      )
      ?.map((item: BindConfigWithSub) => item.name);
    setRequiredNameList(_requiredNameList || []);
  }, []);

  // 获取当前会话ID
  const getCurrentConversationId = useCallback(() => {
    return currentConversationId;
  }, [currentConversationId]);

  // 获取当前会话请求ID
  const getCurrentConversationRequestId = useCallback(() => {
    return currentConversationRequestId;
  }, [currentConversationRequestId]);

  return {
    conversationInfo,
    setConversationInfo,
    currentConversationId,
    setCurrentConversationId,
    currentConversationRequestId,
    setCurrentConversationRequestId,
    requestId,
    setRequestId,
    finalResult,
    setFinalResult,
    variables,
    setVariables,
    requiredNameList,
    setRequiredNameList,
    userFillVariables,
    setUserFillVariables,
    handleVariables,
    needUpdateTopicRef,
    getCurrentConversationId,
    getCurrentConversationRequestId,
    isSuggest,
    setIsSuggest,
    manualComponents,
    setManualComponents,
    showType,
    setShowType,
    cardList,
    setCardList,
    isLoadingConversation,
    setIsLoadingConversation,
    isLoadingOtherInterface,
    setIsLoadingOtherInterface,
  };
};
