import AgentChatEmpty from '@/components/AgentChatEmpty';
import {
  AgentInterventionChatLayer,
  type AgentMode,
  useAgentInterventionLayer,
} from '@/components/business-component/AgentIntervention';
import { useActiveInterventionQueue } from '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue';
import MessageQueuePanel, {
  useUnifiedChatQueue,
} from '@/components/business-component/MessageQueue';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import ConversationStatus from '@/pages/Chat/components/ConversationStatus';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { AgentTypeEnum } from '@/types/enums/space';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import ChatInputHomeIndependent from './ChatInputHomeIndependent';

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
  roleInfo = DEFAULT_ROLE_INFO,
  isLoading = false,
  loadingMore = false,
  isMoreMessage = false,
  isConversationActive = false,
  messageBottomMode = 'home',
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
  renderMessageItem,
  renderEmptyState,
  enableMention = true,
  placeholder,

  messageViewRef: externalMessageViewRef,
  className,
  style,
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
}) => {
  const [isHoveringChat, setIsHoveringChat] = useState<boolean>(false);
  const internalMessageViewRef = useRef<HTMLDivElement>(null);
  const messageViewRef = externalMessageViewRef || internalMessageViewRef;
  const allowAutoScrollRef = useRef<boolean>(true);
  const scrollTimeoutRef = useRef<any>(null);
  const [scrollBtnVisible, setScrollBtnVisible] =
    useState<boolean>(showScrollBtn);

  const agentModeRef = useRef<AgentMode>('yolo');

  // 1. 滚动检测逻辑
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setScrollBtnVisible,
  );

  // 2. 向上滚动到顶加载历史消息的 IntersectionObserver 探测器
  const { ref: loadMoreRef, inView: loadMoreInView } = useIntersectionObserver({
    rootMargin: '10px 0px 0px 0px',
    threshold: 0,
  });

  const prevLoadMoreInViewRef = useRef<boolean>(false);
  useEffect(() => {
    const isEntering = loadMoreInView && !prevLoadMoreInViewRef.current;
    prevLoadMoreInViewRef.current = loadMoreInView;

    if (
      isEntering &&
      isMoreMessage &&
      !loadingMore &&
      messageList?.length > 0 &&
      conversationId
    ) {
      onLoadMoreMessage?.(conversationId);
    }
  }, [
    loadMoreInView,
    isMoreMessage,
    loadingMore,
    messageList?.length,
    conversationId,
    onLoadMoreMessage,
  ]);

  // 是否有待处理的 intervention（ask/question/审批）：有则暂停队列消费并隐藏队列面板
  const activeInterventions = useActiveInterventionQueue(messageList);
  const hasPendingIntervention = activeInterventions.length > 0;

  // 3. 消息队列：会话活跃时消息入队，空闲时自动消费（逻辑收敛于 hook）
  const messageQueue = useUnifiedChatQueue({
    conversationId,
    messageList,
    selectedModelId,
    agentModeRef,
    onSendMessage,
    minConsumeInterval: queueMinConsumeInterval,
    hasPendingIntervention,
    loadingSuggest,
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
    messageQueue.trySend(
      messageInfo,
      files,
      skillIds,
      modelId,
      selectedAgentMode,
    );
  };

  // 4. 智能体指令介入图层 (ACP/MCP 审批交互)
  //    intervention 响应的 resume 消息走 rawSend 绕过队列拦截，避免回复被错误入队
  const interventionLayer = useAgentInterventionLayer({
    conversationId,
    messageList,
    initialAgentMode,
    onSendMessage: (msg) => messageQueue.rawSend(msg),
  });
  agentModeRef.current = interventionLayer.agentMode;

  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    const element = messageViewRef.current;
    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
    }
    setScrollBtnVisible(false);
  };

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

  // 大模型流式输出或更新时自动平滑滚动置底
  useEffect(() => {
    if (allowAutoScrollRef.current) {
      const element = messageViewRef.current;
      if (element) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'instant',
        });
      }
    }
  }, [messageList, isConversationActive, chatSuggestList]);

  // 向上滚动加载更多历史消息时的滚动锁定机制
  const lastScrollHeightRef = useRef<number>(0);
  const lastScrollTopRef = useRef<number>(0);
  const prevLoadingMoreRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    const element = messageViewRef.current;
    if (!element) return;

    if (prevLoadingMoreRef.current && !loadingMore) {
      const heightDifference =
        element.scrollHeight - lastScrollHeightRef.current;
      if (heightDifference > 0) {
        element.scrollTop = lastScrollTopRef.current + heightDifference;
      }
    }

    lastScrollHeightRef.current = element.scrollHeight;
    lastScrollTopRef.current = element.scrollTop;
    prevLoadingMoreRef.current = loadingMore || false;
  }, [messageList, loadingMore]);

  return (
    <div className={cx(styles['session-container'], className)} style={style}>
      <div
        className={cx(styles['chat-wrapper-content'], 'scroll-container')}
        ref={messageViewRef}
        onMouseEnter={() => setIsHoveringChat(true)}
        onMouseLeave={() => setIsHoveringChat(false)}
      >
        <div className={cx(styles['chat-wrapper'], 'flex-1')}>
          {isLoading ? (
            <div className={cx(styles['loading-wrapper'])}>
              <LoadingOutlined className={cx(styles['loading-icon'])} />
            </div>
          ) : (
            <>
              {/* 变量参数配置表单 */}
              {form && (
                <NewConversationSet
                  className="mb-16"
                  form={form}
                  variables={variables || agentInfo?.guidQuestionDtos || []}
                  userFillVariables={userFillVariables}
                  isFilled={isVariablesFilled ?? !!variableParams}
                  disabled={isVariablesDisabled}
                />
              )}

              {messageList?.length > 0 ? (
                <>
                  {/* 加载历史消息的触发探测节点 */}
                  {isMoreMessage &&
                    (messageList?.length || 0) >= MESSAGE_PAGE_SIZE && (
                      <div
                        ref={loadMoreRef}
                        className={cx(styles['load-more-container'])}
                      >
                        {loadingMore ? (
                          <span>
                            <LoadingOutlined style={{ marginRight: 8 }} />
                            {dict('PC.Pages.Chat.loadingHistoryConversation')}
                          </span>
                        ) : null}
                      </div>
                    )}

                  {/* 消息渲染列表 */}
                  {messageList?.map((item: MessageInfo, idx: number) => {
                    const isLastMessage = idx === messageList.length - 1;
                    if (renderMessageItem) {
                      return renderMessageItem(item, isLastMessage);
                    }
                    return (
                      <ChatView
                        key={`${item.id}-${item?.index || idx}`}
                        messageInfo={item}
                        roleInfo={roleInfo}
                        mode={messageBottomMode}
                        showStatusDesc={
                          agentInfo?.type !== AgentTypeEnum.TaskAgent
                        }
                      />
                    );
                  })}

                  {/* 问题建议：仅会话空闲且队列已排空时展示，避免与队列中的下一轮消息割裂 */}
                  {shouldShowSessionSuggest && (
                    <RecommendList
                      className={cx(styles['recommend-list-box'])}
                      loading={loadingSuggest}
                      chatSuggestList={chatSuggestList}
                      onClick={handleMessageSend}
                    />
                  )}

                  {/* 通用型智能体：后台任务执行中且流式已结束 */}
                  {showTaskExecutingWait && (
                    <div className={cx(styles['task-executing-container'])}>
                      <LoadingOutlined />
                      <span>{dict('PC.Pages.Chat.agentExecutingWait')}</span>
                    </div>
                  )}
                </>
              ) : // 空状态展现
              renderEmptyState ? (
                renderEmptyState()
              ) : (
                <AgentChatEmpty
                  className="h-full"
                  icon={agentInfo?.icon}
                  name={agentInfo?.name as string}
                  extra={
                    <div className="flex flex-col items-center content-center">
                      <div className={cx(styles['opening-chat-msg'])}>
                        {agentInfo?.openingChatMsg}
                      </div>
                      <RecommendList
                        className="mt-16"
                        chatSuggestList={agentInfo?.guidQuestionDtos || []}
                        onClick={handleMessageSend}
                      />
                    </div>
                  }
                />
              )}
            </>
          )}
        </div>
      </div>

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
        {/* 待发送消息队列面板：有待处理 intervention（ask/question/审批）时隐藏，让 intervention 独占展示 */}
        {!hasPendingIntervention && (
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
          wholeDisabled={inputDisabled}
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
            messageList?.length > 0
          }
          isPersonalComputer={!!agentInfo?.sandboxId}
          {...interventionLayer.agentModeInputProps}
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
