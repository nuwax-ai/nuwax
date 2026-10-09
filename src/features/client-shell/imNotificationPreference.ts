import { hostBridge } from '@/utils/hostBridge';

const IM_NOTIFICATION_KEY = 'nuwax-im.notify';

function readNotificationEnabled(): boolean {
  try {
    return localStorage.getItem(IM_NOTIFICATION_KEY) !== '0';
  } catch {
    return true;
  }
}

/** 不依赖 IM 页面挂载，文档就绪后恢复保存偏好，并同步其它窗口的修改。 */
export function initImNotificationPreference(): () => void {
  if (!hostBridge.im.hasNativeNotifications()) return () => undefined;
  let disposed = false;
  let generation = 0;
  // auth:getContext 将当前文档绑定到主进程，IM 偏好 IPC 必须晚于该握手。
  const ready = hostBridge.auth.getContext();
  const sync = async () => {
    const currentGeneration = ++generation;
    await ready;
    if (disposed || currentGeneration !== generation) return;
    await hostBridge.im.setNotificationEnabled(readNotificationEnabled());
  };
  void sync();
  const onStorage = (event: StorageEvent) => {
    if (event.key === IM_NOTIFICATION_KEY || event.key === null) void sync();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    disposed = true;
    generation += 1;
    window.removeEventListener('storage', onStorage);
  };
}
