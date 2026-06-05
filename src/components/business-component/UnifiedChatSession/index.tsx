import AgentChatEmpty from '@/components/AgentChatEmpty';
import {
  AgentInterventionChatLayer,
  type AgentMode,
  useAgentInterventionLayer,
} from '@/components/business-component/AgentIntervention';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import ConversationStatus from '@/pages/Chat/components/ConversationStatus';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';

import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { dict } from '@/services/i18nRuntime';
import { AgentTypeEnum } from '@/types/enums/space';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

import styles from './index.less';
import type { UnifiedChatSessionProps } from './types';

const cx = classNames.bind(styles);

const UnifiedChatSession: React.FC<UnifiedChatSessionProps> = ({
  conversationId,
  messageList,
  roleInfo,
  isLoading,
  loadingMore,
  isMoreMessage,
  isConversationActive,
  loadingSuggest = false,
  chatSuggestList = [],
  agentInfo,
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
      onLoadMoreMessage(conversationId);
    }
  }, [
    loadMoreInView,
    isMoreMessage,
    loadingMore,
    messageList?.length,
    conversationId,
    onLoadMoreMessage,
  ]);

  // 3. 消息发送代理
  const handleMessageSend = (
    messageInfo: string,
    files: UploadFileInfo[] = [],
    skillIds: number[] = [],
    modelId?: number,
    selectedAgentMode?: AgentMode,
  ) => {
    onSendMessage(
      messageInfo,
      files,
      skillIds,
      modelId || selectedModelId,
      selectedAgentMode || agentModeRef.current,
    );
  };

  // 4. 智能体指令介入图层 (ACP/MCP 审批交互)
  const interventionLayer = useAgentInterventionLayer({
    conversationId,
    messageList,
    onSendMessage: (msg) => handleMessageSend(msg),
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
                  {messageList.map((item: MessageInfo, idx: number) => {
                    const isLastMessage = idx === messageList.length - 1;
                    if (renderMessageItem) {
                      return renderMessageItem(item, isLastMessage);
                    }
                    return (
                      <ChatView
                        key={`${item.id}-${item?.index || idx}`}
                        messageInfo={item}
                        roleInfo={roleInfo}
                        mode="chat"
                        showStatusDesc={
                          agentInfo?.type !== AgentTypeEnum.TaskAgent
                        }
                      />
                    );
                  })}

                  {/* 开场推荐提问建议列表 */}
                  <RecommendList
                    className={cx(styles['recommend-list-box'])}
                    loading={loadingSuggest}
                    chatSuggestList={chatSuggestList}
                    onClick={handleMessageSend}
                  />

                  {/* 通用型智能体执行中状态提示 */}
                  {isConversationActive &&
                    agentInfo?.type === AgentTypeEnum.TaskAgent && (
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

      {/* 统一会话输入框 */}
      <div className={cx(styles['chat-input-container'])}>
        <ChatInputHome
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
        />
      </div>
    </div>
  );
};

export default UnifiedChatSession;
