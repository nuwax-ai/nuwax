/**
 * 统一主题管理 Hook
 *
 * 特点：
 * - 不涉及UI组件，仅处理数据逻辑
 * - 保持与现有Hook的兼容性
 * - 提供简化的主题操作接口
 */

import {
  UnifiedThemeData,
  unifiedThemeService,
} from '@/services/unifiedThemeService';
import {
  ThemeLayoutColorStyle,
  ThemeNavigationStyleType,
} from '@/types/enums/theme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';

// 添加UpdateOptions类型定义
interface UpdateOptions {
  immediate?: boolean;
  emitEvent?: boolean;
  saveToStorage?: boolean;
}

/**
 * Hook 返回值接口
 */
interface UseUnifiedThemeReturn {
  // 当前数据
  data: UnifiedThemeData;

  // 状态
  isLoading: boolean;
  configSource: 'user' | 'tenant' | 'default';
  configSourceText: string;

  // 更新方法
  updatePrimaryColor: (color: string, options?: UpdateOptions) => Promise<void>;
  updateAntdTheme: (
    theme: 'light' | 'dark',
    options?: UpdateOptions,
  ) => Promise<void>;
  updateNavigationStyle: (
    style: ThemeNavigationStyleType,
    options?: UpdateOptions,
  ) => Promise<void>;
  updateLayoutStyle: (
    style: ThemeLayoutColorStyle,
    options?: UpdateOptions,
  ) => Promise<void>;
  updateBackground: (
    backgroundId: string,
    options?: UpdateOptions,
  ) => Promise<void>;
  updateLanguage: (
    language: 'zh-CN' | 'en-US',
    options?: UpdateOptions,
  ) => Promise<void>;

  // 便捷方法
  toggleAntdTheme: () => Promise<void>;
  toggleNavigationTheme: () => Promise<void>;
  toggleNavigationStyle: () => Promise<void>;
  toggleLanguage: () => Promise<void>;
  resetToDefault: () => Promise<void>;

  // 衍生状态（保持兼容性）
  primaryColor: string;
  antdTheme: 'light' | 'dark';
  navigationStyle: ThemeNavigationStyleType;
  layoutStyle: ThemeLayoutColorStyle;
  backgroundId: string;
  language: 'zh-CN' | 'en-US';
  isDarkMode: boolean;
  isNavigationDark: boolean;
  isNavigationExpanded: boolean;
  isChineseLanguage: boolean;

  // 额外功能
  extraColors: string[];
}

/**
 * 统一主题管理 Hook
 */
export const useUnifiedTheme = (): UseUnifiedThemeReturn => {
  const [data, setData] = useState<UnifiedThemeData>(
    unifiedThemeService.getCurrentData(),
  );
  const [isLoading, setIsLoading] = useState(false);
  // 获取租户配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 监听数据变化
  useEffect(() => {
    const handleDataChange = (newData: UnifiedThemeData) => {
      setData(newData);
      setIsLoading(false);
    };

    unifiedThemeService.addListener(handleDataChange);

    return () => {
      unifiedThemeService.removeListener(handleDataChange);
    };
  }, []);

  // 创建更新方法（带loading状态）
  const createUpdateMethod = useCallback(
    (updateFn: (...args: any[]) => Promise<void>) => {
      return async (...args: any[]) => {
        setIsLoading(true);
        try {
          await updateFn(...args);
        } catch (error) {
          console.error('主题更新失败:', error);
          setIsLoading(false);
          throw error;
        }
      };
    },
    [],
  );

  // 更新方法
  const updatePrimaryColor = createUpdateMethod(
    unifiedThemeService.updatePrimaryColor.bind(unifiedThemeService),
  );
  const updateAntdTheme = createUpdateMethod(
    unifiedThemeService.updateAntdTheme.bind(unifiedThemeService),
  );
  const updateNavigationStyle = createUpdateMethod(
    unifiedThemeService.updateNavigationStyle.bind(unifiedThemeService),
  );
  const updateLayoutStyle = createUpdateMethod(
    unifiedThemeService.updateLayoutStyle.bind(unifiedThemeService),
  );
  const updateBackground = createUpdateMethod(
    unifiedThemeService.updateBackground.bind(unifiedThemeService),
  );
  const updateLanguage = createUpdateMethod(
    unifiedThemeService.updateLanguage.bind(unifiedThemeService),
  );

  // 便捷切换方法
  const toggleAntdTheme = useCallback(async () => {
    const newTheme = data.antdTheme === 'light' ? 'dark' : 'light';
    await updateAntdTheme(newTheme);
  }, [data.antdTheme, updateAntdTheme]);

  const toggleNavigationTheme = useCallback(async () => {
    const newLayoutStyle =
      data.layoutStyle === ThemeLayoutColorStyle.DARK
        ? ThemeLayoutColorStyle.LIGHT
        : ThemeLayoutColorStyle.DARK;
    await updateLayoutStyle(newLayoutStyle);
  }, [data.layoutStyle, updateLayoutStyle]);

  const toggleNavigationStyle = useCallback(async () => {
    const newStyle =
      data.navigationStyle === ThemeNavigationStyleType.STYLE1
        ? ThemeNavigationStyleType.STYLE2
        : ThemeNavigationStyleType.STYLE1;
    await updateNavigationStyle(newStyle);
  }, [data.navigationStyle, updateNavigationStyle]);

  const toggleLanguage = useCallback(async () => {
    const newLanguage = data.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    await updateLanguage(newLanguage);
  }, [data.language, updateLanguage]);

  const resetToDefault = createUpdateMethod(
    unifiedThemeService.resetToDefault.bind(unifiedThemeService),
  );

  // 获取配置信息
  const configSource = unifiedThemeService.getConfigSource();
  const configSourceText = unifiedThemeService.getConfigSourceText();

  // 衍生状态（保持与现有代码的兼容性）
  const isDarkMode = data.antdTheme === 'dark';
  const isNavigationDark = data.layoutStyle === ThemeLayoutColorStyle.DARK;
  const isNavigationExpanded =
    data.navigationStyle === ThemeNavigationStyleType.STYLE2;
  const isChineseLanguage = data.language === 'zh-CN';
  // 获取额外颜色
  const extraColors = useMemo(
    () => unifiedThemeService.getExtraColors(),
    [tenantConfigInfo],
  );

  return {
    // 当前数据
    data,

    // 状态
    isLoading,
    configSource,
    configSourceText,

    // 更新方法
    updatePrimaryColor,
    updateAntdTheme,
    updateNavigationStyle,
    updateLayoutStyle,
    updateBackground,
    updateLanguage,

    // 便捷方法
    toggleAntdTheme,
    toggleNavigationTheme,
    toggleNavigationStyle,
    toggleLanguage,
    resetToDefault,

    // 衍生状态（兼容性）
    primaryColor: data.primaryColor,
    antdTheme: data.antdTheme,
    navigationStyle: data.navigationStyle,
    layoutStyle: data.layoutStyle,
    backgroundId: data.backgroundId,
    language: data.language,
    isDarkMode,
    isNavigationDark,
    isNavigationExpanded,
    isChineseLanguage,

    // 额外功能
    extraColors,
  };
};

export default useUnifiedTheme;
