import agentImage from '@/assets/images/agent_image.png';
import { UnifiedChatSession } from '@/components/business-component';
import { dict } from '@/services/i18nRuntime';
import { AgentTypeEnum } from '@/types/enums/space';
import type { PluginInfo } from '@/types/interfaces/plugin';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';

export interface PluginChatSessionProps {
  conversationId?: number;
  pluginInfo?: PluginInfo | null;
}

const PluginChatSession: React.FC<PluginChatSessionProps> = ({
  conversationId = 1552195,
  pluginInfo,
}) => {
  const [loadingAsync, setLoadingAsync] = useState<boolean>(true);

  const {
    conversationInfo,
    messageList,
    chatSuggestList,
    runAsync,
    onMessageSend,
    messageViewRef,
    isConversationActive,
    isMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
    resetInit,
    handleClearSideEffect,
    setMessageList,
    setIsMoreMessage,
  } = useModel('conversationInfo');

  // 初始化查询会话信息与历史消息
  useEffect(() => {
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
      infos: [],
      variableParams: undefined,
      sandboxId: '-1',
      skillIds,
      modelId,
      agentMode: agentMode || 'yolo',
    });
  };

  // 清除会话记录
  const handleClear = async () => {
    setMessageList([]);
    setIsMoreMessage(false);
    handleClearSideEffect();
  };

  const agentName = conversationInfo?.agent?.name || pluginInfo?.name || '';
  const agentIcon =
    conversationInfo?.agent?.icon || pluginInfo?.icon || (agentImage as string);

  return (
    <UnifiedChatSession
      conversationId={conversationId}
      messageList={messageList}
      roleInfo={roleInfo}
      isLoading={loadingAsync}
      loadingMore={loadingMore}
      isMoreMessage={isMoreMessage}
      isConversationActive={isConversationActive}
      messageBottomMode="chat"
      loadingSuggest={false}
      chatSuggestList={chatSuggestList as string[]}
      agentInfo={{
        id: conversationInfo?.agent?.targetId,
        name: agentName,
        icon: agentIcon,
        type: (conversationInfo?.agent?.type || AgentTypeEnum.ChatBot) as any,
        openingChatMsg: conversationInfo?.agent?.openingChatMsg,
        guidQuestionDtos: conversationInfo?.agent?.guidQuestionDtos,
      }}
      onSendMessage={handleSendMessage}
      onClear={handleClear}
      onLoadMoreMessage={handleLoadMoreMessage}
      readonly={false}
      enableMention={false}
      placeholder={dict(
        'PC.Components.ChatInputHomeMentionEditor.placeholderWithoutMention',
      )}
      messageViewRef={messageViewRef}
    />
  );
};

export default PluginChatSession;
