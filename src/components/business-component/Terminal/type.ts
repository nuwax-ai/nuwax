import type { ITheme, Terminal } from '@xterm/xterm';

// ─── 连接状态 ────────────────────────────────────────────────────
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// ─── 主题预设 ────────────────────────────────────────────────────
export type TerminalThemePreset = 'dark' | 'light';
export type TerminalTheme = TerminalThemePreset | ITheme;

// ─── 搜索选项 ────────────────────────────────────────────────────
export interface SearchOptions {
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 是否使用正则表达式 */
  regex?: boolean;
  /** 是否全词匹配 */
  wholeWord?: boolean;
  /** 是否增量搜索 */
  incremental?: boolean;
}

/** 组件内搜索选项 state（三项均为必填布尔值） */
export type TerminalSearchOptionsState = Required<
  Pick<SearchOptions, 'caseSensitive' | 'wholeWord' | 'regex'>
>;

/** 搜索选项默认值 */
export const DEFAULT_TERMINAL_SEARCH_OPTIONS: TerminalSearchOptionsState = {
  caseSensitive: false,
  wholeWord: false,
  regex: false,
};

/** 动态加载的 xterm addon 最小能力描述 */
export interface TerminalAddonInstance {
  fit?: () => void;
  dispose?: () => void;
  findNext?: (term: string, options?: SearchOptions) => boolean;
  findPrevious?: (term: string, options?: SearchOptions) => boolean;
  clearDecorations?: () => void;
  serialize?: () => string;
}

export type TerminalAddonsMap = Map<string, TerminalAddonInstance>;

// ─── WebSocket 线缆协议 ──────────────────────────────────────────
/** plain：纯文本输入 + JSON resize；ttyd：0x30 输入帧 + '1' resize + '2'/'3' 流控 */
export type TerminalWireProtocol = 'plain' | 'ttyd';

/**
 * ttyd 下行背压配置（与官方 html 客户端 writeData 一致）。
 *
 * xterm 在大量输出时渲染变慢；通过 WebSocket 向 ttyd 发送 PAUSE/RESUME，
 * 让服务端暂时停止 pty 写入，从而控制下行流量，避免浏览器/xterm 缓冲溢出。
 *
 * @see https://github.com/tsl0922/ttyd/blob/master/html/src/components/terminal/xterm/index.ts
 */
export interface TtydFlowControlConfig {
  /** 是否启用自动 PAUSE/RESUME @default true */
  enabled?: boolean;
  /**
   * 累计写入 xterm 的字节阈值；超过后改用 term.write(data, callback) 统计 pending
   * @default 100000
   */
  limit?: number;
  /**
   * pending（未完成 write 回调数）超过该值时发送 PAUSE ('2')
   * @default 10
   */
  highWater?: number;
  /**
   * 某次 write 回调执行后 pending 低于该值时发送 RESUME ('3')
   * @default 4
   */
  lowWater?: number;
}

/** ttyd 流控默认值（与 ttyd 官方 FlowControl 一致） */
export const DEFAULT_TTYD_FLOW_CONTROL: Required<
  Pick<TtydFlowControlConfig, 'limit' | 'highWater' | 'lowWater'>
> = {
  limit: 100000,
  highWater: 10,
  lowWater: 4,
};

// ─── 重连配置 ────────────────────────────────────────────────────
export interface ReconnectConfig {
  /** 是否启用自动重连 @default true */
  enabled?: boolean;
  /** 最大重连次数 @default 5 */
  maxRetries?: number;
  /** 重连基础延迟（毫秒），使用指数退避 @default 1000 */
  retryDelay?: number;
}

// ─── 组件 Props ──────────────────────────────────────────────────
export interface XtermTerminalProps {
  /** WebSocket 连接地址 (如 "wss://example.com/terminal") */
  wsUrl?: string;
  /** WebSocket 子协议（ttyd 需传 ['tty']） */
  wsSubprotocols?: string | string[];
  /** 与后端约定的消息格式 @default 'plain' */
  wireProtocol?: TerminalWireProtocol;
  /**
   * ttyd 下行背压：通过 WebSocket 发送 PAUSE/RESUME 控制服务端 pty 输出，
   * 避免大量输出导致 xterm 缓冲溢出（仅 wireProtocol='ttyd' 生效）
   */
  ttydFlowControl?: TtydFlowControlConfig;
  /** 挂载时是否自动连接（需要 wsUrl） @default false */
  autoConnect?: boolean;
  /** 重连配置 */
  reconnect?: ReconnectConfig;

  /** 工具栏标题 */
  title?: string;

