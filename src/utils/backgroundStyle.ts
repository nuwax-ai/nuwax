import React from 'react';

/**
 * 背景风格管理工具类
 * 根据选择的背景图来切换深浅色风格
 */

export type BackgroundStyleType = 'light' | 'dark';

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

  // 导航相关 - 深色风格
  '--xagi-nav-first-menu-color-text': 'rgba(255, 255, 255, 1)',
  '--xagi-nav-first-menu-color-text-secondary': 'rgba(255, 255, 255, 0.8)',
  '--xagi-nav-second-menu-color-text': 'rgba(255, 255, 255, 1)',
  '--xagi-nav-second-menu-color-text-secondary': 'rgba(255, 255, 255, 0.8)',
  '--xagi-nav-second-menu-color-text-tertiary': 'rgba(255, 255, 255, 0.55)',
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

  // 导航相关 - 浅色风格
  '--xagi-nav-first-menu-color-text': 'rgba(0, 0, 0, 1)',
  '--xagi-nav-first-menu-color-text-secondary': 'rgba(0, 0, 0, 0.8)',
  '--xagi-nav-second-menu-color-text': 'rgba(0, 0, 0, 1)',
  '--xagi-nav-second-menu-color-text-secondary': 'rgba(0, 0, 0, 0.8)',
  '--xagi-nav-second-menu-color-text-tertiary': 'rgba(0, 0, 0, 0.55)',
};

/**
 * 背景风格管理类
 */
export class BackgroundStyleManager {
  private static instance: BackgroundStyleManager;
  private currentBackground: BackgroundConfig | null = null;
  private currentStyle: BackgroundStyleType = 'light';

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
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    const data = {
      backgroundId: this.currentBackground?.id,
      style: this.currentStyle,
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

  React.useEffect(() => {
    const handleStyleChange = (event: CustomEvent) => {
      setStyle(event.detail.style);
      setBackground(event.detail.background);
    };

    window.addEventListener(
      'xagi-background-style-changed',
      handleStyleChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        'xagi-background-style-changed',
        handleStyleChange as EventListener,
      );
    };
  }, []);

  return {
    style,
    background,
    setBackground: (id: string) => backgroundStyleManager.setBackground(id),
    toggleStyle: () => backgroundStyleManager.toggleStyle(),
    setStyle: (newStyle: BackgroundStyleType) =>
      backgroundStyleManager.setStyle(newStyle),
    getAllBackgrounds: () => backgroundStyleManager.getAllBackgrounds(),
    getBackgroundsByStyle: (filterStyle: BackgroundStyleType) =>
      backgroundStyleManager.getBackgroundsByStyle(filterStyle),
  };
};
