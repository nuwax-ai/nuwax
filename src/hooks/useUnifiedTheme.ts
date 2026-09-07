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
import { isNuwaClaw } from '@/utils/nuwaClawBridge';
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

  /** 实际生效的导航风格：桌面端（nuwaclaw webview）锁定单栏 style3，其余随配置 */
  effectiveNavigationStyle: ThemeNavigationStyleType;
  /** 导航风格是否被环境锁定（桌面端为 true，切换 UI 据此隐藏） */
  isNavigationStyleLocked: boolean;

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

  // 桌面端锁定单栏：布局分发、壳 class 等渲染决策统一读 effective 值
  // （须先于各 toggle/衍生计算声明）
  const isNavigationStyleLocked = isNuwaClaw();
  const effectiveNavigationStyle = isNavigationStyleLocked
    ? ThemeNavigationStyleType.STYLE3
    : data.navigationStyle;

  // 创建更新方法（带loading状态）
  const createUpdateMethod = useCallback(
    (updateFn: (...args: any[]) => Promise<void>) => {
      return async (...args: any[]) => {
        setIsLoading(true);
        try {
          await updateFn(...args);
        } catch (error) {
          console.error('Theme update failed:', error);
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
    // style3（单栏）是独立布局形态，不参与紧凑/展开互切；
    // 桌面端锁定单栏（沉浸式折叠/壳同步只按单栏维护）
    if (
      isNavigationStyleLocked ||
      data.navigationStyle === ThemeNavigationStyleType.STYLE3
    ) {
      return;
    }
    const newStyle =
      data.navigationStyle === ThemeNavigationStyleType.STYLE1
        ? ThemeNavigationStyleType.STYLE2
        : ThemeNavigationStyleType.STYLE1;
    await updateNavigationStyle(newStyle);
  }, [data.navigationStyle, isNavigationStyleLocked, updateNavigationStyle]);

  const toggleLanguage = useCallback(async () => {
    const newLanguage = data.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    await updateLanguage(newLanguage);
  }, [data.language, updateLanguage]);

  const resetToDefault = createUpdateMethod(
    unifiedThemeService.resetToDefault.bind(unifiedThemeService),
  );
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
    effectiveNavigationStyle,
    isNavigationStyleLocked,

    // 额外功能
    extraColors,
  };
};

export default useUnifiedTheme;
