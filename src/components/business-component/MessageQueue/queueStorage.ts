import type { QueuedMessage } from './types';

const STORAGE_PREFIX = 'msg_queue:';

/**
 * 持久化队列的有效期（ms）。加载时丢弃超过该时长的陈旧项，
 * 避免几小时前排队的消息在刷新恢复后被自动消费发出。
 */
const QUEUE_TTL_MS = 24 * 60 * 60 * 1000;

const getStorageKey = (conversationId: string | number) =>
  `${STORAGE_PREFIX}${conversationId}`;

/**
 * 读取并恢复某会话的持久化队列：
 * - 还原 queuedAt 为 Date
 * - 过滤超过 TTL 的陈旧项与结构非法项
 * - localStorage 不可用 / 解析失败时安全降级为空队列
 */
export const loadQueue = (
  conversationId: string | number | null | undefined,
): QueuedMessage[] => {
  if (conversationId === null || conversationId === undefined) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(conversationId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed
      .map((item) => ({ ...item, queuedAt: new Date(item?.queuedAt) }))
      .filter(
        (item): item is QueuedMessage =>
          typeof item?.id === 'string' &&
          typeof item?.text === 'string' &&
          item.queuedAt instanceof Date &&
          !Number.isNaN(item.queuedAt.getTime()) &&
          now - item.queuedAt.getTime() <= QUEUE_TTL_MS,
      );
  } catch {
    return [];
  }
};

/**
 * 持久化某会话的队列。空队列直接删除存储键，避免残留空记录。
 * localStorage 不可用 / 配额超限时静默降级（仅内存）。
 */
export const saveQueue = (
  conversationId: string | number | null | undefined,
  queue: QueuedMessage[],
): void => {
  if (conversationId === null || conversationId === undefined) return;
  try {
    const key = getStorageKey(conversationId);
    if (!queue.length) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(queue));
  } catch {
    // ignore: localStorage 不可用或配额超限，降级为纯内存队列
  }
};
