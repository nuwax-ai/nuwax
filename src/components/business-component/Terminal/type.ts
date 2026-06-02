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

// ─── WebSocket 线缆协议 ──────────────────────────────────────────
/** plain：纯文本输入 + JSON resize；ttyd：0x30 输入帧 + '1' resize */
export type TerminalWireProtocol = 'plain' | 'ttyd';

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
  /** 查找下一个匹配项 */
  findNext: (term: string, options?: SearchOptions) => boolean;
  /** 查找上一个匹配项 */
  findPrevious: (term: string, options?: SearchOptions) => boolean;
  /** 关闭搜索栏 */
  closeSearch: () => void;

  /** 获取原始 xterm.js Terminal 实例 */
  getTerminal: () => Terminal | null;
  /** 获取当前连接状态 */
  getStatus: () => ConnectionStatus;

  /** 将当前缓冲区内容下载为 .txt 文件 */
  downloadBuffer: (filename?: string) => void;
}
