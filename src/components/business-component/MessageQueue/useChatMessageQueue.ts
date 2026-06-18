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
   * 会话消息是否处理中（纯 isConversationActive，基于 messageList 的 Loading/Incomplete）。
   * 同时用于「入队判定」和「auto-consume 触发」——用纯信号而非合并 taskStatus，
   * 避免 taskStatus 状态机切换的中间空白导致：① 入队失效（消息直接发出，"一出溜"）；
   * ② auto-consume 误消费下一条。
   */
  isConversationActive: boolean;
  messageList: MessageInfo[];
  /** 当前会话 ID，切换时清空队列 */
  conversationId: any;
  /** 真正发送消息（会话空闲时调用） */
  sendMessage: SendMessage;
  /** 停止当前会话（"立即发送"时调用，停止后会触发 auto-consume） */
  runStopConversation: (id: any) => void;
  /**
   * auto-consume 触发后、发送队首前的最小等待间隔（ms）。
   * 用于等待会话状态稳定，避免状态切换中间空白误消费；默认 500。
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
  messageList,
  conversationId,
  sendMessage,
  runStopConversation,
  minConsumeInterval = 500,
  hasPendingIntervention = false,
}: UseChatMessageQueueParams) => {
  const messageQueue = useMessageQueue();

  // auto-consume 相关：一律以纯 isConversationActive 为准（消息状态驱动，稳定）
  const convActiveRef = useRef(isConversationActive);
  const prevConvActiveRef = useRef(isConversationActive);
  const prevPendingRef = useRef(hasPendingIntervention);
  // intervention pending（ref 避免 effect 依赖频繁触发）
  const hasPendingInterventionRef = useRef(hasPendingIntervention);
  hasPendingInterventionRef.current = hasPendingIntervention;
  // 最小消费间隔（ref 避免 effect 依赖频繁触发）
  const minIntervalRef = useRef(minConsumeInterval);
  minIntervalRef.current = minConsumeInterval;
  // 上次实际消费的时间戳：保证两次发送之间至少 minConsumeInterval，防止状态抖动时"一出溜"全发
  const lastConsumeAtRef = useRef(0);
  const consumeLockRef = useRef(false);
  const consumeTimerRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<number | null>(null);

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

  // UI 发送入口：活跃则入队，否则真正发送（透传全部参数）
  const trySend = useCallback(
    (messageInfo: string, files?: UploadFileInfo[], ...rest: any[]) => {
      if (isConversationActive) {
        messageQueue.enqueue({ text: messageInfo, files });
        return;
      }
      (sendMessage as SendMessage)(
        messageInfo,
        files,
        ...(rest as [any, any, any]),
      );
    },
    [isConversationActive, messageQueue, sendMessage],
  );

  // 切换会话时清空队列并重置消费锁
  useEffect(() => {
    messageQueue.clearQueue();
    consumeLockRef.current = false;
    clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // 会话消息重新进入处理中（Loading/Incomplete）时释放消费锁、清定时器。
  // 关键：用纯 isConversationActive 而非合并 isActive，避免 taskStatus 抖动。
  useEffect(() => {
    convActiveRef.current = isConversationActive;
    if (isConversationActive) {
      consumeLockRef.current = false;
      clearTimers();
    }
  }, [isConversationActive, clearTimers]);

  // 有待处理 intervention（ask/question/审批）时，取消任何待消费定时器并释放锁，
  // 暂停队列消费；待用户提交 intervention、会话再次回到空闲后由 auto-consume 恢复。
  useEffect(() => {
    if (hasPendingIntervention) {
      clearTimers();
      consumeLockRef.current = false;
    }
  }, [hasPendingIntervention, clearTimers]);

  // 自动消费：纯 isConversationActive 由 true -> false（消息真正流转完成）且队列非空时，
  // 延迟发送队首。用此信号而非合并 isActive，可避免 taskStatus 状态机切换的中间空白误触发。
  useEffect(() => {
    const wasActive = prevConvActiveRef.current;
    const wasPending = prevPendingRef.current;
    const wasBlocked = wasActive || wasPending;
    prevConvActiveRef.current = isConversationActive;
    prevPendingRef.current = hasPendingIntervention;

    // 触发条件：从阻塞（会话活跃 OR intervention pending）转为完全空闲。
    // 这样 intervention 解除后（即使 isConversationActive 一直为 false）也能恢复消费。
    if (
      wasBlocked &&
      !isConversationActive &&
      !hasPendingIntervention &&
      messageQueue.hasQueuedMessages &&
      !consumeLockRef.current
    ) {
      // 最后一条消息出错时暂停消费，等待用户处理
      const lastMessage = messageList?.[messageList.length - 1];
      if (lastMessage?.status === MessageStatusEnum.Error) {
        return;
      }

      consumeLockRef.current = true;
      clearTimers();

      // 距上次实际消费的剩余冷却时间：保证两次发送之间至少 minConsumeInterval，
      // 即使会话状态快速抖动（true→false 反复）也不会"一出溜"全发
      const elapsed = Date.now() - lastConsumeAtRef.current;
      const wait = Math.max(minIntervalRef.current - elapsed, 0);

      consumeTimerRef.current = window.setTimeout(() => {
        consumeTimerRef.current = null;
        // 延迟期间消息又进入处理中（例如队首已发出、新的一轮流式开始），等待下一轮完成
        if (convActiveRef.current) {
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

      // 兜底释放锁，避免异常卡死
      releaseTimerRef.current = window.setTimeout(() => {
        releaseTimerRef.current = null;
        if (consumeLockRef.current && !convActiveRef.current) {
          consumeLockRef.current = false;
        }
      }, 2000);
    }
  }, [
    isConversationActive,
    hasPendingIntervention,
    messageQueue.hasQueuedMessages,
    messageQueue.dequeueFirst,
    messageList,
    sendMessage,
    clearTimers,
  ]);

  // 卸载清理
  useEffect(() => () => clearTimers(), [clearTimers]);

  // 立即发送：移到队首并停止当前会话，停止后会由 auto-consume 自动发送
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

  // 编辑：从队列移除并返回，由调用方触发回填
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
  };
};
