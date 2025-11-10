import { GIF_DEFAULT_GRAY } from '@/constants/images.constants';
import {
  DEFAULT_THEME_CONFIG,
  STORAGE_KEYS,
} from '@/constants/theme.constants';
import { unifiedThemeService } from '@/services/unifiedThemeService';

/**
 * 样式初始化工具类
 * 统一管理 layout navigation CSS 变量的初始化逻辑
 */
export class StyleInitializer {
  /**
   * 初始化 layout navigation CSS 变量
   * 在应用启动时或租户信息加载完成后调用
   * @param context 调用上下文，用于日志记录
   * @param forceDefault 是否强制使用默认配置，忽略本地存储
   */
  static async initializeLayoutStyle(
    context: string = 'unknown',
    forceDefault: boolean = false,
  ): Promise<void> {
    try {
      console.log(`${context}，开始初始化 layout navigation CSS 变量`);

      // 如果强制使用默认配置，或者没有已保存的样式配置
      const hasStyleConfig =
        !forceDefault && localStorage.getItem(STORAGE_KEYS.LAYOUT_STYLE);
      if (!hasStyleConfig) {
        // 使用默认配置
        await StyleInitializer.applyDefaultStyleWithFallback(context);
      } else {
        // 如果有保存的配置，重新应用以确保 CSS 变量被正确设置
        try {
          // 使用统一主题服务重新应用当前配置
          const currentData = unifiedThemeService.getCurrentData();
          await unifiedThemeService.updateData(currentData, {
            immediate: true,
          });
          const configKey = `${currentData.layoutStyle}-${currentData.navigationStyle}`;
          console.log(`${context}：重新应用已保存的样式配置:`, configKey);
        } catch (configError) {
          console.warn(
            `${context}：应用已保存的样式配置失败，回退到默认配置:`,
            configError,
          );
          await StyleInitializer.applyDefaultStyleWithFallback(context);
        }
      }

      console.log(`${context}：layout navigation CSS 变量初始化完成`);
    } catch (error) {
      console.error(
        `${context}：初始化 layout navigation CSS 变量失败:`,
        error,
      );
      // 最终兜底方案
      await StyleInitializer.applyDefaultStyleWithFallback(context);
    }
  }

  /**
   * 应用默认样式配置的兜底方法
   * @param context 调用上下文
   */
  private static async applyDefaultStyleWithFallback(
    context: string,
  ): Promise<void> {
    try {
      // 使用统一的默认配置
      const defaultConfigKey = `${DEFAULT_THEME_CONFIG.LAYOUT_STYLE}-${DEFAULT_THEME_CONFIG.NAVIGATION_STYLE}`;
      // 使用统一主题服务应用默认配置
      await unifiedThemeService.resetToDefault();
      console.log(`${context}：使用默认样式配置: ${defaultConfigKey}`);
    } catch (fallbackError) {
      console.error(`${context}：应用默认样式配置失败:`, fallbackError);
      // 最后的兜底方案：直接设置 CSS 变量
      this.setFallbackCSSVariables(context);
    }
  }

