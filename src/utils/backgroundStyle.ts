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
 *
 * 主题配置优先级（严格按顺序）：
 * 1. 用户本地配置 (STORAGE_KEYS.USER_THEME_CONFIG) - 优先级最高
 *    - 来源：用户在主题配置页面保存的设置
 *    - 特点：如果存在，完全忽略租户配置，确保用户偏好不被覆盖
 * 2. 租户配置数据 (TENANT_CONFIG_INFO.templateConfig) - 兜底方案
 *    - 来源：后端租户配置接口返回的templateConfig
 *    - 特点：仅在本地无配置时生效，提供租户级别的默认主题
 * 3. 布局样式本地存储 (STORAGE_KEYS.LAYOUT_STYLE) - 最后兜底
 *    - 来源：布局风格管理器的本地缓存
 *    - 特点：用于保持用户上次的布局风格选择
 * 4. 系统默认配置 - 兜底的兜底
 *    - 来源：代码中定义的硬编码默认值
 *    - 特点：确保系统始终有可用的主题配置
 *
 * 重要说明：
 * - 本地主题配置一旦存在，租户配置将被完全忽略
 * - 这确保了用户的自定义主题设置不会被租户更新覆盖
 * - 租户配置仅在用户首次使用或清除本地配置后生效
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

    // // 保存到本地存储
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
   * 支持预设颜色和自定义颜色
   * @param themeConfig 主题配置数据
   */
  public syncThemeColorToGlobalSettings(themeConfig: any): void {
    if (!themeConfig?.selectedThemeColor) return;

    try {
      // 验证颜色格式（支持 hex、rgb、rgba 等格式）
      const colorValue = themeConfig.selectedThemeColor;
      if (!this.isValidColor(colorValue)) {
        console.warn('无效的主题颜色格式:', colorValue);
        return;
      }

      // 获取当前全局设置
      const { STORAGE_KEYS } = require('@/constants/theme.constants');
      const currentSettingsStr = localStorage.getItem(
        STORAGE_KEYS.GLOBAL_SETTINGS,
      );
      let currentSettings = currentSettingsStr
        ? JSON.parse(currentSettingsStr)
        : {};

      // 更新主题颜色（支持任何有效的颜色值）
      const newSettings = {
        ...currentSettings,
        primaryColor: colorValue,
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

      console.log('已同步主题颜色到全局设置 (支持自定义颜色):', colorValue);
    } catch (error) {
      console.warn('同步主题颜色到全局设置失败:', error);
    }
  }

  /**
   * 验证颜色值是否有效
   * 支持 hex、rgb、rgba、hsl、hsla 等格式
   * @param color 颜色值
   * @returns 是否为有效颜色
   */
  private isValidColor(color: string): boolean {
    if (!color || typeof color !== 'string') return false;

    // 创建一个临时元素来验证颜色
    const tempElement = document.createElement('div');
    tempElement.style.color = color;

    // 如果浏览器能解析这个颜色，style.color 不会为空
    return tempElement.style.color !== '';
  }

  /**
   * 获取当前配置来源
   * @returns 配置来源类型
   */
  public getCurrentConfigSource(): 'local' | 'tenant' | 'default' {
    try {
      // 1. 检查用户本地配置
      const userThemeConfig = localStorage.getItem(
        STORAGE_KEYS.USER_THEME_CONFIG,
      );
      if (userThemeConfig) {
        return 'local';
      }

      // 2. 检查租户配置
      const tenantConfigString = localStorage.getItem('TENANT_CONFIG_INFO');
      if (tenantConfigString) {
        try {
          const tenantConfig = JSON.parse(tenantConfigString);
          if (tenantConfig.templateConfig) {
            return 'tenant';
          }
        } catch (error) {
          console.warn('解析租户配置失败:', error);
        }
      }

      // 3. 检查布局样式本地存储
      const layoutStyle = localStorage.getItem(STORAGE_KEYS.LAYOUT_STYLE);
      if (layoutStyle) {
        return 'tenant'; // 布局样式通常来自租户配置
      }

      return 'default';
    } catch (error) {
      console.warn('获取配置来源失败:', error);
      return 'default';
    }
  }

  /**
   * 获取主题配置数据（按优先级）
   * 优先级：用户本地数据 > 租户配置数据 > 默认值
   * @returns 主题配置数据或null
   */
  public getThemeConfigData(): any {
    try {
      // 1. 优先从用户主题配置本地存储获取
      const userThemeConfig = localStorage.getItem(
        STORAGE_KEYS.USER_THEME_CONFIG,
      );
      if (userThemeConfig) {
        try {
          const templateConfig = JSON.parse(userThemeConfig);
          console.log(
            '✅ 从用户本地配置加载主题配置 (优先级最高):',
            templateConfig,
          );
          console.log('📝 注意：租户配置将被忽略，确保用户偏好不被覆盖');
          return templateConfig; // 直接返回原始格式的主题配置
        } catch (error) {
          console.warn('❌ 解析用户本地主题配置失败:', error);
        }
      }

      // 2. 如果用户本地没有，则从租户配置中获取主题配置
      const tenantConfigString = localStorage.getItem('TENANT_CONFIG_INFO');
      if (tenantConfigString) {
        try {
          const tenantConfig = JSON.parse(tenantConfigString);
          if (tenantConfig.templateConfig) {
            const templateConfig = JSON.parse(tenantConfig.templateConfig);
            console.log(
              '🏢 从租户配置加载主题配置 (兜底方案):',
              templateConfig,
            );
            console.log('📝 注意：本地无配置，使用租户默认主题');
            return templateConfig; // 直接返回原始格式的主题配置
          }
        } catch (error) {
          console.warn('❌ 解析租户主题配置失败:', error);
        }
      }

      console.log('⚠️ 未找到任何主题配置，将使用系统默认值');
      return null;
    } catch (error) {
      console.warn('❌ Failed to get theme config data:', error);
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

      // 2. 如果没有主题配置，则从布局样式本地存储获取（最后的兜底方案）
      if (!themeData) {
        const stored = localStorage.getItem(STORAGE_KEYS.LAYOUT_STYLE);
        if (stored) {
          themeData = JSON.parse(stored);
          console.log('从布局样式本地存储加载配置 (最后兜底):', themeData);
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
