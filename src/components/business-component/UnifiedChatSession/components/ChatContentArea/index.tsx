import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import * as React from 'react';

import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import { dict } from '@/services/i18nRuntime';
import { AgentTypeEnum } from '@/types/enums/space';
import type { MessageInfo, RoleInfo } from '@/types/interfaces/conversationInfo';
import type { UnifiedAgentInfo } from '../../types';

import styles from './index.less';

const cx = classNames.bind(styles);

export interface ChatContentAreaProps {
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
  renderMessageItem?: (message: MessageInfo, isLastMessage: boolean) => React.ReactNode;
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
  );
};

export default ChatContentArea;
