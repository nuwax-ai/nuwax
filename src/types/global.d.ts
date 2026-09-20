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
 * 由 nuwaclaw 工具栏 / 壳层快捷键触发，经 webviewPerfBridge 转发，
 * nuwax 侧 hostBridgeEvents 响应。新增命令类型在此扩展联合成员。
 */
type HostCommand =
  /** 收起/展开二级菜单 */
  | {
      type: 'toggle-second-menu';
      /** true=收起，false=展开 */
      collapsed: boolean;
    }
  /** 新建任务（壳层接管 ⌘N/Ctrl+N：浏览器保留键页面收不到，壳 before-input-event 拦截后下发） */
  | {
      type: 'new-task';
    }
  /** 打开全局搜索（壳应用菜单「文件 → 搜索」，桌面端 ⌘K/Ctrl+K 菜单化触发；打开 SidebarSearchModal） */
  | {
      type: 'open-search';
    }
  /** 休眠控制：宿主可见性变化（锁屏/最小化/托盘隐藏/恢复）。壳 hostActivity 服务沿状态变化沿下发 */
  | {
      type: 'host-activity';
      /** true=宿主可见（恢复轮询并立即补拉）；false=不可见（暂停后台轮询） */
      visible: boolean;
    };

/**
 * nuwax → nuwaclaw 壳的主题同步协议（guest→host 通道）。
 * 女娲主题生效/让位时由 brandTheme 推送，壳侧据此给自己的 antd tokens /
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

interface TitlebarDragRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 宿主客户端更新状态（桥 updater.getState 回包；status 语义与壳 UpdateState 一致）。 */
interface ClientUpdateState {
  status:
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error';
  /** 宿主客户端当前版本（徽标常显版本号）。 */
  hostVersion: string;
  /** 目标版本（available 及之后的状态存在）。 */
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  progress?: {
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  };
  error?: string;
  canAutoUpdate?: boolean;
  isReadOnlyVolumeError?: boolean;
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
      /** 企业登录：切换客户端后端域名并重新初始化（仅壳内有效） */
      configureServerHost?: (
        host: string,
      ) => Promise<{ success: boolean; serverHost?: string; error?: string }>;
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
      /** 打开宿主壳「客户端设置」弹窗（设置 UI 由壳 renderer 承载；旧版宿主无此能力）。 */
      openClientSettings?: () => Promise<{ success: boolean; error?: string }>;
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
      /** 上报 webview 顶部明确空白区；主窗口拖拽层由壳渲染。 */
      setTitlebarDragRegions?: (regions: TitlebarDragRegion[]) => void;
    };
    // nuwax→nuwaclaw 标题栏手势通道：guest 命中判定（mousedown 目标为空白）后
    // 请求壳执行原生窗口拖拽/双击缩放——拖拽层不再常驻盖在 webview 上，页面
    // 任何控件点击零吞没（2026-09-17 架构切换：事件时判定替代预计算矩形挖洞）
    titlebar?: {
      /** 空白处按下：请求主进程开始跟随光标移动窗口（mouseup/失焦由 guest 补发 end）。 */
      beginDrag?: () => void;
      /** 结束拖拽会话（mouseup / blur / 按键异常时补发）。 */
      endDrag?: () => void;
      /** 空白处双击：切换最大化/还原。 */
      toggleMaximize?: () => void;
    };
    // nuwax→nuwaclaw 壳语言同步通道（壳 UI 文案/主进程语言跟随 webview 多语言设置）
    i18n?: {
      /** 推送当前语言（如 en-US / zh-CN；fire-and-forget，失败静默）。 */
      syncLang?: (lang: string) => void;
    };
    // nuwaclaw 客户端宿主注入：宿主自身更新状态与动作（logo 旁版本徽标消费；
    // 与壳关于页共用主进程同一更新器；旧宿主无此命名空间，feature-detect 后隐藏徽标）
    updater?: {
      /** 当前更新状态 + 宿主客户端版本（hostVersion）。 */
      getState?: () => Promise<ClientUpdateState | null>;
      /** 触发一次更新检查（与关于页同源）。 */
      check?: () => Promise<{ hasUpdate?: boolean; error?: string } | null>;
      /** 下载更新（幂等）。 */
      download?: () => Promise<{ success: boolean; error?: string }>;
      /** 重启并安装（仅 downloaded 状态有意义）。 */
      install?: () => Promise<{ success: boolean; error?: string }>;
    };
    // nuwax→nuwaclaw 壳页面元信息上报（构建版本，关于页「界面版本」展示）
    meta?: {
      /** 上报前端构建信息（appVersion 来自构建期生成的版本常量）。 */
      syncWebInfo?: (payload: { appVersion: string; gitHash?: string }) => void;
    };
    // nuwaclaw 客户端宿主注入：宿主身份只读信息（host→guest，构建期注入非 IPC）
    host?: {
      /** 宿主产品标识：nuwaclaw（社区版）/ nuwax（商业版；存量宿主历史值 nuwawork）。 */
      getProduct?: () => string;
    };
  };
}
