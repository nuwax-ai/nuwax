import type { QueuedMessage } from '@/types/interfaces/messageQueue';
import { useCallback, useRef, useState } from 'react';

export const useMessageQueue = () => {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const queueRef = useRef<QueuedMessage[]>([]);

  const updateQueue = useCallback(
    (updater: (prev: QueuedMessage[]) => QueuedMessage[]) => {
      setQueue((prev) => {
        const next = updater(prev);
        queueRef.current = next;
        return next;
      });
    },
    [],
  );

  const enqueue = useCallback(
    (item: Omit<QueuedMessage, 'id' | 'queuedAt'>) => {
      const newItem: QueuedMessage = {
        ...item,
        id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  return {
    queue,
    hasQueuedMessages: queue.length > 0,
    enqueue,
    prepend,
    remove,
    dequeueForEdit,
    dequeueFirst,
    clearQueue,
  };
};
