import { EVENT_TYPE } from '@/constants/event.constants';
import {
  getCurrentLoginStatus,
  subscribeLoginStatus,
} from '@/services/userService';
import type { HostImUnreadSnapshot } from '@/types/interfaces/im';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { hostBridge } from '@/utils/hostBridge';

let unreadCount = 0;
const unreadListeners = new Set<() => void>();
let disconnectCurrent: (() => void) | undefined;

function updateUnreadCount(total: number): void {
  if (!Number.isSafeInteger(total) || total < 0 || total === unreadCount)
    return;
  unreadCount = total;
  unreadListeners.forEach((listener) => listener());
}

/** 导航只订阅展示值；商业客户端取壳层值，普通 Web 取 IM 实例值。 */
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
      if (!hostBridge.im.hasNativeUnread()) updateUnreadCount(0);
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
        if (!isCurrent()) return;
        eventBus.emit(event.eventType, event.payload);
        if (
          event.eventType === 'chat_start' ||
          event.eventType === EVENT_TYPE.ChatFinished
        ) {
          // 项目面板已有开始/结束处理器；无 ID 的刷新通知只更新导航任务列表。
          eventBus.emit(EVENT_TYPE.RefreshConversationList);
        }
      }),
    );
  }
  if (
    !hostBridge.im.hasNativeUnread() &&
    typeof im.onUnreadChange === 'function'
  ) {
    unsubscribers.push(
      im.onUnreadChange(({ total }) => {
        if (isCurrent()) updateUnreadCount(total);
      }),
    );
  }
  // 先订阅再读快照，覆盖宿主晚挂载、未读数尚未再次变化的情况。
  if (
    !hostBridge.im.hasNativeUnread() &&
    isCurrent() &&
    typeof im.getSnapshot === 'function'
  ) {
    updateUnreadCount(im.getSnapshot().unreadTotal);
  }
  return dispose;
}

/** 壳已有独立 WS；这里只接展示事件，不建立连接、请求 unread-total 或轮询。 */
export function subscribeNativeImUnread(): () => void {
  if (!hostBridge.im.hasNativeUnread()) return () => undefined;
  let disposed = false;
  let generation = 0;
  let unsubscribe = () => {};
  const clear = () => {
    generation += 1;
    unsubscribe();
    unsubscribe = () => {};
    updateUnreadCount(0);
  };
  const connect = async () => {
    clear();
    if (disposed || !getCurrentLoginStatus()) return;
    const currentGeneration = generation;
    const isCurrent = () =>
      !disposed && generation === currentGeneration && getCurrentLoginStatus();
    let latest: HostImUnreadSnapshot | null = null;
    let eventReceived = false;
    const apply = (snapshot: HostImUnreadSnapshot | null) => {
      if (!isCurrent()) return;
      if (snapshot === null) {
        latest = null;
        updateUnreadCount(0);
        return;
      }
      if (
        ![
          snapshot.sessionGeneration,
          snapshot.revision,
          snapshot.total,
          snapshot.dndTotal,
        ].every((value) => Number.isSafeInteger(value) && value >= 0) ||
        !Number.isSafeInteger(snapshot.total + snapshot.dndTotal)
      )
        return;
      if (
        latest &&
        (snapshot.sessionGeneration < latest.sessionGeneration ||
          (snapshot.sessionGeneration === latest.sessionGeneration &&
            snapshot.revision <= latest.revision))
      )
        return;
      latest = snapshot;
      updateUnreadCount(snapshot.total + snapshot.dndTotal);
    };
    try {
      // 文档先与当前账号握手，再登记推送目标。
      const context = await hostBridge.auth.getContext();
      if (!context || !isCurrent()) return;
      unsubscribe = hostBridge.im.onUnreadChanged((snapshot) => {
        eventReceived = true;
        apply(snapshot);
      });
      const snapshot = await hostBridge.im.getUnreadSnapshot();
      // invoke 回包可能晚于更新/清零事件；优先保留订阅收到的最新值。
      if (!eventReceived) apply(snapshot);
    } catch {
      // 桥失败保留最后成功的展示值，下一次账号初始化重新接入。
    }
  };
  const offLogin = subscribeLoginStatus(() => {
    void connect();
  });
  eventBus.on(EVENT_NAMES.AUTH_SESSION_CLEARED, clear);
  void connect();
  return () => {
    disposed = true;
    offLogin();
    eventBus.off(EVENT_NAMES.AUTH_SESSION_CLEARED, clear);
    clear();
  };
}
