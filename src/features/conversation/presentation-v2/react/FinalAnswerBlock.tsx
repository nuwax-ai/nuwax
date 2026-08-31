/**
 * 最终回答常显区：轨迹下方正常 Markdown 展示 + 回答专属操作栏。
 * 复制内容只含最终回答本身，不含隐藏过程；调试入口读取整轮 finalResult。
 */
import CopyButton from '@/components/base/CopyButton';
import ChatBottomDebug from '@/components/ChatView/ChatBottomDebug';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import useMarkdownRender from '@/hooks/useMarkdownRender';
import { dict } from '@/services/i18nRuntime';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
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
  showDebug = true,
}) => {
  const lastAssistant = [...turn.assistantMessages]
    .reverse()
    .find((message) => message.role === AssistantRoleEnum.ASSISTANT);
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

  return (
    <div className={cx(styles['answer-block'])} data-testid="v2-final-answer">
      {answerText ? (
        <MarkdownRenderer
          key={messageIdRef.current}
          id={messageIdRef.current}
          markdownRef={markdownRef}
          answer={answerText}
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
      ) : null}
      {terminal && answerText && messageBottomMode === 'chat' && (
        <div className={cx(styles['answer-actions'])}>
          <CopyButton text={answerText} onCopy={handleCopy}>
            {dict('PC.Components.ChatView.copy')}
          </CopyButton>
          {showDebug !== false && lastAssistant && (
            <ChatBottomDebug messageInfo={lastAssistant} />
          )}
        </div>
      )}
    </div>
  );
};

export default FinalAnswerBlock;
