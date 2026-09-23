/**
 * Nuwax 沉浸壳页面几何策略（纯函数）。
 *
 * 分层约定：hostBridge 识别平台并提供尺寸；本策略按平台、承载页面和导航状态
 * 计算退让值；SidebarShell 写入页面级结果；immersiveShell.less 只消费 CSS 变量。
 * Mac 红绿灯只占左导航列，Windows/Linux 菜单行横跨窗口，因此两端不能共用
 * 同一组全屏 top。独立页没有 page-container，沿用各端的宿主级默认值。
 */

export type ImmersiveShellPlatform = 'macos' | 'windows-linux';

export interface ShellAvoidanceMetrics {
  CONTENT_TOP: number;
  TOOLBAR: number;
}

export interface ImmersiveShellGeometryInput {
  platform: ImmersiveShellPlatform;
  surface: 'page-container' | 'standalone';
  /** 左侧导航是否收起；只改变 Mac 主内容区是否延伸到红绿灯下方。 */
  navigationCollapsed?: boolean;
  /** 普通沉浸页面由 page-container 承担顶部退让。 */
  immersiveMarginTop?: boolean;
  /** 单栏工作台页由 page-container 承担背景退让。 */
  suppressSecondMenu?: boolean;
}

export interface ImmersiveShellGeometry {
  /** html 根上的默认值，供无 page-container 的页面使用。 */
  contentTop: number;
  toolbarTop: number;
  /** fixed 全屏根相对视口的 top；page-container 会覆盖宿主默认值。 */
  fullscreenTop: number;
  /** 全屏 wrapper 内部补偿量，用于让 wrapper 内容与 page-container 起点对齐。 */
  pageContentOffset: number;
  /** 页面容器自身的背景退让；undefined 表示保持原始起点。 */
  pageContainerMarginTop?: number;
}

/**
 * 统一算出不同平台与页面形态的顶部几何。
 *
 * | 页面形态 | macOS 展开 | macOS 收起 | Windows/Linux |
 * | --- | ---: | ---: | ---: |
 * | page-container 背景 / 全屏根 | 0 | TOOLBAR | CONTENT_TOP |
 * | 独立全屏页 | 0 | 不适用 | TOOLBAR |
 *
 * Windows/Linux 的 page-container 背景始终从 CONTENT_TOP 开始；普通页面与
 * 单栏工作台页只是由不同的路由标记触发。macOS 仅在左导航收起后整体让出 TOOLBAR。
 */
export const resolveImmersiveShellGeometry = (
  input: ImmersiveShellGeometryInput,
  metrics: ShellAvoidanceMetrics,
): ImmersiveShellGeometry => {
  const isMac = input.platform === 'macos';
  const contentTop = isMac ? 0 : metrics.CONTENT_TOP;
  const toolbarTop = isMac ? 0 : metrics.TOOLBAR;

  if (input.surface === 'standalone') {
    return {
      contentTop,
      toolbarTop,
      fullscreenTop: toolbarTop,
      pageContentOffset: toolbarTop - contentTop,
    };
  }

  const navigationCollapsed = input.navigationCollapsed ?? false;
  let fullscreenTop: number;
  let pageContainerMarginTop: number | undefined;
  if (isMac) {
    fullscreenTop = navigationCollapsed ? metrics.TOOLBAR : 0;
    pageContainerMarginTop = navigationCollapsed ? metrics.TOOLBAR : undefined;
  } else {
    fullscreenTop = metrics.CONTENT_TOP;
    pageContainerMarginTop =
      input.immersiveMarginTop || input.suppressSecondMenu
        ? metrics.CONTENT_TOP
        : undefined;
  }

  return {
    contentTop,
    toolbarTop,
    fullscreenTop,
    pageContentOffset: fullscreenTop - contentTop,
    pageContainerMarginTop,
  };
};
