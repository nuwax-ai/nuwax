import type { AgentMode } from '@/components/business-component/AgentIntervention';
import useConversation from '@/hooks/useConversation';
import { dict } from '@/services/i18nRuntime';
import { ExpandPageAreaEnum, TaskStatus } from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  AgentConfigInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { RoleInfo } from '@/types/interfaces/conversationInfo';
import cloneDeep from 'lodash/cloneDeep';
import { useCallback, useMemo } from 'react';
import { useModel } from 'umi';

export interface UseConversationAgentChatSessionOptions {
  /** 当前智能体 ID */
  agentId: number;
  /** 智能体配置（开场白、模型权限等） */
  agentConfigInfo?: AgentConfigInfo;
  /** 更新智能体配置（清空会话后同步 devConversationId） */
  onAgentConfigInfo?: (info: AgentConfigInfo) => void;
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
    onAgentConfigInfo,
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
    setMessageList,
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
    setIsMoreMessage,
    setIsLoadingConversation,
    setIsLoadingOtherInterface,
    isLoadingOtherInterface,
    handleClearSideEffect,
    runQueryConversation,
    clearFilePanelInfo,
    isConversationActive: agentStreamActive,
    // 停止会话相关
    runStopConversation,
    loadingStopConversation,
    disabledConversationActive,
    // 当前会话 ID 与请求 ID
    getCurrentConversationId,
    getCurrentConversationRequestId,
  } = useModel('conversationAgent');

  const { hidePagePreview, showPagePreview } = useModel('chat');
  const { runAsyncConversationCreate } = useConversation();

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

  /**
   * 清空会话记录并创建新的开发会话
   */
  const handleClear = useCallback(async () => {
    handleClearSideEffect();
    // 重置是否还有更多消息
    setIsMoreMessage(false);
    // 清除文件面板信息, 并关闭文件面板
    clearFilePanelInfo();
    // 清空消息列表
    setMessageList([]);
    // 重置加载状态
    setIsLoadingConversation(false);

    try {
      setIsLoadingOtherInterface(true);
      // 创建智能体会话(智能体编排页面devMode为true)
      const { success, data } = await runAsyncConversationCreate({
        agentId,
        devMode: true,
      });

      if (success) {
        // 点击刷子时,智能体要"重置",默认有打开页面就返回到默认首页,默认没有打开页面,则把页面收起来
        const agent = data?.agent || {};
        const expandPageArea = agent.expandPageArea;
        const pageHomeIndex = agent.pageHomeIndex;
        if (expandPageArea === ExpandPageAreaEnum.No) {
          hidePagePreview();
        } else {
          showPagePreview({
            uri: pageHomeIndex,
            params: {},
          });
        }

        const id = data?.id;
        if (agentConfigInfo && id) {
          // 更新智能体配置信息
          const _agentConfigInfo = cloneDeep(
            agentConfigInfo,
          ) as AgentConfigInfo;
          _agentConfigInfo.devConversationId = id;
          onAgentConfigInfo?.(_agentConfigInfo);
        }
        if (id) {
          // 查询会话
          await runQueryConversation(id);
        }
      }
    } finally {
      setIsLoadingOtherInterface(false);
    }
  }, [
    agentId,
    agentConfigInfo,
    onAgentConfigInfo,
    handleClearSideEffect,
    setIsMoreMessage,
    clearFilePanelInfo,
    setMessageList,
    setIsLoadingConversation,
    setIsLoadingOtherInterface,
    runAsyncConversationCreate,
    hidePagePreview,
    showPagePreview,
    runQueryConversation,
  ]);

  const enableMention =
    agentConfigInfo?.type === AgentTypeEnum.TaskAgent &&
    agentConfigInfo?.allowAtSkill === 1;

  const agentTaskExecuting =
    conversationInfo?.taskStatus === TaskStatus.EXECUTING;

  return {
    conversationId: devConversationId,
    messageList,
    roleInfo,
    isLoading: loadingConversation,
    loadingMore,
    isMoreMessage,
    isConversationActive: agentTaskExecuting,
    queueContext: {
      streamActive: agentStreamActive,
      taskExecuting: agentTaskExecuting,
      runStopConversation: (id: number | string) => {
        void runStopConversation(String(id));
      },
    },
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
    onClear: handleClear,
    clearLoading: isLoadingOtherInterface,
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
      streamActiveOverride: agentStreamActive,
      taskExecutingOverride: agentTaskExecuting,
      stopConversationIdOverride: devConversationId,
      onStopConversationOverride: (id: number | string) => {
        void runStopConversation(String(id));
      },
      loadingStopConversationOverride: loadingStopConversation,
      onDisabledStreamActiveOverride: disabledConversationActive,
    },
    // 停止会话相关数据，供独立版输入组件使用（全部来自 conversationAgent model）
    runStopConversation,
    loadingStopConversation,
    getCurrentConversationId,
    getCurrentConversationRequestId,
    disabledConversationActive,
    loadingConversation,
    isLoadingOtherInterface,
    conversationInfo,
  };
}