  /**
   * 最后的兜底方案：直接设置 CSS 变量
   * @param context 调用上下文
   */
  private static setFallbackCSSVariables(context: string): void {
    try {
      const rootElement = document.documentElement;

      // 设置默认的导航相关 CSS 变量
      const defaultNavVars = {
        '--xagi-nav-first-menu-width': '60px',
        '--xagi-page-container-margin': '16px',
        '--xagi-page-container-border-radius': '12px',
        '--xagi-page-container-border-color': 'transparent',
      };

      // 设置默认的布局相关 CSS 变量
      const defaultLayoutVars = {
        '--xagi-layout-text-primary': '#000000',
        '--xagi-layout-text-secondary': 'rgba(0, 0, 0, 0.65)',
        '--xagi-layout-text-tertiary': 'rgba(0, 0, 0, 0.65)',
        '--xagi-layout-text-disabled': 'rgba(0, 0, 0, 0.25)',
        '--xagi-layout-second-menu-text-color': 'rgba(0, 0, 0, 0.88)',
        '--xagi-layout-second-menu-text-color-secondary': 'rgba(0, 0, 0, 0.65)',
        '--xagi-layout-bg-primary': 'rgba(255, 255, 255, 0.95)',
        '--xagi-layout-bg-secondary': 'rgba(255, 255, 255, 0.85)',
        '--xagi-layout-bg-card': 'rgba(255, 255, 255, 0.65)',
        '--xagi-layout-bg-input': 'rgba(255, 255, 255, 0.45)',
        '--xagi-layout-border-primary': 'rgba(0, 0, 0, 0.15)',
        '--xagi-layout-border-secondary': 'rgba(0, 0, 0, 0.1)',
        '--xagi-layout-shadow': 'rgba(0, 0, 0, 0.1)',
        '--xagi-layout-overlay': 'rgba(255, 255, 255, 0.7)',
        '--xagi-layout-bg-container': 'rgba(255, 255, 255, 0.95)',
      };

      // 设置默认主题色相关 CSS 变量
      const defaultThemeVars = {
        '--xagi-color-primary': DEFAULT_THEME_CONFIG.PRIMARY_COLOR, // 默认主题色
        '--xagi-color-success': '#3bb346',
        '--xagi-color-warning': '#fc8800',
        '--xagi-color-error': '#f93920',
        '--xagi-color-info': '#0077fa',
        '--xagi-color-link': DEFAULT_THEME_CONFIG.PRIMARY_COLOR,
      };

      // 设置默认背景图 CSS 变量
      const defaultBackgroundVars = {
        '--xagi-background-image': `url(${GIF_DEFAULT_GRAY})`, // 默认背景图
      };

      // 应用导航变量
      Object.entries(defaultNavVars).forEach(([key, value]) => {
        rootElement.style.setProperty(key, value);
      });

      // 应用布局变量
      Object.entries(defaultLayoutVars).forEach(([key, value]) => {
        rootElement.style.setProperty(key, value);
      });

      // // 应用主题色变量
      Object.entries(defaultThemeVars).forEach(([key, value]) => {
        rootElement.style.setProperty(key, value);
      });

      // 应用背景图变量
      Object.entries(defaultBackgroundVars).forEach(([key, value]) => {
        rootElement.style.setProperty(key, value);
      });

      // 设置 body 类名
      document.body.classList.remove(
        'xagi-layout-light',
        'xagi-layout-dark',
        'xagi-nav-style1',
        'xagi-nav-style2',
      );
      document.body.classList.add('xagi-layout-light', 'xagi-nav-style1');

      console.log(
        `${context}：已应用兜底 CSS 变量配置（包含主题色、导航栏风格、深浅色、背景图）`,
      );
    } catch (error) {
      console.error(`${context}：设置兜底 CSS 变量失败:`, error);
    }
  }

  /**
   * 检查样式配置是否存在
   * @returns 是否存在样式配置
   */
  static hasStyleConfig(): boolean {
    // 检查是否有用户主题配置或统一主题数据
    return (
      !!localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG) ||
      !!localStorage.getItem(STORAGE_KEYS.LAYOUT_STYLE)
    );
  }

  /**
   * 获取当前样式配置键名
   * @returns 当前样式配置键名
   */
  static getCurrentStyleConfigKey(): string {
    const data = unifiedThemeService.getCurrentData();
    return `${data.layoutStyle}-${data.navigationStyle}`;
  }

  /**
   * 强制应用默认样式配置
   * 用于错误恢复或重置场景
   */
  static async applyDefaultStyle(): Promise<void> {
    try {
      // 使用统一主题服务应用默认样式
      await unifiedThemeService.resetToDefault();
      console.log('已应用默认样式配置: light-style1');
    } catch (error) {
      console.error('应用默认样式配置失败:', error);
    }
  }

  /**
   * 接口失败时的兜底初始化
   * 强制使用默认配置，忽略本地存储
   * @param context 调用上下文
   */
  static async initializeWithFallback(
    context: string = '接口失败',
  ): Promise<void> {
    console.log(`${context}，使用兜底方案初始化 layout navigation CSS 变量`);
    await this.initializeLayoutStyle?.(context, true); // 强制使用默认配置
  }
}

/**
 * 导出便捷函数
 */
export const initializeLayoutStyle = StyleInitializer.initializeLayoutStyle;
export const hasStyleConfig = StyleInitializer.hasStyleConfig;
export const getCurrentStyleConfigKey =
  StyleInitializer.getCurrentStyleConfigKey;
export const applyDefaultStyle = StyleInitializer.applyDefaultStyle;
export const initializeWithFallback = StyleInitializer.initializeWithFallback;
