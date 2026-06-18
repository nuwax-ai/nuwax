import agentImage from '@/assets/images/agent_image.png';
import { UnifiedChatSession } from '@/components/business-component';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type { PluginInfo } from '@/types/interfaces/plugin';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useModel } from 'umi';

export interface PluginChatSessionProps {
  conversationId?: number;
  pluginInfo?: PluginInfo | null;
}

const PluginChatSession: React.FC<PluginChatSessionProps> = ({
  conversationId,
  pluginInfo,
}) => {
  const location = useLocation();
  const [loadingAsync, setLoadingAsync] = useState<boolean>(true);
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<number>();
  const [selectedComponentList, setSelectedComponentList] = useState<any[]>([]);
  const hasAutoSentRef = useRef(false);

  const {
    conversationInfo,
    messageList,
    chatSuggestList,
    runAsync,
    onMessageSend,
    messageViewRef,
    isMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
    resetInit,
    // 停止会话相关
    runStopConversation,
    loadingStopConversation,
    getCurrentConversationId,
    getCurrentConversationRequestId,
    disabledConversationActive,
    // 加载状态
    loadingConversation,
    isLoadingOtherInterface,
  } = useModel('conversationInfo');

  // 1. 初始化回显从外部跳转传递过来的信息
  useEffect(() => {
    const state = (location.state || (history as any).location?.state) as any;
    if (state) {
      if (state.modelId) setSelectedModelId(state.modelId);
      if (state.selectedComputerId)
        setSelectedComputerId(state.selectedComputerId);
      if (state.infos) setSelectedComponentList(state.infos);
    }
  }, [location.state]);

  // 2. 刷新页面时从接口返回的历史会话中做回显
  useEffect(() => {
    if (conversationInfo) {
      if (!selectedComputerId) {
        const sandboxId =
          conversationInfo?.agent?.sandboxId ||
          conversationInfo?.sandboxServerId ||
          '';
        if (sandboxId) setSelectedComputerId(String(sandboxId));
      }
      if (!selectedModelId) {
        const modelId =
          conversationInfo?.modelId ||
          conversationInfo?.agent?.modelComponentConfig?.targetId;
        if (modelId) setSelectedModelId(modelId);
      }
      if (!selectedComponentList?.length) {
        const infos =
          conversationInfo?.infos ||
          conversationInfo?.agent?.manualComponents ||
          [];
        if (infos?.length) setSelectedComponentList(infos);
      }
    }
  }, [conversationInfo]);

  // 3. 进入页面携带首条消息自动触发发送会话
  useEffect(() => {
    if (hasAutoSentRef.current) return;
    if (conversationId && conversationInfo) {
      const state = (location.state || (history as any).location?.state) as any;
      if (
        state &&
        (state.message?.trim() || state.files?.length || state.skillIds?.length)
      ) {
        const list = conversationInfo?.messageList || [];
        const len = list?.length || 0;
        // 会话消息列表为空或者只有一条消息且其为 ASSISTANT（开场白）时，可以自动发送
        const isCanMessage =
          !len || (len === 1 && list[0].messageType === 'ASSISTANT');

        if (isCanMessage) {
          hasAutoSentRef.current = true;
          onMessageSend({
            id: conversationId,
            messageInfo: state.message || '',
            files: state.files || [],
            infos: state.infos || [],
            sandboxId: String(selectedComputerId || '-1'),
            debug: true,
            isSync: false,
            skillIds: state.skillIds || [],
            modelId: selectedModelId,
            agentMode: state.agentMode || 'yolo',
            data: conversationInfo,
          });
        } else {
          hasAutoSentRef.current = true;
        }
      }
    }
  }, [
    conversationId,
    conversationInfo,
    onMessageSend,
    location.state,
    selectedComputerId,
    selectedModelId,
  ]);

  // 初始化查询会话信息与历史消息
  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    const loadConversation = async () => {
      try {
        setLoadingAsync(true);
        await runAsync(conversationId);
      } catch (error) {
        console.error('Failed to load conversation info:', error);
      } finally {
        if (active) {
          setLoadingAsync(false);
        }
      }
    };

    loadConversation();

    return () => {
      active = false;
      // 组件卸载时重置全局会话状态，防止污染其他页面
      resetInit();
    };
  }, [conversationId]);

  // 角色信息（名称、头像）
  const roleInfo = useMemo(() => {
    const agent = conversationInfo?.agent;
    const defaultName = pluginInfo?.name || '';
    const defaultAvatar = pluginInfo?.icon || (agentImage as string);
    return {
      assistant: {
        name: (agent?.name || defaultName) as string,
        avatar: (agent?.icon || defaultAvatar) as string,
      },
      system: {
        name: (agent?.name || defaultName) as string,
        avatar: (agent?.icon || defaultAvatar) as string,
      },
    };
  }, [conversationInfo, pluginInfo]);

  // 消息发送
  const handleSendMessage = (
    messageInfo: string,
    files: any[] = [],
    skillIds: number[] = [],
    modelId?: number,
    agentMode?: string,
  ) => {
    onMessageSend({
      id: conversationId,
      messageInfo,
      files,
      infos: selectedComponentList || [],
      variableParams: undefined,
      sandboxId: String(selectedComputerId || '-1'),
      skillIds,
      modelId: modelId || selectedModelId,
      agentMode: agentMode || 'yolo',
    });
  };

  return (
    <UnifiedChatSession
      conversationId={conversationId}
      messageList={messageList}
      roleInfo={roleInfo}
      isLoading={loadingAsync}
      loadingMore={loadingMore}
      isMoreMessage={isMoreMessage}
      isConversationActive={
        conversationInfo?.taskStatus === TaskStatus.EXECUTING
      }
      messageBottomMode="chat"
      loadingSuggest={false}
      chatSuggestList={chatSuggestList as string[]}
      agentInfo={{
        id: conversationInfo?.agent?.agentId,
        name: conversationInfo?.agent?.name,
        icon: conversationInfo?.agent?.icon,
        type: (conversationInfo?.agent?.type || AgentTypeEnum.ChatBot) as any,
        openingChatMsg: conversationInfo?.agent?.openingChatMsg,
        guidQuestionDtos: conversationInfo?.agent?.guidQuestionDtos,
      }}
      onSendMessage={handleSendMessage}
      onLoadMoreMessage={handleLoadMoreMessage}
      initialAgentMode={(location.state as any)?.agentMode}
      readonly={false}
      enableMention={true}
      allowOtherModel={conversationInfo?.agent?.allowOtherModel}
      selectedComputerId={selectedComputerId}
      onComputerSelect={setSelectedComputerId}
      selectedModelId={selectedModelId}
      onModelSelect={setSelectedModelId}
      selectedComponentList={selectedComponentList}
      onSelectComponent={setSelectedComponentList}
      placeholder={dict(
        'PC.Components.ChatInputHomeMentionEditor.placeholderWithoutMention',
      )}
      messageViewRef={messageViewRef}
      // 原 conversationInfo model 数据，传给独立版输入组件
      runStopConversation={runStopConversation}
      loadingStopConversation={loadingStopConversation}
      getCurrentConversationId={getCurrentConversationId}
      getCurrentConversationRequestId={getCurrentConversationRequestId}
      disabledConversationActive={disabledConversationActive}
      loadingConversation={loadingConversation}
      isLoadingOtherInterface={isLoadingOtherInterface}
      conversationInfo={conversationInfo}
    />
  );
};

export default PluginChatSession;
