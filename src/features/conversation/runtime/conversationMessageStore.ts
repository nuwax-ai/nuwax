import {
  finalizeMessagesOnStreamClose,
  finalizeOwnedMessageOnStaleClose,
  markOwnedMessageStreamError,
} from '@/features/conversation/domain/messageLifecycle';
import {
  appendOutgoingConversationMessages,
  preserveOptimisticMessageTail,
  reconcileConversationSnapshotMessages,
} from '@/models/conversationInfoMessageList';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

/**
 * 新线（runtime session）的消息状态仓（双线方案 §3.2-1）。
 *
 * 合同：
 * - 一切 messageList 变更必须经本 store 的写入 API（新线内没有 setMessageList 直写，
 *   也没有 snapshot 兼容回调）；
 * - 每次写入产出不可变新数组并通知订阅者；未变化的写入保持原引用（React bail-out）；
 * - getSnapshot 引用稳定，兼容 useSyncExternalStore。
 */
export interface ConversationMessageStore {
  getSnapshot(): MessageInfo[];
  subscribe(listener: () => void): () => void;
  /** 发送时的乐观轮次追加（user + assistant Loading 占位），返回更新后列表 */
  applyOptimisticRound(
    user: MessageInfo,
    assistant: MessageInfo,
  ): MessageInfo[];
  /** SSE 投影写入（reducer 产出后的新列表），引用相同则跳过 */
  applyStreamReduction(messages: MessageInfo[]): MessageInfo[];
  /**
   * 函数式更新（React setState 形状兼容）：供 resumeController 等
   * 以 Dispatch<SetStateAction<MessageInfo[]>> 为 deps 的既有件接入新线。
   */
  update(updater: (prev: MessageInfo[]) => MessageInfo[]): MessageInfo[];
  /**
   * 轮询/恢复快照归并（乐观尾保留规则由纯函数承载）。
   * 返回是否产生了新引用（reconcile 纯函数总是构造新数组；内容等价的归并
   * 仍会触发一次通知，与旧线 model 的 reconcile 调用模式一致）。
   */
  mergeSnapshot(incoming: MessageInfo[]): boolean;
  /** 历史加载整体替换（保留本地末尾乐观消息，规则由纯函数承载） */
  replaceFromHistory(incoming: MessageInfo[]): MessageInfo[];
  /** 流结束：Loading/Incomplete → Stopped，执行中 processing → FAILED */
  finalizeOnClose(): void;
  /** 网络错误：owner 消息 → Error，其执行中 processing → FAILED */
  markStreamError(ownerId: string): void;
  /** 过期连接的迟到 close：只清理 owner 自己的消息 */
  finalizeOwnedOnStaleClose(ownerId: string): void;
  /** 定点补丁（干预补偿等） */
  patchMessage(messageId: string, patch: Partial<MessageInfo>): void;
  /** 清空（切换会话/重置） */
  reset(): void;
}

export function createConversationMessageStore(
  initial: MessageInfo[] = [],
): ConversationMessageStore {
  let messages = initial;
  const listeners = new Set<() => void>();

  const commit = (next: MessageInfo[]): MessageInfo[] => {
    if (next === messages) {
      return messages;
    }
    messages = next;
    listeners.forEach((listener) => {
      listener();
    });
    return messages;
  };

  return {
    getSnapshot: () => messages,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    applyOptimisticRound(user, assistant) {
      return commit(
        appendOutgoingConversationMessages(messages, user, assistant),
      );
    },

    applyStreamReduction(next) {
      return commit(next);
    },

    update(updater) {
      return commit(updater(messages));
    },

    mergeSnapshot(incoming) {
      const merged = reconcileConversationSnapshotMessages(messages, incoming);
      const changed = merged !== messages;
      commit(merged);
      return changed;
    },

    replaceFromHistory(incoming) {
      return commit(preserveOptimisticMessageTail(messages, incoming));
    },

    finalizeOnClose() {
      try {
        commit(finalizeMessagesOnStreamClose(messages));
      } catch (error) {
        console.error(
          '[conversationMessageStore] finalizeOnClose ERROR:',
          error,
        );
      }
    },

    markStreamError(ownerId) {
      commit(markOwnedMessageStreamError(messages, ownerId));
    },

    finalizeOwnedOnStaleClose(ownerId) {
      commit(finalizeOwnedMessageOnStaleClose(messages, ownerId));
    },

    patchMessage(messageId, patch) {
      const index = messages.findIndex((message) => message.id === messageId);
      if (index < 0) {
        return;
      }
      const next = [...messages];
      next[index] = { ...next[index], ...patch };
      commit(next);
    },

    reset() {
      commit([]);
    },
  };
}
