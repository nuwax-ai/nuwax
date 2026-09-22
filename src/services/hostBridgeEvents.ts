/**
 * nuwaclaw 宿主命令响应层（host→guest 入站通道的 nuwax 侧消费端）。
 *
 * 与 brandTheme 同范式：独立模块、仅桌面端生效、浏览器端 no-op。
 * nuwaclaw 工具栏 / 壳层快捷键触发的命令经 webviewPerfBridge 转发到 nuwax，本模块
 * 注册回调并按命令类型分发到对应业务能力（toggle-second-menu → layout model 的
 * setIsSecondMenuCollapsed；new-task → 新建任务）。
 *
 * 设计：handlers 由调用方（DynamicMenusLayout）从 useModel('layout') 取得后传入，
 * 本模块不直接依赖 umi model，保持纯函数可测性。注册的回调固定为 handleHostCommand，
 * 内部经 currentHandlers 读最新 handlers，故 handlers 变化无需重新注册。
 */
import { saveUserLang } from '@/services/i18n';
import { normalizeLang } from '@/services/i18nLangPolicy';
import {
  fetchAndApplyLangMap,
  markLangUserSet,
  setCurrentLang,
} from '@/services/i18nRuntime';
import { hostBridge } from '@/utils/hostBridge';
import { handleHostActivityPayload } from './hostVisibility';

/** 宿主命令需要驱动的业务能力（由调用方注入）。 */
export interface HostBridgeEventHandlers {
  /** 应用二级菜单收起态（layout model 的 setIsSecondMenuCollapsed）。 */
  setSecondMenuCollapsed: (collapsed: boolean) => void;
  /** 新建任务（与侧栏「新建任务」同一处理函数；壳层 ⌘N/Ctrl+N 接管下发）。 */
  createNewTask: () => void;
  /** 打开全局搜索（layout model 的 setOpenSearchModal(true)；壳应用菜单「文件 → 搜索」
   * 下发。可选：仅挂了 SidebarSearchModal 的单栏布局注入，经典布局无实体不注入。 */
  openSearch?: () => void;
}

/** 最近一次注入的 handlers（handleHostCommand 闭包读取，保证读到最新）。 */
let currentHandlers: HostBridgeEventHandlers | null = null;

/** set-lang 命令处理：归一语种 → 标记用户显式选择 → 拉取并应用字典 → 尽力持久化账号。 */
function handleSetLangPayload(lang: unknown): void {
  const normalized = normalizeLang(typeof lang === 'string' ? lang : null);
  markLangUserSet();
  // 弱网下壳约 800ms 后重载 webview：语种必须在异步拉字典前同步落定（ACTIVE_LANG
  // 立即写入），否则慢网拉取被打断→按旧语种启动→回声 syncLang(旧语种) 拖回壳（bug 2428）
  setCurrentLang(normalized);
  void (async () => {
    try {
      await fetchAndApplyLangMap(normalized, 'PC');
      try {
        await saveUserLang(normalized);
      } catch {
        // 后端持久化失败不阻断本地切换（与 web 自身语言面板同策略）
      }
    } catch (error) {
      console.error('[hostBridgeEvents] set-lang apply failed:', error);
    }
  })();
}

/** 宿主命令分发：按 payload.type 路由到对应业务能力。 */
function handleHostCommand(payload: HostCommand): void {
  if (!payload || typeof payload !== 'object') return;
  switch (payload.type) {
    case 'toggle-second-menu':
      currentHandlers?.setSecondMenuCollapsed(!!payload.collapsed);
      break;
    case 'new-task':
      currentHandlers?.createNewTask();
      break;
    case 'open-search':
      currentHandlers?.openSearch?.();
      break;
    case 'host-activity':
      // 休眠控制：壳 hostActivity 服务下发的宿主可见性沿，不依赖注入 handlers
      handleHostActivityPayload(payload);
      break;
    case 'set-lang':
      // 壳设置切语言（bug 2428）：应用语种+标记显式选择+尽力持久化到账号；
      // 壳随后重载本 webview 全量渲染新语种，持久化失败不阻断本地切换
      handleSetLangPayload(payload.lang);
      break;
    default:
      console.warn(
        '[hostBridgeEvents] unknown host command type',
        (payload as HostCommand)?.type,
      );
  }
}

/**
 * 初始化 nuwaclaw 宿主命令监听（仅桌面端生效：浏览器无桥时 onHostCommand 返回 false）。
 * 在能取得 layout model 的组件（DynamicMenusLayout）mount 时调用一次。
 * handlers 变化时仅更新 currentHandlers，无需重新注册回调。返回 dispose 注销。
 */
export function initHostBridgeEvents(
  handlers: HostBridgeEventHandlers,
): () => void {
  currentHandlers = handlers;
  hostBridge.events.onHostCommand(handleHostCommand);
  return () => {
    hostBridge.events.onHostCommand(null);
    currentHandlers = null;
  };
}
