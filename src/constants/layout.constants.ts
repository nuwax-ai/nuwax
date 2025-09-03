// 布局相关常量配置
import { ThemeNavigationStyleType } from '@/types/enums/theme';

/**
 * 导航布局尺寸常量
 * 统一管理导航相关的宽度和高度配置
 */
export const NAVIGATION_LAYOUT_SIZES = {
  // 一级菜单宽度配置
  FIRST_MENU_WIDTH: {
    STYLE1: 60, // 紧凑模式：无文字导航
    STYLE2: 88, // 展开模式：有文字导航
  },

  // 二级菜单宽度配置
  SECOND_MENU_WIDTH: 240,

  // 菜单总宽度计算
  getTotalMenuWidth: (navigationStyle: string) => {
    const firstMenuWidth =
      navigationStyle === 'style2'
        ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE2
        : NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1;
    return firstMenuWidth + NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH;
  },

  // 页面容器边距配置
  PAGE_CONTAINER_MARGIN: {
    STYLE1: 16, // 紧凑模式：有外边距
    STYLE2: 0, // 展开模式：无外边距
  },

  // 页面容器圆角配置
  PAGE_CONTAINER_BORDER_RADIUS: {
    STYLE1: 12, // 紧凑模式：有圆角
    STYLE2: 0, // 展开模式：无圆角
  },
} as const;

export const FIRST_MENU_WIDTH = NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1;
export const FIRST_MENU_WIDTH_STYLE2 =
  NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE2;
export const SECOND_MENU_WIDTH = NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH;
export const MENU_WIDTH = FIRST_MENU_WIDTH + SECOND_MENU_WIDTH; // 默认菜单总宽度
export const MENU_WIDTH_STYLE2 = FIRST_MENU_WIDTH_STYLE2 + SECOND_MENU_WIDTH; // 风格2菜单总宽度

/**
 * 根据导航风格获取一级菜单宽度
 * @param navigationStyle 导航风格 'style1' | 'style2'
 * @returns 一级菜单宽度
 * @deprecated 请使用 NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH 替代
 */
export const getFirstMenuWidth = (
  navigationStyle: ThemeNavigationStyleType,
): number => {
  return navigationStyle === ThemeNavigationStyleType.STYLE2
    ? FIRST_MENU_WIDTH_STYLE2
    : FIRST_MENU_WIDTH;
};

/**
 * 根据导航风格获取菜单总宽度
 * @param navigationStyle 导航风格 'style1' | 'style2'
 * @returns 菜单总宽度
 * @deprecated 请使用 NAVIGATION_LAYOUT_SIZES.getTotalMenuWidth 替代
 */
export const getTotalMenuWidth = (
  navigationStyle: ThemeNavigationStyleType,
): number => {
  return navigationStyle === ThemeNavigationStyleType.STYLE2
    ? MENU_WIDTH_STYLE2
    : MENU_WIDTH;
};

// 常量定义
export const MOBILE_BREAKPOINT = 768; // 移动端断点
export const ANIMATION_DURATION = 300; // 动画持续时间
export const MOBILE_MENU_TOP_PADDING = 32; // 移动端菜单顶部间距
