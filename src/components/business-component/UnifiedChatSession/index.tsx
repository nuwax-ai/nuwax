import {
  AgentInterventionChatLayer,
  type AgentMode,
  useAgentInterventionLayer,
} from '@/components/business-component/AgentIntervention';
import { useActiveInterventionQueue } from '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue';
import MessageQueuePanel, {
  useUnifiedChatQueue,
} from '@/components/business-component/MessageQueue';
import ConversationStatus from '@/pages/Chat/components/ConversationStatus';
import classNames from 'classnames';
import { useMemo, useRef } from 'react';

import { ENABLE_CHAT_MESSAGE_QUEUE } from '@/constants/feature.constants';
import { dict } from '@/services/i18nRuntime';
import { DefaultSelectedEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { AgentTypeEnum } from '@/types/enums/space';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { RoleInfo } from '@/types/interfaces/conversationInfo';
import ChatContentArea from './components/ChatContentArea';
import ChatInputHomeIndependent from './components/ChatInputHomeIndependent';
import { useConversationStreamResume } from './hooks/useConversationStreamResume';
import { useLoadMoreHistory } from './hooks/useLoadMoreHistory';
import { useUnifiedChatScroll } from './hooks/useUnifiedChatScroll';

import styles from './index.less';
import type { UnifiedChatSessionProps } from './types';

const cx = classNames.bind(styles);

const DEFAULT_ROLE_INFO: RoleInfo = {
  assistant: { name: 'Assistant', avatar: '' },
  system: { name: 'System', avatar: '' },
};

const UnifiedChatSession: React.FC<UnifiedChatSessionProps> = ({
  conversationId,
  messageList = [],
  roleInfo,
  isLoading = false,
  loadingMore = false,
  isMoreMessage = false,
  isConversationActive = false,
  isLocallyStreaming,
  messageBottomMode = 'home',
  showDebug,
  loadingSuggest = false,
  chatSuggestList = [],
  agentInfo = {},
  initialAgentMode,
  onSendMessage,
  onClear,
  onLoadMoreMessage,
  selectedModelId,
  onModelSelect,
  allowOtherModel,
  manualComponents = [],
  selectedComponentList = [],
  onSelectComponent,
  requiredNameList = [],
  variableParams,
  form,
  variables,
  userFillVariables,
  isVariablesFilled,
  isVariablesDisabled,
  clearLoading = false,
  isSelectionLocked = false,
  hasUserSentMessage = false,
  readonly,
  showAnnouncement,
  mentionPlacement,
  selectedComputerId = '',
  onComputerSelect,

  showScrollBtn = false,
  allowAutoScrollRef,
  scrollTimeoutRef,
  setShowScrollBtn,
  renderMessageItem,
  renderEmptyState,
  enableMention = true,
  placeholder,

  messageViewRef: externalMessageViewRef,
  className,
  style,
  chatInputDisabled = false,
  chatInputProps,
  queueMinConsumeInterval,
  queueContext,

  // 原 ChatInputHome 中 useModel('conversationInfo') 数据
  runStopConversation,
  loadingStopConversation,
  getCurrentConversationId,
  getCurrentConversationRequestId,
  disabledConversationActive,
  loadingConversation,
  isLoadingOtherInterface,
  conversationInfo,
  interventionHandlers,
  // 会话流式恢复(sub)
  onResumeConversationStream,
  onAbortResumeStream,
  onReloadConversationHistoryAsync,
}) => {
  // 滚动管理 Hook
  const {
    messageViewRef,
    scrollBtnVisible,
    isHoveringChat,
    handleSendScrollReset,
    onScrollBottom,
    handleMouseEnter,
    handleMouseLeave,
  } = useUnifiedChatScroll({
    messageList,
    isConversationActive,
    chatSuggestList,
    isLoading,
    loadingMore,
    externalMessageViewRef,
    externalAllowAutoScrollRef: allowAutoScrollRef,
    externalScrollTimeoutRef: scrollTimeoutRef,
    onScrollBtnVisibleChange: setShowScrollBtn,
    showScrollBtn,
  });

  // 历史消息交叉加载 Hook
  const { loadMoreRef } = useLoadMoreHistory({
    conversationId,
    messageList,
    isMoreMessage,
    loadingMore,
    onLoadMoreMessage,
  });

  // 会话流式恢复(sub)：刷新页面 / 新开标签时，重建 EXECUTING 会话的流式输出。
  // action 未注入（如隔离会话源）时整体不启用。轮询仅标签可见时触发，离开页面自动清轮询 + 断 sub。
  useConversationStreamResume({
    conversationId,
    taskStatus: conversationInfo?.taskStatus,
    isLocallyStreaming: isLocallyStreaming ?? isConversationActive,
    messageList,
    reloadHistoryAsync: onReloadConversationHistoryAsync,
    resumeStream: onResumeConversationStream,
    abortSub: onAbortResumeStream,
  });

  const agentModeRef = useRef<AgentMode>('yolo');

  // 角色信息（名称、头像）默认逻辑：优先使用外部传入，其次根据传入的 agentInfo 自适应组装，最后使用 DEFAULT_ROLE_INFO 兜底
  const effectiveRoleInfo = useMemo<RoleInfo>(() => {
    if (roleInfo && roleInfo !== DEFAULT_ROLE_INFO) {
      return roleInfo;
    }
    return {
      assistant: {
        name: (agentInfo?.name as string) || 'Assistant',
        avatar: (agentInfo?.icon as string) || '',
      },
      system: {
        name: (agentInfo?.name as string) || 'System',
        avatar: (agentInfo?.icon as string) || '',
      },
    };
  }, [roleInfo, agentInfo?.name, agentInfo?.icon]);

  // 是否有待处理的 intervention（ask/question/审批）：有则暂停队列消费并隐藏队列面板
  const activeInterventions = useActiveInterventionQueue(messageList);
  const hasPendingIntervention = activeInterventions.length > 0;

  // 消息队列：会话活跃时消息入队，空闲时自动消费（逻辑收敛于 hook）
  const messageQueue = useUnifiedChatQueue({
    conversationId,
    messageList,
    selectedModelId,
    agentModeRef,
    onSendMessage,
    minConsumeInterval: queueMinConsumeInterval,
    hasPendingIntervention,
    queueContext,
  });

  // 消息发送代理：经队列拦截（活跃时入队，否则真正发送）
  const handleMessageSend = (
    messageInfo: string,
    files: UploadFileInfo[] = [],
    skillIds: number[] = [],
    modelId?: number,
    selectedAgentMode?: AgentMode,
  ) => {
    // 用户在会话中发送新提示词：恢复队列自动消费（解除此前主动停止造成的暂停）
    messageQueue.resumeAutoConsume();

    // 发送消息时强制重置自动滚动状态并立即置底
    handleSendScrollReset();

    messageQueue.trySend(
      messageInfo,
      files,
      skillIds,
      modelId,
      selectedAgentMode,
    );
  };

  // 智能体指令介入图层 (ACP/MCP 审批交互)
  // intervention 响应的 resume 消息走 rawSend 绕过队列拦截，避免回复被错误入队
  const interventionLayer = useAgentInterventionLayer({
    conversationId,
    messageList,
    initialAgentMode,
    allowChooseMode: agentInfo?.allowChooseMode,
    onSendMessage: (msg) => messageQueue.rawSend(msg),
    interventionHandlers,
  });
  agentModeRef.current = interventionLayer.agentMode;

  // 输入框是否禁用（表单必填验证）
  const inputDisabled = useMemo(() => {
    if (requiredNameList?.length > 0) {
      if (!variableParams) {
        return true;
      }
      // 判断所填参数是否包含所有必填
      const hasAllRequired = requiredNameList.every(
        (name) =>
          variableParams[name] !== undefined && variableParams[name] !== '',
      );
      return !hasAllRequired;
    }
    return false;
  }, [requiredNameList, variableParams]);

  // 是否有活跃的流式消息（即最后一条消息正在加载或未完成）
  const hasActiveStreamingMessage = useMemo(() => {
    if (!messageList || messageList.length === 0) return false;
    const lastMessage = messageList[messageList.length - 1];
    return (
      lastMessage.status === MessageStatusEnum.Loading ||
      lastMessage.status === MessageStatusEnum.Incomplete
    );
  }, [messageList]);

  /**
   * 「智能体正在执行，请稍等」仅在后端 taskStatus=EXECUTING 且流式已结束时展示。
   * 不用 isConversationActive：队列自动发送会乐观置活跃，末条仍为 Complete 时会误显示。
   */
  const showTaskExecutingWait = useMemo(() => {
    return (
      conversationInfo?.taskStatus === TaskStatus.EXECUTING &&
      !hasActiveStreamingMessage
    );
  }, [conversationInfo?.taskStatus, hasActiveStreamingMessage]);

  /**
   * 会话 suggest 仅在整轮结束且队列已排空时展示。
   * 队列自动消费下一条时，上一轮 suggest 若仍挂在底部会与新一轮消息割裂成两块。
   */
  const shouldShowSessionSuggest = useMemo(() => {
    if (!messageList?.length) {
      return false;
    }
    if (messageQueue.hasQueuedMessages) {
      return false;
    }
    if (isConversationActive) {
      return false;
    }
    return true;
  }, [
    messageList?.length,
    messageQueue.hasQueuedMessages,
    isConversationActive,
  ]);

  /** Agent 模式选择器：由智能体 allowChooseMode 配置控制 */
  const showAgentModeSelector = useMemo(
    () => agentInfo?.allowChooseMode === DefaultSelectedEnum.Yes,
    [agentInfo?.allowChooseMode],
  );

  return (
    <div className={cx(styles['session-container'], className)} style={style}>
      {/* 核心聊天展现内容区 */}
      <ChatContentArea
        messageViewRef={messageViewRef}
        handleMouseEnter={handleMouseEnter}
        handleMouseLeave={handleMouseLeave}
        isLoading={isLoading}
        form={form}
        variables={variables}
        agentInfo={agentInfo}
        userFillVariables={userFillVariables}
        isVariablesFilled={isVariablesFilled}
        isVariablesDisabled={isVariablesDisabled}
        variableParams={variableParams}
        messageList={messageList}
        isMoreMessage={isMoreMessage}
        loadMoreRef={loadMoreRef}
        loadingMore={loadingMore}
        renderMessageItem={renderMessageItem}
        effectiveRoleInfo={effectiveRoleInfo}
        messageBottomMode={messageBottomMode}
        showDebug={showDebug}
        shouldShowSessionSuggest={shouldShowSessionSuggest}
        loadingSuggest={loadingSuggest}
        chatSuggestList={chatSuggestList}
        handleMessageSend={handleMessageSend}
        showTaskExecutingWait={showTaskExecutingWait}
        renderEmptyState={renderEmptyState}
      />

      {/* 会话执行状态栏 */}
      {messageList?.length > 0 &&
        agentInfo?.type === AgentTypeEnum.TaskAgent && (
          <ConversationStatus
            messageList={messageList}
            className={cx(styles['conversation-status-bar'])}
          />
        )}

      {/* 指令介入审批卡片区 */}
      <AgentInterventionChatLayer
        {...interventionLayer.chatLayerProps}
        className={cx(styles['intervention-dock'])}
      />

      {/* 统一会话输入框（使用独立版组件，避免与 conversationInfo model 强耦合） */}
      <div className={cx(styles['chat-input-container'])}>
        {/* 待发送消息队列面板：功能开关关闭或有待处理 intervention 时隐藏 */}
        {ENABLE_CHAT_MESSAGE_QUEUE && !hasPendingIntervention && (
          <MessageQueuePanel
            queue={messageQueue.queue}
            onSendNow={messageQueue.sendNow}
            onDelete={messageQueue.deleteQueued}
            onEdit={messageQueue.handleEditQueued}
            onClear={messageQueue.clearQueue}
            onReorder={messageQueue.reorder}
          />
        )}
        <ChatInputHomeIndependent
          key={`chat-input-${conversationId}`}
          clearDisabled={!messageList?.length}
          onEnter={handleMessageSend}
          onClear={onClear}
          wholeDisabled={inputDisabled || chatInputDisabled}
          visible={scrollBtnVisible && isHoveringChat}
          clearLoading={clearLoading}
          manualComponents={manualComponents}
          selectedComponentList={selectedComponentList}
          onSelectComponent={onSelectComponent}
          onScrollBottom={onScrollBottom}
          isTaskAgentActive={agentInfo?.type === AgentTypeEnum.TaskAgent}
          selectedComputerId={selectedComputerId}
          onComputerSelect={onComputerSelect}
          agentId={agentInfo?.id}
          agentSandboxId={agentInfo?.sandboxId || selectedComputerId}
          hasPermission={agentInfo?.hasPermission !== false}
          maskText={
            agentInfo?.hasPermission !== false
              ? ''
              : dict('PC.Components.ChatInputHome.noAgentPermission')
          }
          fixedSelection={
            !!agentInfo?.sandboxId ||
            isSelectionLocked ||
            hasUserSentMessage ||
            messageList?.some((message) => Boolean(message?.id))
          }
          isPersonalComputer={!!agentInfo?.sandboxId}
          {...interventionLayer.agentModeInputProps}
          showAgentModeSelector={showAgentModeSelector}
          enableMention={enableMention}
          placeholder={placeholder}
          readonly={readonly}
          showAnnouncement={showAnnouncement}
          mentionPlacement={mentionPlacement}
          allowOtherModel={allowOtherModel}
          selectedModelId={selectedModelId}
          onModelSelect={onModelSelect}
          agentType={agentInfo?.type}
          {...chatInputProps}
          // 传入原 conversationInfo model 数据
          runStopConversation={runStopConversation}
          onUserStopConversation={messageQueue.pauseAutoConsume}
          loadingStopConversation={loadingStopConversation}
          getCurrentConversationId={getCurrentConversationId}
          getCurrentConversationRequestId={getCurrentConversationRequestId}
          isConversationActive={isConversationActive}
          disabledConversationActive={disabledConversationActive}
          messageList={messageList}
          loadingConversation={loadingConversation}
          isLoadingOtherInterface={isLoadingOtherInterface}
          conversationInfo={conversationInfo}
        />
      </div>
    </div>
  );
};

export default UnifiedChatSession;
