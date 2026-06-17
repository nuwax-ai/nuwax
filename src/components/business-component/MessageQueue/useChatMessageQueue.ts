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
  /** 会话是否活跃（与发送按钮状态一致：isConversationActive || taskStatus === EXECUTING） */
  isActive: boolean;
  messageList: MessageInfo[];
  /** 当前会话 ID，切换时清空队列 */
  conversationId: any;
  /** 真正发送消息（会话空闲时调用） */
  sendMessage: SendMessage;
  /** 停止当前会话（"立即发送"时调用，停止后会触发 auto-consume） */
  runStopConversation: (id: any) => void;
}

export const useChatMessageQueue = ({
  isActive,
  messageList,
  conversationId,
  sendMessage,
  runStopConversation,
}: UseChatMessageQueueParams) => {
  const messageQueue = useMessageQueue();

  const isActiveRef = useRef(isActive);
  const prevIsActiveRef = useRef(isActive);
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
      if (isActive) {
        messageQueue.enqueue({ text: messageInfo, files });
        return;
      }
      (sendMessage as SendMessage)(
        messageInfo,
        files,
        ...(rest as [any, any, any]),
      );
    },
    [isActive, messageQueue, sendMessage],
  );

  // 切换会话时清空队列并重置消费锁
  useEffect(() => {
    messageQueue.clearQueue();
    consumeLockRef.current = false;
    clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // 会话重新进入活跃状态时释放消费锁
  useEffect(() => {
    isActiveRef.current = isActive;
    if (isActive) {
      consumeLockRef.current = false;
      clearTimers();
    }
  }, [isActive, clearTimers]);

  // 自动消费：会话由活跃 -> 空闲且队列非空时，延迟发送队首
  useEffect(() => {
    const wasActive = prevIsActiveRef.current;
    prevIsActiveRef.current = isActive;

    if (
      wasActive &&
      !isActive &&
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

      consumeTimerRef.current = window.setTimeout(() => {
        consumeTimerRef.current = null;
        // 延迟期间会话又变活跃，等待下一轮完成
        if (isActiveRef.current) {
          consumeLockRef.current = false;
          return;
        }
        const next = messageQueue.dequeueFirst();
        if (next) {
          sendMessage(next.text, next.files || []);
        } else {
          consumeLockRef.current = false;
        }
      }, 500);

      // 兜底释放锁，避免异常卡死
      releaseTimerRef.current = window.setTimeout(() => {
        releaseTimerRef.current = null;
        if (consumeLockRef.current && !isActiveRef.current) {
          consumeLockRef.current = false;
        }
      }, 2000);
    }
  }, [
    isActive,
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
