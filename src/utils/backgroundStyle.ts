import React from 'react';
import { cloneDeep } from './common';

/**
 * 布局深浅色风格管理工具类
 * 注意：此风格系统与 Ant Design 的主题系统完全独立
 * 仅控制布局容器、导航栏等自定义组件的视觉风格
 */

/**
 * 布局深浅色风格类型
 * 注意：这与 Ant Design 的 theme 无关，仅用于布局风格
 */
export type LayoutColorStyle = 'light' | 'dark';

/**
 * 导航风格类型
 * style1: 紧凑模式（无文字导航，有外边距和圆角）
 * style2: 展开模式（有文字导航，无外边距和圆角）
 */
export type NavigationStyleType = 'style1' | 'style2';

export interface BackgroundConfig {
  id: string;
  name: string;
  url: string;
  layoutStyle: LayoutColorStyle; // 重命名：明确这是布局风格，非Ant Design主题
  description?: string;
}

/**
 * 预定义的背景配置
 * 根据背景图的明暗程度来确定适合的布局风格
 */
export const backgroundConfigs: BackgroundConfig[] = [
  {
    id: 'variant-1',
    name: '星空夜景',
    url: '/bg/bg-variant-1.png',
    layoutStyle: 'light',
    description: '深色背景，适合深色布局风格',
  },
  {
    id: 'variant-2',
    name: '云朵白天',
    url: '/bg/bg-variant-2.png',
    layoutStyle: 'light',
    description: '浅色背景，适合浅色布局风格',
  },
  {
    id: 'variant-3',
    name: '森林晨光',
    url: '/bg/bg-variant-3.png',
    layoutStyle: 'dark',
    description: '明亮背景，适合浅色布局风格',
  },
  {
    id: 'variant-4',
    name: '深海夜色',
    url: '/bg/bg-variant-4.png',
    layoutStyle: 'dark',
    description: '深色背景，适合深色布局风格',
  },
  {
    id: 'variant-5',
    name: '梦幻紫色',
    url: '/bg/bg-variant-5.png',
    layoutStyle: 'light',
    description: '深色调背景，适合深色布局风格',
  },
  {
    id: 'variant-6',
    name: '温暖阳光',
    url: '/bg/bg-variant-6.png',
    layoutStyle: 'dark',
    description: '温暖色调，适合浅色布局风格',
  },
  {
    id: 'variant-7',
    name: '夜晚都市',
    url: '/bg/bg-variant-7.png',
    layoutStyle: 'dark',
    description: '都市夜景，适合深色布局风格',
  },
  {
    id: 'variant-8',
    name: '清新蓝天',
    url: '/bg/bg-variant-8.png',
    layoutStyle: 'light',
    description: '清新明亮，适合浅色布局风格',
  },
];

/**
 * 深色布局风格的CSS变量值
 * 注意：这些变量仅用于自定义布局组件，不影响 Ant Design 组件
 */
const darkLayoutStyleVariables = {
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
};

/**
 * 浅色布局风格的CSS变量值
 * 注意：这些变量仅用于自定义布局组件，不影响 Ant Design 组件
 */
const lightLayoutStyleVariables = {
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
};

/**
 * 布局风格管理类
 * 注意：完全独立于 Ant Design 主题系统
 */
export class LayoutStyleManager {
  private static instance: LayoutStyleManager;
  private currentBackground: BackgroundConfig | null = null;
  private currentLayoutStyle: LayoutColorStyle = 'light';
  private currentNavStyle: NavigationStyleType = 'style1';

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

