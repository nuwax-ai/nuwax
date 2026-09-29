import {
  getCurrentLoginStatus,
  subscribeLoginStatus,
} from '@/services/userService';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';

let unreadCount = 0;
const unreadListeners = new Set<() => void>();
let disconnectCurrent: (() => void) | undefined;

function updateUnreadCount(total: number): void {
  if (!Number.isSafeInteger(total) || total < 0 || total === unreadCount)
    return;
  unreadCount = total;
  unreadListeners.forEach((listener) => listener());
}

/** 导航只订阅展示值；IM 连接与事件订阅归宿主实例所有。 */
export const imUnreadState = {
  getSnapshot: (): number => unreadCount,
  subscribe(listener: () => void): () => void {
    unreadListeners.add(listener);
    return () => unreadListeners.delete(listener);
  },
};

/** 挂载完成后接入；返回的退订函数也负责清理当前账号的展示值。 */
export function subscribeImEvents(): () => void {
  disconnectCurrent?.();
  const im = window.__im;
  if (!getCurrentLoginStatus() || !im) return () => {};

  let disposed = false;
  const unsubscribers: Array<() => void> = [];
  const isCurrent = () => !disposed && getCurrentLoginStatus();
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    if (disconnectCurrent === dispose) {
      disconnectCurrent = undefined;
      updateUnreadCount(0);
    }
  };
  disconnectCurrent = dispose;

  unsubscribers.push(
    subscribeLoginStatus(() => {
      if (!getCurrentLoginStatus()) dispose();
    }),
  );
  eventBus.on(EVENT_NAMES.AUTH_SESSION_CLEARED, dispose);
  unsubscribers.push(() =>
    eventBus.off(EVENT_NAMES.AUTH_SESSION_CLEARED, dispose),
  );

  if (typeof im.onCustomEvent === 'function') {
    unsubscribers.push(
      im.onCustomEvent((event) => {
        // IM 只发布 payload；消费标记仍由 batch 自己负责。
        if (isCurrent()) eventBus.emit(event.eventType, event.payload);
      }),
    );
  }
  if (typeof im.onUnreadChange === 'function') {
    unsubscribers.push(
      im.onUnreadChange(({ total }) => {
        if (isCurrent()) updateUnreadCount(total);
      }),
    );
  }
  // 先订阅再读快照，覆盖宿主晚挂载、未读数尚未再次变化的情况。
  if (isCurrent() && typeof im.getSnapshot === 'function') {
    updateUnreadCount(im.getSnapshot().unreadTotal);
  }
  return dispose;
}
