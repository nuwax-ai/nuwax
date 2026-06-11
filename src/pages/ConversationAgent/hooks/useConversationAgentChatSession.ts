import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  AgentConfigInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { RoleInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useMemo } from 'react';
import { useModel } from 'umi';

export interface UseConversationAgentChatSessionOptions {
  /** 当前智能体 ID */
  agentId: number;
  /** 智能体配置（开场白、模型权限等） */
  agentConfigInfo?: AgentConfigInfo;
  /** 当前选中的沙箱电脑 ID */
  selectedComputerId?: string;
  /** 沙箱选择变更回调 */
  onChangeSelectedComputerId?: (id: string) => void;
  /** 当前选中的模型 ID */
  selectedModelId?: number;
  /** 模型选择变更回调 */
  onModelSelect?: (modelId: number) => void;
  /** 已选工具/组件列表（发送消息时附带） */
  selectedComponentList?: AgentSelectedComponentInfo[];
  /** 选择/取消选择组件 */
  onSelectComponent?: (comp: AgentSelectedComponentInfo) => void;
  /** 是否锁定沙箱选择 */
  isSelectionLocked?: boolean;
}

/**
 * ConversationAgent 页面聊天会话 Hook
 * 所有会话数据与方法均来自 conversationAgent model，与 conversationInfo 完全隔离
 */
export function useConversationAgentChatSession(
  options: UseConversationAgentChatSessionOptions,
) {
  const {
    agentId,
    agentConfigInfo,
    selectedComputerId = '',
    onChangeSelectedComputerId,
    selectedModelId,
    onModelSelect,
    selectedComponentList,
    onSelectComponent,
    isSelectionLocked = false,
  } = options;

  const {
    conversationInfo,
    messageList,
    chatSuggestList,
    loadingConversation,
    loadingMore,
    isMoreMessage,
    loadingSuggest,
    onMessageSend,
    manualComponents,
    handleLoadMoreMessage,
    messageViewRef,
    showScrollBtn,
  } = useModel('conversationAgent');

  const roleInfo: RoleInfo = useMemo(
    () => ({
      assistant: {
        name: agentConfigInfo?.name as string,
        avatar: agentConfigInfo?.icon as string,
      },
      system: {
        name: agentConfigInfo?.name as string,
        avatar: agentConfigInfo?.icon as string,
      },
    }),
    [agentConfigInfo?.name, agentConfigInfo?.icon],
  );

  const devConversationId = agentConfigInfo?.devConversationId;

  const handleSendMessage = useCallback(
    (
      messageInfo: string,
      files?: UploadFileInfo[],
      skillIds?: number[],
      modelId?: number,
      selectedAgentMode?: AgentMode,
    ) => {
      if (!devConversationId) {
        return;
      }

      const effectiveSandboxId = String(
        selectedComputerId ||
          conversationInfo?.sandboxServerId ||
          conversationInfo?.agent?.sandboxId ||
          '',
      );

      onMessageSend({
        id: devConversationId,
        messageInfo,
        files,
        infos: selectedComponentList ?? manualComponents,
        sandboxId: effectiveSandboxId,
        debug: true,
        isSync: false,
        skillIds,
        modelId: modelId || selectedModelId,
        agentMode: selectedAgentMode,
      });
    },
    [
      devConversationId,
      conversationInfo?.sandboxServerId,
      conversationInfo?.agent?.sandboxId,
      selectedComputerId,
      selectedComponentList,
      manualComponents,
      onMessageSend,
      selectedModelId,
    ],
  );

  const enableMention =
    agentConfigInfo?.type === AgentTypeEnum.TaskAgent &&
    agentConfigInfo?.allowAtSkill === 1;

  return {
    conversationId: devConversationId,
    messageList,
    roleInfo,
    isLoading: loadingConversation,
    loadingMore,
    isMoreMessage,
    isConversationActive: conversationInfo?.taskStatus === TaskStatus.EXECUTING,
    messageBottomMode: 'chat' as const,
    loadingSuggest,
    chatSuggestList,
    agentInfo: {
      id: agentId,
      name: agentConfigInfo?.name,
      icon: agentConfigInfo?.icon,
      type: agentConfigInfo?.type,
      openingChatMsg: agentConfigInfo?.openingChatMsg,
      guidQuestionDtos: agentConfigInfo?.guidQuestionDtos,
      eventBindConfig: agentConfigInfo?.eventBindConfig,
      hasPermission: conversationInfo?.agent?.hasPermission,
      sandboxId: conversationInfo?.agent?.sandboxId,
    },
    allowOtherModel: agentConfigInfo?.allowOtherModel,
    selectedModelId,
    onModelSelect,
    isSelectionLocked,
    onSendMessage: handleSendMessage,
    onLoadMoreMessage: handleLoadMoreMessage,
    manualComponents,
    selectedComponentList,
    onSelectComponent,
    selectedComputerId,
    onComputerSelect: (id: string) => {
      onChangeSelectedComputerId?.(id);
    },
    showScrollBtn,
    messageViewRef,
    enableMention,
    placeholder: enableMention
      ? dict('PC.Components.ChatInputHomeMentionEditor.placeholderWithMention')
      : dict(
          'PC.Components.ChatInputHomeMentionEditor.placeholderWithoutMention',
        ),
    chatInputProps: {
      fixedSelection: true,
      agentSandboxId: conversationInfo?.agent?.sandboxId,
    },
  };
}
