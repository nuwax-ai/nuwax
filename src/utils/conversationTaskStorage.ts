const STORAGE_PREFIX = 'conversation_task:v1:';

export function conversationTaskKey(
  conversationId: number,
  accountId: number | string | undefined,
  tenantId: number | undefined,
  spaceId: number | undefined,
) {
  if (!conversationId || !accountId) return undefined;
  return `${STORAGE_PREFIX}${conversationId}:${encodeURIComponent(
    JSON.stringify([accountId, tenantId ?? null, spaceId ?? null]),
  )}:`;
}

export function readTaskRecord<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export function writeTaskRecord(key: string, value: unknown) {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存储不可用时继续使用当前页面内存状态。
  }
}

export function visitTaskRecords(prefix: string, visit: (key: string) => void) {
  try {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(prefix),
    );
    keys.forEach(visit);
  } catch {
    // 存储可能被浏览器禁用。
  }
}

export function clearTaskRecords(conversationId: number | string) {
  visitTaskRecords(`${STORAGE_PREFIX}${conversationId}:`, (key) =>
    writeTaskRecord(key, undefined),
  );
}
