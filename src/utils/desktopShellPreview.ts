export const DESKTOP_SHELL_PREVIEW_ROUTE = '/desktop-shell-preview';
export const DESKTOP_SHELL_PREVIEW_PARAM = '__desktop_shell_preview';

export type DesktopShellPreviewPlatform = 'macos' | 'windows' | 'linux';

export interface DesktopShellViewportPreset {
  label: string;
  width: number;
  height: number;
}

export const DESKTOP_SHELL_VIEWPORT_PRESETS: DesktopShellViewportPreset[] = [
  { label: '客户端最小', width: 1200, height: 720 },
  { label: 'Windows 验收', width: 1240, height: 752 },
  { label: '常用桌面', width: 1440, height: 900 },
];

const VALID_PLATFORMS = new Set<DesktopShellPreviewPlatform>([
  'macos',
  'windows',
  'linux',
]);

// iframe 内独立模块实例的窗口级状态：SPA 切换菜单后路由通常会丢 query，
// 但当前 webview 的宿主平台不应随路由变化。内存粘滞不会污染同源的预览控制台父页。
let cachedPreviewPlatform: DesktopShellPreviewPlatform | undefined;

export interface DesktopShellPreviewLayoutState {
  secondMenuAvailable: boolean;
  secondMenuCollapsed: boolean;
}

const previewLayoutState: DesktopShellPreviewLayoutState = {
  secondMenuAvailable: false,
  secondMenuCollapsed: false,
};
const previewLayoutListeners = new Set<
  (state: DesktopShellPreviewLayoutState) => void
>();
let previewHostCommandHandler: ((payload: HostCommand) => void) | null = null;

/** 生产包必须忽略任何手工拼接的预览参数。 */
export const canUseDesktopShellPreview = (): boolean =>
  process.env.NODE_ENV !== 'production';

export const parseDesktopShellPreviewPlatform = (
  search: string,
): DesktopShellPreviewPlatform | undefined => {
  const value = new URLSearchParams(search).get(DESKTOP_SHELL_PREVIEW_PARAM);
  return value && VALID_PLATFORMS.has(value as DesktopShellPreviewPlatform)
    ? (value as DesktopShellPreviewPlatform)
    : undefined;
};

export const getDesktopShellPreviewPlatform = ():
  | DesktopShellPreviewPlatform
  | undefined => {
  if (!canUseDesktopShellPreview() || typeof window === 'undefined') {
    return undefined;
  }
  const platform = parseDesktopShellPreviewPlatform(window.location.search);
  if (platform) cachedPreviewPlatform = platform;
  return platform ?? cachedPreviewPlatform;
};

/**
 * 开发预览中的轻量宿主命令通道。
 *
 * 浏览器预览不伪造 window.NuwaClawBridge，避免业务误以为原生 API 可用；仅把
 * 标题栏折叠按钮需要的 host→guest 命令保留在当前 iframe 模块实例内。
 */
export const setDesktopShellPreviewHostCommandHandler = (
  handler: ((payload: HostCommand) => void) | null,
): void => {
  previewHostCommandHandler = handler;
};

export const emitDesktopShellPreviewHostCommand = (
  payload: HostCommand,
): void => {
  if (!getDesktopShellPreviewPlatform()) return;
  previewHostCommandHandler?.(payload);
};

/** guest→预览标题栏：同步真实布局状态，让折叠按钮与原生壳语义一致。 */
export const updateDesktopShellPreviewLayoutState = (
  patch: Partial<DesktopShellPreviewLayoutState>,
): void => {
  if (!getDesktopShellPreviewPlatform()) return;
  Object.assign(previewLayoutState, patch);
  const snapshot = { ...previewLayoutState };
  previewLayoutListeners.forEach((listener) => listener(snapshot));
};

export const subscribeDesktopShellPreviewLayoutState = (
  listener: (state: DesktopShellPreviewLayoutState) => void,
): (() => void) => {
  listener({ ...previewLayoutState });
  previewLayoutListeners.add(listener);
  return () => previewLayoutListeners.delete(listener);
};

/** 仅供单测隔离模块级 iframe 生命周期状态。 */
export const resetDesktopShellPreviewRuntimeForTest = (): void => {
  if (process.env.NODE_ENV !== 'test') return;
  cachedPreviewPlatform = undefined;
  previewHostCommandHandler = null;
  previewLayoutState.secondMenuAvailable = false;
  previewLayoutState.secondMenuCollapsed = false;
  previewLayoutListeners.clear();
};

/** 仅开发环境的预览控制台本身；iframe 中的业务路由仍按原规则鉴权。 */
export const isDesktopShellPreviewPage = (): boolean =>
  canUseDesktopShellPreview() &&
  typeof window !== 'undefined' &&
  window.location.pathname === DESKTOP_SHELL_PREVIEW_ROUTE;

export const buildDesktopShellPreviewUrl = (options: {
  targetPath: string;
  platform: DesktopShellPreviewPlatform;
  origin?: string;
}): string => {
  const origin = options.origin ?? window.location.origin;
  let url: URL;
  try {
    url = new URL(options.targetPath || '/home', origin);
  } catch {
    url = new URL('/home', origin);
  }

  // 调试器只承载同源业务页面，避免把登录态或内部参数带给外部站点。
  if (url.origin !== origin || url.pathname === DESKTOP_SHELL_PREVIEW_ROUTE) {
    url = new URL('/home', origin);
  }
  url.searchParams.delete('_shell');
  url.searchParams.set(DESKTOP_SHELL_PREVIEW_PARAM, options.platform);
  return url.toString();
};
