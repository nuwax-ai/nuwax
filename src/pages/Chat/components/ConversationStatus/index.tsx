import RunOver from '@/components/ChatView/RunOver';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  // 存储最终时间（一旦设置就不再变化）
  const [finalElapsedTime, setFinalElapsedTime] = useState<number | null>(null);
  // 使用 useRef 保存 timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // 保存当前计时的开始时间，用于判断是否需要重建 timer
  const currentStartTimeRef = useRef<number | null>(null);
  // 保存当前是否正在计时
  const isTimingRef = useRef<boolean>(false);

  // 最近一条助手消息（用于状态展示）
  const lastAssistantMessage = useMemo(() => {
    if (!messageList || messageList.length === 0) {
      return undefined;
    }
    return [...messageList]
      .reverse()
      .find((msg) => msg.role === 'ASSISTANT' && msg.status);
  }, [messageList]);

  // 提取关键值用于依赖项（避免对象引用变化导致 useEffect 频繁触发）
  const {
    isRunning,
    userMessageTime,
    hasFinalResult,
    finalStartTime,
    finalEndTime,
  } = useMemo(() => {
    if (!messageList || messageList.length === 0) {
      return {
        isRunning: false,
        userMessageTime: null,
        hasFinalResult: false,
        finalStartTime: null,
        finalEndTime: null,
      };
    }

    // 检查是否有 finalResult
    const lastAssistant = [...messageList]
      .reverse()
      .find((msg) => msg.role === 'ASSISTANT' && msg.status);

    if (lastAssistant?.finalResult) {
      return {
        isRunning: false,
        userMessageTime: null,
        hasFinalResult: true,
        finalStartTime: lastAssistant.finalResult.startTime,
        finalEndTime: lastAssistant.finalResult.endTime,
      };
    }

    // 检查是否正在运行
    const lastMessage = messageList[messageList.length - 1];

    const running =
      lastMessage?.status === MessageStatusEnum.Loading ||
      lastMessage?.status === MessageStatusEnum.Incomplete;

    if (running) {
      // 获取最后一条用户消息的时间
      const lastUser = [...messageList]
        .reverse()
        .find((msg) => msg.role === 'USER');

      return {
        isRunning: true,
        userMessageTime: lastUser?.time || null,
        hasFinalResult: false,
        finalStartTime: null,
        finalEndTime: null,
      };
    }

    return {
      isRunning: false,
      userMessageTime: null,
      hasFinalResult: false,
      finalStartTime: null,
      finalEndTime: null,
    };
  }, [messageList]);

  // 清理定时器的函数
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    isTimingRef.current = false;
    currentStartTimeRef.current = null;
  }, []);

  // 计算会话时长
  useEffect(() => {
    // 如果有 finalResult，清理 timer 并设置最终时间
    if (hasFinalResult && finalStartTime !== null && finalEndTime !== null) {
      // 立即清理 timer
      clearTimer();

      // 计算最终时间
      const finalElapsed = Math.floor((finalEndTime - finalStartTime) / 1000);

      // 使用更大的值，避免时间回退
      // 如果当前显示的时间比最终时间大，保持当前时间
      const displayTime = Math.max(finalElapsed, elapsedTime);
      setFinalElapsedTime(displayTime);
      return;
    }

    // 重置最终时间（当重新开始计时时）
    setFinalElapsedTime(null);

    // 如果正在运行
    if (isRunning && userMessageTime) {
      const startTime = new Date(userMessageTime).getTime();

      // 检查是否需要重建 timer（开始时间变化或者之前没有在计时）
      if (!isTimingRef.current || currentStartTimeRef.current !== startTime) {
        // 清理旧的 timer
        clearTimer();

        // 保存新的开始时间
        currentStartTimeRef.current = startTime;
        isTimingRef.current = true;

        // 启动计时器，实时更新
        const updateElapsedTime = () => {
          const currentTime = Date.now();
          const elapsed = Math.floor((currentTime - startTime) / 1000);
          setElapsedTime(elapsed);
        };

        // 立即更新一次
        updateElapsedTime();

        // 每秒更新一次
        timerRef.current = setInterval(updateElapsedTime, 1000);
      }
      // 如果开始时间没变，保持现有的 timer 继续运行
    } else {
      // 不在运行状态，清理 timer
      if (isTimingRef.current) {
        clearTimer();
      }
    }

    // 清理函数：组件卸载时清理 timer
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isRunning,
    userMessageTime,
    hasFinalResult,
    finalStartTime,
    finalEndTime,
    clearTimer,
  ]);

  // 格式化时间显示（分:秒）
  // 优先使用最终时间，如果没有则使用实时时间
  const formattedTime = useMemo(() => {
    const timeToDisplay =
      finalElapsedTime !== null ? finalElapsedTime : elapsedTime;
    const minutes = Math.floor(timeToDisplay / 60);
    const seconds = timeToDisplay % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }, [elapsedTime, finalElapsedTime]);

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
