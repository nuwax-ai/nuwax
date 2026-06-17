/**
 * 租户主题配置相关类型定义
 */

/**
 * 租户主题色配置
 */
export interface TenantThemeColor {
  /** 主题色值 */
  color: string;
  /** 主题色名称 */
  name: string;
  /** 是否为默认主题色 */
  isDefault?: boolean;
}

/**
 * 租户背景图片配置
 */
export interface TenantBackgroundImage {
  /** 背景图片ID */
  id: string;
  /** 背景图片名称 */
  name: string;
  /** 背景图片预览URL */
  preview: string;
  /** 背景图片完整URL */
  url: string;
  /** 是否为默认背景 */
  isDefault?: boolean;
}

/**
 * 导航栏风格配置
 */
export interface NavigationStyle {
  /** 风格ID */
  id: string;
  /** 风格名称 */
  name: string;
  /** 风格描述 */
  description?: string;
  /** 是否为默认风格 */
  isDefault?: boolean;
}

/**
 * 租户主题配置
 */
export interface TenantThemeConfig {
  /** 可用的主题色列表 */
  themeColors: TenantThemeColor[];
  /** 可用的背景图片列表 */
  backgroundImages: TenantBackgroundImage[];
  /** 可用的导航栏风格列表 */
  navigationStyles: NavigationStyle[];
  /** 默认主题色 */
  defaultThemeColor: string;
  /** 默认背景图片ID */
  defaultBackgroundId: string;
  /** 默认导航栏风格ID */
  defaultNavigationStyleId: string;
  /** 是否支持深色模式 */
  supportDarkMode: boolean;
  /** 默认是否为深色模式 */
  defaultIsDarkMode: boolean;
}

/**
 * 租户信息
 */
export interface TenantInfo {
  /** 租户ID */
  id: string;
  /** 租户名称 */
  name: string;
  /** 租户主题配置 */
  themeConfig: TenantThemeConfig;
}
