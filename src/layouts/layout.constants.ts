// 导航基础宽度常量
export const FIRST_MENU_WIDTH = 60; // 风格1的默认宽度（紧凑模式）
export const FIRST_MENU_WIDTH_STYLE2 = 88; // 风格2的宽度（展开模式）
export const SECOND_MENU_WIDTH = 240;
export const MENU_WIDTH = FIRST_MENU_WIDTH + SECOND_MENU_WIDTH; // 默认菜单总宽度
export const MENU_WIDTH_STYLE2 = FIRST_MENU_WIDTH_STYLE2 + SECOND_MENU_WIDTH; // 风格2菜单总宽度

/**
 * 根据导航风格获取一级菜单宽度
 * @param navigationStyle 导航风格 'style1' | 'style2'
 * @returns 一级菜单宽度
 */
export const getFirstMenuWidth = (navigationStyle: 'style1' | 'style2'): number => {
  return navigationStyle === 'style2' ? FIRST_MENU_WIDTH_STYLE2 : FIRST_MENU_WIDTH;
};

/**
 * 根据导航风格获取菜单总宽度
 * @param navigationStyle 导航风格 'style1' | 'style2'
 * @returns 菜单总宽度
 */
export const getTotalMenuWidth = (navigationStyle: 'style1' | 'style2'): number => {
  return navigationStyle === 'style2' ? MENU_WIDTH_STYLE2 : MENU_WIDTH;
};

// 常量定义
export const MOBILE_BREAKPOINT = 768; // 移动端断点
export const ANIMATION_DURATION = 300; // 动画持续时间
export const MOBILE_MENU_TOP_PADDING = 32; // 移动端菜单顶部间距
