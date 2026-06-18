import { isSessionStreamBusy } from '@/hooks/useExecutingTaskStatusPoll';
import { MessageStatusEnum } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { QueuedMessage } from './types';
import { useMessageQueue } from './useMessageQueue';

/** 两次队列消费之间的默认最小间隔（ms），避免 SSE 快速结束导致「一出溜」连发 */
const DEFAULT_MIN_CONSUME_INTERVAL_MS = 500;

/** 消费后若流式始终未启动，解除「等待流结束」守卫的超时（ms） */
const AWAIT_STREAM_WATCHDOG_MS = 5000;

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
  minConsumeInterval = DEFAULT_MIN_CONSUME_INTERVAL_MS,
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
  const hasPendingInterventionRef = useRef(hasPendingIntervention);
  hasPendingInterventionRef.current = hasPendingIntervention;
  const minIntervalRef = useRef(minConsumeInterval);
  minIntervalRef.current = minConsumeInterval;
  const lastConsumeAtRef = useRef(0);
  const consumeLockRef = useRef(false);
  /** 队首已发出，须等本轮流式 complete 后再消费下一条 */
  const awaitingStreamEndRef = useRef(false);
  const awaitStreamWatchdogRef = useRef<number | null>(null);
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
    if (awaitStreamWatchdogRef.current) {
      window.clearTimeout(awaitStreamWatchdogRef.current);
      awaitStreamWatchdogRef.current = null;
    }
  }, []);

  /** 消费发出后标记「等待流结束」，并启动看门狗防止 send 失败时永久卡死 */
  const scheduleAutoConsumeRef = useRef<() => void>(() => {});
  const markAwaitingStreamEnd = useCallback(() => {
    awaitingStreamEndRef.current = true;
    if (awaitStreamWatchdogRef.current) {
      window.clearTimeout(awaitStreamWatchdogRef.current);
    }
    awaitStreamWatchdogRef.current = window.setTimeout(() => {
      awaitStreamWatchdogRef.current = null;
      if (!streamActiveRef.current) {
        awaitingStreamEndRef.current = false;
        scheduleAutoConsumeRef.current();
      }
    }, AWAIT_STREAM_WATCHDOG_MS);
  }, []);

  const canAttemptConsume = useCallback(() => {
    if (consumeLockRef.current) {
      return false;
    }
    if (!messageQueue.hasQueuedMessages) {
      return false;
    }
    if (streamActiveRef.current || taskExecutingRef.current) {
      return false;
    }
    if (hasPendingInterventionRef.current) {
      return false;
    }
    // 上一条队首已消费，须经历完整流式周期（active→idle）后再发下一条
    if (awaitingStreamEndRef.current) {
      return false;
    }
    const lastMessage =
      messageListRef.current?.[messageListRef.current.length - 1];
    if (lastMessage?.status === MessageStatusEnum.Error) {
      return false;
    }
    return true;
  }, [messageQueue.hasQueuedMessages]);

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
        markAwaitingStreamEnd();
        // 回放入队时的快照参数，避免 skillIds/modelId/agentMode 丢失
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
  }, [
    canAttemptConsume,
    clearTimers,
    markAwaitingStreamEnd,
    messageQueue.dequeueFirst,
    sendMessage,
  ]);
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
        // 入队时一并快照 skillIds/modelId/agentMode，消费时原样回放，避免丢失（尤其 @技能）
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

  // 切换会话：重置消费锁与定时器；队列本身由 useMessageQueue 按 conversationId
  // 加载对应的持久化数据（不再无条件清空，保证切走再回来队列仍在）
  useEffect(() => {
    consumeLockRef.current = false;
    awaitingStreamEndRef.current = false;
    clearTimers();
    // 同步边沿状态，避免切换会话时用旧 blocked 边沿误触发 auto-consume
    prevConsumeBlockedRef.current = consumeBlockedRef.current;
    prevStreamActiveRef.current = streamActiveRef.current;
  }, [conversationId, clearTimers]);

  useEffect(() => {
    streamActiveRef.current = streamActive;
    taskExecutingRef.current = isTaskExecuting;
    consumeBlockedRef.current = consumeBlocked;

    // 流式由 active → idle：上一则队首消息的流式周期结束，允许消费下一条
    if (prevStreamActiveRef.current && !streamActive) {
      awaitingStreamEndRef.current = false;
      if (awaitStreamWatchdogRef.current) {
        window.clearTimeout(awaitStreamWatchdogRef.current);
        awaitStreamWatchdogRef.current = null;
      }
    }
    prevStreamActiveRef.current = streamActive;

    if (streamActive || isTaskExecuting) {
      consumeLockRef.current = false;
      clearTimers();
    }
  }, [streamActive, isTaskExecuting, consumeBlocked, clearTimers]);

  useEffect(() => {
    if (hasPendingIntervention) {
      clearTimers();
      consumeLockRef.current = false;
    }
  }, [hasPendingIntervention, clearTimers]);

  // 仅在 consumeBlocked 由 true→false 的边沿触发消费（不监听 hasQueuedMessages，避免 dequeue 重渲染误触发）
  useEffect(() => {
    const wasBlocked = prevConsumeBlockedRef.current;
    prevConsumeBlockedRef.current = consumeBlocked;

    // 被 intervention / 后台任务打断且流式从未启动时，解除「等待流结束」守卫
    if (
      consumeBlocked &&
      awaitingStreamEndRef.current &&
      !streamActiveRef.current
    ) {
      awaitingStreamEndRef.current = false;
      if (awaitStreamWatchdogRef.current) {
        window.clearTimeout(awaitStreamWatchdogRef.current);
        awaitStreamWatchdogRef.current = null;
      }
    }

    if (wasBlocked && !consumeBlocked && messageQueue.hasQueuedMessages) {
      scheduleAutoConsume();
    }
  }, [consumeBlocked, messageQueue.hasQueuedMessages, scheduleAutoConsume]);

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
