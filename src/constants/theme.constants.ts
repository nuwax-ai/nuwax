/**
 * 主题配置常量
 * 定义布局风格和导航风格的所有CSS变量配置
 */

import { ThemeLayoutColorStyle } from '@/types/enums/theme';
import {
  ThemeBackgroundConfig,
  ThemeStyleConfig,
} from '@/types/interfaces/theme';
// 主题令牌常量配置
// 为主题配置添加类型
import type { ThemeConfig } from 'antd/es/config-provider';
import type { AliasToken, ComponentTokenMap } from 'antd/es/theme/interface';

/**
 * 预设主题色配置
 * 定义可选择的主题色选项
 */
export const THEME_COLOR_CONFIGS = [
  { color: '#5147ff', name: '蓝色', isDefault: true },
  { color: '#ff4d4f', name: '红色' },
  { color: '#fa8c16', name: '橙色' },
  { color: '#52c41a', name: '绿色' },
  { color: '#722ed1', name: '紫色' },
  { color: '#eb2f96', name: '粉色' },
] as const;

/**
 * 本地存储键名配置
 * 统一管理所有存储键名，确保各模块间的一致性
 */
export const STORAGE_KEYS = {
  LAYOUT_STYLE: 'xagi-layout-style', // 布局样式配置
  BACKGROUND_ID: 'xagi-background-id', // 背景图片ID
  GLOBAL_SETTINGS: 'xagi-global-settings', // 全局设置
  USER_THEME_CONFIG: 'xagi-user-theme-config', // 用户主题配置
  TENANT_CONFIG_INFO: 'TENANT_CONFIG_INFO', // 租户配置信息
  AUTH_TYPE: 'AUTH_TYPE', // 认证类型
  ACCESS_TOKEN: 'ACCESS_TOKEN', // 访问令牌
  USER_INFO: 'USER_INFO', // 用户信息
  SPACE_ID: 'SPACE_ID', // 空间ID
  SPACE_URL: 'SPACE_URL', // 空间URL
} as const;

/**
 * 默认主题配置
 * 统一管理所有默认值，确保各模块间的一致性
 */
export const DEFAULT_THEME_CONFIG = {
  PRIMARY_COLOR: '#5147ff',
  BACKGROUND_ID: '',
  NAVIGATION_STYLE: 'style1',
  LAYOUT_STYLE: 'light',
  THEME: 'light',
  LANGUAGE: 'zh-CN',
} as const;

/**
 * 预定义的背景配置
 * 根据背景图的明暗程度来确定适合的布局风格
 */
export const THEME_BACKGROUND_CONFIGS: ThemeBackgroundConfig[] = [
  {
    id: 'bg-variant-1',
    name: '星空夜景',
    url: '/bg/bg-variant-1.png',
    layoutStyle: ThemeLayoutColorStyle.LIGHT,
    description: '深色背景，适合深色布局风格',
  },
  {
    id: 'bg-variant-2',
    name: '云朵白天',
    url: '/bg/bg-variant-2.png',
    layoutStyle: ThemeLayoutColorStyle.LIGHT,
    description: '浅色背景，适合浅色布局风格',
  },
  {
    id: 'bg-variant-3',
    name: '森林晨光',
    url: '/bg/bg-variant-3.png',
    layoutStyle: ThemeLayoutColorStyle.DARK,
    description: '明亮背景，适合浅色布局风格',
  },
  {
    id: 'bg-variant-4',
    name: '深海夜色',
    url: '/bg/bg-variant-4.png',
    layoutStyle: ThemeLayoutColorStyle.DARK,
    description: '深色背景，适合深色布局风格',
  },
  {
    id: 'bg-variant-5',
    name: '梦幻紫色',
    url: '/bg/bg-variant-5.png',
    layoutStyle: ThemeLayoutColorStyle.LIGHT,
    description: '深色调背景，适合深色布局风格',
  },
  {
    id: 'bg-variant-6',
    name: '温暖阳光',
    url: '/bg/bg-variant-6.png',
    layoutStyle: ThemeLayoutColorStyle.DARK,
    description: '温暖色调，适合浅色布局风格',
  },
  {
    id: 'bg-variant-7',
    name: '夜晚都市',
    url: '/bg/bg-variant-7.png',
    layoutStyle: ThemeLayoutColorStyle.DARK,
    description: '都市夜景，适合深色布局风格',
  },
  {
    id: 'bg-variant-8',
    name: '清新蓝天',
    url: '/bg/bg-variant-8.png',
    layoutStyle: ThemeLayoutColorStyle.LIGHT,
    description: '清新明亮，适合浅色布局风格',
  },
];

