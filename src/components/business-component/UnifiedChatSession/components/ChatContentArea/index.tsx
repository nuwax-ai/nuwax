import { toChatKitMessage } from '@/adapters/chatKitAdapter';
import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatView from '@/components/ChatView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import { LoadingOutlined } from '@ant-design/icons';
import { ChatMessageList } from '@nuwax-ai/chat-kit/react';
import classNames from 'classnames';
import * as React from 'react';

import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import { dict } from '@/services/i18nRuntime';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import type { UnifiedAgentInfo } from '../../types';

import styles from './index.less';

const cx = classNames.bind(styles);

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

  const sharedMessages = React.useMemo(
    () =>
      renderedMessageList.map((message, index) =>
        toChatKitMessage(message, conversationId ?? 'new', index),
      ),
    [conversationId, renderedMessageList],
  );

  const sourceMessageBySharedId = React.useMemo(
    () =>
      new Map(
        sharedMessages.map((message, index) => [
          message.id,
          renderedMessageList[index],
        ]),
      ),
    [renderedMessageList, sharedMessages],
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

            <ChatMessageList
              messages={sharedMessages}
              className={cx(styles['shared-message-list'])}
              beforeMessages={
                isMoreMessage && sharedMessages.length >= MESSAGE_PAGE_SIZE ? (
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
                ) : null
              }
              renderMessage={(sharedMessage) => {
                const item = sourceMessageBySharedId.get(sharedMessage.id);
                if (!item) return null;
                const index = renderedMessageList.indexOf(item);
                const isLastMessage = index === renderedMessageList.length - 1;
                if (renderMessageItem) {
                  return renderMessageItem(item, isLastMessage);
                }
                return (
                  <ChatView
                    messageInfo={item}
                    roleInfo={effectiveRoleInfo}
                    mode={messageBottomMode}
                    showDebug={showDebug}
                    showStatusDesc={agentInfo?.type !== AgentTypeEnum.TaskAgent}
                  />
                );
              }}
              empty={
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
                )
              }
              afterMessages={
                sharedMessages.length > 0 ? (
                  <>
                    {shouldShowSessionSuggest && (
                      <RecommendList
                        className={cx(styles['recommend-list-box'])}
                        loading={loadingSuggest}
                        chatSuggestList={chatSuggestList || []}
                        onClick={handleMessageSend}
                      />
                    )}
                    {showTaskExecutingWait && (
                      <div className={cx(styles['task-executing-container'])}>
                        <LoadingOutlined />
                        <span>{dict('PC.Pages.Chat.agentExecutingWait')}</span>
                      </div>
                    )}
                  </>
                ) : null
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatContentArea;
