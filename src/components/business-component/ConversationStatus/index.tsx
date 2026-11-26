import RunOver from '@/components/ChatView/RunOver';
import { projectConversation } from '@/features/conversation/presentation-v2';
import { dict } from '@/services/i18nRuntime';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ConversationStatusProps {
  messageList: MessageInfo[];
  className?: string;
}

/** 显示当前助手消息的状态和本轮耗时。 */
const ConversationStatus: React.FC<ConversationStatusProps> = ({
  messageList,
  className,
}) => {
  const { lastAssistantMessage, userMessage } = useMemo(() => {
    let lastAssistantMessage: MessageInfo | undefined;
    for (let index = messageList.length - 1; index >= 0; index -= 1) {
      const message = messageList[index];
      if (!lastAssistantMessage) {
        if (
          message.role === AssistantRoleEnum.ASSISTANT &&
          (message.id || message.status || message.finalResult)
        ) {
          lastAssistantMessage = message;
        }
      } else if (message.role === AssistantRoleEnum.USER) {
        return { lastAssistantMessage, userMessage: message };
      }
    }
    return { lastAssistantMessage, userMessage: undefined };
  }, [messageList]);

  // SYSTEM/FUNCTION 可以排在助手消息之后，不能用列表尾项决定是否计时。
  const status = lastAssistantMessage?.status;
  const isRunning =
    status === MessageStatusEnum.Loading ||
    status === MessageStatusEnum.Incomplete;
  // 历史快照和本地消息分别可能用毫秒时间戳、日期字符串。
  const userStartTime = new Date(userMessage?.time ?? '').getTime();
  const startTime = Number.isFinite(userStartTime)
    ? userStartTime
    : new Date(lastAssistantMessage?.time ?? '').getTime();
  const roundKey =
    userMessage?.clientRenderKey ||
    userMessage?.id ||
    lastAssistantMessage?.requestId ||
    lastAssistantMessage?.clientRenderKey ||
    lastAssistantMessage?.id;
  const [timer, setTimer] = useState<{
    roundKey: typeof roundKey;
    elapsedSeconds: number;
  }>();
  const terminalMetrics = useMemo(() => {
    if (isRunning || !lastAssistantMessage) return undefined;
    try {
      return projectConversation(messageList).turns.find((turn) =>
        turn.assistantMessages.includes(lastAssistantMessage),
      )?.metrics;
    } catch (error) {
      console.error('[ConversationStatus] 无法计算终态耗时', error);
      return undefined;
    }
  }, [isRunning, lastAssistantMessage, messageList]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const startedAt = Number.isFinite(startTime) ? startTime : Date.now();
    const tick = () => {
      setTimer({
        roundKey,
        elapsedSeconds: Math.max(
          0,
          Math.floor((Date.now() - startedAt) / 1000),
        ),
      });
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, roundKey, startTime]);

  if (!lastAssistantMessage) return null;

  const elapsedSeconds =
    timer?.roundKey === roundKey ? timer.elapsedSeconds : undefined;
  const finalSeconds =
    terminalMetrics?.elapsedMs === undefined
      ? undefined
      : Math.floor(terminalMetrics.elapsedMs / 1000);
  const secondsToDisplay = isRunning
    ? elapsedSeconds ?? 0
    : status === MessageStatusEnum.Stopped && elapsedSeconds !== undefined
    ? elapsedSeconds
    : elapsedSeconds === undefined
    ? finalSeconds
    : Math.max(elapsedSeconds, finalSeconds ?? 0);
  const formattedTime =
    secondsToDisplay === undefined
      ? '—'
      : `${String(Math.floor(secondsToDisplay / 60)).padStart(2, '0')}:${String(
          secondsToDisplay % 60,
        ).padStart(2, '0')}`;
  const estimated =
    !isRunning &&
    (elapsedSeconds === undefined ||
      (status !== MessageStatusEnum.Stopped &&
        finalSeconds !== undefined &&
        finalSeconds > elapsedSeconds)) &&
    terminalMetrics?.elapsedSource === 'tools';

  // 已落库的历史消息可能没有临时 status，仍需展示状态栏。
  const statusMessage = status
    ? lastAssistantMessage
    : {
        ...lastAssistantMessage,
        status:
          lastAssistantMessage.finalResult?.success === false
            ? MessageStatusEnum.Error
            : MessageStatusEnum.Complete,
      };

  return (
    <div
      className={cx(styles.conversationStatus, className)}
      style={{ marginBottom: 0 }}
    >
      <div className={cx(styles.statusBadge, 'flex-1')}>
        <RunOver messageInfo={statusMessage} showTerminalStatus />
      </div>
      <div className={cx(styles.timer)}>
        {estimated
          ? dict('PC.Components.ConversationStatus.estimated', formattedTime)
          : formattedTime}
      </div>
    </div>
  );
};

export default ConversationStatus;