/**
 * 四个样式配置：light-style1, light-style2, dark-style1, dark-style2
 * 注意：这些变量仅用于自定义布局组件，不影响 Ant Design 组件
 */
export const STYLE_CONFIGS: Record<string, ThemeStyleConfig> = {
  // 浅色 + 紧凑模式
  'light-style1': {
    layout: {
      '--xagi-layout-text-primary': '#000000',
      '--xagi-layout-text-secondary': 'rgba(0, 0, 0, 0.85)',
      '--xagi-layout-text-tertiary': 'rgba(0, 0, 0, 0.65)',
      '--xagi-layout-text-disabled': 'rgba(0, 0, 0, 0.25)',
      '--xagi-layout-second-menu-text-color': 'rgba(0, 0, 0, 0.85)',
      '--xagi-layout-bg-primary': 'rgba(255, 255, 255, 0.95)',
      '--xagi-layout-bg-secondary': 'rgba(255, 255, 255, 0.85)',
      '--xagi-layout-bg-card': 'rgba(255, 255, 255, 0.65)',
      '--xagi-layout-bg-input': 'rgba(255, 255, 255, 0.45)',
      '--xagi-layout-border-primary': 'rgba(0, 0, 0, 0.15)',
      '--xagi-layout-border-secondary': 'rgba(0, 0, 0, 0.1)',
      '--xagi-layout-shadow': 'rgba(0, 0, 0, 0.1)',
      '--xagi-layout-overlay': 'rgba(255, 255, 255, 0.7)',
      '--xagi-layout-bg-container': 'rgba(255, 255, 255, 0.95)',
    },
    navigation: {
      '--xagi-nav-first-menu-width': '60px',
      '--xagi-page-container-margin': '16px',
      '--xagi-page-container-border-radius': '12px',
    },
  },
  // 浅色 + 展开模式
  'light-style2': {
    layout: {
      '--xagi-layout-text-primary': '#000000',
      '--xagi-layout-text-secondary': 'rgba(0, 0, 0, 0.85)',
      '--xagi-layout-text-tertiary': 'rgba(0, 0, 0, 0.65)',
      '--xagi-layout-text-disabled': 'rgba(0, 0, 0, 0.25)',
      '--xagi-layout-second-menu-text-color': 'rgba(0, 0, 0, 0.85)',
      '--xagi-layout-bg-primary': 'rgba(255, 255, 255, 0.95)',
      '--xagi-layout-bg-secondary': 'rgba(255, 255, 255, 0.85)',
      '--xagi-layout-bg-card': 'rgba(255, 255, 255, 0.65)',
      '--xagi-layout-bg-input': 'rgba(255, 255, 255, 0.45)',
      '--xagi-layout-border-primary': 'rgba(0, 0, 0, 0.15)',
      '--xagi-layout-border-secondary': 'rgba(0, 0, 0, 0.1)',
      '--xagi-layout-shadow': 'rgba(0, 0, 0, 0.1)',
      '--xagi-layout-overlay': 'rgba(255, 255, 255, 0.7)',
      '--xagi-layout-bg-container': 'rgba(255, 255, 255, 0.95)',
    },
    navigation: {
      '--xagi-nav-first-menu-width': '88px',
      '--xagi-page-container-margin': '0px',
      '--xagi-page-container-border-radius': '0px',
    },
  },
  // 深色 + 紧凑模式
  'dark-style1': {
    layout: {
      '--xagi-layout-text-primary': '#ffffff',
      '--xagi-layout-text-secondary': 'rgba(255, 255, 255, 0.85)',
      '--xagi-layout-text-tertiary': 'rgba(255, 255, 255, 0.65)',
      '--xagi-layout-text-disabled': 'rgba(255, 255, 255, 0.25)',
      '--xagi-layout-second-menu-text-color': 'rgba(255, 255, 255, 0.85)',
      '--xagi-layout-bg-primary': 'rgba(0, 0, 0, 0.85)',
      '--xagi-layout-bg-secondary': 'rgba(0, 0, 0, 0.65)',
      '--xagi-layout-bg-card': 'rgba(0, 0, 0, 0.45)',
      '--xagi-layout-bg-input': 'rgba(0, 0, 0, 0.25)',
      '--xagi-layout-border-primary': 'rgba(0, 0, 0, 0.15)',
      '--xagi-layout-border-secondary': 'rgba(0, 0, 0, 0.1)',
      '--xagi-layout-shadow': 'rgba(0, 0, 0, 0.6)',
      '--xagi-layout-overlay': 'rgba(0, 0, 0, 0.7)',
      '--xagi-layout-bg-container': '#ffffff',
    },
    navigation: {
      '--xagi-nav-first-menu-width': '60px',
      '--xagi-page-container-margin': '16px',
      '--xagi-page-container-border-radius': '12px',
    },
  },
  // 深色 + 展开模式
  'dark-style2': {
    layout: {
      '--xagi-layout-text-primary': '#ffffff',
      '--xagi-layout-text-secondary': 'rgba(255, 255, 255, 0.85)',
      '--xagi-layout-text-tertiary': 'rgba(255, 255, 255, 0.65)',
      '--xagi-layout-text-disabled': 'rgba(255, 255, 255, 0.25)',
      '--xagi-layout-second-menu-text-color': 'rgba(0, 0, 0, 0.85)',
      '--xagi-layout-bg-primary': 'rgba(0, 0, 0, 0.85)',
      '--xagi-layout-bg-secondary': 'rgba(0, 0, 0, 0.85)',
      '--xagi-layout-bg-card': 'rgba(0, 0, 0, 0.45)',
      '--xagi-layout-bg-input': 'rgba(0, 0, 0, 0.25)',
      '--xagi-layout-border-primary': 'rgba(0, 0, 0, 0.15)',
      '--xagi-layout-border-secondary': 'rgba(0, 0, 0, 0.1)',
      '--xagi-layout-shadow': 'rgba(0, 0, 0, 0.6)',
      '--xagi-layout-overlay': 'rgba(0, 0, 0, 0.7)',
      '--xagi-layout-bg-container': '#ffffff',
    },
    navigation: {
      '--xagi-nav-first-menu-width': '88px',
      '--xagi-page-container-margin': '0px',
      '--xagi-page-container-border-radius': '0px',
    },
  },
};

