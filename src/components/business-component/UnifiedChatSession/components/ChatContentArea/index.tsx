import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import * as React from 'react';

import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import { projectConversationTurns } from '@/features/conversation/presentation/conversationTurnPresentation';
import { dict } from '@/services/i18nRuntime';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import type { UnifiedAgentInfo } from '../../types';

import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 优先使用客户端稳定渲染 ID，历史消息则使用服务端 ID 作为 React key。
 * 会话终态快照可能为历史消息补齐或调整 index；把 index 拼进 key 会导致整条消息
 * 被卸载重挂，Markdown 内容在下一帧重新注入时产生可见闪烁。
 */
export const getChatMessageRenderKey = (
  message: MessageInfo,
  fallbackIndex: number,
): string => {
  const id = message.clientRenderKey || message.id;
  if (id !== null && id !== undefined && String(id).trim() !== '') {
    return `message-${String(id)}`;
  }
  return `message-fallback-${message.role}-${message.index ?? fallbackIndex}`;
};

export interface ChatContentAreaProps {
  conversationId?: number | string;
  messageViewRef: React.RefObject<HTMLDivElement>;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  isLoading: boolean;
  form?: any;
  variables?: any[];
  agentInfo?: UnifiedAgentInfo;
  userFillVariables?: any;
  isVariablesFilled?: boolean;
  isVariablesDisabled?: boolean;
  variableParams?: Record<string, string | number> | null;
  messageList?: MessageInfo[];
  isMoreMessage?: boolean;
  loadMoreRef: any;
  loadingMore?: boolean;
  renderMessageItem?: (
    message: MessageInfo,
    isLastMessage: boolean,
  ) => React.ReactNode;
  effectiveRoleInfo: RoleInfo;
  messageBottomMode?: 'none' | 'home' | 'chat';
  showDebug?: boolean;
  shouldShowSessionSuggest: boolean;
  loadingSuggest?: boolean;
  chatSuggestList?: any[];
  handleMessageSend: (...args: any[]) => void;
  showTaskExecutingWait: boolean;
  renderEmptyState?: () => React.ReactNode;
}

export const ChatContentArea: React.FC<ChatContentAreaProps> = ({
  conversationId,
  messageViewRef,
  handleMouseEnter,
  handleMouseLeave,
  isLoading,
  form,
  variables,
  agentInfo = {},
  userFillVariables,
  isVariablesFilled,
  isVariablesDisabled,
  variableParams,
  messageList = [],
  isMoreMessage,
  loadMoreRef,
  loadingMore,
  renderMessageItem,
  effectiveRoleInfo,
  messageBottomMode = 'home',
  showDebug,
  shouldShowSessionSuggest,
  loadingSuggest,
  chatSuggestList = [],
  handleMessageSend,
  showTaskExecutingWait,
  renderEmptyState,
}) => {
  const renderedMessageList = React.useMemo(() => {
    if (!messageList || messageList.length <= 1) {
      return messageList;
    }
    const isOpeningMessage = (item: MessageInfo) => {
      return !item.id;
    };
    const hasRealMessage = messageList.some((item) => !isOpeningMessage(item));
    if (hasRealMessage) {
      return messageList.filter((item) => !isOpeningMessage(item));
    }
    return messageList;
  }, [messageList]);

  const messagePresentations = React.useMemo(
    () =>
      renderMessageItem
        ? null
        : projectConversationTurns(renderedMessageList || []),
    [renderMessageItem, renderedMessageList],
  );

  return (
    <div
      className={cx(styles['chat-wrapper-content'], 'scroll-container')}
      ref={messageViewRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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

            {renderedMessageList?.length > 0 ? (
              <>
                {/* 加载历史消息的触发探测节点 */}
                {isMoreMessage &&
                  (renderedMessageList?.length || 0) >= MESSAGE_PAGE_SIZE && (
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
                {renderMessageItem &&
                  renderedMessageList?.map((item: MessageInfo, idx: number) => {
                    const isLastMessage =
                      idx === renderedMessageList.length - 1;
                    return renderMessageItem(item, isLastMessage);
                  })}

                {!renderMessageItem &&
                  messagePresentations?.map((presentation, idx) => {
                    const item =
                      presentation.kind === 'message'
                        ? presentation.message
                        : presentation.messageInfo;
                    return (
                      <ChatView
                        key={
                          presentation.key || getChatMessageRenderKey(item, idx)
                        }
                        conversationId={conversationId}
                        messageInfo={item}
                        turnPresentation={
                          presentation.kind === 'turn'
                            ? presentation
                            : undefined
                        }
                        roleInfo={effectiveRoleInfo}
                        mode={messageBottomMode}
                        showDebug={showDebug}
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
                    chatSuggestList={chatSuggestList || []}
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
              renderEmptyState?.()
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
  );
};

export default ChatContentArea;
