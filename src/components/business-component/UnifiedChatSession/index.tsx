import {
  AgentInterventionChatLayer,
  type AgentMode,
  useAgentInterventionLayer,
} from '@/components/business-component/AgentIntervention';
import { useActiveInterventionQueue } from '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue';
import MessageQueuePanel, {
  useUnifiedChatQueue,
} from '@/components/business-component/MessageQueue';
import { registerOpenUiActionSender } from '@/components/business-component/OpenUiArtifactView/actionRegistry';
import { buildOpenUiResumeMessage } from '@/components/business-component/OpenUiArtifactView/openUiResumeMessage';
import ConversationStatus from '@/pages/Chat/components/ConversationStatus';
import classNames from 'classnames';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { ENABLE_CHAT_MESSAGE_QUEUE } from '@/constants/feature.constants';
import { selectConversationSessionView } from '@/features/conversation/domain/sessionView';
import { dict } from '@/services/i18nRuntime';
import { DefaultSelectedEnum, TaskStatus } from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { RoleInfo } from '@/types/interfaces/conversationInfo';
import type {
  OpenUiAction,
  OpenUiActionArtifact,
} from '@/types/interfaces/openUi';
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
  isAwaitingChatTerminal = false,
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
  showClearIcon = true,
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
  voiceInputMock = false,
  chatInputProps,
  queueMinConsumeInterval,
  queueContext,
  sessionView,

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
  waitForHistoryUserBeforeResume,
  resumeDebugSource,
  onConversationSnapshot,
  onTerminalTaskStatus,
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
    isAwaitingChatTerminal,
    messageList,
    reloadHistoryAsync: onReloadConversationHistoryAsync,
    waitForHistoryUserBeforeResume,
    resumeDebugSource,
    resumeStream: onResumeConversationStream,
    abortSub: onAbortResumeStream,
    onConversationSnapshot,
    onTerminalTaskStatus,
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
  /** 是否渲染队列面板区域（用于测量高度，上移滚到底部按钮） */
  const showQueuePanel = ENABLE_CHAT_MESSAGE_QUEUE && !hasPendingIntervention;

  // 消息队列：会话活跃时消息入队，空闲时自动消费（逻辑收敛于 hook）。
  // 队列上下文默认以自身 props 构造（主入口数据由页面注入），不再读全局 model；
  // 隔离入口（预览 Tab）显式传入 queueContext 覆盖，避免与主聊天串扰。
  const messageQueue = useUnifiedChatQueue({
    conversationId,
    messageList,
    selectedModelId,
    agentModeRef,
    onSendMessage,
    minConsumeInterval: queueMinConsumeInterval,
    hasPendingIntervention,
    queueContext: queueContext ?? {
      streamActive: isLocallyStreaming ?? isConversationActive,
      taskExecuting: conversationInfo?.taskStatus === TaskStatus.EXECUTING,
    },
  });

  // Facade sessionView（方案 §6.4）：入口注入的语义化视图优先；未注入时以现有
  // props 内部派生（兼容并存）。内部派生不含 resumeSubscribed（sub 订阅态在
  // useConversationStreamResume 内部，其轮询门禁自持真实值）。
  const session = useMemo(
    () =>
      sessionView ??
      selectConversationSessionView({
        conversationId,
        modelStreamActive: isLocallyStreaming ?? isConversationActive,
        awaitingChatTerminal: isAwaitingChatTerminal,
        taskStatus: conversationInfo?.taskStatus,
        messageList,
        hasQueuedMessages: messageQueue.hasQueuedMessages,
        hasPendingIntervention,
      }),
    [
      sessionView,
      conversationId,
      isLocallyStreaming,
      isConversationActive,
      isAwaitingChatTerminal,
      conversationInfo?.taskStatus,
      messageList,
      messageQueue.hasQueuedMessages,
      hasPendingIntervention,
    ],
  );

  // 滚到底部按钮需避开队列面板：测量队列区域高度写入 CSS 变量
  const sessionContainerRef = useRef<HTMLDivElement>(null);
  const chatInputContainerRef = useRef<HTMLDivElement>(null);
  const queuePanelMeasureRef = useRef<HTMLDivElement>(null);

  // 审批卡片的可用高度需要扣除输入框，避免输入框变高后覆盖卡片底部。
  useLayoutEffect(() => {
    const sessionContainer = sessionContainerRef.current;
    const inputContainer = chatInputContainerRef.current;
    if (!sessionContainer || !inputContainer) return;

    const update = () => {
      sessionContainer.style.setProperty(
        '--chat-input-height',
        `${inputContainer.offsetHeight}px`,
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(inputContainer);
    return () => {
      observer.disconnect();
      sessionContainer.style.removeProperty('--chat-input-height');
    };
  }, []);

  useLayoutEffect(() => {
    const container = chatInputContainerRef.current;
    if (!container) return;

    const setQueueHeight = (height: number) => {
      container.style.setProperty('--queue-panel-height', `${height}px`);
    };

    if (!showQueuePanel) {
      setQueueHeight(0);
      return;
    }

    const measureEl = queuePanelMeasureRef.current;
    if (!measureEl) {
      setQueueHeight(0);
      return;
    }

    const update = () => setQueueHeight(measureEl.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(measureEl);
    return () => {
      observer.disconnect();
      setQueueHeight(0);
    };
  }, [showQueuePanel, messageQueue.hasQueuedMessages]);

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
    agentId: agentInfo?.id,
    messageList,
    initialAgentMode,
    allowChooseMode: agentInfo?.allowChooseMode,
    onSendMessage: (msg, files) => messageQueue.rawSend(msg, files),
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

  /**
   * 「智能体正在执行，请稍等」仅在后端 taskStatus=EXECUTING 且流式已结束时展示。
   * 不用 isConversationActive：队列自动发送会乐观置活跃，末条仍为 Complete 时会误显示。
   * 语义统一由 session 视图提供（§5.6：页面不再用原始字段重新推导）。
   */
  const showTaskExecutingWait = session.shouldShowTaskWait;

  /**
   * 会话 suggest 仅在整轮结束且队列已排空时展示。
   * 队列自动消费下一条时，上一轮 suggest 若仍挂在底部会与新一轮消息割裂成两块。
   */
  const shouldShowSessionSuggest = session.shouldShowSuggest;

  /** Agent 模式选择器：由智能体 allowChooseMode 配置控制 */
  const showAgentModeSelector = useMemo(
    () => agentInfo?.allowChooseMode === DefaultSelectedEnum.Yes,
    [agentInfo?.allowChooseMode],
  );

  const respondOpenUiAction = useMemo(
    () => (artifact: OpenUiActionArtifact, action: OpenUiAction) => {
      messageQueue.rawSend(buildOpenUiResumeMessage(artifact, action));
    },
    [messageQueue.rawSend],
  );

  useEffect(
    () =>
      conversationId === undefined
        ? undefined
        : registerOpenUiActionSender(conversationId, respondOpenUiAction),
    [conversationId, respondOpenUiAction],
  );

  return (
    <div
      ref={sessionContainerRef}
      className={cx(styles['session-container'], className)}
      style={style}
    >
      {/* 核心聊天展现内容区 */}
      <ChatContentArea
        conversationId={conversationId}
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
      <div
        ref={chatInputContainerRef}
        className={cx(styles['chat-input-container'])}
      >
        {/* 待发送消息队列面板：功能开关关闭或有待处理 intervention 时隐藏；
            外层测量容器供滚到底部按钮按队列高度上移 */}
        {showQueuePanel && (
          <div
            ref={queuePanelMeasureRef}
            className={cx(styles['queue-panel-measure'])}
          >
            <MessageQueuePanel
              queue={messageQueue.queue}
              onSendNow={messageQueue.sendNow}
              onDelete={messageQueue.deleteQueued}
              onEdit={messageQueue.handleEditQueued}
              onClear={messageQueue.clearQueue}
              onReorder={messageQueue.reorder}
            />
          </div>
        )}
        <ChatInputHomeIndependent
          key={`chat-input-${conversationId}`}
          clearDisabled={!messageList?.length}
          onEnter={handleMessageSend}
          onClear={onClear}
          wholeDisabled={
            inputDisabled || chatInputDisabled || hasPendingIntervention
          }
          visible={scrollBtnVisible && isHoveringChat}
          clearLoading={clearLoading}
          showClearIcon={showClearIcon}
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
          voiceInputMock={voiceInputMock}
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
