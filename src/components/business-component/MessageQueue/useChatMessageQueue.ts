import { isSessionStreamBusy } from '@/hooks/useExecutingTaskStatusPoll';
import { MessageStatusEnum } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  minConsumeInterval = 1200,
  hasPendingIntervention = false,
}: UseChatMessageQueueParams) => {
  const messageQueue = useMessageQueue();

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
  const hasPendingInterventionRef = useRef(hasPendingIntervention);
  /**
   * 用户主动停止会话后置 true：暂停队列自动消费，避免停止后立即发送下一条排队消息。
   * 用户再次发送新提示词（或点击「立即发送」）后置 false，恢复自动消费。
   */
  const userPausedRef = useRef(false);
  hasPendingInterventionRef.current = hasPendingIntervention;
  const minIntervalRef = useRef(minConsumeInterval);
  minIntervalRef.current = minConsumeInterval;
  /** 最近一次「消费阻塞解除（≈流式结束）」的时刻，作为消费间隔的起算基准 */
  const blockReleasedAtRef = useRef(0);
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

  const canAttemptConsume = useCallback(() => {
    if (consumeLockRef.current) {
      return false;
    }
    if (!messageQueue.hasQueuedMessages) {
      return false;
    }
    // 用户主动停止会话后暂停自动消费，等待用户再次发送新消息后才恢复
    if (userPausedRef.current) {
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
  }, [messageQueue.hasQueuedMessages]);

  const scheduleAutoConsume = useCallback(() => {
    if (!canAttemptConsume()) {
      return;
    }

    consumeLockRef.current = true;
    clearTimers();

    // 从「流式结束时刻」起算，而非上次发送时刻：上一条响应通常耗时数秒，
    // 若以发送时刻为基准，elapsed 恒大于间隔会使 wait≈0，间隔形同虚设。
    const elapsed = Date.now() - blockReleasedAtRef.current;
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
  }, [canAttemptConsume, clearTimers, messageQueue.dequeueFirst, sendMessage]);

  /** 用户主动停止会话：暂停队列自动消费，清掉待执行的消费定时器 */
  const pauseAutoConsume = useCallback(() => {
    userPausedRef.current = true;
    clearTimers();
    consumeLockRef.current = false;
  }, [clearTimers]);

  /**
   * 用户再次发送新消息：仅解除暂停位，不主动触发消费。
   * 新消息发送后流式结束时的 consumeBlocked 释放信号会自然驱动消费下一条；
   * 此处若主动 schedule，会在会话仍空闲的瞬间抢先消费，导致排队消息抢在
   * 用户刚输入的消息之前（或与之同时）被发送。
   */
  const resumeAutoConsume = useCallback(() => {
    userPausedRef.current = false;
  }, []);

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

  useEffect(() => {
    messageQueue.clearQueue();
    consumeLockRef.current = false;
    userPausedRef.current = false;
    clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    streamActiveRef.current = streamActive;
    taskExecutingRef.current = isTaskExecuting;
    consumeBlockedRef.current = consumeBlocked;

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

  // 仅在「流式 + 后台任务 + intervention」全部解除后触发消费（不再单独监听流式结束）
  useEffect(() => {
    const wasBlocked = prevConsumeBlockedRef.current;
    prevConsumeBlockedRef.current = consumeBlocked;

    if (wasBlocked && !consumeBlocked && messageQueue.hasQueuedMessages) {
      // 记录「消费阻塞解除（≈流式结束）」时刻，作为本次消费间隔的起算基准
      blockReleasedAtRef.current = Date.now();
      scheduleAutoConsume();
    }
  }, [consumeBlocked, messageQueue.hasQueuedMessages, scheduleAutoConsume]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const sendNow = useCallback(
    (qMsg: QueuedMessage) => {
      // 「立即发送」视为用户重新参与，恢复自动消费，确保停止后队列中的下一条能继续发送
      userPausedRef.current = false;
      messageQueue.remove(qMsg.id);
      // 回放入队时快照的全部参数（技能/模型/智能体模式），避免立即发送丢失 @技能等
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
      // 会话已空闲（如暂停态下点击立即发送）时不会有流式结束信号，需主动触发一次消费
      scheduleAutoConsume();
    },
    [messageQueue, conversationId, runStopConversation, scheduleAutoConsume],
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
    pauseAutoConsume,
    resumeAutoConsume,
  };
};