    // 应用对应布局风格
    this.applyLayoutStyle(config.layoutStyle);

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
      this.currentLayoutStyle === 'light' ? 'dark' : 'light';
    this.setLayoutStyle(newStyle);
  }

  /**
   * 设置特定布局风格
   */
  setLayoutStyle(style: LayoutColorStyle): void {
    this.currentLayoutStyle = style;
    this.applyLayoutStyle(style);
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
    this.applyNavigationStyle(navStyle);
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
      this.currentNavStyle === 'style1' ? 'style2' : 'style1';
    this.setNavigationStyle(newNavStyle);
  }

  /**
   * 应用布局风格CSS变量
   * 注意：这些变量只影响自定义布局组件，不影响 Ant Design 组件
   */
  private applyLayoutStyle(style: LayoutColorStyle): void {
    const variables = cloneDeep(
      style === 'dark' ? darkLayoutStyleVariables : lightLayoutStyleVariables,
    );

    // 如果 当前的 nav style 是 style2，则--xagi-layout-bg-secondary 应该是黑色
    const data = JSON.parse(localStorage.getItem('xagi-layout-style') || '{}');
    if (data.navigationStyle === 'style2') {
      variables['--xagi-layout-second-menu-text-color'] =
        style === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.85)';
      variables['--xagi-layout-text-secondary'] =
        style === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';
    }
    if (data.navigationStyle === 'style1') {
      variables['--xagi-layout-second-menu-text-color'] =
        variables['--xagi-layout-text-secondary'];
    }

    // if (data.navigationStyle === 'style1') {
    //   variables['--xagi-layout-text-secondary'] =
    //     style === 'dark'
    //       ? 'rgba(255, 255, 255, 0.85)'
    //       : 'rgba(255, 255, 255, 0.85)';
    // }
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // 添加布局风格类名到body
    document.body.classList.remove('xagi-layout-light', 'xagi-layout-dark');
    document.body.classList.add(`xagi-layout-${style}`);
  }

  /**
   * 应用导航风格
   */
  private applyNavigationStyle(navStyle: NavigationStyleType): void {
    const rootElement = document.documentElement;

    if (navStyle === 'style1') {
      // 风格1：紧凑模式（60px，无文字）
      rootElement.style.setProperty('--xagi-nav-first-menu-width', '60px');
      rootElement.style.setProperty('--xagi-page-container-margin', '16px');
      rootElement.style.setProperty(
        '--xagi-page-container-border-radius',
        '12px',
      );
    } else {
      // 风格2：展开模式（88px，有文字）
      rootElement.style.setProperty('--xagi-nav-first-menu-width', '88px');
      rootElement.style.setProperty('--xagi-page-container-margin', '0px');
      rootElement.style.setProperty(
        '--xagi-page-container-border-radius',
        '0px',
      );
    }

    // 如果导航风格是 style2，则设置 --xagi-layout-bg-secondary 为黑色
    if (navStyle === 'style2') {
      const currentLayoutStyle = this.getCurrentLayoutStyle();
      rootElement.style.setProperty(
        '--xagi-layout-bg-secondary',
        currentLayoutStyle === 'dark'
          ? 'rgba(0, 0, 0, 0.85)'
          : 'rgba(255, 255, 255, 0.85)',
      );
      rootElement.style.setProperty(
        '--xagi-layout-second-menu-text-color',
        'rgba(0, 0, 0, 0.85)',
      );
    } else {
      // 风格1时恢复默认值（从布局风格变量中获取）
      const currentLayoutStyle = this.getCurrentLayoutStyle();
      const variables =
        currentLayoutStyle === 'dark'
          ? darkLayoutStyleVariables
          : lightLayoutStyleVariables;
      rootElement.style.setProperty(
        '--xagi-layout-bg-secondary',
        variables['--xagi-layout-bg-secondary'],
      );
      rootElement.style.setProperty(
        '--xagi-layout-second-menu-text-color',
        variables['--xagi-layout-second-menu-text-color'],
      );
    }

    // 添加导航风格类名到body
    document.body.classList.remove('xagi-nav-style1', 'xagi-nav-style2');
    document.body.classList.add(`xagi-nav-${navStyle}`);
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
    localStorage.setItem('xagi-layout-style', JSON.stringify(data));
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('xagi-layout-style');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.backgroundId) {
          const config = backgroundConfigs.find(
            (bg) => bg.id === data.backgroundId,
          );
          if (config) {
            this.currentBackground = config;
            this.setBackgroundImage(config.url);
          }
        }

        if (data.layoutStyle) {
          this.currentLayoutStyle = data.layoutStyle;
          this.applyLayoutStyle(data.layoutStyle);
        }

        if (data.navigationStyle) {
          this.currentNavStyle = data.navigationStyle;
          this.applyNavigationStyle(data.navigationStyle);
        }
      }
    } catch (error) {
      console.warn('Failed to load layout style from storage:', error);
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

/**
 * React Hook 用于监听布局风格变化
 * 注意：这与 Ant Design 主题系统完全独立
 */
export const useLayoutStyle = () => {
  const [layoutStyle, setLayoutStyle] = React.useState<LayoutColorStyle>(
    layoutStyleManager.getCurrentLayoutStyle(),
  );
  const [background, setBackground] = React.useState<BackgroundConfig | null>(
    layoutStyleManager.getCurrentBackground(),
  );
  const [navigationStyle, setNavigationStyle] =
    React.useState<NavigationStyleType>(
      layoutStyleManager.getCurrentNavigationStyle(),
    );

  React.useEffect(() => {
    const handleStyleChange = (event: CustomEvent) => {
      setLayoutStyle(event.detail.layoutStyle);
      setBackground(event.detail.background);
      if (event.detail.navigationStyle) {
        setNavigationStyle(event.detail.navigationStyle);
      }
    };

    const handleNavigationStyleChange = (event: CustomEvent) => {
      setNavigationStyle(event.detail.navigationStyle);
    };

    window.addEventListener(
      'xagi-layout-style-changed',
      handleStyleChange as EventListener,
    );
    window.addEventListener(
      'xagi-navigation-style-changed',
      handleNavigationStyleChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        'xagi-layout-style-changed',
        handleStyleChange as EventListener,
      );
      window.removeEventListener(
        'xagi-navigation-style-changed',
        handleNavigationStyleChange as EventListener,
      );
    };
  }, []);

  return {
    layoutStyle,
    background,
    navigationStyle,
    setBackground: (id: string) => layoutStyleManager.setBackground(id),
    toggleLayoutStyle: () => layoutStyleManager.toggleLayoutStyle(),
    setLayoutStyle: (newStyle: LayoutColorStyle) =>
      layoutStyleManager.setLayoutStyle(newStyle),
    setNavigationStyle: (navStyle: NavigationStyleType) =>
      layoutStyleManager.setNavigationStyle(navStyle),
    toggleNavigationStyle: () => layoutStyleManager.toggleNavigationStyle(),
    getAllBackgrounds: () => layoutStyleManager.getAllBackgrounds(),
    getBackgroundsByLayoutStyle: (filterStyle: LayoutColorStyle) =>
      layoutStyleManager.getBackgroundsByLayoutStyle(filterStyle),
  };
};

// 向后兼容：导出旧的别名
export type BackgroundStyleType = LayoutColorStyle;
export const backgroundStyleManager = layoutStyleManager;
export const useBackgroundStyle = useLayoutStyle;
