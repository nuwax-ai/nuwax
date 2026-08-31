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
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import type { UnifiedAgentInfo } from '../../types';

import styles from './index.less';

const cx = classNames.bind(styles);

// V2 渲染器按需加载：v1 默认路径不进入 V2 import 链（工具卡→CodeEditor→
// monaco-editor 等重依赖只在真正切到 v2 时拉取，测试与旧线不受影响）。
const ConversationRendererV2 = React.lazy(() =>
  import('@/features/conversation/presentation-v2/react').then((module) => ({
    default: module.ConversationRendererV2,
  })),
);

/**
 * V2 懒加载边界：chunk 拉取失败（发版后旧 tab 请求已删除 hash、弱网）时
 * V2 内部的 ErrorBoundary 尚未加载，异常会冒泡到根卸载整棵树。
 * 本地 boundary 捕获后回退 V1 列表，满足「回退 V1、禁止白屏」的规格。
 */
class V2RendererLoadBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error(
      '[ConversationRendererV2] chunk load failed, falling back to V1',
      error,
      info?.componentStack,
    );
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

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
  variableParams?: Record<string, string | number | null> | null;
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
  /**
   * 会话渲染线（V2 双线重构）：v1 = 现有逐消息 ChatView（默认，零行为变化）；
   * v2 = ConversationRendererV2（轮次工作轨迹 + 最终回答）。
   * renderMessageItem 自定义入口恒走原逻辑，不受本参数影响。
   */
  messageRenderer?: 'v1' | 'v2';
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
  messageRenderer = 'v1',
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

  // V1 列表渲染（默认分支与 V2 chunk 失败回退共用）
  const renderV1MessageList = () =>
    renderedMessageList?.map((item: MessageInfo, idx: number) => {
      const isLastMessage = idx === renderedMessageList.length - 1;
      if (renderMessageItem) {
        return renderMessageItem(item, isLastMessage);
      }
      return (
        <ChatView
          key={getChatMessageRenderKey(item, idx)}
          conversationId={conversationId}
          messageInfo={item}
          roleInfo={effectiveRoleInfo}
          mode={messageBottomMode}
          showDebug={showDebug}
          showStatusDesc={agentInfo?.type !== AgentTypeEnum.TaskAgent}
        />
      );
    });

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

                {/* 消息渲染列表：渲染线选择（V2 双线重构）。自定义 renderMessageItem 恒走原逻辑 */}
                {messageRenderer === 'v2' && !renderMessageItem ? (
                  <V2RendererLoadBoundary
                    fallback={<>{renderV1MessageList()}</>}
                  >
                    <React.Suspense
                      fallback={
                        <div
                          role="status"
                          data-testid="v2-renderer-loading"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '24px 0',
                            color: 'rgba(5, 5, 5, 0.45)',
                          }}
                        >
                          <LoadingOutlined aria-hidden="true" />
                          <span style={{ fontSize: 12 }}>
                            {dict('PC.Pages.Chat.loadingHistoryConversation')}
                          </span>
                        </div>
                      }
                    >
                      <ConversationRendererV2
                        conversationId={conversationId}
                        messageList={renderedMessageList}
                        roleInfo={effectiveRoleInfo}
                        messageBottomMode={messageBottomMode}
                        showDebug={showDebug}
                        showStatusDesc={
                          agentInfo?.type !== AgentTypeEnum.TaskAgent
                        }
                      />
                    </React.Suspense>
                  </V2RendererLoadBoundary>
                ) : (
                  renderV1MessageList()
                )}

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
