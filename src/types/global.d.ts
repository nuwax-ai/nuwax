// interface Window {
//   publicPath?: string;
// }
declare namespace Global {
  interface Pagination {
    total: number;
    pageSize: number;
    current: number;
  }

  interface IGetList {
    pageNo: number;
    pageSize: number;
    category?: string;
    kw?: string;
    spaceId?: number;
    dataType?: string;
    justReturnSpaceData?: boolean;
  }
}

/**
 * nuwaclaw 宿主下发给 nuwax 的命令协议（跨 webview host→guest 通道）。
 * 由 nuwaclaw 工具栏触发，经 webviewPerfBridge 转发，nuwax 侧 nuwaClawHostEvents 响应。
 * 新增命令类型在此扩展 type 联合。
 */
interface HostCommand {
  /** 收起/展开二级菜单 */
  type: 'toggle-second-menu';
  /** true=收起，false=展开 */
  collapsed: boolean;
}

/**
 * nuwax → nuwaclaw 壳的主题同步协议（guest→host 通道）。
 * 女娲主题生效/让位时由 nuwaClawTheme 推送，壳侧据此给自己的 antd tokens /
 * CSS 变量叠加米白调色板，实现「原生侧（设置弹窗等）与 nuwax 统一效果」。
 * 让位时 active=false，壳回落自身 light/dark 主题。
 */
interface ShellThemePayload {
  /** 女娲主题是否生效 */
  active: boolean;
  /** 品牌主色（女娲蓝） */
  primary?: string;
  /** 主内容/容器底色 */
  bgContent?: string;
  /** 菜单/侧栏底色 */
  bgMenu?: string;
  /** 浮起面底色（菜单项 hover/选中） */
  bgElevated?: string;
  /** 主描边 */
  border?: string;
  /** 次描边 */
  borderSecondary?: string;
  /** 菜单项 hover 底色 */
  bgItemHover?: string;
}

// 扩展全局作用域（本文件为全局脚本，顶层声明直接合并到全局类型，
// 故 interface Window 不需要 declare global 包裹）
interface Window {
  Global: typeof Global;
  NuwaClawBridge?: {
    perf?: {
      enabled?: () => boolean;
      mark?: (stage: string, payload?: Record<string, unknown>) => void;
      markOnce?: (
        key: string,
        stage: string,
        payload?: Record<string, unknown>,
      ) => void;
    };
    // nuwaclaw 客户端宿主注入：ACCESS_TOKEN 双向同步（重启免登）
    auth?: {
      getToken?: () => Promise<string | null>;
      persistToken?: (token: string) => Promise<boolean>;
      clear?: () => Promise<boolean>;
    };
    // nuwaclaw 客户端宿主注入：原生能力（右键另存图片、新开独立窗口等）
    native?: {
      saveImage?: (
        url: string,
        filename?: string,
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
      /** 新开独立窗口打开站内页面（全屏页承载：智能体详情/工作流/网页应用开发/我的电脑等）。 */
      openWindow?: (
        path: string,
      ) => Promise<{ success: boolean; error?: string }>;
    };
    // nuwaclaw 宿主→nuwax 入站命令通道（contextBridge 注册回调；host 触发时 cb 在 guest 上下文执行）
    events?: {
      /** 注册/注销宿主命令回调（传 null 注销）。 */
      onHostCommand?: (cb: ((payload: HostCommand) => void) | null) => void;
    };
    // nuwax→nuwaclaw 壳主题同步通道（女娲主题生效/让位时推送，壳侧统一原生 UI 效果）
    theme?: {
      /** 推送主题状态给壳（fire-and-forget，失败静默）。 */
      syncTheme?: (payload: ShellThemePayload) => void;
    };
    // nuwax→nuwaclaw 壳布局状态同步通道（如当前页是否有二级菜单，壳据此显隐收起按钮）
    layout?: {
      /** 告知壳当前页是否存在可收起的二级菜单（fire-and-forget，失败静默）。 */
      setSecondMenuAvailable?: (available: boolean) => void;
      /** 同步二级菜单真实收起态给壳（壳工具栏 icon 以此为准，修 reload 后失同步）。 */
      setSecondMenuCollapsed?: (collapsed: boolean) => void;
    };
  };
}