  /** 只读模式，禁用键盘输入 @default false */
  readOnly?: boolean;

  /** 主题预设 ('dark' | 'light') 或自定义 ITheme @default 'dark' */
  theme?: TerminalTheme;

  /** 字体大小（像素） @default 14 */
  fontSize?: number;
  /** 字体族 */
  fontFamily?: string;
  /** 光标是否闪烁 @default true */
  cursorBlink?: boolean;
  /** 行高倍数 @default 1.2 */
  lineHeight?: number;
  /** 回滚行数 @default 5000 */
  scrollback?: number;

  /** 启用字体连字 @default false */
  ligatures?: boolean;
  /** 启用 WebGL 渲染器（失败时回退到 canvas） @default true */
  enableWebgl?: boolean;
  /** 启用图片支持 (sixel/iTerm2) @default false */
  enableImages?: boolean;

  /**
   * 嵌入式布局（如底部面板）
   * 去掉边框、降低 min-height，并在连接后自动 fit 尺寸
   */
  embedded?: boolean;
  /** 自定义 CSS 类名 */
  className?: string;
  /** 自定义内联样式 */
  style?: React.CSSProperties;

  // ─── 回调函数 ─────────────────────────────────────────────
  /** WebSocket 连接成功时触发 */
  onConnect?: () => void;
  /** WebSocket 断开时触发 */
  onDisconnect?: (event?: CloseEvent) => void;
  /** 连接或终端出错时触发 */
  onError?: (error: Error | string) => void;
  /** 接收到数据时触发（来自 WS 或外部写入） */
  onData?: (data: string) => void;
  /** 用户键盘输入时触发 */
  onInput?: (data: string) => void;
}

/** 回调 ref 类型（与 Props 保持一致） */
export type TerminalOnConnect = NonNullable<XtermTerminalProps['onConnect']>;
export type TerminalOnDisconnect = NonNullable<
  XtermTerminalProps['onDisconnect']
>;
export type TerminalOnError = NonNullable<XtermTerminalProps['onError']>;
export type TerminalOnData = NonNullable<XtermTerminalProps['onData']>;
export type TerminalOnInput = NonNullable<XtermTerminalProps['onInput']>;

// ─── Ref 命令式 API ──────────────────────────────────────────────
export interface XtermTerminalRef {
  /** 建立 WebSocket 连接（不传参则使用 wsUrl prop） */
  connect: (url?: string) => void;
  /** 断开 WebSocket 连接 */
  disconnect: () => void;

  /** 向终端写入原始数据 */
  write: (data: string) => void;
  /** 向终端写入数据并追加换行 */
  writeln: (data: string) => void;
  /** 清空终端屏幕和回滚缓冲区 */
  clear: () => void;

  /** 聚焦终端 */
  focus: () => void;
  /** 取消聚焦 */
  blur: () => void;

  /** 打开搜索栏 */
  search: () => void;
  /** 切换搜索栏显示/隐藏 */
  toggleSearch: () => void;
  /** 关闭搜索栏并清除高亮 */
  closeSearch: () => void;
  /** 搜索栏是否可见 */
  isSearchVisible: () => boolean;
  /** 设置搜索关键词 */
  setSearchTerm: (term: string) => void;
  /** 获取当前搜索关键词 */
  getSearchTerm: () => string;
  /** 更新搜索选项 */
  setSearchOptions: (options: Partial<SearchOptions>) => void;
  /** 查找下一个匹配项（不传 term 则使用当前搜索词） */
  findNext: (term?: string, options?: SearchOptions) => boolean;
  /** 查找上一个匹配项（不传 term 则使用当前搜索词） */
  findPrevious: (term?: string, options?: SearchOptions) => boolean;
  /** 清除搜索高亮 */
  clearSearchDecorations: () => void;

  /** 切换全屏 */
  toggleFullscreen: () => Promise<void>;
  /** 是否处于全屏 */
  isFullscreen: () => boolean;

  /** 获取原始 xterm.js Terminal 实例 */
  getTerminal: () => Terminal | null;
  /** 获取当前连接状态 */
  getStatus: () => ConnectionStatus;

  /** 将当前缓冲区内容下载为 .txt 文件 */
  downloadBuffer: (filename?: string) => void;

  /**
   * 手动 PAUSE（'2'），暂停 ttyd 服务端 pty 输出。
   * 常规场景由组件根据 pending 自动背压，仅调试或特殊需求时使用。
   */
  ttydPause?: () => void;
  /** 手动 RESUME（'3'），恢复 pty 输出 */
  ttydResume?: () => void;
}
