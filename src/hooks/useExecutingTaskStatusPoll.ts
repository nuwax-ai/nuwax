import { TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useEffect, useRef } from 'react';

const DEFAULT_POLL_INTERVAL_MS = 5000;

/** 默认检查最近 N 条消息中的 processing 执行态 */
const DEFAULT_RECENT_MESSAGE_COUNT = 5;

/** 消息列表末尾是否仍在流式输出（Loading / Incomplete） */
export function hasActiveStreamingInMessages(
  messageList: MessageInfo[] | undefined | null,
): boolean {
  if (!messageList?.length) {
    return false;
  }
  const lastMessage = messageList[messageList.length - 1];
  return (
    lastMessage.status === MessageStatusEnum.Loading ||
    lastMessage.status === MessageStatusEnum.Incomplete
  );
}

/**
 * 最近若干条消息中是否存在 processingList 仍在 EXECUTING 的块。
 * 流式 chunk 间 message.status 可能短暂为 null，但工具/页面调用仍在执行。
 */
export function hasExecutingProcessingInRecentMessages(
  messageList: MessageInfo[] | undefined | null,
  recentCount = DEFAULT_RECENT_MESSAGE_COUNT,
): boolean {
  if (!messageList?.length) {
    return false;
  }
  const recentMessages = messageList.slice(-recentCount);
  return recentMessages.some((message) =>
    message.processingList?.some(
      (item) => item.status === ProcessingEnum.EXECUTING,
    ),
  );
}

/**
 * 消息列表是否表明会话仍在流式/处理中（与 model isConversationActive 对齐的兜底信号）
 */
export function isSessionStreamBusy(
  messageList: MessageInfo[] | undefined | null,
): boolean {
  return (
    hasActiveStreamingInMessages(messageList) ||
    hasExecutingProcessingInRecentMessages(messageList)
  );
}

export interface UseExecutingTaskStatusPollOptions {
  conversationId?: number | string | null;
  taskStatus?: TaskStatus;
  messageList?: MessageInfo[];
  /** 拉取并 merge taskStatus */
  onSync: (conversationId: number | string) => void | Promise<void>;
  enabled?: boolean;
  /** 轮询间隔，默认 5s */
  intervalMs?: number;
}

/**
 * taskStatus=EXECUTING 且消息流已空闲时，轮询同步 taskStatus。
 * 兜底 ChatFinished 遗漏、后端状态延迟落库、页面长时间停留等场景。
 */
export function useExecutingTaskStatusPoll({
  conversationId,
  taskStatus,
  messageList,
  onSync,
  enabled = true,
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
}: UseExecutingTaskStatusPollOptions): void {
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const isStreaming = isSessionStreamBusy(messageList);

  useEffect(() => {
    if (
      !enabled ||
      !conversationId ||
      taskStatus !== TaskStatus.EXECUTING ||
      isStreaming
    ) {
      return;
    }

    const sync = () => {
      void onSyncRef.current(conversationId);
    };

    // 流式刚结束、task 仍 EXECUTING 时立即拉一次
    sync();

    const timer = window.setInterval(sync, intervalMs);
    return () => window.clearInterval(timer);
  }, [conversationId, taskStatus, isStreaming, enabled, intervalMs]);
}
