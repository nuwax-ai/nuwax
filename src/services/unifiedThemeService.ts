/**
 * 统一主题数据管理服务
 *
 * 目标：
 * - 不新做组件样式，仅处理数据存取逻辑
 * - 统一管理主题、导航栏、背景图、语言相关状态
 * - 配置优先级：用户设置 > 租户信息设置 > 默认配置
 * - 保持向后兼容性
 */

import {
  DEFAULT_THEME_CONFIG,
  STORAGE_KEYS,
  STYLE_CONFIGS,
  THEME_COLOR_CONFIGS,
  backgroundConfigs,
} from '@/constants/theme.constants';
import {
  ThemeLayoutColorStyle,
  ThemeNavigationStyleType,
} from '@/types/enums/theme';

/**
 * 统一主题配置接口
 */
export interface UnifiedThemeData {
  // 主题配置
  primaryColor: string;
  antdTheme: 'light' | 'dark';

  // 导航配置
  navigationStyle: ThemeNavigationStyleType;
  layoutStyle: ThemeLayoutColorStyle;

  // 背景配置
  backgroundId: string;

  // 语言配置
  language: 'zh-CN' | 'en-US';

  // 元数据
  timestamp: number;
  source: 'user' | 'tenant' | 'default';
}

/**
 * 配置更新选项
 */
interface UpdateOptions {
  immediate?: boolean;
  emitEvent?: boolean;
  saveToStorage?: boolean;
}

/**
 * 统一主题数据管理类
 */
class UnifiedThemeService {
  private currentData: UnifiedThemeData;
  private listeners: Set<(data: UnifiedThemeData) => void> = new Set();
  private clearThemeFlag: boolean = false;
  constructor() {
    this.currentData = this.loadConfiguration();
    this.initializeEventHandlers();
  }

  /**
   * 按优先级加载配置
   * 优先级：用户设置 > 租户信息设置 > 默认配置
   */
  private loadConfiguration(): UnifiedThemeData {
    // 1. 尝试加载用户设置（最高优先级）
    const userConfig = this.loadUserSettings();
    if (userConfig) {
      return { ...userConfig, source: 'user' };
    }

    // 2. 尝试加载租户信息设置
    const tenantConfig = this.loadTenantSettings();
    if (tenantConfig) {
      return { ...tenantConfig, source: 'tenant' };
    }

    // 3. 使用默认配置
    const defaultConfig = this.getDefaultConfiguration();
    return { ...defaultConfig, source: 'default' };
  }

