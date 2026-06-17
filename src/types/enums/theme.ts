/**
 * 主题相关枚举定义
 */

/**
 * 布局深浅色风格类型
 * 注意：这与 Ant Design 的 theme 无关，仅用于布局风格
 */
export enum ThemeLayoutColorStyle {
  /** 浅色布局风格 */
  LIGHT = 'light',
  /** 深色布局风格 */
  DARK = 'dark',
}

/**
 * 导航风格类型
 * style1: 紧凑模式（无文字导航，有外边距和圆角）
 * style2: 展开模式（有文字导航，无外边距和圆角）
 */
export enum ThemeNavigationStyleType {
  /** 紧凑模式 */
  STYLE1 = 'style1',
  /** 展开模式 */
  STYLE2 = 'style2',
}
