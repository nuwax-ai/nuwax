import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { loadQueue, saveQueue } from './queueStorage';
import type { QueuedMessage } from './types';

/**
 * 待发送消息队列（按 conversationId 持久化到 localStorage）。
 * 传入 conversationId 时：mount / 切换会话自动恢复对应队列，任何变更即写回；
 * 不传时退化为纯内存队列。
 */
export const useMessageQueue = (conversationId?: string | number | null) => {
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const [queue, setQueue] = useState<QueuedMessage[]>(() =>
    loadQueue(conversationId),
  );
  const queueRef = useRef<QueuedMessage[]>(queue);

  const updateQueue = useCallback(
    (updater: (prev: QueuedMessage[]) => QueuedMessage[]) => {
      setQueue((prev) => {
        const next = updater(prev);
        queueRef.current = next;
        saveQueue(conversationIdRef.current, next);
        return next;
      });
    },
    [],
  );

  // 切换会话：同步加载持久化队列，避免 effect 延迟导致旧会话队列误消费
  useLayoutEffect(() => {
    const loaded = loadQueue(conversationId);
    queueRef.current = loaded;
    setQueue(loaded);
  }, [conversationId]);

  const enqueue = useCallback(
    (item: Omit<QueuedMessage, 'id' | 'queuedAt'>) => {
      const newItem: QueuedMessage = {
        ...item,
        id: `queued_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        queuedAt: new Date(),
      };
      updateQueue((prev) => [...prev, newItem]);
    },
    [updateQueue],
  );

  /** 将消息插入到队列头部（用于"立即发送"场景） */
  const prepend = useCallback(
    (item: Omit<QueuedMessage, 'id' | 'queuedAt'>) => {
      const newItem: QueuedMessage = {
        ...item,
        id: `queued_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        queuedAt: new Date(),
      };
      updateQueue((prev) => [newItem, ...prev]);
    },
    [updateQueue],
  );

  const remove = useCallback(
    (id: string) => {
      updateQueue((prev) => prev.filter((item) => item.id !== id));
    },
    [updateQueue],
  );

  const dequeueForEdit = useCallback(
    (id: string): QueuedMessage | undefined => {
      const found = queueRef.current.find((item) => item.id === id);
      if (found) {
        updateQueue((prev) => prev.filter((item) => item.id !== id));
      }
      return found;
    },
    [updateQueue],
  );

  const dequeueFirst = useCallback((): QueuedMessage | undefined => {
    const current = queueRef.current;
    if (current.length === 0) return undefined;
    const first = current[0];
    updateQueue((prev) => prev.slice(1));
    return first;
  }, [updateQueue]);

  const clearQueue = useCallback(() => updateQueue(() => []), [updateQueue]);

  /** 拖拽排序：把 fromIndex 处的项移动到 toIndex */
  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateQueue((prev) => {
        if (
          fromIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex < 0 ||
          toIndex >= prev.length ||
          fromIndex === toIndex
        ) {
          return prev;
        }
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [updateQueue],
  );

  return {
    queue,
    hasQueuedMessages: queue.length > 0,
    enqueue,
    prepend,
    remove,
    dequeueForEdit,
    dequeueFirst,
    clearQueue,
    reorder,
  };
};