  /**
   * 加载用户设置
   */
  private loadUserSettings(): UnifiedThemeData | null {
    try {
      // 从用户主题配置加载
      const userThemeConfig = localStorage.getItem(
        STORAGE_KEYS.USER_THEME_CONFIG,
      );
      if (userThemeConfig) {
        const config = JSON.parse(userThemeConfig);
        return this.normalizeUserConfig(config);
      }

      // 从全局设置加载
      const globalSettings = localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS);
      if (globalSettings) {
        const settings = JSON.parse(globalSettings);
        return this.normalizeGlobalSettings(settings);
      }

      return null;
    } catch (error) {
      console.warn('加载用户设置失败:', error);
      return null;
    }
  }

  /**
   * 加载租户信息设置
   */
  private loadTenantSettings(): UnifiedThemeData | null {
    try {
      const tenantConfigString = localStorage.getItem(
        STORAGE_KEYS.TENANT_CONFIG_INFO,
      );
      if (!tenantConfigString) return null;

      const tenantConfig = JSON.parse(tenantConfigString);
      if (!tenantConfig.templateConfig) return null;

      const templateConfig = JSON.parse(tenantConfig.templateConfig);
      return this.normalizeTenantConfig(templateConfig);
    } catch (error) {
      console.warn('加载租户设置失败:', error);
      return null;
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfiguration(): UnifiedThemeData {
    return {
      primaryColor: DEFAULT_THEME_CONFIG.PRIMARY_COLOR,
      antdTheme: DEFAULT_THEME_CONFIG.THEME as 'light' | 'dark',
      navigationStyle:
        DEFAULT_THEME_CONFIG.NAVIGATION_STYLE as ThemeNavigationStyleType,
      layoutStyle: DEFAULT_THEME_CONFIG.LAYOUT_STYLE as ThemeLayoutColorStyle,
      backgroundId: DEFAULT_THEME_CONFIG.BACKGROUND_ID,
      language: DEFAULT_THEME_CONFIG.LANGUAGE as 'zh-CN' | 'en-US',
      timestamp: Date.now(),
      source: 'default',
    };
  }

  /**
   * 标准化用户配置格式
   */
  private normalizeUserConfig(config: any): UnifiedThemeData {
    const defaults = this.getDefaultConfiguration();
    return {
      primaryColor: config.selectedThemeColor || defaults.primaryColor,
      antdTheme: config.antdTheme || defaults.antdTheme,
      navigationStyle: config.navigationStyleId || defaults.navigationStyle,
      layoutStyle: config.navigationStyle || defaults.layoutStyle,
      backgroundId: config.selectedBackgroundId || defaults.backgroundId,
      language: config.language || defaults.language,
      timestamp: config.timestamp || Date.now(),
      source: 'user',
    };
  }

  /**
   * 标准化全局设置格式
   */
  private normalizeGlobalSettings(settings: any): UnifiedThemeData {
    const defaults = this.getDefaultConfiguration();
    return {
      primaryColor: settings.primaryColor || defaults.primaryColor,
      antdTheme: settings.theme || defaults.antdTheme,
      navigationStyle: defaults.navigationStyle,
      layoutStyle: defaults.layoutStyle,
      backgroundId: settings.backgroundImageId || defaults.backgroundId,
      language: settings.language || defaults.language,
      timestamp: Date.now(),
      source: 'user',
    };
  }

  /**
   * 标准化租户配置格式
   */
  private normalizeTenantConfig(config: any): UnifiedThemeData {
    const defaults = this.getDefaultConfiguration();
    return {
      primaryColor: config.selectedThemeColor || defaults.primaryColor,
      antdTheme: config.antdTheme || defaults.antdTheme,
      navigationStyle: config.navigationStyleId || defaults.navigationStyle,
      layoutStyle: config.navigationStyle || defaults.layoutStyle,
      backgroundId: config.selectedBackgroundId || defaults.backgroundId,
      language: config.language || defaults.language,
      timestamp: config.timestamp || Date.now(),
      source: 'tenant',
    };
  }

  /**
   * 初始化事件处理
   */
  private initializeEventHandlers(): void {
    // 监听存储变化
    window.addEventListener('storage', (e) => {
      if (
        [STORAGE_KEYS.USER_THEME_CONFIG, STORAGE_KEYS.GLOBAL_SETTINGS].includes(
          e.key as any,
        )
      ) {
        const needNotify = !this.clearThemeFlag;
        this.reloadConfiguration(needNotify);
        this.clearThemeFlag = false; // 清除标志
      }
    });
  }

  /**
   * 重新加载配置
   */
  private reloadConfiguration(needNotify: boolean = true): void {
    const newData = this.loadConfiguration();
    if (JSON.stringify(newData) !== JSON.stringify(this.currentData)) {
      this.currentData = newData;
      if (needNotify) {
        this.notifyListeners();
      }
    }
  }

  /**
   * 获取当前配置
   */
  getCurrentData(): UnifiedThemeData {
    return { ...this.currentData };
  }

  /**
   * 更新主题色
   */
  async updatePrimaryColor(
    color: string,
    options: UpdateOptions = {},
  ): Promise<void> {
    await this.updateData({ primaryColor: color }, options);
  }

  /**
   * 更新Ant Design主题模式
   */
  async updateAntdTheme(
    theme: 'light' | 'dark',
    options: UpdateOptions = {},
  ): Promise<void> {
    await this.updateData({ antdTheme: theme }, options);
  }

  /**
   * 更新导航风格
   */
  async updateNavigationStyle(
    style: ThemeNavigationStyleType,
    options: UpdateOptions = {},
  ): Promise<void> {
    await this.updateData({ navigationStyle: style }, options);
  }

  /**
   * 更新布局风格（导航栏深浅色）
   */
  async updateLayoutStyle(
    style: ThemeLayoutColorStyle,
    options: UpdateOptions = {},
  ): Promise<void> {
    await this.updateData({ layoutStyle: style }, options);
  }

  /**
   * 更新背景图
   */
  async updateBackground(
    backgroundId: string,
    options: UpdateOptions = {},
  ): Promise<void> {
    // 根据背景图自动设置布局风格
    const backgroundConfig = backgroundConfigs.find(
      (bg) => bg.id === backgroundId,
    );

    const layoutStyle = backgroundConfig?.layoutStyle;

    const updates: Partial<UnifiedThemeData> = { backgroundId };
    if (layoutStyle) {
      updates.layoutStyle = layoutStyle;
    }

    await this.updateData(updates, options);
  }

  /**
   * 更新语言
   */
  async updateLanguage(
    language: 'zh-CN' | 'en-US',
    options: UpdateOptions = {},
  ): Promise<void> {
    await this.updateData({ language }, options);
  }

  /**
   * 批量更新配置
   */
  async updateData(
    updates: Partial<UnifiedThemeData> | null,
    options: UpdateOptions = {},
  ): Promise<void> {
    const {
      immediate = true,
      emitEvent = true,
      saveToStorage = true,
    } = options;

    // 更新内存中的数据
    this.currentData = {
      ...this.currentData,
      ...(updates || {}),
      timestamp: Date.now(),
      source: 'user', // 用户操作都标记为用户来源
    };

    // 保存到存储
    if (saveToStorage) {
      this.saveToStorage();
    }

    // 立即应用到DOM
    if (immediate) {
      this.applyToDOM();
    }

    // 触发事件
    if (emitEvent) {
      this.notifyListeners();
      this.emitGlobalEvent();
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      // 保存到用户主题配置
      const userThemeConfig = {
        selectedThemeColor: this.currentData.primaryColor,
        selectedBackgroundId: this.currentData.backgroundId,
        antdTheme: this.currentData.antdTheme,
        navigationStyle: this.currentData.layoutStyle,
        navigationStyleId: this.currentData.navigationStyle,
        language: this.currentData.language,
        timestamp: this.currentData.timestamp,
      };

      localStorage.setItem(
        STORAGE_KEYS.USER_THEME_CONFIG,
        JSON.stringify(userThemeConfig),
      );

      // 同步到全局设置
      const globalSettings = {
        theme: this.currentData.antdTheme,
        language: this.currentData.language,
        primaryColor: this.currentData.primaryColor,
        backgroundImageId: this.currentData.backgroundId,
      };

      localStorage.setItem(
        STORAGE_KEYS.GLOBAL_SETTINGS,
        JSON.stringify(globalSettings),
      );
    } catch (error) {
      console.error('保存主题数据失败:', error);
    }
  }

  /**
   * 应用到DOM
   */
  private applyToDOM(): void {
    try {
      const root = document.documentElement;

      // 设置主题色
      root.style.setProperty(
        '--xagi-color-primary',
        this.currentData.primaryColor,
      );

      // 设置背景图
      if (this.currentData.backgroundId) {
        // 查找背景图配置获取正确的URL
        const backgroundConfig = backgroundConfigs.find(
          (bg) => bg.id === this.currentData.backgroundId,
        );

        const backgroundUrl =
          backgroundConfig?.url || `/bg/${this.currentData.backgroundId}.png`;

        // 设置CSS变量
        root.style.setProperty(
          '--xagi-background-image',
          `url(${backgroundUrl})`,
        );
      }

      // 根据布局风格和导航风格应用完整的CSS变量
      const layoutStyleKey =
        this.currentData.layoutStyle === ThemeLayoutColorStyle.DARK
          ? 'dark'
          : 'light';
      const navigationStyleKey =
        this.currentData.navigationStyle === ThemeNavigationStyleType.STYLE1
          ? 'style1'
          : 'style2';
      const styleConfigKey = `${layoutStyleKey}-${navigationStyleKey}`;

      const styleConfig = STYLE_CONFIGS[styleConfigKey];
      if (styleConfig) {
        // 应用layout相关的CSS变量
        Object.entries(styleConfig.layout).forEach(([property, value]) => {
          root.style.setProperty(property, value);
        });

        // 应用navigation相关的CSS变量
        Object.entries(styleConfig.navigation).forEach(([property, value]) => {
          root.style.setProperty(property, value);
        });
      } else {
        // 设置导航栏宽度（兜底）
        const navWidth =
          this.currentData.navigationStyle === ThemeNavigationStyleType.STYLE1
            ? '60px'
            : '88px';
        root.style.setProperty('--xagi-nav-first-menu-width', navWidth);
      }

      // 设置data属性
      root.setAttribute('data-theme', this.currentData.antdTheme);
      root.setAttribute('data-nav-theme', this.currentData.layoutStyle);
      root.setAttribute(
        'data-nav-style',
        this.currentData.navigationStyle === ThemeNavigationStyleType.STYLE1
          ? 'compact'
          : 'expanded',
      );
      this.updateBodyClasses();
    } catch (error) {
      console.error('应用主题数据到DOM失败:', error);
    }
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
    document.body.classList.add(`xagi-layout-${this.currentData.layoutStyle}`);
    document.body.classList.add(`xagi-nav-${this.currentData.navigationStyle}`);
  }

  /**
   * 触发全局事件
   */
  private emitGlobalEvent(): void {
    try {
      // 新事件
      window.dispatchEvent(
        new CustomEvent('unified-theme-changed', {
          detail: this.currentData,
        }),
      );

      // 兼容旧事件
      window.dispatchEvent(
        new CustomEvent('xagi-global-settings-changed', {
          detail: this.currentData,
        }),
      );

      window.dispatchEvent(
        new CustomEvent('xagi-theme-config-changed', {
          detail: this.currentData,
        }),
      );

      // 兼容导航风格变化事件
      window.dispatchEvent(
        new CustomEvent('xagi-navigation-style-changed', {
          detail: { navigationStyle: this.currentData.navigationStyle },
        }),
      );

      // 兼容布局风格变化事件
      window.dispatchEvent(
        new CustomEvent('xagi-layout-style-changed', {
          detail: {
            layoutStyle: this.currentData.layoutStyle,
            navigationStyle: this.currentData.navigationStyle,
          },
        }),
      );
    } catch (error) {
      console.error('触发全局事件失败:', error);
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentData);
      } catch (error) {
        console.error('监听器回调失败:', error);
      }
    });
  }

  /**
   * 添加监听器
   */
  addListener(callback: (data: UnifiedThemeData) => void): void {
    this.listeners.add(callback);
  }

  /**
   * 移除监听器
   */
  removeListener(callback: (data: UnifiedThemeData) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * 重置为默认配置
   */
  async resetToDefault(): Promise<void> {
    const defaultConfig = this.getDefaultConfiguration();
    await this.updateData(defaultConfig, { immediate: true, emitEvent: true });
  }

  /**
   * 获取配置来源
   */
  getConfigSource(): 'user' | 'tenant' | 'default' {
    return this.currentData.source;
  }

  /**
   * 获取配置来源显示文本
   */
  getConfigSourceText(): string {
    switch (this.currentData.source) {
      case 'user':
        return '用户设置';
      case 'tenant':
        return '租户配置';
      case 'default':
        return '默认配置';
      default:
        return '未知来源';
    }
  }

  /**
   * 获取额外的主题颜色（自定义颜色）
   * 从本地缓存的租户信息中获取主题色，如果不是预设颜色则作为自定义颜色返回
   */
  getExtraColors(): string[] {
    const colors: string[] = [];

    try {
      // 专门从租户配置中获取主题色
      const tenantConfigString = localStorage.getItem(
        STORAGE_KEYS.TENANT_CONFIG_INFO,
      );

      if (tenantConfigString) {
        const tenantConfig = JSON.parse(tenantConfigString);
        if (tenantConfig.templateConfig) {
          const templateConfig = JSON.parse(tenantConfig.templateConfig);
          if (templateConfig.selectedThemeColor) {
            const isPresetColor = THEME_COLOR_CONFIGS.some(
              (config: any) =>
                config.color === templateConfig.selectedThemeColor,
            );

            // 如果不是预设颜色，则作为自定义颜色显示
            if (!isPresetColor) {
              colors.push(templateConfig.selectedThemeColor);
            }
          }
        }
      }
    } catch (error) {
      console.warn('获取额外主题颜色失败:', error);
    }

    return colors;
  }

  /**
   * 销毁服务
   */
  dispose(): void {
    this.listeners.clear();
  }

  /**
   * 清除用户主题配置
   */
  clearUserThemeConfig(): void {
    this.clearThemeFlag = true;
    localStorage.removeItem(STORAGE_KEYS.USER_THEME_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_SETTINGS);
  }
}

// 创建并导出单例实例
export const unifiedThemeService = new UnifiedThemeService();

// 开发环境下暴露到全局，便于调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__UNIFIED_THEME_SERVICE__ = unifiedThemeService;
}

// 导出便捷方法
export const {
  getCurrentData,
  updatePrimaryColor,
  updateAntdTheme,
  updateNavigationStyle,
  updateLayoutStyle,
  updateBackground,
  updateLanguage,
  addListener,
  removeListener,
  resetToDefault,
  getConfigSource,
  getConfigSourceText,
  getExtraColors,
  clearUserThemeConfig,
} = unifiedThemeService;

export default unifiedThemeService;
