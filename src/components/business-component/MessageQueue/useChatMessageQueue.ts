import { MessageStatusEnum } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useEffect, useRef } from 'react';
import type { QueuedMessage } from './types';
import { useMessageQueue } from './useMessageQueue';

/** 真正发送消息的函数签名（对齐 useChatConversation.handleMessageSend） */
type SendMessage = (
  messageInfo: string,
  files?: UploadFileInfo[],
  skillIds?: number[],
  modelId?: number,
  selectedAgentMode?: any,
) => void;

export interface UseChatMessageQueueParams {
  /**
   * 会话消息是否处理中（纯流式信号：messageList 的 Loading/Incomplete）。
   * 用于 auto-consume 触发与消费锁释放。
   */
  isConversationActive: boolean;
  /**
   * 入队拦截判定（可选）。未传时与 isConversationActive 相同。
   * 合并 taskStatus===EXECUTING 时应传 true，避免 TaskAgent 后台执行期间消息直接发出。
   */
  isEnqueueBlocked?: boolean;
  /**
   * 后台任务是否执行中（taskStatus===EXECUTING）。
   * 不参与 auto-consume 触发（避免 taskStatus 抖动误触发），
   * 但会阻塞实际 dequeue；任务结束后再尝试消费队列。
   */
  isTaskExecuting?: boolean;
  messageList: MessageInfo[];
  /** 当前会话 ID，切换时清空队列 */
  conversationId: any;
  /** 真正发送消息（会话空闲时调用） */
  sendMessage: SendMessage;
  /** 停止当前会话（"立即发送"时调用，停止后会触发 auto-consume） */
  runStopConversation: (id: any) => void;
  /**
   * auto-consume 触发后、发送队首前的最小等待间隔（ms）。
   * 用于等待会话状态稳定（React 渲染周期级），默认 100。
   * 乐观更新 + 3s 保活 + lastConsumeAt 硬间隔 + 锁机制已提供主要保护。
   */
  minConsumeInterval?: number;
  /**
   * 当前是否有待处理的 intervention（ask/question/审批）。
   * 为 true 时暂停 auto-consume，等用户提交 intervention 后再恢复消费队列。
   */
  hasPendingIntervention?: boolean;
}

