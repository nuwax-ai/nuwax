/**
 * 宿主可见性状态（「休眠控制」消费端）
 *
 * 背景（2026-09-17 实测）：Electron webview 的 document.visibilityState 不随宿主
 * 窗口最小化/托盘隐藏/锁屏变化，前端轮询感知不到「用户不在看」，锁屏挂机时
 * /api/notify/event/collect/batch 等轮询照常打后端。
 *
 * 事实源：壳主进程 hostActivity 服务（窗口事件 + powerMonitor 锁屏沿，受壳设置
 * 「休眠控制」开关门控）经 nuwax:host-command 通道下发 { type: 'host-activity',
 * visible }，由 hostBridgeEvents 统一分发到本模块。
 *
 * 语义约定：
 * - 默认 true（无桥/未收到事件/桥异常时按可见处理，轮询行为不被卡死）；
 * - 同值事件不重复通知；
 * - subscribe 不做注册即回调——消费方挂载时经 getHostVisibility() 自取初值，
 *   避免与 useRequest 自动首跑叠加出双请求；
 * - 浏览器端永远 true：宿主信号只做「额外暂停」，tab 级隐藏仍由各处
 *   pollingWhenHidden / document.hidden 原生行为管理。
 */

export type HostVisibilityListener = (visible: boolean) => void;

let visible = true;
const listeners = new Set<HostVisibilityListener>();

/** hostBridgeEvents 分发入口：处理 host-activity 命令，同值幂等。 */
export function handleHostActivityPayload(payload: {
  visible?: unknown;
}): void {
  const next = !!payload?.visible;
  if (next === visible) return;
  visible = next;
  listeners.forEach((listener) => listener(visible));
}

/** 当前宿主是否可见（浏览器端恒 true）。 */
export function getHostVisibility(): boolean {
  return visible;
}

/** 订阅宿主可见性变化；返回注销函数。不回调当前值，初值请用 getHostVisibility()。 */
export function subscribeHostVisibility(
  listener: HostVisibilityListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 测试隔离：复位模块态。 */
export function __resetForTest(): void {
  visible = true;
  listeners.clear();
}
