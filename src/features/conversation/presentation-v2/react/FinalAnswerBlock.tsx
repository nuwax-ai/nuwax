/**
 * 最终回答常显区：轨迹下方正常 Markdown 展示 + 回答专属操作栏。
 * 复制内容只含最终回答本身，不含隐藏过程；调试入口读取整轮 finalResult。
 */
import CopyButton from '@/components/base/CopyButton';
import ShareMessageButton from '@/components/business-component/ConversationShareModal/ShareMessageButton';
import ChatBottomDebug from '@/components/ChatView/ChatBottomDebug';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import useMarkdownRender from '@/hooks/useMarkdownRender';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { formatTimeAgo } from '@/utils/common';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import type { ConversationTurnPresentationV2 } from '../types';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface FinalAnswerBlockProps {
  turn: ConversationTurnPresentationV2;
  messageBottomMode?: 'none' | 'home' | 'chat';
  showDebug?: boolean;
}

const FinalAnswerBlock: React.FC<FinalAnswerBlockProps> = ({
  turn,
  messageBottomMode = 'chat',
  showDebug = false,
}) => {
  const { data: themeData } = useUnifiedTheme();
  const lastAssistant = [...turn.assistantMessages]
    .reverse()
    .find((message) => message.role === AssistantRoleEnum.ASSISTANT);
  const messageTime = lastAssistant?.time;
  const [messageTimeLabel, setMessageTimeLabel] = useState(() =>
    messageTime ? formatTimeAgo(messageTime) : '',
  );

  // 与 V1 ChatSampleBottom 完全一致：按消息 time 计算相对时间，并每分钟刷新。
  useEffect(() => {
    if (!messageTime) {
      setMessageTimeLabel('');
      return undefined;
    }
    const updateTime = () => setMessageTimeLabel(formatTimeAgo(messageTime));
    updateTime();
    const timerId = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(timerId);
  }, [messageTime]);
  const answerText = turn.finalAnswer.text;
  const answerId = `v2-answer-${turn.key}`;
  const { markdownRef, messageIdRef } = useMarkdownRender({
    id: answerId,
    answer: answerText,
    thinking: '',
  });

  const handleCopy = () => {
    message.success(dict('PC.Toast.Global.copiedSuccessfully'));
  };

  const terminal =
    !turn.running &&
    (lastAssistant?.status === 'complete' ||
      lastAssistant?.status === 'stopped' ||
      lastAssistant?.status === 'error' ||
      !lastAssistant?.status);

  // V2 会话内搜索定位锚点：turn 聚合后无单条消息 DOM，把 turn 内全部
  // server 消息 id 挂到常显区根节点，供 ConversationSearchPanel 按词匹配定位
  const serverMessageIds = turn.assistantMessages
    .map((msg) => msg.id)
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cx(styles['answer-block'])}
      data-testid="v2-final-answer"
      data-server-message-ids={serverMessageIds || undefined}
    >
      {answerText ? (
        <MarkdownRenderer
          key={messageIdRef.current}
          id={messageIdRef.current}
          markdownRef={markdownRef}
          answer={answerText}
          theme={themeData.antdTheme === 'dark' ? 'dark' : 'light'}
          thinking=""
          status={lastAssistant?.status}
          thinkingFinished={lastAssistant?.thinkingFinished}
          collapseProcessGroups={false}
          autoCollapseEnabled={false}
        />
      ) : turn.terminalStatus === 'stopped' ? (
        <div className={cx(styles['answer-status'])}>
          {dict('PC.Components.ConversationRendererV2.answerStopped')}
        </div>
      ) : turn.terminalStatus === 'error' ? (
        <div className={cx(styles['answer-status'])}>
          {dict('PC.Components.ConversationRendererV2.answerError')}
        </div>
      ) : terminal ? (
        // 正常完成但未产出正文（如 0 节点空轮）：一行轻提示，避免回答区空白无解释
        <div className={cx(styles['answer-status'])}>
          {dict('PC.Components.ConversationRendererV2.answerEmpty')}
        </div>
      ) : null}
      {/* V1 在 home 模式（默认入口）也由 ChatSampleBottom 展示复制+时间，
          V2 操作栏对齐：仅 none 模式隐藏（messageBottomMode 默认值即 home） */}
      {terminal && answerText && messageBottomMode !== 'none' && (
        <div className={cx(styles['answer-actions'])}>
          <CopyButton text={answerText} onCopy={handleCopy}>
            {dict('PC.Components.ChatView.copy')}
          </CopyButton>
          <ShareMessageButton text={answerText} isUser={false} />
          {showDebug && lastAssistant && (
            <ChatBottomDebug messageInfo={lastAssistant} />
          )}
          {/* 沿用 V1 消息时间规则，并固定在当前操作栏最右侧。 */}
          {messageTimeLabel && (
            <span
              className={cx(styles['answer-time'])}
              data-testid="v2-answer-time"
            >
              {messageTimeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FinalAnswerBlock;
