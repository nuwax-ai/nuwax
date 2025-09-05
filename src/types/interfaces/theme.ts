/**
 * 主题相关接口定义
 */

import {
  ThemeLayoutColorStyle,
  ThemeNavigationStyleType,
} from '@/types/enums/theme';

/**
 * 背景配置接口
 */
export interface ThemeBackgroundConfig {
  /** 背景图片唯一标识 */
  id: string;
  /** 背景图片显示名称 */
  name: string;
  /** 背景图片文件路径 */
  url: string;
  /** 布局风格，根据背景图的明暗程度来确定适合的布局风格 */
  layoutStyle: ThemeLayoutColorStyle;
  /** 背景图片描述（可选） */
  description?: string;
}

/**
 * 样式配置接口
 * 定义每个样式组合的完整CSS变量配置
 */
export interface ThemeStyleConfig {
  /** 布局相关的CSS变量 */
  layout: {
    '--xagi-layout-text-primary': string;
    '--xagi-layout-text-secondary': string;
    '--xagi-layout-text-tertiary': string;
    '--xagi-layout-text-disabled': string;
    '--xagi-layout-second-menu-text-color': string;
    '--xagi-layout-bg-primary': string;
    '--xagi-layout-bg-secondary': string;
    '--xagi-layout-bg-card': string;
    '--xagi-layout-bg-input': string;
    '--xagi-layout-border-primary': string;
    '--xagi-layout-border-secondary': string;
    '--xagi-layout-shadow': string;
    '--xagi-layout-overlay': string;
    '--xagi-layout-bg-container': string;
  };
  /** 导航相关的CSS变量 */
  navigation: {
    '--xagi-nav-first-menu-width': string;
    '--xagi-page-container-margin': string;
    '--xagi-page-container-border-radius': string;
    '--xagi-page-container-border-color': string;
  };
}

/**
 * 样式配置键名类型
 */
export type ThemeStyleConfigKey =
  keyof typeof import('@/constants/theme.constants').STYLE_CONFIGS;

/**
 * 布局风格类型别名（向后兼容）
 */
export type LayoutColorStyle = ThemeLayoutColorStyle;

/**
 * 导航风格类型别名（向后兼容）
 */
export type NavigationStyleType = ThemeNavigationStyleType;

/**
 * 背景配置类型别名（向后兼容）
 */
export type BackgroundConfig = ThemeBackgroundConfig;

/**
 * 样式配置类型别名（向后兼容）
 */
export type StyleConfig = ThemeStyleConfig;
