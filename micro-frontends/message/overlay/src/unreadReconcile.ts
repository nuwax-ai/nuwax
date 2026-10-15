import { useChatStore } from './store/chat';

/** 与源仓 reconcilePoll 的消息对账同一量级；总数接口是 O(1)，且服务端读到漂移时会自愈。 */
export const UNREAD_RECONCILE_INTERVAL_MS = 45_000;

function reconcileUnreadTotal(): void {
  if (document.visibilityState !== 'visible') return;
  const state = useChatStore.getState();
  if (state.userId === null || state.userId === undefined) return;
  void state.refreshUnreadTotal().catch(() => undefined);
}

/**
 * 源仓所有对账（轮询、回前台、重连）都不刷未读总数，宿主红点会停在旧值，
 * 且 IM 隐藏保活时没有可见性事件可依赖；这里补周期与回前台两个触发点。
 * 返回停止函数，卸载时必须调用。
 */
export function startUnreadReconcile(): () => void {
  const timer = window.setInterval(
    reconcileUnreadTotal,
    UNREAD_RECONCILE_INTERVAL_MS,
  );
  document.addEventListener('visibilitychange', reconcileUnreadTotal);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', reconcileUnreadTotal);
  };
}
