import {
  type BackgroundConfig,
  type LayoutColorStyle,
  type NavigationStyleType,
} from '@/types/interfaces/theme';
import { layoutStyleManager } from '@/utils/backgroundStyle';
import React from 'react';

/**
 * React Hook 用于监听布局风格变化
 * 注意：这与 Ant Design 主题系统完全独立
 *
 * @returns 布局风格相关的状态和方法
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
    // 新增的API
    getCurrentStyleConfigKey: () =>
      layoutStyleManager.getCurrentStyleConfigKey(),
    getAllStyleConfigKeys: () => layoutStyleManager.getAllStyleConfigKeys(),
    setStyleByConfigKey: (configKey: string) =>
      layoutStyleManager.setStyleByConfigKey(configKey),
  };
};

// 向后兼容：导出旧的别名
export const useBackgroundStyle = useLayoutStyle;