/**
 * 样式配置键名常量
 */
export const STYLE_CONFIG_KEYS = {
  LIGHT_STYLE1: 'light-style1',
  LIGHT_STYLE2: 'light-style2',
  DARK_STYLE1: 'dark-style1',
  DARK_STYLE2: 'dark-style2',
} as const;

/**
 * 所有样式配置键名数组
 */
export const ALL_STYLE_CONFIG_KEYS = Object.keys(STYLE_CONFIGS);

/**
 * 样式配置键名类型
 */
export type StyleConfigKey = keyof typeof STYLE_CONFIGS;

/**
 * Ant Design 主题 tokens
 * 用于配置 Ant Design 组件的主题
 */
export const themeTokens: Partial<AliasToken> = {
  // 品牌主色 - 项目主色调
  colorPrimary: '#5147ff',

  // 功能色
  colorSuccess: '#3bb346',
  colorWarning: '#fc8800',
  colorError: '#f93920',
  colorInfo: '#0077fa',

  // 基础色 - 用于派生文本和背景色
  colorTextBase: '#000000',
  colorBgBase: '#ffffff',

  // 超链接颜色
  colorLink: '#5147ff',

  // 字体配置
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  fontFamilyCode:
    'Monaco, "Menlo", "Ubuntu Mono", "Consolas", "Liberation Mono", "Courier New", monospace',

  // 字号配置
  fontSize: 14,

  // 线条配置
  lineWidth: 0.5,
  lineType: 'solid',

  // 圆角配置
  borderRadius: 8,

  // 尺寸配置
  sizeUnit: 4,
  sizeStep: 4,
  sizePopupArrow: 8,

  // 控制组件高度
  controlHeight: 32,

  // Z轴配置
  zIndexBase: 0,
  zIndexPopupBase: 1000,

  // // 图片透明度
  opacityImage: 1,

  // 动画配置
  motionUnit: 0.1,
  motionBase: 0,
  // motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
  // motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
  // motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  // motionEaseOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  // motionEaseInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  // motionEaseInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  // motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  // motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',

  // 风格配置
  wireframe: false,
  motion: true,

  // 预设颜色
  blue: '#1890ff',
  purple: '#722ed1',
  cyan: '#13c2c2',
  green: '#52c41a',
  magenta: '#eb2f96',
  pink: '#eb2f96',
  red: '#f5222d',
  orange: '#fa8c16',
  yellow: '#fadb14',
  volcano: '#fa541c',
  geekblue: '#2f54eb',
  lime: '#a0d911',
  gold: '#faad14',
  // 填充颜色 浅色
  colorFill: 'rgba(12,20,40,0.1)',
  colorFillSecondary: 'rgba(12,20,40,0.06)',
  colorFillTertiary: 'rgba(12,20,40,0.04)',
  colorFillQuaternary: 'rgba(12,20,40,0.02)',
  // border radius
  borderRadiusSM: 4,
  borderRadiusLG: 12,
};