export const useChatMessageQueue = ({
  isConversationActive,
  isEnqueueBlocked,
  isTaskExecuting = false,
  messageList,
  conversationId,
  sendMessage,
  runStopConversation,
  minConsumeInterval = 100,
  hasPendingIntervention = false,
}: UseChatMessageQueueParams) => {
  const messageQueue = useMessageQueue();
  /** 入队判定：默认与流式活跃一致，可由上层合并 taskStatus */
  const enqueueBlocked = isEnqueueBlocked ?? isConversationActive;

  const convActiveRef = useRef(isConversationActive);
  const prevConvActiveRef = useRef(isConversationActive);
  const prevPendingRef = useRef(hasPendingIntervention);
  const taskExecutingRef = useRef(isTaskExecuting);
  const prevTaskExecutingRef = useRef(isTaskExecuting);
  const hasPendingInterventionRef = useRef(hasPendingIntervention);
  hasPendingInterventionRef.current = hasPendingIntervention;
  const minIntervalRef = useRef(minConsumeInterval);
  minIntervalRef.current = minConsumeInterval;
  const lastConsumeAtRef = useRef(0);
  const consumeLockRef = useRef(false);
  const consumeTimerRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<number | null>(null);
  const messageListRef = useRef(messageList);
  messageListRef.current = messageList;

  const clearTimers = useCallback(() => {
    if (consumeTimerRef.current) {
      window.clearTimeout(consumeTimerRef.current);
      consumeTimerRef.current = null;
    }
    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
  }, []);

  /** 是否满足消费队列的前置条件（不含冷却间隔） */
  const canAttemptConsume = useCallback(() => {
    if (consumeLockRef.current) {
      return false;
    }
    if (!messageQueue.hasQueuedMessages) {
      return false;
    }
    if (convActiveRef.current || taskExecutingRef.current) {
      return false;
    }
    if (hasPendingInterventionRef.current) {
      return false;
    }
    const lastMessage =
      messageListRef.current?.[messageListRef.current.length - 1];
    if (lastMessage?.status === MessageStatusEnum.Error) {
      return false;
    }
    return true;
  }, [messageQueue.hasQueuedMessages]);

  /** 延迟发送队首；触发仍由流式结束 / 任务结束 / intervention 解除驱动 */
  const scheduleAutoConsume = useCallback(() => {
    if (!canAttemptConsume()) {
      return;
    }

    consumeLockRef.current = true;
    clearTimers();

    const elapsed = Date.now() - lastConsumeAtRef.current;
    const wait = Math.max(minIntervalRef.current - elapsed, 0);

    consumeTimerRef.current = window.setTimeout(() => {
      consumeTimerRef.current = null;
      if (convActiveRef.current || taskExecutingRef.current) {
        consumeLockRef.current = false;
        return;
      }
      const next = messageQueue.dequeueFirst();
      if (next) {
        lastConsumeAtRef.current = Date.now();
        sendMessage(next.text, next.files || []);
      } else {
        consumeLockRef.current = false;
      }
    }, wait);

    releaseTimerRef.current = window.setTimeout(() => {
      releaseTimerRef.current = null;
      if (
        consumeLockRef.current &&
        !convActiveRef.current &&
        !taskExecutingRef.current
      ) {
        consumeLockRef.current = false;
      }
    }, 2000);
  }, [canAttemptConsume, clearTimers, messageQueue.dequeueFirst, sendMessage]);

  const trySend = useCallback(
    (messageInfo: string, files?: UploadFileInfo[], ...rest: any[]) => {
      if (enqueueBlocked) {
        messageQueue.enqueue({ text: messageInfo, files });
        return;
      }
      (sendMessage as SendMessage)(
        messageInfo,
        files,
        ...(rest as [any, any, any]),
      );
    },
    [enqueueBlocked, messageQueue, sendMessage],
  );

  useEffect(() => {
    messageQueue.clearQueue();
    consumeLockRef.current = false;
    clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    convActiveRef.current = isConversationActive;
    if (isConversationActive) {
      consumeLockRef.current = false;
      clearTimers();
    }
  }, [isConversationActive, clearTimers]);

  useEffect(() => {
    taskExecutingRef.current = isTaskExecuting;
    if (isTaskExecuting) {
      clearTimers();
      consumeLockRef.current = false;
    }
  }, [isTaskExecuting, clearTimers]);

  useEffect(() => {
    if (hasPendingIntervention) {
      clearTimers();
      consumeLockRef.current = false;
    }
  }, [hasPendingIntervention, clearTimers]);

  // 流式结束或 intervention 解除后尝试消费
  useEffect(() => {
    const wasActive = prevConvActiveRef.current;
    const wasPending = prevPendingRef.current;
    const wasBlocked = wasActive || wasPending;
    prevConvActiveRef.current = isConversationActive;
    prevPendingRef.current = hasPendingIntervention;

    if (
      wasBlocked &&
      !isConversationActive &&
      !hasPendingIntervention &&
      messageQueue.hasQueuedMessages
    ) {
      scheduleAutoConsume();
    }
  }, [
    isConversationActive,
    hasPendingIntervention,
    messageQueue.hasQueuedMessages,
    scheduleAutoConsume,
  ]);

  // 后台任务结束后（流式已空闲）再尝试消费，避免「请稍等」期间发出队首
  useEffect(() => {
    const wasTaskExecuting = prevTaskExecutingRef.current;
    prevTaskExecutingRef.current = isTaskExecuting;

    if (
      wasTaskExecuting &&
      !isTaskExecuting &&
      !isConversationActive &&
      !hasPendingIntervention &&
      messageQueue.hasQueuedMessages
    ) {
      scheduleAutoConsume();
    }
  }, [
    isTaskExecuting,
    isConversationActive,
    hasPendingIntervention,
    messageQueue.hasQueuedMessages,
    scheduleAutoConsume,
  ]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const sendNow = useCallback(
    (qMsg: QueuedMessage) => {
      messageQueue.remove(qMsg.id);
      messageQueue.prepend({ text: qMsg.text, files: qMsg.files });
      if (conversationId) {
        runStopConversation(conversationId);
      }
    },
    [messageQueue, conversationId, runStopConversation],
  );

  const deleteQueued = useCallback(
    (queuedId: string) => messageQueue.remove(queuedId),
    [messageQueue],
  );

  const editQueued = useCallback(
    (qMsg: QueuedMessage): QueuedMessage | undefined =>
      messageQueue.dequeueForEdit(qMsg.id),
    [messageQueue],
  );

  return {
    queue: messageQueue.queue,
    hasQueuedMessages: messageQueue.hasQueuedMessages,
    clearQueue: messageQueue.clearQueue,
    trySend,
    sendNow,
    deleteQueued,
    editQueued,
    reorder: messageQueue.reorder,
  };
};
