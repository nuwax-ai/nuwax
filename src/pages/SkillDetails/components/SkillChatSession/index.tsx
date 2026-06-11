import agentImage from '@/assets/images/agent_image.png';
import { UnifiedChatSession } from '@/components/business-component';
import { dict } from '@/services/i18nRuntime';
import { AgentTypeEnum } from '@/types/enums/space';
import type { SkillDetailInfo } from '@/types/interfaces/skill';
import React, { useEffect, useMemo, useState } from 'react';
import { history, useLocation, useModel } from 'umi';

export interface SkillChatSessionProps {
  conversationId?: number;
  skillInfo?: SkillDetailInfo | null;
  selectedComputerId?: string;
  onChangeSelectedComputerId?: (id: string) => void;
}

const SkillChatSession: React.FC<SkillChatSessionProps> = ({
  conversationId,
  skillInfo,
  selectedComputerId,
  onChangeSelectedComputerId,
}) => {
  const location = useLocation() as any;

  // 是否锁定电脑选择（仅在带有 selectedComputerId 且为 PUSH 跳转时生效）
  const [isSelectionLocked, setIsSelectionLocked] = useState<boolean>(false);

  // 模型ID
  const [selectedModelId, setSelectedModelId] = useState<number>(
    (location.state as any)?.modelId,
  );

  const {
    conversationInfo,
    messageList,
    chatSuggestList,
    runQueryConversation,
    loadingConversation,
    onMessageSend,
    messageViewRef,
    isConversationActive,
    isMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
    resetInit,
    manualComponents,
  } = useModel('conversationInfo');

  // 获取有效的云电脑 ID（逻辑对齐 ConversationAgent）
  const getEffectiveSandboxId = (info: any = conversationInfo) => {
    try {
      // 优先级 1: 手动选择 (selectedComputerId)
      if (selectedComputerId) {
        return selectedComputerId;
      }

      // 优先级 2: 兜底从 location.state 获取 (仅 PUSH 跳转)
      if (
        history.action === 'PUSH' &&
        (location.state as any)?.selectedComputerId
      ) {
        return (location.state as any).selectedComputerId;
      }

      // 优先级 3: 个人电脑 (sandboxId)
      if (info?.agent?.sandboxId) {
        return info.agent.sandboxId;
      }

      // 优先级 4: 共享电脑 (sandboxServerId)
      const sandboxServerId = info?.sandboxServerId;
      if (sandboxServerId) {
        return String(sandboxServerId);
      }

      return '';
    } catch {
      return selectedComputerId;
    }
  };

  const finalSelectedComputerId = useMemo(() => {
    return getEffectiveSandboxId();
  }, [selectedComputerId, conversationInfo, history.action, location.state]);

  // 同步初始化状态并锁定
  useEffect(() => {
    const isPushWithComputer =
      history.action === 'PUSH' &&
      !!(location.state as any)?.selectedComputerId;
    if (isPushWithComputer) {
      setIsSelectionLocked(true);
    } else {
      setIsSelectionLocked(false);
    }
  }, [history.action, location.key]);

  // 初始化查询会话信息与历史消息
  useEffect(() => {
    if (conversationId) {
      runQueryConversation(conversationId);
    }

    return () => {
      // 组件卸载时重置全局会话状态，防止污染其他页面
      resetInit();
    };
  }, [conversationId]);

  // 角色信息（名称、头像）
  const roleInfo = useMemo(() => {
    const agent = conversationInfo?.agent;
    const defaultName = skillInfo?.name || '';
    const defaultAvatar = skillInfo?.icon || (agentImage as string);
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
  }, [conversationInfo, skillInfo]);

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
      infos: manualComponents,
      variableParams: undefined,
      sandboxId: finalSelectedComputerId || '-1',
      skillIds,
      modelId: modelId || selectedModelId,
      agentMode: agentMode || 'yolo',
    });
  };

  const agentName = conversationInfo?.agent?.name || skillInfo?.name || '';
  const agentIcon =
    conversationInfo?.agent?.icon || skillInfo?.icon || (agentImage as string);

  console.log('selectedComputerId', selectedComputerId);

  return (
    <UnifiedChatSession
      conversationId={conversationId}
      messageList={messageList}
      roleInfo={roleInfo}
      isLoading={loadingConversation}
      loadingMore={loadingMore}
      isMoreMessage={isMoreMessage}
      isConversationActive={isConversationActive}
      messageBottomMode="chat"
      loadingSuggest={false}
      chatSuggestList={chatSuggestList as string[]}
      agentInfo={{
        id: conversationInfo?.agentId || conversationInfo?.agent?.agentId,
        name: agentName,
        icon: agentIcon,
        type: (conversationInfo?.agent?.type || AgentTypeEnum.ChatBot) as any,
        openingChatMsg: conversationInfo?.agent?.openingChatMsg,
        guidQuestionDtos: conversationInfo?.agent?.guidQuestionDtos,
        sandboxId: finalSelectedComputerId,
      }}
      chatInputProps={{
        isTaskAgentActive: true, // 强制开启云电脑选择器
      }}
      // 允许切换模型
      allowOtherModel={conversationInfo?.agent?.allowOtherModel}
      selectedModelId={selectedModelId}
      onModelSelect={setSelectedModelId}
      isSelectionLocked={isSelectionLocked}
      manualComponents={manualComponents}
      selectedComputerId={finalSelectedComputerId}
      onComputerSelect={(id) => {
        onChangeSelectedComputerId?.(id);
      }}
      onSendMessage={handleSendMessage}
      onLoadMoreMessage={handleLoadMoreMessage}
      // 允许选择技能模型
      enableMention={true}
      placeholder={dict(
        'PC.Components.ChatInputHomeMentionEditor.placeholderWithoutMention',
      )}
      messageViewRef={messageViewRef}
    />
  );
};

export default SkillChatSession;
