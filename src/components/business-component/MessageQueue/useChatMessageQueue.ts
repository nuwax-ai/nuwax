import {
  selectQueueGate,
  selectSessionStreamActive,
} from '@/features/conversation/domain/runtimeSelectors';
import { TaskStatus } from '@/types/enums/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { QueuedMessage } from './types';
import { useMessageQueue } from './useMessageQueue';

/** 消费后若流式始终未启动，解除「等待流结束」守卫的超时（ms），避免 send 失败永久卡死 */
const AWAIT_STREAM_WATCHDOG_MS = 5000;

/** 真正发送消息的函数签名（对齐 useChatConversation.handleMessageSend） */
type SendMessage = (
  messageInfo: string,
  files?: UploadFileInfo[],
  skillIds?: number[],
  modelId?: number,
  selectedAgentMode?: any,
  selectedDocs?: SelectedDocInfo[],
  expertComponents?: QueuedMessage['expertComponents'],
) => void | Promise<unknown>;

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
  minConsumeInterval = 1200,
  hasPendingIntervention = false,
}: UseChatMessageQueueParams) => {
  // 传入 conversationId：队列按会话持久化到 localStorage，切换会话/刷新后可恢复
  const messageQueue = useMessageQueue(conversationId);

  /** 以 messageList 为准兜底，避免 model isConversationActive 与真实流式状态脱节 */
  const streamActive = useMemo(
    () => selectSessionStreamActive(isConversationActive, messageList),
    [isConversationActive, messageList],
  );

  const enqueueBlocked = useMemo(
    () =>
      isEnqueueBlocked ??
      selectQueueGate(
        streamActive,
        messageList,
        isTaskExecuting ? TaskStatus.EXECUTING : undefined,
      ).enqueueBlocked,
    [isEnqueueBlocked, streamActive, isTaskExecuting, messageList],
  );

  /** 队列消费阻塞：流式 OR 后台任务 OR intervention，须全部解除后才可 auto-consume */
  const consumeBlocked = enqueueBlocked || hasPendingIntervention;

  const streamActiveRef = useRef(streamActive);
  const prevStreamActiveRef = useRef(streamActive);
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
  /**
   * 队首已发出，须经历完整流式周期（active→idle）后再消费下一条。
   * 堵住「发送后活跃空窗」导致的双发。
   */
  const awaitingStreamEndRef = useRef(false);
  const awaitStreamWatchdogRef = useRef<number | null>(null);
  const consumeTimerRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<number | null>(null);
  /** 边沿 effect 内读取，避免把 hasQueuedMessages 放进依赖导致 dequeue 重跑误触发 */
  const hasQueuedMessagesRef = useRef(messageQueue.hasQueuedMessages);
  hasQueuedMessagesRef.current = messageQueue.hasQueuedMessages;

  /** 仅清理消费调度定时器（不清 awaiting 看门狗，避免流/任务刚活跃时误杀） */
  const clearConsumeTimers = useCallback(() => {
    if (consumeTimerRef.current) {
      window.clearTimeout(consumeTimerRef.current);
      consumeTimerRef.current = null;
    }
    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
  }, []);

  const clearAwaitWatchdog = useCallback(() => {
    if (awaitStreamWatchdogRef.current) {
      window.clearTimeout(awaitStreamWatchdogRef.current);
      awaitStreamWatchdogRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    clearConsumeTimers();
    clearAwaitWatchdog();
  }, [clearConsumeTimers, clearAwaitWatchdog]);

  /** 消费发出后标记「等待流结束」，并启动看门狗防止 send 失败时永久卡死 */
  const scheduleAutoConsumeRef = useRef<() => void>(() => {});
  const markAwaitingStreamEnd = useCallback(() => {
    awaitingStreamEndRef.current = true;
    clearAwaitWatchdog();
    awaitStreamWatchdogRef.current = window.setTimeout(() => {
      awaitStreamWatchdogRef.current = null;
      // 流始终未启动（发送失败 / 乐观态丢失）：解除守卫，允许后续消费重试
      if (!streamActiveRef.current) {
        awaitingStreamEndRef.current = false;
        scheduleAutoConsumeRef.current();
      }
    }, AWAIT_STREAM_WATCHDOG_MS);
  }, [clearAwaitWatchdog]);

  // UI 与自动消费均消费发送拒绝；问答直发仍由 rawSend 向上返回 Promise。
  const dispatchMessage = useCallback(
    (...args: Parameters<SendMessage>) => {
      const report = (error: unknown) =>
        console.error('[messageQueue] send failed', error);
      try {
        void Promise.resolve(sendMessage(...args)).catch(report);
      } catch (error) {
        report(error);
      }
    },
    [sendMessage],
  );

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
    // 上一条队首已消费，须经历完整流式周期后再发下一条
    if (awaitingStreamEndRef.current) {
      return false;
    }
    // 末条为 Error 时仍允许继续消费：UI 保留「运行错误」展示，不把 Error 当永久阻断。
    // 用户主动停止仍由 userPausedRef 暂停。
    return true;
  }, [messageQueue.hasQueuedMessages]);

  const scheduleAutoConsume = useCallback(() => {
    if (!canAttemptConsume()) {
      return;
    }

    consumeLockRef.current = true;
    clearConsumeTimers();

    // 从「流式结束时刻」起算，而非上次发送时刻：上一条响应通常耗时数秒，
    // 若以发送时刻为基准，elapsed 恒大于间隔会使 wait≈0，间隔形同虚设。
    const elapsed = Date.now() - blockReleasedAtRef.current;
    const wait = Math.max(minIntervalRef.current - elapsed, 0);

    consumeTimerRef.current = window.setTimeout(() => {
      consumeTimerRef.current = null;
      if (
        streamActiveRef.current ||
        taskExecutingRef.current ||
        hasPendingInterventionRef.current ||
        awaitingStreamEndRef.current
      ) {
        consumeLockRef.current = false;
        return;
      }
      const next = messageQueue.dequeueFirst();
      if (next) {
        // 发出后立刻进入「等待流结束」，堵住发送后活跃空窗导致的双发
        markAwaitingStreamEnd();
        // 回放入队时的快照参数，避免 skillIds/modelId/agentMode/selectedDocs 丢失
        dispatchMessage(
          next.text,
          next.files || [],
          next.skillIds,
          next.modelId,
          next.selectedAgentMode,
          next.selectedDocs,
          next.expertComponents,
        );
      } else {
        consumeLockRef.current = false;
      }
    }, wait);

    releaseTimerRef.current = window.setTimeout(() => {
      releaseTimerRef.current = null;
      // awaitingStreamEnd 期间不放锁，避免空窗期内二次 schedule
      if (
        consumeLockRef.current &&
        !streamActiveRef.current &&
        !taskExecutingRef.current &&
        !awaitingStreamEndRef.current
      ) {
        consumeLockRef.current = false;
      }
    }, 2000);
  }, [
    canAttemptConsume,
    clearConsumeTimers,
    markAwaitingStreamEnd,
    messageQueue.dequeueFirst,
    dispatchMessage,
  ]);
  scheduleAutoConsumeRef.current = scheduleAutoConsume;

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
      selectedDocs?: SelectedDocInfo[],
      expertComponents?: QueuedMessage['expertComponents'],
    ) => {
      if (enqueueBlocked) {
        // 入队时一并快照 skillIds/modelId/agentMode/selectedDocs/expertComponents，消费时原样回放，避免丢失（尤其 @技能）
        messageQueue.enqueue({
          text: messageInfo,
          files,
          skillIds,
          selectedDocs,
          expertComponents,
          modelId,
          selectedAgentMode,
        });
        return;
      }
      dispatchMessage(
        messageInfo,
        files,
        skillIds,
        modelId,
        selectedAgentMode,
        selectedDocs,
        expertComponents,
      );
    },
    [enqueueBlocked, messageQueue, dispatchMessage],
  );

  /** 最近一次删除/清空快照（按会话隔离），供 5s 撤销提示恢复原位置 */
  const lastRemovedRef = useRef<Array<{ item: QueuedMessage; index: number }>>(
    [],
  );

  useEffect(() => {
    // 切换会话：useMessageQueue 已同步切换并恢复目标会话的持久化队列（24h TTL）；
    // 此处仅重置运行态锁、定时器与上一会话的撤销快照，不再清空持久化队列。
    lastRemovedRef.current = [];
    consumeLockRef.current = false;
    userPausedRef.current = false;
    awaitingStreamEndRef.current = false;
    clearTimers();
    // 同步边沿状态，避免切换会话时用旧 blocked 边沿误触发 auto-consume
    prevConsumeBlockedRef.current = consumeBlockedRef.current;
    prevStreamActiveRef.current = streamActiveRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    streamActiveRef.current = streamActive;
    taskExecutingRef.current = isTaskExecuting;
    consumeBlockedRef.current = consumeBlocked;

    // 流式由 active → idle：上一则队首消息的流式周期结束，允许消费下一条
    if (prevStreamActiveRef.current && !streamActive) {
      awaitingStreamEndRef.current = false;
      clearAwaitWatchdog();
    }
    prevStreamActiveRef.current = streamActive;

    // 流已真正启动：看门狗使命完成，但仍保持 awaiting 直到 idle
    if (streamActive && awaitingStreamEndRef.current) {
      clearAwaitWatchdog();
    }

    if (streamActive || isTaskExecuting) {
      consumeLockRef.current = false;
      // 只清消费定时器，保留 awaitingStreamEnd 守卫
      clearConsumeTimers();
    }
  }, [
    streamActive,
    isTaskExecuting,
    consumeBlocked,
    clearConsumeTimers,
    clearAwaitWatchdog,
  ]);

  useEffect(() => {
    if (hasPendingIntervention) {
      clearConsumeTimers();
      consumeLockRef.current = false;
      // intervention 打断且流式从未启动时，解除「等待流结束」守卫，避免永久卡死
      if (awaitingStreamEndRef.current && !streamActiveRef.current) {
        awaitingStreamEndRef.current = false;
        clearAwaitWatchdog();
      }
    }
  }, [hasPendingIntervention, clearConsumeTimers, clearAwaitWatchdog]);

  // 仅在 consumeBlocked 由 true→false 的边沿触发消费（不监听 hasQueuedMessages，避免 dequeue 重渲染误触发）
  useEffect(() => {
    const wasBlocked = prevConsumeBlockedRef.current;
    prevConsumeBlockedRef.current = consumeBlocked;

    if (wasBlocked && !consumeBlocked && hasQueuedMessagesRef.current) {
      // 记录「消费阻塞解除（≈流式结束）」时刻，作为本次消费间隔的起算基准
      blockReleasedAtRef.current = Date.now();
      scheduleAutoConsume();
    }
  }, [consumeBlocked, scheduleAutoConsume]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  /**
   * 立即发送：不看流式/任务/暂停等会话状态，直接调 chat 接口，排队由后端处理。
   * 先标记「等待流结束」并清掉待执行的消费定时器，避免同轮自动消费与直发叠加双发。
   */
  const sendNow = useCallback(
    (qMsg: QueuedMessage) => {
      const item = messageQueue.dequeueById(qMsg.id);
      if (!item) return;
      // 「立即发送」视为用户重新参与，恢复自动消费
      userPausedRef.current = false;
      clearConsumeTimers();
      consumeLockRef.current = false;
      markAwaitingStreamEnd();
      dispatchMessage(
        item.text,
        item.files || [],
        item.skillIds,
        item.modelId,
        item.selectedAgentMode,
        item.selectedDocs,
        item.expertComponents,
      );
    },
    [messageQueue, clearConsumeTimers, markAwaitingStreamEnd, dispatchMessage],
  );

  /** 删除单条：记录原位置快照供 undoLastRemove 恢复 */
  const deleteQueued = useCallback(
    (queuedId: string) => {
      const index = messageQueue.queue.findIndex(
        (item) => item.id === queuedId,
      );
      if (index >= 0) {
        lastRemovedRef.current = [{ item: messageQueue.queue[index], index }];
      }
      messageQueue.remove(queuedId);
    },
    [messageQueue],
  );

  /** 清空全部：记录全部项及原顺序快照供 undoLastRemove 恢复 */
  const clearAllQueued = useCallback(() => {
    if (messageQueue.queue.length > 0) {
      lastRemovedRef.current = messageQueue.queue.map((item, index) => ({
        item,
        index,
      }));
    }
    messageQueue.clearQueue();
  }, [messageQueue]);

  /** 撤销最近一次删除或清空，按原下标顺序插回 */
  const undoLastRemove = useCallback(() => {
    const entries = lastRemovedRef.current;
    if (!entries.length) return;
    lastRemovedRef.current = [];
    messageQueue.restore(entries);
  }, [messageQueue]);

  const editQueued = useCallback(
    (qMsg: QueuedMessage): QueuedMessage | undefined =>
      messageQueue.dequeueById(qMsg.id),
    [messageQueue],
  );

  return {
    queue: messageQueue.queue,
    hasQueuedMessages: messageQueue.hasQueuedMessages,
    clearQueue: messageQueue.clearQueue,
    clearAllQueued,
    undoLastRemove,
    trySend,
    sendNow,
    deleteQueued,
    editQueued,
    reorder: messageQueue.reorder,
    pauseAutoConsume,
    resumeAutoConsume,
  };
};
