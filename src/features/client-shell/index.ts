/**
 * 客户端专属适配聚合（Nuwax 桌面宿主 webview 内运行时生效）
 *
 * 聚合原则：nuwax PC web 中「仅因客户端宿主存在才需要」的适配（构建版本上报、
 * 标题栏拖拽热区、客户端更新徽标等）统一收敛在本模块——单一初始化入口 +
 * 组件/服务同址，通用业务代码（app.tsx / 布局）只留最小挂载点。
 * 宿主专属适配在浏览器中 no-op；网页更新入口由浏览器和 direct 宿主共同使用。
 */
import { APP_VERSION } from '@/constants/version';
import { subscribeNativeImUnread } from '@/services/imEventBridge';
import { initTitlebarDragGesture } from '@/services/titlebarDragGesture';
import { hostBridge } from '@/utils/hostBridge';
import { initImNotificationPreference } from './imNotificationPreference';
import { getPageBuildInfo } from './pageBuildInfo';
import { initWebUpdateCheck } from './webUpdateService';

/**
 * 聚合初始化：AppContainer 挂载时调用一次，返回清理函数。
 * 新增客户端适配（键位、上报、同步器……）一律在此登记，不再散落业务代码。
 */
export function initClientShell(): () => void {
  // IM 尚未打开时也恢复保存的原生通知开关，等待文档握手后同步。
  const disposeImPreference = initImNotificationPreference();
  const disposeImUnread = subscribeNativeImUnread();
  // 前端构建版本上报（壳关于页「界面版本（nuwax pc web）」展示）。
  // hash 留在入口 HTML：保持业务 chunk 稳定，并准确上报当前页面实际版本。
  const pageBuildInfo = getPageBuildInfo();
  hostBridge.meta.syncWebInfo({
    appVersion: pageBuildInfo.appVersion || APP_VERSION,
    ...(pageBuildInfo.gitHash ? { gitHash: pageBuildInfo.gitHash } : {}),
  });
  const disposeWebUpdateCheck = initWebUpdateCheck();

  // 标题栏手势（mousedown 命中判定→壳主进程拖窗/双击缩放；壳层无覆盖零吞点击）
  const disposeDragGesture = initTitlebarDragGesture();

  return () => {
    disposeWebUpdateCheck();
    disposeDragGesture();
    disposeImPreference();
    disposeImUnread();
  };
}

export {
  download as downloadClientUpdate,
  install as installClientUpdate,
  isAvailable as isClientUpdateAvailable,
} from './clientUpdateService';
export { default as ClientVersionBadge } from './ClientVersionBadge';
export { default as DesktopShellPreviewChrome } from './DesktopShellPreviewChrome';
export { default as WebVersionBadge } from './WebVersionBadge';
