import React from 'react';

/**
 * 背景风格管理工具类
 * 根据选择的背景图来切换深浅色风格
 */

export type BackgroundStyleType = 'light' | 'dark';

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
  style: BackgroundStyleType; // 这个背景图适合的风格
  description?: string;
}

/**
 * 预定义的背景配置
 * 根据背景图的明暗程度来确定适合的风格
 */
export const backgroundConfigs: BackgroundConfig[] = [
  {
    id: 'variant-1',
    name: '星空夜景',
    url: '/bg/bg-variant-1.png',
    style: 'dark',
    description: '深色背景，适合深色风格',
  },
  {
    id: 'variant-2',
    name: '云朵白天',
    url: '/bg/bg-variant-2.png',
    style: 'light',
    description: '浅色背景，适合浅色风格',
  },
  {
    id: 'variant-3',
    name: '森林晨光',
    url: '/bg/bg-variant-3.png',
    style: 'light',
    description: '明亮背景，适合浅色风格',
  },
  {
    id: 'variant-4',
    name: '深海夜色',
    url: '/bg/bg-variant-4.png',
    style: 'dark',
    description: '深色背景，适合深色风格',
  },
  {
    id: 'variant-5',
    name: '梦幻紫色',
    url: '/bg/bg-variant-5.png',
    style: 'dark',
    description: '深色调背景，适合深色风格',
  },
  {
    id: 'variant-6',
    name: '温暖阳光',
    url: '/bg/bg-variant-6.png',
    style: 'light',
    description: '温暖色调，适合浅色风格',
  },
  {
    id: 'variant-7',
    name: '夜晚都市',
    url: '/bg/bg-variant-7.png',
    style: 'dark',
    description: '都市夜景，适合深色风格',
  },
  {
    id: 'variant-8',
    name: '清新蓝天',
    url: '/bg/bg-variant-8.png',
    style: 'light',
    description: '清新明亮，适合浅色风格',
  },
];

/**
 * 深色风格的CSS变量值
 */
const darkStyleVariables = {
  '--xagi-current-text-primary': '#ffffff',
  '--xagi-current-text-secondary': 'rgba(255, 255, 255, 0.85)',
  '--xagi-current-text-tertiary': 'rgba(255, 255, 255, 0.65)',
  '--xagi-current-text-disabled': 'rgba(255, 255, 255, 0.25)',

  '--xagi-current-bg-primary': 'rgba(0, 0, 0, 0.85)',
  '--xagi-current-bg-secondary': 'rgba(0, 0, 0, 0.65)',
  '--xagi-current-bg-card': 'rgba(0, 0, 0, 0.45)',
  '--xagi-current-bg-input': 'rgba(0, 0, 0, 0.25)',

  '--xagi-current-border-primary': 'rgba(255, 255, 255, 0.15)',
  '--xagi-current-border-secondary': 'rgba(255, 255, 255, 0.1)',

  '--xagi-current-shadow': 'rgba(0, 0, 0, 0.6)',
  '--xagi-current-overlay': 'rgba(0, 0, 0, 0.7)',
};

/**
 * 浅色风格的CSS变量值
 */
const lightStyleVariables = {
  '--xagi-current-text-primary': '#000000',
  '--xagi-current-text-secondary': 'rgba(0, 0, 0, 0.85)',
  '--xagi-current-text-tertiary': 'rgba(0, 0, 0, 0.65)',
  '--xagi-current-text-disabled': 'rgba(0, 0, 0, 0.25)',

  '--xagi-current-bg-primary': 'rgba(255, 255, 255, 0.95)',
  '--xagi-current-bg-secondary': 'rgba(255, 255, 255, 0.85)',
  '--xagi-current-bg-card': 'rgba(255, 255, 255, 0.65)',
  '--xagi-current-bg-input': 'rgba(255, 255, 255, 0.45)',

  '--xagi-current-border-primary': 'rgba(0, 0, 0, 0.15)',
  '--xagi-current-border-secondary': 'rgba(0, 0, 0, 0.1)',

  '--xagi-current-shadow': 'rgba(0, 0, 0, 0.1)',
  '--xagi-current-overlay': 'rgba(255, 255, 255, 0.7)',
};

/**
 * 背景风格管理类
 */
