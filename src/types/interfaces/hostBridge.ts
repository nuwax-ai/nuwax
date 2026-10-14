/**
 * 业务页面与桌面宿主的桥契约；不依赖 Electron 或父仓，前端可独立构建。
 * 客户端通过 scripts/sync-host-bridge-contract.mjs 生成本文件的只读快照。
 */
export type HostCommand =
  | { type: 'toggle-second-menu'; collapsed: boolean }
  | { type: 'new-task' }
  | { type: 'open-search' }
  | { type: 'host-activity'; visible: boolean }
  | { type: 'computer-service-state'; phase: string; sandboxId?: string }
  | { type: 'set-lang'; lang: string };

/** 宿主提供的当前鉴权域信息，不包含凭据。 */
export interface HostAuthContext {
  businessOrigin: string;
  gatewayOrigin: string | null;
  loadMode: 'gateway' | 'direct';
}

/** 女娲主题生效时同步调色板；active=false 时宿主回落自己的主题。 */
export interface ShellThemePayload {
  active: boolean;
  primary?: string;
  bgContent?: string;
  bgMenu?: string;
  bgElevated?: string;
  border?: string;
  borderSecondary?: string;
  bgItemHover?: string;
}

export interface TitlebarDragRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 宿主更新器状态，hostVersion 为宿主版本，version 为目标版本。 */
export interface ClientUpdateState {
  status:
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error';
  hostVersion: string;
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

export interface ClientUpdateCheckResult {
  /** 旧宿主可能不提供该字段。 */
  hasUpdate?: boolean;
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  error?: string;
  alreadyChecking?: boolean;
}

/** 商业宿主未读展示快照，不含消息内容或凭据。 */
export interface HostImUnreadSnapshot {
  sessionGeneration: number;
  revision: number;
  total: number;
}

export interface HostImBridge {
  setNotificationEnabled(enabled: boolean): Promise<void>;
  getUnreadSnapshot(): Promise<HostImUnreadSnapshot | null>;
  onUnreadChanged(
    listener: (snapshot: HostImUnreadSnapshot | null) => void,
  ): () => void;
}

/** 压缩档。像素尺寸在任何一档都不变，只改变编码质量。 */
export type CaptureQuality = "lossless" | "high" | "medium" | "low";

export type StillFormat = "png" | "jpeg" | "webp";
export type VideoFormat = "mp4" | "webm";
export type RecordOutput = VideoFormat | "gif";

export interface CaptureCompression {
  quality: CaptureQuality;
  /** 给定则从所选档逐级下探直到达标；任何情况下都不缩放像素。 */
  maxBytes?: number;
}

export type CapturePermission = "granted" | "denied" | "not-determined" | "n/a";

export interface CaptureDisplayInfo {
  id: string;
  hdr: boolean;
  scale: number;
}

/** 某一档的实际含义，供调用方据此决定压缩策略。数值为只读说明。 */
export interface TierDescriptor {
  quality: CaptureQuality;
  /** 静态图是否严格无损（仅 lossless 档的 PNG）。视频与 GIF 恒为有损。 */
  stillStrictlyLossless: boolean;
  /** JPEG / WebP 质量（1-100）；lossless 档为 null。 */
  stillQuality: number | null;
  /** 视频每像素每帧比特数。 */
  videoBitsPerPixel: number;
  /** GIF 帧率上限。 */
  gifMaxFps: number;
  /** GIF 调色板色数。 */
  gifColors: number;
}

export interface CaptureCapabilities {
  apiVersion: number;
  /** false 表示本机当前不能用（特性关闭/平台不支持），其余字段仍尽量给出。 */
  available: boolean;
  platform: 'darwin' | 'win32' | 'linux' | string;
  permission: CapturePermission;
  displays: CaptureDisplayInfo[];
  formats: { still: StillFormat[]; video: VideoFormat[]; gif: boolean };
  tiers: Record<CaptureQuality, TierDescriptor>;
}

export interface ScreenshotOptions {
  format?: StillFormat;
  compression?: CaptureCompression;
}

export interface RecordOptions {
  output: RecordOutput;
  fps?: number;
  compression?: CaptureCompression;
  /** 录制时长上限（毫秒），缺省使用特性默认值。 */
  maxDurationMs?: number;
}

export type CaptureErrorCode =
  | "canceled"
  | "permission-denied"
  | "busy"
  | "encoder-unavailable"
  | "unsupported"
  | "untrusted"
  | "invalid-argument"
  | "failed";

export interface CaptureSuccess {
  success: true;
  /** 不透明句柄；渲染进程拿不到文件路径。 */
  resultId: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  durationMs?: number;
  /** 实际使用的档位；`maxBytes` 下探后可能低于请求档位。 */
  qualityUsed: CaptureQuality;
  /** `maxBytes` 在最低档仍未达标。 */
  exceedsMaxBytes?: boolean;
  /** 采集自 HDR 屏并已转为 SDR/sRGB。 */
  hdrToneMapped: boolean;
  /** 为满足 H.264 偶数宽高，宽/高被补了 1 像素。 */
  paddedForEvenSize?: boolean;
}

export interface CaptureFailure {
  success: false;
  code: CaptureErrorCode;
  error?: string;
}

export type CaptureResult = CaptureSuccess | CaptureFailure;

/** 截图复制位图；录屏（含 GIF）复制原始文件，不返回本地路径。 */
export type CaptureCopyResult =
  | { success: true; kind: 'image' | 'file' }
  | CaptureFailure;

export type CaptureState =
  | "idle"
  | "selecting"
  | "recording"
  | "paused"
  | "encoding";

/** 渲染进程侧可见的桥形状。 */
export interface CaptureBridge {
  getCapabilities(): Promise<CaptureCapabilities>;
  screenshot(options?: ScreenshotOptions): Promise<CaptureResult>;
  record(options: RecordOptions): Promise<CaptureResult>;
  cancel(): Promise<void>;
  onStateChange(listener: (state: CaptureState) => void): () => void;
  readChunk(
    resultId: string,
    offset: number,
    length: number,
  ): Promise<ArrayBuffer | null>;
  release(resultId: string): Promise<void>;
  /** 增量能力，旧客户端可缺失；成功复制后可 release 原结果。 */
  copy?(resultId: string): Promise<CaptureCopyResult>;
}

/** 当前 preload 暴露的完整能力；IM 仅在商业宿主受信顶层页面提供。 */
/** 本机文件访问：可选宿主能力，旧客户端和浏览器保持原路线。 */
export type LocalFilesErrorCode =
  | 'untrusted'
  | 'unavailable'
  | 'not-local'
  | 'invalid-argument'
  | 'context-unresolved'
  | 'expired'
  | 'not-found'
  | 'permission-denied'
  | 'file-service-unavailable'
  | 'canceled'
  | 'failed';
export type LocalFilesResult<T> =
  | { success: true; data: T }
  | { success: false; code: LocalFilesErrorCode; error?: string };
export interface LocalFilesCapabilities {
  apiVersion: number;
  available: boolean;
  sandboxId?: string;
}
export interface LocalFilesContextInput {
  cId: string | number;
  sandboxId: string;
  workspacePath?: string;
  projectId?: string | number;
  serviceType?: string;
  userId?: string | number;
}
export interface LocalFilesContext {
  contextId: string;
  cId: string;
  sandboxId: string;
  root: string;
}
export interface LocalFileTarget {
  contextId: string;
  path: string;
}
export interface LocalFilesListOptions {
  relativePath?: string;
  recursive?: boolean;
  depth?: number;
  type?: 'file' | 'dir' | 'all';
  limit?: number;
  customTargetDir?: string;
}
export interface LocalFilesSearchOptions extends LocalFilesListOptions {
  kw: string;
  maxVisit?: number;
  timeoutMs?: number;
}
export interface LocalFileEntry {
  name: string;
  isDir: boolean;
  isLink?: boolean;
  fileProxyUrl?: string | null;
  binary?: boolean;
  contents?: string;
  sizeExceeded?: boolean;
  size?: number;
}
export interface LocalFilesList {
  files: LocalFileEntry[];
  recursive?: boolean;
  truncated?: boolean;
  visited?: number;
}
export interface LocalFileMetadata {
  path: string;
  size: number;
  mime: string;
  isDir: boolean;
  mtimeMs: number;
}
export interface LocalFilePreview {
  grantId: string;
  url: string;
  baseUrl: string;
  mime: string;
  bytes: number;
}
export interface LocalFileSaveOptions {
  fileName?: string;
  operationId?: string;
}
export interface LocalFileSaved {
  canceled: boolean;
  path?: string;
}
export interface HostLocalFilesBridge {
  pickDirectory(): Promise<{ canceled: boolean; paths: string[] }>;
  getCapabilities(): Promise<LocalFilesCapabilities>;
  resolveContext(
    input: LocalFilesContextInput,
  ): Promise<LocalFilesResult<LocalFilesContext>>;
  releaseContext(contextId: string): Promise<void>;
  listFiles(
    contextId: string,
    options?: LocalFilesListOptions,
  ): Promise<LocalFilesResult<LocalFilesList>>;
  searchFiles(
    contextId: string,
    options: LocalFilesSearchOptions,
  ): Promise<LocalFilesResult<LocalFilesList>>;
  stat(target: LocalFileTarget): Promise<LocalFilesResult<LocalFileMetadata>>;
  preparePreview(
    target: LocalFileTarget,
  ): Promise<LocalFilesResult<LocalFilePreview>>;
  releasePreview(grantId: string): Promise<void>;
  openPath(target: LocalFileTarget): Promise<LocalFilesResult<void>>;
  revealInFolder(target: LocalFileTarget): Promise<LocalFilesResult<void>>;
  saveFile(
    target: LocalFileTarget,
    options?: LocalFileSaveOptions,
  ): Promise<LocalFilesResult<LocalFileSaved>>;
  exportWorkspace(
    contextId: string,
    options?: LocalFileSaveOptions,
  ): Promise<LocalFilesResult<LocalFileSaved>>;
  cancel(operationId: string): Promise<void>;
}

export interface HostBridgeContract {
  /** 无副作用的异步探测；未知能力、未受信页面、未启用功能返回 false。 */
  canUse?(capability: string): Promise<boolean>;
  perf: {
    enabled(): boolean;
    mark(stage: string, payload?: Record<string, unknown>): void;
    markOnce(
      key: string,
      stage: string,
      payload?: Record<string, unknown>,
    ): void;
  };
  auth: {
    getContext(): Promise<HostAuthContext | null>;
    syncSession(): Promise<boolean>;
    beginLogin(): Promise<boolean>;
    /** @deprecated 商业宿主返回 null；ticket cookie 是登录事实源。 */
    getToken(): Promise<string | null>;
    /** @deprecated 商业宿主返回 false，不持久化 token；用 syncSession 确认 cookie 会话。 */
    persistToken(token: string): Promise<boolean>;
    clear(): Promise<boolean>;
    configureServerHost(
      host: string,
    ): Promise<{ success: boolean; serverHost?: string; error?: string }>;
  };
  native: {
    saveImage(
      url: string,
      filename?: string,
    ): Promise<{ success: boolean; path?: string; error?: string }>;
    saveFile(
      url: string,
      filename?: string,
    ): Promise<{
      success: boolean;
      path?: string;
      canceled?: boolean;
      error?: string;
    }>;
    openWindow(path: string): Promise<{ success: boolean; error?: string }>;
    openClientSettings(): Promise<{ success: boolean; error?: string }>;
  };
  localFiles: HostLocalFilesBridge;
  updater: {
    getState(): Promise<ClientUpdateState | null>;
    check(): Promise<ClientUpdateCheckResult | null>;
    download(): Promise<{ success: boolean; error?: string }>;
    install(): Promise<{ success: boolean; error?: string }>;
  };
  events: {
    onHostCommand(callback: ((payload: HostCommand) => void) | null): void;
  };
  theme: { syncTheme(payload: ShellThemePayload): void };
  layout: {
    setNewTaskAvailable(available: boolean): void;
    setSecondMenuAvailable(available: boolean): void;
    setSecondMenuCollapsed(collapsed: boolean): void;
    setTitlebarDragRegions(regions: TitlebarDragRegion[]): void;
  };
  titlebar: { beginDrag(): void; endDrag(): void; toggleMaximize(): void };
  i18n: { syncLang(lang: string): void };
  meta: {
    syncWebInfo(payload: { appVersion: string; gitHash?: string }): void;
  };
  /** 历史宿主可能返回未知产品标识，消费层负责识别和降级。 */
  host: { getProduct(): string };
  im?: HostImBridge;
  /** 仅商业宿主受信顶层页面提供，旧客户端可缺失。 */
  capture?: CaptureBridge;
}

/** 浏览器没有桥；旧宿主可以只提供部分命名空间及方法，消费方按能力探测。 */
export type CompatibleHostBridge = {
  [Namespace in keyof HostBridgeContract]?: NonNullable<HostBridgeContract[Namespace]> extends (...args: never[]) => unknown
    ? NonNullable<HostBridgeContract[Namespace]>
    : Partial<NonNullable<HostBridgeContract[Namespace]>>;
};

type HostNamespaces = Omit<HostBridgeContract, 'canUse'>;
/** 能力名区分大小写；命名空间表示至少有一个成员可用。 */
export type HostCapability = Exclude<
  keyof HostNamespaces | {
    [K in keyof HostNamespaces]-?: `${K}.${Extract<keyof NonNullable<HostNamespaces[K]>, string>}`
  }[keyof HostNamespaces],
  'auth.getToken' | 'auth.persistToken'
> | 'capture.screenshot.png' | 'capture.screenshot.jpeg' | 'capture.screenshot.webp'
  | 'capture.record.mp4' | 'capture.record.webm' | 'capture.record.gif'
  | 'capture.copy.image' | 'capture.copy.file';