export const darkThemeTokens = {
  ...themeTokens,
  colorBgBase: '#000',
  colorTextBase: '#fff',
  // TODO 填充颜色 深色 缺少

  // 导航深色主题适配
  colorFill: 'rgba(255, 255, 255, 0.08)',
  colorFillSecondary: 'rgba(255, 255, 255, 0.04)',
  colorFillTertiary: 'rgba(255, 255, 255, 0.02)',
  colorFillQuaternary: 'rgba(255, 255, 255, 0.01)',
};

// 组件主题类型定义
type ButtonToken = Partial<ComponentTokenMap['Button'] | AliasToken>;
type SelectToken = Partial<ComponentTokenMap['Select'] | AliasToken>;
type InputToken = Partial<ComponentTokenMap['Input'] | AliasToken>;
type MenuToken = Partial<ComponentTokenMap['Menu'] | AliasToken>;
type DatePickerToken = Partial<ComponentTokenMap['DatePicker'] | AliasToken>;
type FormToken = Partial<ComponentTokenMap['Form'] | AliasToken>;
type MessageToken = Partial<ComponentTokenMap['Message'] | AliasToken>;
type NotificationToken = Partial<
  ComponentTokenMap['Notification'] | AliasToken
>;
type ModalToken = Partial<ComponentTokenMap['Modal'] | AliasToken>;
type CardToken = Partial<ComponentTokenMap['Card'] | AliasToken>;
type TableToken = Partial<ComponentTokenMap['Table'] | AliasToken>;
type SegmentedToken = Partial<ComponentTokenMap['Segmented'] | AliasToken>;

