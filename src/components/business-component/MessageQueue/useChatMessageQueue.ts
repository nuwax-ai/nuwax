import { isSessionStreamBusy } from '@/hooks/useExecutingTaskStatusPoll';
import { MessageStatusEnum } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { loadQueue } from './queueStorage';
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
   * 流式活跃信号（model/context）；会与 messageList 末条 Loading/Incomplete 合并。
   */
  isConversationActive: boolean;
  /**
   * 入队拦截：streamActive || taskExecuting（与发送/停止按钮一致）。
   * 未传时回退为 streamActive || isTaskExecuting。
   */
  isEnqueueBlocked?: boolean;
  /** 后台 taskStatus===EXECUTING */
  isTaskExecuting?: boolean;
  messageList: MessageInfo[];
  conversationId: any;
  sendMessage: SendMessage;
  runStopConversation: (id: any) => void;
  minConsumeInterval?: number;
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
  const messageQueue = useMessageQueue(conversationId);

  /** 以 messageList 为准兜底，避免 model isConversationActive 与真实流式状态脱节 */
  const streamActive = useMemo(
    () => isConversationActive || isSessionStreamBusy(messageList),
    [isConversationActive, messageList],
  );

  const enqueueBlocked = useMemo(
    () => isEnqueueBlocked ?? (streamActive || isTaskExecuting),
    [isEnqueueBlocked, streamActive, isTaskExecuting],
  );

  /** 队列消费阻塞：流式 OR 后台任务 OR intervention，须全部解除后才可 auto-consume */
  const consumeBlocked = enqueueBlocked || hasPendingIntervention;

  const streamActiveRef = useRef(streamActive);
  const taskExecutingRef = useRef(isTaskExecuting);
  const consumeBlockedRef = useRef(consumeBlocked);
  const prevConsumeBlockedRef = useRef(consumeBlocked);
  const prevStreamActiveRef = useRef(streamActive);
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
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const hasQueueItems = useCallback(() => {
    return (
      messageQueue.hasQueuedMessages ||
      loadQueue(conversationIdRef.current).length > 0
    );
  }, [messageQueue.hasQueuedMessages]);

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

  const canAttemptConsume = useCallback(() => {
    if (consumeLockRef.current) {
      return false;
    }
    if (!hasQueueItems()) {
      return false;
    }
    if (streamActiveRef.current || taskExecutingRef.current) {
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
  }, [hasQueueItems]);

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
      if (
        streamActiveRef.current ||
        taskExecutingRef.current ||
        hasPendingInterventionRef.current
      ) {
        consumeLockRef.current = false;
        return;
      }
      const next = messageQueue.dequeueFirst();
      if (next) {
        lastConsumeAtRef.current = Date.now();
        // 回放入队时的快照参数，避免 skillIds/modelId/agentMode 丢失（尤其 @技能）
        sendMessage(
          next.text,
          next.files || [],
          next.skillIds,
          next.modelId,
          next.selectedAgentMode,
        );
      } else {
        consumeLockRef.current = false;
      }
    }, wait);

    releaseTimerRef.current = window.setTimeout(() => {
      releaseTimerRef.current = null;
      if (
        consumeLockRef.current &&
        !streamActiveRef.current &&
        !taskExecutingRef.current
      ) {
        consumeLockRef.current = false;
      }
    }, 2000);
  }, [canAttemptConsume, clearTimers, messageQueue.dequeueFirst, sendMessage]);

  const scheduleAutoConsumeRef = useRef(scheduleAutoConsume);
  scheduleAutoConsumeRef.current = scheduleAutoConsume;

  const trySend = useCallback(
    (
      messageInfo: string,
      files?: UploadFileInfo[],
      skillIds?: number[],
      modelId?: number,
      selectedAgentMode?: QueuedMessage['selectedAgentMode'],
    ) => {
      if (enqueueBlocked) {
        // 入队时一并快照 skillIds/modelId/agentMode，消费时原样回放
        messageQueue.enqueue({
          text: messageInfo,
          files,
          skillIds,
          modelId,
          selectedAgentMode,
        });
        return;
      }
      sendMessage(messageInfo, files, skillIds, modelId, selectedAgentMode);
    },
    [enqueueBlocked, messageQueue, sendMessage],
  );

  // 切换会话：重置消费锁与定时器；队列由 useMessageQueue 按 conversationId 同步加载
  useEffect(() => {
    consumeLockRef.current = false;
    clearTimers();
    prevConsumeBlockedRef.current = consumeBlockedRef.current;
    prevStreamActiveRef.current = streamActiveRef.current;
    prevTaskExecutingRef.current = taskExecutingRef.current;

    // 持久化恢复：layout 加载队列后，若会话空闲则主动尝试消费（无 blocked 边沿时不会触发）
    const resumeTimer = window.setTimeout(() => {
      const hasPersistedQueue = loadQueue(conversationId).length > 0;
      if (!consumeBlockedRef.current && hasPersistedQueue) {
        scheduleAutoConsumeRef.current();
      }
    }, 0);

    return () => window.clearTimeout(resumeTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, clearTimers]);

  useEffect(() => {
    streamActiveRef.current = streamActive;
    taskExecutingRef.current = isTaskExecuting;
    consumeBlockedRef.current = consumeBlocked;

    const streamBecameActive = !prevStreamActiveRef.current && streamActive;
    const taskBecameExecuting =
      !prevTaskExecutingRef.current && isTaskExecuting;

    if (streamActive || isTaskExecuting) {
      consumeLockRef.current = false;
      // 仅在阻塞由 idle→active 时取消待发消费，避免流式 chunk 间隙重复 clearTimers
      if (streamBecameActive || taskBecameExecuting) {
        clearTimers();
      }
    }

    prevStreamActiveRef.current = streamActive;
    prevTaskExecutingRef.current = isTaskExecuting;
  }, [streamActive, isTaskExecuting, consumeBlocked, clearTimers]);

  useEffect(() => {
    if (hasPendingIntervention) {
      clearTimers();
      consumeLockRef.current = false;
    }
  }, [hasPendingIntervention, clearTimers]);

  // 仅在「流式 + 后台任务 + intervention」全部解除后触发消费（不再单独监听流式结束）
  useEffect(() => {
    const wasBlocked = prevConsumeBlockedRef.current;
    prevConsumeBlockedRef.current = consumeBlocked;

    if (wasBlocked && !consumeBlocked && messageQueue.hasQueuedMessages) {
      scheduleAutoConsume();
    }
  }, [consumeBlocked, messageQueue.hasQueuedMessages, scheduleAutoConsume]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const sendNow = useCallback(
    (qMsg: QueuedMessage) => {
      messageQueue.remove(qMsg.id);
      messageQueue.prepend({
        text: qMsg.text,
        files: qMsg.files,
        skillIds: qMsg.skillIds,
        modelId: qMsg.modelId,
        selectedAgentMode: qMsg.selectedAgentMode,
      });
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
