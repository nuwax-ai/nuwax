/**
 * 「会话结束未读」蓝点纯前端 store（页面级内存态，2026-09-17 定调）。
 *
 * 语义：
 * - 会话执行结束（ChatFinished 事件）那一刻用户不在该会话里 → 记蓝点；
 * - 进入该会话（chatId 命中）→ 清除；会话再次结束后重新计时；
 * - 超 24h 自动失效：写入时顺手清理过期项并重建快照——之后若长时间无任何
 *   写入，页面上的旧蓝点最多残留到「下一次任意写入/整页刷新」，不设定时器；
 * - 整页 reload 随模块重初始化全部重置；SPA 路由切换/面板重挂载不重置
 *   （与 useHomeSectionData 的 componentCache 同生命周期口径，多标签页各自独立）。
 *
 * 本文件零 umi 依赖（vitest 可直接单测）；ChatFinished 事件接线在
 * useFinishedConversationUnread.ts（hook 层，模块级页面生命周期订阅）。
 */

/** 蓝点失效时长：自会话结束时刻起算 */
export const UNREAD_DOT_TTL_MS = 24 * 60 * 60 * 1000;

/** conversationId 归一 key（列表项 number 与事件 payload string 混用） */
const normalizeId = (id: number | string | null | undefined): string =>
  id == null ? '' : String(id);

const finishedAtMap = new Map<string, number>();
const listeners = new Set<() => void>();
let activeConversationId: string | null = null;
let snapshot: ReadonlySet<string> = new Set();

/** 清理超时蓝点并按剩余项重建快照、通知订阅方（写路径统一出口） */
function commit(now: number): void {
  for (const [id, at] of finishedAtMap) {
    if (now - at >= UNREAD_DOT_TTL_MS) finishedAtMap.delete(id);
  }
  snapshot = new Set(finishedAtMap.keys());
  listeners.forEach((listener) => listener());
}

/** 记蓝点：会话结束且结束时不在场（事件接线层保证活跃判定，此处只落账） */
export function markConversationFinished(
  conversationId: number | string,
  now: number = Date.now(),
): void {
  const id = normalizeId(conversationId);
  if (!id) return;
  finishedAtMap.set(id, now);
  commit(now);
}

/** 清蓝点：进入会话即视为已读（无命中时静默，不触发重渲染） */
export function markConversationVisited(
  conversationId: number | string,
): void {
  const id = normalizeId(conversationId);
  if (!id || !finishedAtMap.delete(id)) return;
  commit(Date.now());
}

/** 同步当前活跃会话 id（「结束时是否在场」的判定基准；不触发重渲染） */
export function setActiveConversation(
  conversationId: number | string | null | undefined,
): void {
  const id = normalizeId(conversationId);
  activeConversationId = id || null;
}

export function getActiveConversation(): string | null {
  return activeConversationId;
}

/** useSyncExternalStore 订阅入口（返回取消订阅函数） */
export function subscribeFinishedConversationUnread(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** useSyncExternalStore 快照（引用稳定，仅在写入路径重建） */
export function getFinishedConversationUnreadSnapshot(): ReadonlySet<string> {
  return snapshot;
}

/** 测试专用：重置模块内部态 */
export function __resetFinishedConversationUnreadForTest(): void {
  finishedAtMap.clear();
  listeners.clear();
  activeConversationId = null;
  snapshot = new Set();
}
