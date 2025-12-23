import RunOver from '@/components/ChatView/RunOver';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ConversationStatusProps {
  /** 消息列表 */
  messageList: MessageInfo[];
  /** 额外的类名 */
  className?: string;
}

/**
 * 会话状态组件
 * 显示当前运行状态和会话时长
 */
const ConversationStatus: React.FC<ConversationStatusProps> = ({
  messageList,
  className,
}) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // 最近一条助手消息（用于状态展示和时间计算）
  const lastAssistantMessage = useMemo(() => {
    if (!messageList || messageList.length === 0) {
      return undefined;
    }
    return [...messageList]
      .reverse()
      .find((msg) => msg.role === 'ASSISTANT' && msg.status);
  }, [messageList]);

  // 计算会话时长
  useEffect(() => {
    // 如果没有消息，不计时
    if (!messageList || messageList.length === 0) {
      setElapsedTime(0);
      return;
    }

    // 如果有 finalResult，使用其中的时间（这是实际执行时间）
    if (lastAssistantMessage?.finalResult) {
      const { startTime, endTime } = lastAssistantMessage.finalResult;
      const elapsed = Math.floor((endTime - startTime) / 1000);
      setElapsedTime(elapsed);
      return;
    }

    // 如果没有 finalResult，但会话在运行中，使用实时计时
    const lastMessage = messageList[messageList.length - 1];
    const isRunning = lastMessage.status === MessageStatusEnum.Loading;

    if (isRunning) {
      // 获取会话开始时间（最后一条用户消息的时间）
      const lastUserMessage = [...messageList]
        .reverse()
        .find((msg) => msg.role === 'USER');

      if (!lastUserMessage?.time) {
        setElapsedTime(0);
        return;
      }

      const startTime = new Date(lastUserMessage.time).getTime();

      // 启动计时器，实时更新
      const updateElapsedTime = () => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        setElapsedTime(elapsed);
      };

      // 立即更新一次
      updateElapsedTime();

      // 每秒更新一次
      const timer = setInterval(updateElapsedTime, 1000);

      return () => {
        clearInterval(timer);
      };
    }

    // 非运行中且没有 finalResult 时，保持当前 elapsedTime，不重置为 0，
    // 避免在状态切换过程中闪一下 00:00
    return;
  }, [messageList, lastAssistantMessage]);

  // 格式化时间显示（分:秒）
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }, [elapsedTime]);

  if (!lastAssistantMessage) {
    return null;
  }

  return (
    <div
      className={cx(styles.conversationStatus, className)}
      style={{ marginBottom: 0 }}
    >
      {/* 状态标签：复用 ChatView 中的 RunOver 组件，保证与消息列表状态展示一致 */}
      <div className={cx(styles.statusBadge)}>
        <RunOver messageInfo={lastAssistantMessage} />
      </div>

      {/* 计时器 */}
      <div className={cx(styles.timer)}>{formattedTime}</div>
    </div>
  );
};

export default ConversationStatus;