export class BackgroundStyleManager {
  private static instance: BackgroundStyleManager;
  private currentBackground: BackgroundConfig | null = null;
  private currentStyle: BackgroundStyleType = 'light';
  private currentNavStyle: NavigationStyleType = 'style1';

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): BackgroundStyleManager {
    if (!BackgroundStyleManager.instance) {
      BackgroundStyleManager.instance = new BackgroundStyleManager();
    }
    return BackgroundStyleManager.instance;
  }

  /**
   * 设置背景图和对应风格
   */
  setBackground(backgroundId: string): void {
    const config = backgroundConfigs.find((bg) => bg.id === backgroundId);
    if (!config) {
      console.warn(`Background config not found for id: ${backgroundId}`);
      return;
    }

    this.currentBackground = config;
    this.currentStyle = config.style;

    // 设置背景图
    this.setBackgroundImage(config.url);

    // 应用对应风格
    this.applyStyle(config.style);

    // 保存到本地存储
    this.saveToStorage();

    // 触发风格变更事件
    this.dispatchStyleChangeEvent();
  }

  /**
   * 手动切换风格（不改变背景图）
   */
  toggleStyle(): void {
    const newStyle: BackgroundStyleType =
      this.currentStyle === 'light' ? 'dark' : 'light';
    this.setStyle(newStyle);
  }

  /**
   * 设置特定风格
   */
  setStyle(style: BackgroundStyleType): void {
    this.currentStyle = style;
    this.applyStyle(style);
    this.saveToStorage();
    this.dispatchStyleChangeEvent();
  }

  /**
   * 获取当前风格
   */
  getCurrentStyle(): BackgroundStyleType {
    return this.currentStyle;
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
   * 根据风格筛选背景
   */
  getBackgroundsByStyle(style: BackgroundStyleType): BackgroundConfig[] {
    return backgroundConfigs.filter((bg) => bg.style === style);
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
   * 应用CSS变量风格
   */
  private applyStyle(style: BackgroundStyleType): void {
    const variables =
      style === 'dark' ? darkStyleVariables : lightStyleVariables;

    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // 添加风格类名到body
    document.body.classList.remove('xagi-light-style', 'xagi-dark-style');
    document.body.classList.add(`xagi-${style}-style`);
  }

  /**
   * 应用导航风格
   */
  private applyNavigationStyle(navStyle: NavigationStyleType): void {
    // 直接通过 Ant Design 的 CSS 变量系统设置导航样式
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
   * 触发风格变更事件
   */
  private dispatchStyleChangeEvent(): void {
    const event = new CustomEvent('xagi-background-style-changed', {
      detail: {
        style: this.currentStyle,
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
        style: this.currentStyle,
        background: this.currentBackground,
      },
    });
    window.dispatchEvent(event);
    // 同时触发背景风格变更事件以保持兼容性
    this.dispatchStyleChangeEvent();
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    const data = {
      backgroundId: this.currentBackground?.id,
      style: this.currentStyle,
      navigationStyle: this.currentNavStyle,
    };
    localStorage.setItem('xagi-background-style', JSON.stringify(data));
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('xagi-background-style');
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
        if (data.style) {
          this.currentStyle = data.style;
          this.applyStyle(data.style);
        }
        if (data.navigationStyle) {
          this.currentNavStyle = data.navigationStyle;
          this.applyNavigationStyle(data.navigationStyle);
        }
      }
    } catch (error) {
      console.warn('Failed to load background style from storage:', error);
    }
  }

  /**
   * 重置为默认设置
   */
  reset(): void {
    const defaultBackground = backgroundConfigs[0];
    this.setBackground(defaultBackground.id);
    this.setNavigationStyle('style1');
  }
}

/**
 * 导出全局实例
 */
export const backgroundStyleManager = BackgroundStyleManager.getInstance();

/**
 * React Hook 用于监听风格变化
 */
export const useBackgroundStyle = () => {
  const [style, setStyle] = React.useState<BackgroundStyleType>(
    backgroundStyleManager.getCurrentStyle(),
  );
  const [background, setBackground] = React.useState<BackgroundConfig | null>(
    backgroundStyleManager.getCurrentBackground(),
  );
  const [navigationStyle, setNavigationStyle] =
    React.useState<NavigationStyleType>(
      backgroundStyleManager.getCurrentNavigationStyle(),
    );

  React.useEffect(() => {
    const handleStyleChange = (event: CustomEvent) => {
      setStyle(event.detail.style);
      setBackground(event.detail.background);
      if (event.detail.navigationStyle) {
        setNavigationStyle(event.detail.navigationStyle);
      }
    };

    const handleNavigationStyleChange = (event: CustomEvent) => {
      setNavigationStyle(event.detail.navigationStyle);
    };

    window.addEventListener(
      'xagi-background-style-changed',
      handleStyleChange as EventListener,
    );
    window.addEventListener(
      'xagi-navigation-style-changed',
      handleNavigationStyleChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        'xagi-background-style-changed',
        handleStyleChange as EventListener,
      );
      window.removeEventListener(
        'xagi-navigation-style-changed',
        handleNavigationStyleChange as EventListener,
      );
    };
  }, []);

  return {
    style,
    background,
    navigationStyle,
    setBackground: (id: string) => backgroundStyleManager.setBackground(id),
    toggleStyle: () => backgroundStyleManager.toggleStyle(),
    setStyle: (newStyle: BackgroundStyleType) =>
      backgroundStyleManager.setStyle(newStyle),
    setNavigationStyle: (navStyle: NavigationStyleType) =>
      backgroundStyleManager.setNavigationStyle(navStyle),
    toggleNavigationStyle: () => backgroundStyleManager.toggleNavigationStyle(),
    getAllBackgrounds: () => backgroundStyleManager.getAllBackgrounds(),
    getBackgroundsByStyle: (filterStyle: BackgroundStyleType) =>
      backgroundStyleManager.getBackgroundsByStyle(filterStyle),
  };
};
