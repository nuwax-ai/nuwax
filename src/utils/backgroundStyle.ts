import {
  backgroundConfigs,
  STORAGE_KEYS,
  STYLE_CONFIGS,
} from '@/constants/theme.constants';
import {
  ThemeLayoutColorStyle,
  ThemeNavigationStyleType,
} from '@/types/enums/theme';
import {
  type BackgroundConfig,
  type LayoutColorStyle,
  type NavigationStyleType,
} from '@/types/interfaces/theme';

/**
 * 布局深浅色风格管理工具类
 * 注意：此风格系统与 Ant Design 的主题系统完全独立
 * 仅控制布局容器、导航栏等自定义组件的视觉风格
 */

/**
 * 布局风格管理类
 * 注意：完全独立于 Ant Design 主题系统
 */
export class LayoutStyleManager {
  private static instance: LayoutStyleManager;
  private currentBackground: BackgroundConfig | null = null;
  private currentLayoutStyle: LayoutColorStyle = ThemeLayoutColorStyle.LIGHT;
  private currentNavStyle: NavigationStyleType =
    ThemeNavigationStyleType.STYLE1;

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): LayoutStyleManager {
    if (!LayoutStyleManager.instance) {
      LayoutStyleManager.instance = new LayoutStyleManager();
    }
    return LayoutStyleManager.instance;
  }

  /**
   * 设置背景图和对应布局风格
   */
  setBackground(backgroundId: string): void {
    const config = backgroundConfigs.find((bg) => bg.id === backgroundId);
    if (!config) {
      console.warn(`Background config not found for id: ${backgroundId}`);
      return;
    }

    this.currentBackground = config;
    this.currentLayoutStyle = config.layoutStyle;

    // 设置背景图
    this.setBackgroundImage(config.url);

    // 应用完整的样式配置
    this.applyStyleConfig();

    // 保存到本地存储
    this.saveToStorage();

    // 触发风格变更事件
    this.dispatchStyleChangeEvent();
  }

  /**
   * 手动切换布局风格（不改变背景图）
   */
  toggleLayoutStyle(): void {
    const newStyle: LayoutColorStyle =
      this.currentLayoutStyle === ThemeLayoutColorStyle.LIGHT
        ? ThemeLayoutColorStyle.DARK
        : ThemeLayoutColorStyle.LIGHT;
    this.setLayoutStyle(newStyle);
  }

  /**
   * 设置特定布局风格
   */
  setLayoutStyle(style: LayoutColorStyle): void {
    this.currentLayoutStyle = style;
    this.applyStyleConfig();
    this.saveToStorage();
    this.dispatchStyleChangeEvent();
  }

  /**
   * 获取当前布局风格
   */
  getCurrentLayoutStyle(): LayoutColorStyle {
    return this.currentLayoutStyle;
  }

  /**
   * 获取当前背景配置
   */
  getCurrentBackground(): BackgroundConfig | null {
    return this.currentBackground;
  }

  /**
   * 获取所有可用背景配置
   */
  getAllBackgrounds(): BackgroundConfig[] {
    return backgroundConfigs;
  }

  /**
   * 根据布局风格筛选背景
   */
  getBackgroundsByLayoutStyle(style: LayoutColorStyle): BackgroundConfig[] {
    return backgroundConfigs.filter((bg) => bg.layoutStyle === style);
  }

  /**
   * 设置导航风格
   */
  setNavigationStyle(navStyle: NavigationStyleType): void {
    this.currentNavStyle = navStyle;
    this.applyStyleConfig();
    this.saveToStorage();
    this.dispatchNavigationStyleChangeEvent();
  }

  /**
   * 获取当前导航风格
   */
  getCurrentNavigationStyle(): NavigationStyleType {
    return this.currentNavStyle;
  }

  /**
   * 切换导航风格
   */
  toggleNavigationStyle(): void {
    const newNavStyle: NavigationStyleType =
      this.currentNavStyle === ThemeNavigationStyleType.STYLE1
        ? ThemeNavigationStyleType.STYLE2
        : ThemeNavigationStyleType.STYLE1;
    this.setNavigationStyle(newNavStyle);
  }

  /**
   * 获取当前样式配置键名（公共方法）
   */
  getCurrentStyleConfigKey(): string {
    return `${this.currentLayoutStyle}-${this.currentNavStyle}`;
  }

  /**
   * 获取所有可用的样式配置键名
   */
  getAllStyleConfigKeys(): string[] {
    return Object.keys(STYLE_CONFIGS);
  }

  /**
   * 根据样式配置键名直接设置样式
   * @param configKey 样式配置键名，格式为 'layoutStyle-navStyle'
   */
  setStyleByConfigKey(configKey: string): void {
    if (!STYLE_CONFIGS[configKey]) {
      console.warn(`Invalid style config key: ${configKey}`);
      return;
    }

    const [layoutStyle, navStyle] = configKey.split('-') as [
      LayoutColorStyle,
      NavigationStyleType,
    ];

    this.currentLayoutStyle = layoutStyle;
    this.currentNavStyle = navStyle;

    this.applyStyleConfig();
    this.saveToStorage();
    this.dispatchStyleChangeEvent();
  }

  /**
   * 应用完整的样式配置（布局风格 + 导航风格）
   * 注意：这些变量只影响自定义布局组件，不影响 Ant Design 组件
   */
  private applyStyleConfig(): void {
    const configKey = this.getCurrentStyleConfigKey();
    const config = STYLE_CONFIGS[configKey];

    if (!config) {
      console.warn(`Style config not found for key: ${configKey}`);
      return;
    }

    const rootElement = document.documentElement;

    // 应用布局相关的CSS变量
    Object.entries(config.layout).forEach(([key, value]) => {
      rootElement.style.setProperty(key, value);
    });

    // 应用导航相关的CSS变量
    Object.entries(config.navigation).forEach(([key, value]) => {
      rootElement.style.setProperty(key, value);
    });

    // 添加样式类名到body
    this.updateBodyClasses();
  }

  /**
   * 更新body元素的样式类名
   */
  private updateBodyClasses(): void {
    // 移除所有相关的类名
    document.body.classList.remove(
      'xagi-layout-light',
      'xagi-layout-dark',
      'xagi-nav-style1',
      'xagi-nav-style2',
    );

    // 添加当前样式对应的类名
    document.body.classList.add(`xagi-layout-${this.currentLayoutStyle}`);
    document.body.classList.add(`xagi-nav-${this.currentNavStyle}`);
  }

  /**
   * 应用布局风格（重构后的统一方法）
   * @deprecated 使用 applyStyleConfig 替代
   */
  private applyLayoutStyle(style: LayoutColorStyle): void {
    this.currentLayoutStyle = style;
    this.applyStyleConfig();
  }

  /**
   * 应用导航风格（重构后的统一方法）
   * @deprecated 使用 applyStyleConfig 替代
   */
  private applyNavigationStyle(navStyle: NavigationStyleType): void {
    this.currentNavStyle = navStyle;
    this.applyStyleConfig();
  }

  /**
   * 设置背景图
   */
  private setBackgroundImage(url: string): void {
    document.documentElement.style.setProperty(
      '--xagi-background-image',
      `url(${url})`,
    );
  }

  /**
   * 触发布局风格变更事件
   */
  private dispatchStyleChangeEvent(): void {
    const event = new CustomEvent('xagi-layout-style-changed', {
      detail: {
        layoutStyle: this.currentLayoutStyle,
        background: this.currentBackground,
        navigationStyle: this.currentNavStyle,
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * 触发导航风格变更事件
   */
  private dispatchNavigationStyleChangeEvent(): void {
    const event = new CustomEvent('xagi-navigation-style-changed', {
      detail: {
        navigationStyle: this.currentNavStyle,
        layoutStyle: this.currentLayoutStyle,
        background: this.currentBackground,
      },
    });
    window.dispatchEvent(event);
    // 同时触发布局风格变更事件以保持兼容性
    this.dispatchStyleChangeEvent();
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    const data = {
      backgroundId: this.currentBackground?.id,
      layoutStyle: this.currentLayoutStyle,
      navigationStyle: this.currentNavStyle,
    };
    localStorage.setItem(STORAGE_KEYS.LAYOUT_STYLE, JSON.stringify(data));
  }

  /**
   * 同步主题颜色到全局设置
   * @param themeConfig 主题配置数据
   */
  public syncThemeColorToGlobalSettings(themeConfig: any): void {
    if (!themeConfig?.selectedThemeColor) return;

    try {
      // 获取当前全局设置
      const { STORAGE_KEYS } = require('@/constants/theme.constants');
      const currentSettingsStr = localStorage.getItem(
        STORAGE_KEYS.GLOBAL_SETTINGS,
      );
      let currentSettings = currentSettingsStr
        ? JSON.parse(currentSettingsStr)
        : {};

      // 更新主题颜色
      const newSettings = {
        ...currentSettings,
        primaryColor: themeConfig.selectedThemeColor,
      };

      // 保存到本地存储
      localStorage.setItem(
        STORAGE_KEYS.GLOBAL_SETTINGS,
        JSON.stringify(newSettings),
      );

      // 触发全局设置变更事件
      const event = new CustomEvent('xagi-global-settings-changed', {
        detail: newSettings,
      });
      window.dispatchEvent(event);

      console.log('已同步主题颜色到全局设置:', themeConfig.selectedThemeColor);
    } catch (error) {
      console.warn('同步主题颜色到全局设置失败:', error);
    }
  }

  /**
   * 获取主题配置数据（按优先级）
   * @returns 主题配置数据或null
   */
  public getThemeConfigData(): any {
    try {
      let themeData: any = null;

      // 1. 优先从租户配置中获取主题配置
      const tenantConfigString = localStorage.getItem('TENANT_CONFIG_INFO');
      if (tenantConfigString) {
        try {
          const tenantConfig = JSON.parse(tenantConfigString);
          if (tenantConfig.templateConfig) {
            const templateConfig = JSON.parse(tenantConfig.templateConfig);
            console.log('从租户配置加载主题配置:', templateConfig);
            return templateConfig; // 直接返回原始格式的主题配置
          }
        } catch (error) {
          console.warn('解析租户主题配置失败:', error);
        }
      }

      // 2. 如果租户配置中没有，则从用户主题配置本地存储获取
      if (!themeData) {
        const userThemeConfig = localStorage.getItem(
          STORAGE_KEYS.USER_THEME_CONFIG,
        );
        if (userThemeConfig) {
          const templateConfig = JSON.parse(userThemeConfig);
          console.log('从用户主题配置本地存储加载配置:', templateConfig);
          return templateConfig; // 直接返回原始格式的主题配置
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to get theme config data:', error);
      return null;
    }
  }

  /**
   * 从主题配置数据转换为布局样式数据
   * @param themeConfig 主题配置数据
   */
  private convertThemeConfigToLayoutData(themeConfig: any): any {
    return {
      backgroundId: themeConfig.selectedBackgroundId,
      layoutStyle:
        themeConfig.navigationStyle === 'dark'
          ? ThemeLayoutColorStyle.DARK
          : ThemeLayoutColorStyle.LIGHT,
      navigationStyle:
        themeConfig.navigationStyleId === 'style2'
          ? ThemeNavigationStyleType.STYLE2
          : ThemeNavigationStyleType.STYLE1,
    };
  }

  /**
   * 从本地存储加载
   */
  public loadFromStorage(): void {
    try {
      let themeData: any = null;

      // 1. 尝试获取主题配置数据
      const themeConfig = this.getThemeConfigData();
      if (themeConfig) {
        themeData = this.convertThemeConfigToLayoutData(themeConfig);
        // 同步主题颜色到全局设置
        this.syncThemeColorToGlobalSettings(themeConfig);
      }

      // 2. 如果没有主题配置，则从布局样式本地存储获取
      if (!themeData) {
        const stored = localStorage.getItem(STORAGE_KEYS.LAYOUT_STYLE);
        if (stored) {
          themeData = JSON.parse(stored);
          console.log('从布局样式本地存储加载配置:', themeData);
        }
      }

      // 3. 应用加载的配置或使用默认值
      if (themeData) {
        // 加载背景配置
        if (themeData.backgroundId) {
          const config = backgroundConfigs.find(
            (bg) => bg.id === themeData.backgroundId,
          );
          if (config) {
            this.currentBackground = config;
            this.setBackgroundImage(config.url);
          }
        }

        // 加载布局风格
        if (themeData.layoutStyle) {
          this.currentLayoutStyle = themeData.layoutStyle;
        }

        // 加载导航风格
        if (themeData.navigationStyle) {
          this.currentNavStyle = themeData.navigationStyle;
        }

        // 应用完整的样式配置
        this.applyStyleConfig();
      } else {
        console.log('没有找到主题配置，使用默认设置');
        // 使用默认配置
        this.applyStyleConfig();
      }
    } catch (error) {
      console.warn('Failed to load layout style from storage:', error);
      // 出错时使用默认配置
      this.applyStyleConfig();
    }
  }
}

/**
 * 导出全局实例
 */
export const layoutStyleManager = LayoutStyleManager.getInstance();

// 开发环境下将管理器暴露到全局，便于调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).layoutStyleManager = layoutStyleManager;
  (window as any).backgroundStyleManager = layoutStyleManager; // 向后兼容别名
}

// 向后兼容：导出旧的别名
export type BackgroundStyleType = LayoutColorStyle;
export const backgroundStyleManager = layoutStyleManager;
