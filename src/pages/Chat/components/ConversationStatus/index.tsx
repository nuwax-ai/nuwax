import RunOver from '@/components/ChatView/RunOver';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  // 使用 useRef 保存 timer，避免频繁创建/清理
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // 使用 useRef 保存开始时间，避免依赖项变化导致时间重置
  const startTimeRef = useRef<number | null>(null);
  // 使用 useRef 保存上一次的运行状态，用于判断状态变化
  const prevIsRunningRef = useRef<boolean>(false);

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
    // 清理之前的 timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 如果没有消息，不计时
    if (!messageList || messageList.length === 0) {
      setElapsedTime(0);
      startTimeRef.current = null;
      prevIsRunningRef.current = false;
      return;
    }

    // 如果有 finalResult，使用其中的时间（这是实际执行时间）
    if (lastAssistantMessage?.finalResult) {
      const { startTime, endTime } = lastAssistantMessage.finalResult;
      const elapsed = Math.floor((endTime - startTime) / 1000);
      setElapsedTime(elapsed);
      startTimeRef.current = null;
      prevIsRunningRef.current = false;
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
        startTimeRef.current = null;
        prevIsRunningRef.current = false;
        return;
      }

      const startTime = new Date(lastUserMessage.time).getTime();

      // 如果运行状态从 false 变为 true，或者开始时间发生变化，重新设置开始时间
      if (!prevIsRunningRef.current || startTimeRef.current !== startTime) {
        startTimeRef.current = startTime;
        prevIsRunningRef.current = true;
      }

      // 启动计时器，实时更新
      const updateElapsedTime = () => {
        if (startTimeRef.current === null) {
          return;
        }
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      };

      // 立即更新一次
      updateElapsedTime();

      // 每秒更新一次
      timerRef.current = setInterval(updateElapsedTime, 1000);
    } else {
      // 非运行中时，保持当前 elapsedTime，不重置为 0，
      // 避免在状态切换过程中闪一下 00:00
      prevIsRunningRef.current = false;
    }

    // 清理函数：组件卸载或依赖项变化时清理 timer
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
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
