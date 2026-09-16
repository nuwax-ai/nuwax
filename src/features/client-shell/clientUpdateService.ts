import { hostBridge, isDesktopHost } from '@/utils/hostBridge';

/**
 * 宿主客户端更新状态服务（logo 旁版本徽标消费）。
 *
 * 数据源：hostBridge.updater.getState()（壳主进程 autoUpdater 单例）。
 * 主动拉取 + 自适应轮询——下载中/检查中 2s，其余 30s；状态变化即时通知订阅者。
 * 浏览器 / 旧宿主（无 updater 命名空间）available() 为 false，徽标整体隐藏。
 */

export type ClientUpdateListener = (state: ClientUpdateState | null) => void;

const ACTIVE_POLL_INTERVAL_MS = 2_000;
const IDLE_POLL_INTERVAL_MS = 30_000;

let state: ClientUpdateState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;
const listeners = new Set<ClientUpdateListener>();

function notify(): void {
  listeners.forEach((listener) => listener(state));
}

function schedule(): void {
  if (timer) clearTimeout(timer);
  const active =
    state?.status === 'downloading' || state?.status === 'checking';
  timer = setTimeout(
    () => {
      timer = null;
      void refresh();
    },
    active ? ACTIVE_POLL_INTERVAL_MS : IDLE_POLL_INTERVAL_MS,
  );
}

async function refresh(): Promise<void> {
  if (!isAvailable()) return;
  const next = await hostBridge.updater.getState();
  if (next && typeof next === 'object') {
    state = next;
    notify();
  }
  if (started) schedule();
}

/** 宿主更新能力是否可用（桌面宿主 + 新壳 updater 命名空间都在场）。 */
export function isAvailable(): boolean {
  return (
    isDesktopHost() &&
    typeof window.NuwaClawBridge?.updater?.getState === 'function'
  );
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
  if (started || !isAvailable()) return;
  started = true;
  void refresh();
}

export function stop(): void {
  started = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/**
 * 触发下载：本地先乐观切到 downloading（徽标即刻变圆环），随后轮询校正；
 * 宿主拒绝/失败时回查真实状态。
 */
export async function download(): Promise<boolean> {
  if (!isAvailable()) return false;
  if (state) {
    state = { ...state, status: 'downloading' };
    notify();
  }
  // 不信任包装层布尔语义：自行收敛 success 字段（旧宿主怪异回包防御）
  const res = await hostBridge.updater.download();
  const ok = !!res?.success;
  await refresh();
  return ok;
}

/** 重启并安装（仅 downloaded 状态有意义）。 */
export async function install(): Promise<void> {
  await hostBridge.updater.install();
}

/** 测试隔离：复位模块态。 */
export function __resetForTest(): void {
  stop();
  state = null;
  listeners.clear();
}
