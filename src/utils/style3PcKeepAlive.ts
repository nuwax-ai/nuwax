import { ThemeNavigationStyleType } from '@/types/enums/theme';

/** PC 端 style3 才启用整页会话保活，不区分浏览器或商业客户端宿主。 */
export const resolveStyle3PcKeepAliveEnabled = (
  effectiveNavigationStyle: ThemeNavigationStyleType,
  isMobile: boolean,
): boolean =>
  effectiveNavigationStyle === ThemeNavigationStyleType.STYLE3 && !isMobile;