// 组件级别的主题配置
export const componentThemes: ThemeConfig['components'] = {
  // Button 组件
  Button: {
    colorPrimary: themeTokens.colorPrimary,
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    fontWeight: 400,
    primaryShadow: 'none',
    defaultShadow: 'none',
    dangerShadow: 'none',
    // 按钮特定配置
    paddingInline: 15,
    paddingBlock: 4,
    onlyIconSize: 16,
    groupBorderColor: 'transparent',
  } as ButtonToken,

  // Input 组件
  Input: {
    colorPrimary: themeTokens.colorPrimary,
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    paddingInline: 11,
    paddingBlock: 4,
    activeBorderColor: themeTokens.colorPrimary,
    hoverBorderColor: '#7B6EFF',
    activeShadow: '0 0 0 2px rgba(81, 71, 255, 0.2)',
    errorActiveShadow: '0 0 0 2px rgba(255, 77, 79, 0.2)',
    warningActiveShadow: '0 0 0 2px rgba(255, 140, 0, 0.2)',
  } as InputToken,

  // Select 组件
  Select: {
    colorPrimary: themeTokens.colorPrimary,
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    optionSelectedBg: 'rgba(81, 71, 255, 0.1)',
    optionActiveBg: 'rgba(81, 71, 255, 0.05)',
    optionSelectedColor: themeTokens.colorPrimary,
    optionPadding: '5px 12px',
    showArrowPaddingInlineEnd: 18,
  } as SelectToken,

  // Table 组件
  Table: {
    borderRadius: themeTokens.borderRadius,
    fontSize: themeTokens.fontSize,
    headerBg: '#fafafa',
    headerColor: '#666666',
    headerSortActiveBg: '#f0f0f0',
    headerSortHoverBg: '#f5f5f5',
    bodySortBg: '#fafafa',
    rowHoverBg: 'rgba(81, 71, 255, 0.03)',
    rowSelectedBg: 'rgba(81, 71, 255, 0.05)',
    rowSelectedHoverBg: 'rgba(81, 71, 255, 0.08)',
    rowExpandedBg: '#fbfbfb',
    cellPaddingBlock: 16,
    cellPaddingInline: 16,
    cellPaddingBlockMD: 12,
    cellPaddingInlineMD: 12,
    cellPaddingBlockSM: 8,
    cellPaddingInlineSM: 8,
  } as TableToken,

  // Card 组件
  Card: {
    borderRadius: themeTokens.borderRadiusLG,
    paddingLG: themeTokens.paddingLG,
    padding: themeTokens.padding,
    paddingSM: themeTokens.paddingSM,
    headerBg: 'transparent',
    headerFontSize: themeTokens.fontSizeLG,
    headerFontSizeSM: themeTokens.fontSize,
    headerHeight: 56,
    headerHeightSM: 36,
    actionsBg: '#fafafa',
    actionsLiMargin: '12px 0',
    tabsMarginBottom: -17,
  } as CardToken,

  // Modal 组件
  Modal: {
    borderRadius: themeTokens.borderRadiusLG,
    padding: themeTokens.paddingLG,
    paddingLG: themeTokens.paddingLG,
    titleFontSize: themeTokens.fontSizeLG,
    titleLineHeight: 1.6,
    contentBg: '#ffffff',
    headerBg: '#ffffff',
    footerBg: 'transparent',
    maskBg: 'rgba(0, 0, 0, 0.45)',
  } as ModalToken,

  // Message 组件
  Message: {
    contentBg: '#ffffff',
    contentPadding: '12px 16px',
    borderRadius: themeTokens.borderRadius,
    fontSize: themeTokens.fontSize,
    zIndexPopup: 1010,
  } as MessageToken,

  // Notification 组件
  Notification: {
    borderRadius: themeTokens.borderRadius,
    padding: themeTokens.padding,
    paddingLG: themeTokens.paddingLG,
    width: 384,
    zIndexPopup: 1010,
  } as NotificationToken,

  // DatePicker 组件
  DatePicker: {
    colorPrimary: themeTokens.colorPrimary,
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    cellActiveWithRangeBg: 'rgba(81, 71, 255, 0.1)',
    cellHoverWithRangeBg: 'rgba(81, 71, 255, 0.05)',
    cellRangeBorderColor: 'transparent',
    cellBgDisabled: '#f5f5f5',
    timeColumnWidth: 56,
    timeColumnHeight: 224,
    timeCellHeight: 28,
  } as DatePickerToken,

  // Form 组件
  Form: {
    labelFontSize: themeTokens.fontSize,
    labelColor: '#000000d9',
    labelRequiredMarkColor: themeTokens.colorError,
    labelColonMarginInlineStart: 2,
    labelColonMarginInlineEnd: 8,
    itemMarginBottom: 24,
    verticalLabelPadding: '0 0 8px',
    verticalLabelMargin: 0,
  } as FormToken,

  // Menu 组件
  Menu: {
    borderRadius: themeTokens.borderRadius,
    fontSize: themeTokens.fontSize,
    itemBg: 'transparent',
    itemColor: '#000000d9',
    itemHoverBg: 'rgba(0, 0, 0, 0.06)',
    itemHoverColor: '#000000d9',
    itemSelectedBg: 'rgba(81, 71, 255, 0.1)',
    itemSelectedColor: themeTokens.colorPrimary,
    itemActiveBg: 'rgba(81, 71, 255, 0.15)',
    subMenuItemBg: 'transparent',
    itemMarginBlock: 4,
    itemMarginInline: 4,
    itemPaddingInline: 12,
    itemHeight: 40,
    collapsedWidth: 80,
    iconSize: 14,
    iconMarginInlineEnd: 10,
  } as MenuToken,

  // Segmented 组件
  Segmented: {
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    itemSelectedBg: '#fff',
    itemSelectedColor: themeTokens.colorPrimary,
    trackBg: '#f9f9f9',
  } as SegmentedToken,
};

// 向后兼容的导出
export const backgroundConfigs = THEME_BACKGROUND_CONFIGS;
export type BackgroundConfig = ThemeBackgroundConfig;
export type StyleConfig = ThemeStyleConfig;

export default themeTokens;
