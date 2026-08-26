/**
 * nuwaclaw 宿主命令响应层（host→guest 入站通道的 nuwax 侧消费端）。
 *
 * 与 nuwaClawTheme 同范式：独立模块、仅桌面端生效、浏览器端 no-op。
 * nuwaclaw 工具栏等触发的命令经 webviewPerfBridge 转发到 nuwax，本模块注册
 * 回调并按命令类型分发到对应业务能力（当前：toggle-second-menu → layout model
 * 的 setIsSecondMenuCollapsed）。
 *
 * 设计：handlers 由调用方（DynamicMenusLayout）从 useModel('layout') 取得后传入，
 * 本模块不直接依赖 umi model，保持纯函数可测性。注册的回调固定为 handleHostCommand，
 * 内部经 currentHandlers 读最新 handlers，故 handlers 变化无需重新注册。
 */
import { nuwaClawHost } from '@/utils/nuwaClawBridge';

/** 宿主命令需要驱动的业务能力（由调用方注入）。 */
export interface NuwaClawHostEventHandlers {
  /** 应用二级菜单收起态（layout model 的 setIsSecondMenuCollapsed）。 */
  setSecondMenuCollapsed: (collapsed: boolean) => void;
}

/** 最近一次注入的 handlers（handleHostCommand 闭包读取，保证读到最新）。 */
let currentHandlers: NuwaClawHostEventHandlers | null = null;

/** 宿主命令分发：按 payload.type 路由到对应业务能力。 */
function handleHostCommand(payload: HostCommand): void {
  if (!payload || typeof payload !== 'object') return;
  switch (payload.type) {
    case 'toggle-second-menu':
      currentHandlers?.setSecondMenuCollapsed(!!payload.collapsed);
      break;
    default:
      console.warn(
        '[nuwaClawHostEvents] unknown host command type',
        (payload as HostCommand)?.type,
      );
  }
}

/**
 * 初始化 nuwaclaw 宿主命令监听（仅桌面端生效：浏览器无桥时 onHostCommand 返回 false）。
 * 在能取得 layout model 的组件（DynamicMenusLayout）mount 时调用一次。
 * handlers 变化时仅更新 currentHandlers，无需重新注册回调。返回 dispose 注销。
 */
export function initNuwaClawHostEvents(
  handlers: NuwaClawHostEventHandlers,
): () => void {
  currentHandlers = handlers;
  nuwaClawHost.events.onHostCommand(handleHostCommand);
  return () => {
    nuwaClawHost.events.onHostCommand(null);
    currentHandlers = null;
  };
}
