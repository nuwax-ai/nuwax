import { subscribeHostVisibility } from '@/services/hostVisibility';
import { hostBridge, isDesktopHost } from '@/utils/hostBridge';

/**
 * 宿主客户端更新状态服务（logo 旁版本徽标消费）。
 *
 * 数据源：hostBridge.updater.getState()（壳主进程 autoUpdater 单例）。
 * 宿主状态推送优先，下载/检查/安装中 2s、其余 30s 轮询兜底。
 * 前台/网络恢复时补查服务器（5 分钟节流），打开更新日志时强制补查。
 * 浏览器 / 旧宿主（无 updater 命名空间）available() 为 false，徽标整体隐藏。
 */

export type ClientUpdateListener = (state: ClientUpdateState | null) => void;

const ACTIVE_POLL_INTERVAL_MS = 2_000;
const IDLE_POLL_INTERVAL_MS = 30_000;
const FOREGROUND_CHECK_INTERVAL_MS = 5 * 60_000;

let state: ClientUpdateState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;
let checkTask: Promise<void> | null = null;
let lastCheckAt: number | null = null;
let unsubscribeHostVisibility: (() => void) | undefined;
let unsubscribeState: (() => void) | undefined;
let refreshRevision = 0;
const listeners = new Set<ClientUpdateListener>();

function notify(): void {
  listeners.forEach((listener) => listener(state));
}

/** 宿主更新能力是否可用（桌面宿主 + 新壳 updater 命名空间都在场）。 */
export function isAvailable(): boolean {
  return (
    isDesktopHost() &&
    typeof window.NuwaClawBridge?.updater?.getState === 'function'
  );
}

async function refresh(): Promise<void> {
  if (!isAvailable()) return;
  const revision = ++refreshRevision;
  try {
    const next = await hostBridge.updater.getState();
    if (revision === refreshRevision && next && typeof next === 'object') {
      state = next;
      notify();
    }
  } catch {
    // 更新退出时桥可能先断开；保留最后状态，仍在运行时由下次轮询恢复。
  }
}

// 轮询只在本层续约；单次 refresh 不再隐式创建 timer，stop 后不会重新启动。
function schedule(): void {
  if (!started) return;
  if (timer) clearTimeout(timer);
  const active =
    state?.status === 'downloading' ||
    state?.status === 'checking' ||
    state?.status === 'installing';
  timer = setTimeout(
    () => {
      timer = null;
      void refresh().then(schedule);
    },
    active ? ACTIVE_POLL_INTERVAL_MS : IDLE_POLL_INTERVAL_MS,
  );
}

/** 静默核对通道最新信息；检查完成后立即读取宿主状态，无需等待下一轮轮询。 */
export function checkLatest(force = true): Promise<void> {
  if (!isAvailable()) return Promise.resolve();
  if (checkTask) return checkTask;
  if (
    state?.status === 'downloading' ||
    state?.status === 'downloaded' ||
    state?.status === 'installing' ||
    (!force &&
      lastCheckAt !== null &&
      Date.now() - lastCheckAt < FOREGROUND_CHECK_INTERVAL_MS)
  )
    return Promise.resolve();
  lastCheckAt = Date.now();
  checkTask = Promise.resolve()
    .then(() => hostBridge.updater.check())
    .catch(() => {
      // 自动刷新失败保留已知版本，下载前由宿主再次核对目标。
    })
    .then(refresh)
    .finally(() => {
      checkTask = null;
      schedule();
    });
  return checkTask;
}

function onForeground(): void {
  if (
    !started ||
    document.visibilityState === 'hidden' ||
    navigator.onLine === false
  )
    return;
  // 关于页可能已经查到新版，先读取缓存，再按节流规则补查服务器。
  void refresh().then(() => checkLatest(false));
}

export function getState(): ClientUpdateState | null {
  return state;
}

/** 订阅状态变化（注册时立即回调一次当前值）；返回注销函数。 */
export function subscribe(listener: ClientUpdateListener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

/** 启动轮询（幂等；不可用环境 no-op）。首个订阅者挂载时调用。 */
export function start(): void {
  if (!isAvailable()) return;
  if (started) {
    onForeground();
    return;
  }
  started = true;
  unsubscribeState = hostBridge.updater.onStateChange((next) => {
    refreshRevision += 1;
    state = next;
    if (next.status === 'available' || next.status === 'not-available') {
      lastCheckAt = Date.now();
    }
    notify();
    schedule();
  });
  window.addEventListener('focus', onForeground);
  window.addEventListener('online', onForeground);
  document.addEventListener('visibilitychange', onForeground);
  unsubscribeHostVisibility = subscribeHostVisibility((visible) => {
    if (visible) onForeground();
  });
  // 启动首查由宿主统一调度，前端首次挂载只同步状态，避免重复请求。
  void refresh().then(schedule);
}

export function stop(): void {
  started = false;
  window.removeEventListener('focus', onForeground);
  window.removeEventListener('online', onForeground);
  document.removeEventListener('visibilitychange', onForeground);
  unsubscribeHostVisibility?.();
  unsubscribeHostVisibility = undefined;
  unsubscribeState?.();
  unsubscribeState = undefined;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/**
 * 触发下载（installAfterDownload 宿主会继续安装）：乐观切到 downloading，随后轮询校正；
 * 宿主拒绝/失败时回查真实状态。
 */
export async function download(): Promise<boolean> {
  if (!isAvailable()) return false;
  if (state) {
    state = {
      ...state,
      status: 'downloading',
      error: undefined,
      progress: undefined,
    };
    notify();
  }
  if (started) schedule();
  // 不信任包装层布尔语义：自行收敛 success 字段（旧宿主怪异回包防御）
  let ok = false;
  try {
    const res = await hostBridge.updater.download();
    ok = !!res?.success;
  } catch (error) {
    if (state) {
      state = {
        ...state,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
      notify();
    }
  }
  await refresh();
  schedule();
  return ok;
}

/**
 * 重启并安装；一键策略可按需补齐下载，旧宿主须先下载。
 * 透传宿主执行结果：success 后宿主进程将退出（清理+quitAndInstall 有数秒~数十秒空窗），
 * 失败（dev 包/MSI/宿主拒绝）由调用方浮出错误。
 */
export async function install(): Promise<{ success: boolean; error?: string }> {
  const res = await hostBridge.updater.install();
  return { success: !!res?.success, error: res?.error };
}

/** 测试隔离：复位模块态。 */
export function __resetForTest(): void {
  stop();
  state = null;
  checkTask = null;
  lastCheckAt = null;
  refreshRevision += 1;
  listeners.clear();
}
