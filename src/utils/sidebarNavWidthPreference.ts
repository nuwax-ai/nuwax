/**
 * 单栏（style3）主会话列宽度偏好（像素）。
 * 拖拽结束后持久化到 localStorage，刷新后恢复上次宽度。
 * 仅 SidebarNavLayout（style3 单栏）挂载时读写——经典风格（style1/2）
 * 侧栏宽度恒为常量 SECOND_MENU_WIDTH，不消费本偏好，切风格不串值。
 * 默认值单一来源于 NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH。
 */
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';

export const NAV_SIDEBAR_WIDTH_STORAGE_KEY = 'style3_nav_sidebar_width_px';

/** 主会话列宽度上下限（px），超出按边界处理 */
export const NAV_SIDEBAR_WIDTH_MIN = 200;
export const NAV_SIDEBAR_WIDTH_MAX = 400;
export const NAV_SIDEBAR_WIDTH_DEFAULT =
  NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH;

export const clampNavSidebarWidth = (value: number): number =>
  Math.max(
    NAV_SIDEBAR_WIDTH_MIN,
    Math.min(NAV_SIDEBAR_WIDTH_MAX, Math.round(value)),
  );

export const loadNavSidebarWidthPx = (): number => {
  try {
    const raw = localStorage.getItem(NAV_SIDEBAR_WIDTH_STORAGE_KEY);
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isFinite(parsed)
      ? clampNavSidebarWidth(parsed)
      : NAV_SIDEBAR_WIDTH_DEFAULT;
  } catch {
    return NAV_SIDEBAR_WIDTH_DEFAULT;
  }
};

export const saveNavSidebarWidthPx = (px: number): void => {
  try {
    localStorage.setItem(
      NAV_SIDEBAR_WIDTH_STORAGE_KEY,
      String(clampNavSidebarWidth(px)),
    );
  } catch {
    // ignore: localStorage 不可用，降级为仅本次会话生效
  }
};
