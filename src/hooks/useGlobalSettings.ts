import { STORAGE_KEYS } from '@/constants/theme.constants';
import backgroundService from '@/services/backgroundService';
import { BackgroundImage } from '@/types/background';
import { theme as antdTheme } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { setLocale } from 'umi';

// 主题类型定义
export type ThemeMode = 'light' | 'dark';

// 语言类型定义
export type Language = 'zh-CN' | 'en-US';

// 全局设置接口
export interface GlobalSettings {
  theme: ThemeMode;
  language: Language;
  /**
   * 应用主色，影响 Ant Design `colorPrimary`
   */
  primaryColor?: string;
  /**
   * 当前背景图片ID
   */
  backgroundImageId?: string;
}

// 本地存储的键名
// 使用统一的存储键名
export const SETTINGS_STORAGE_KEY = STORAGE_KEYS.GLOBAL_SETTINGS;

// 背景图片列表（从全局服务获取）
export const getBackgroundImages = () =>
  backgroundService.getBackgroundImages();

// 默认设置（导出供初始化使用）
export const defaultSettings: GlobalSettings = {
  theme: 'light',
  language: 'zh-CN',
  primaryColor: '#5147ff',
  backgroundImageId: '', // 使用固定默认值，避免循环依赖
};

/**
 * 获取主题配置数据（按优先级）
 * 优先级：用户本地配置 > 租户配置 > 默认值
 */
const getThemeConfigData = () => {
  try {
    // 1. 优先从用户主题配置本地存储获取
    const userThemeConfig = localStorage.getItem(
      STORAGE_KEYS.USER_THEME_CONFIG,
    );
    if (userThemeConfig) {
      const templateConfig = JSON.parse(userThemeConfig);
      console.log('🎨 从用户主题配置加载 (优先级最高):', templateConfig);
      return templateConfig;
    }

    // 2. 如果用户本地没有，则从租户配置中获取主题配置
    const tenantConfigString = localStorage.getItem('TENANT_CONFIG_INFO');
    if (tenantConfigString) {
      const tenantConfig = JSON.parse(tenantConfigString);
      if (tenantConfig.templateConfig) {
        const templateConfig = JSON.parse(tenantConfig.templateConfig);
        console.log('🏢 从租户配置加载主题配置 (兜底方案):', templateConfig);
        return templateConfig;
      }
    }

    console.log('⚠️ 未找到任何主题配置，将使用默认值');
    return null;
  } catch (error) {
    console.warn('❌ 获取主题配置数据失败:', error);
    return null;
  }
};

/**
 * 全局设置管理 Hook
 * 提供主题切换和语言切换功能
 *
 * 配置优先级（严格按顺序）：
 * 1. 用户主题配置 (STORAGE_KEYS.USER_THEME_CONFIG) - 优先级最高
 * 2. 租户配置数据 (TENANT_CONFIG_INFO.templateConfig) - 兜底方案
 * 3. 全局设置本地存储 (STORAGE_KEYS.GLOBAL_SETTINGS) - 最后兜底
 * 4. 系统默认配置 - 兜底的兜底
 *
 * 重要说明：
 * - 用户主题配置一旦存在，租户配置将被完全忽略
 * - 这确保了用户的自定义主题设置不会被租户更新覆盖
 */
export const useGlobalSettings = () => {
  // 读取并持有全局设置（优先使用用户配置）
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    // 1. 优先从主题配置数据获取（用户本地配置 > 租户配置 > 默认值）
    const themeConfig = getThemeConfigData();
    if (themeConfig) {
      console.log('🎨 使用主题配置数据初始化全局设置:', themeConfig);
      return {
        ...defaultSettings,
        primaryColor:
          themeConfig.selectedThemeColor || defaultSettings.primaryColor,
        backgroundImageId:
          themeConfig.selectedBackgroundId || defaultSettings.backgroundImageId,
        theme: themeConfig.antdTheme === 'dark' ? 'dark' : 'light',
      };
    }

    // 2. 如果没有主题配置，尝试从全局设置获取
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        console.log('🎨 从全局设置加载用户配置:', parsedSettings);

        // 优先使用用户配置中的背景图片ID
        const userBackgroundId = parsedSettings.backgroundImageId;
        const currentBackgroundId = backgroundService.getCurrentBackgroundId();

        return {
          ...defaultSettings,
          ...parsedSettings,
          // 优先使用用户配置的背景图片ID，如果用户配置为空则使用backgroundService的值
          backgroundImageId: userBackgroundId || currentBackgroundId,
        };
      }
    } catch (error) {
      console.warn('❌ 解析全局设置失败:', error);
    }

    // 3. 最后使用默认设置和backgroundService的当前值
    const currentBackgroundId = backgroundService.getCurrentBackgroundId();
    console.log(
      '🎨 使用默认设置和backgroundService当前值:',
      currentBackgroundId,
    );
    return {
      ...defaultSettings,
      backgroundImageId: currentBackgroundId,
    };
  });

  // 监听背景服务的变化，同步更新状态
  useEffect(() => {
    const handleBackgroundChanged = (background: BackgroundImage) => {
      setSettings((prev) => ({
        ...prev,
        backgroundImageId: background.id,
      }));
    };

    // 添加事件监听器
    backgroundService.addEventListener(
      'backgroundChanged',
      handleBackgroundChanged,
    );

    // 清理函数
    return () => {
      backgroundService.removeEventListener(
        'backgroundChanged',
        handleBackgroundChanged,
      );
    };
  }, []);

  // antd ConfigProvider 的动态更新交由 app.tsx 的运行时 antd 配置处理，避免在多个组件中重复设置导致循环更新

  // 保存设置到本地，并触发全局事件供其他订阅者使用
  const saveSettings = (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('保存全局设置失败:', error);
    }
    try {
      window.dispatchEvent(
        new CustomEvent('xagi-global-settings-changed', {
          detail: newSettings,
        }),
      );
    } catch (err) {
      try {
        const evt = document.createEvent('CustomEvent');
        // @ts-ignore
        evt.initCustomEvent(
          'xagi-global-settings-changed',
          false,
          false,
          newSettings,
        );
        window.dispatchEvent(evt);
      } catch {}
    }
  };

  // 切换主题
  const toggleTheme = () => {
    const newTheme: ThemeMode = settings.theme === 'light' ? 'dark' : 'light';
    saveSettings({ ...settings, theme: newTheme });
  };

  // 设置主题
  const setTheme = (theme: ThemeMode) => {
    saveSettings({ ...settings, theme });
  };

  // 切换语言
  const toggleLanguage = () => {
    const newLanguage: Language =
      settings.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    saveSettings({ ...settings, language: newLanguage });
    // 同步 Umi 多语言上下文
    setLocale(newLanguage, false);
  };

  // 设置语言
  const setLanguage = (language: Language) => {
    saveSettings({ ...settings, language });
    // 同步 Umi 多语言上下文
    setLocale(language, false);
  };

  // 设置主色
  const setPrimaryColor = (color: string) => {
    const next = color || defaultSettings.primaryColor!;
    saveSettings({ ...settings, primaryColor: next });
  };

  // 设置背景图片
  const setBackgroundImage = (backgroundImageId: string) => {
    backgroundService.setBackground(backgroundImageId);
    // 背景服务会通过事件系统自动更新状态，无需手动调用saveSettings
  };

  // 获取当前背景图片（从全局服务）
  const getCurrentBackgroundImage = () => {
    return backgroundService.getCurrentBackground();
  };

  // 获取背景图片的CSS样式（从全局服务）
  const getBackgroundImageStyle = () => {
    return backgroundService.getBackgroundStyle();
  };

  // const { token } = antdTheme.useToken(); // 暂时注释掉，避免未使用变量错误

  // 判断是否为暗色主题
  const isDarkMode = useMemo(() => settings.theme === 'dark', [settings.theme]);

  // 判断是否为中文
  const isChineseLanguage = useMemo(
    () => settings.language === 'zh-CN',
    [settings.language],
  );
  const themeAlgorithm = useMemo(() => {
    return settings.theme === 'dark'
      ? antdTheme.darkAlgorithm
      : antdTheme.defaultAlgorithm;
  }, [settings.theme]);

  return {
    settings,
    theme: settings.theme,
    language: settings.language,
    primaryColor: settings.primaryColor ?? defaultSettings.primaryColor!,
    backgroundImageId:
      settings.backgroundImageId ?? defaultSettings.backgroundImageId!,
    isDarkMode,
    isChineseLanguage,
    toggleTheme,
    setTheme,
    toggleLanguage,
    setLanguage,
    themeAlgorithm,
    setPrimaryColor,
    setBackgroundImage,
    getCurrentBackgroundImage,
    getBackgroundImageStyle,
    backgroundImages: getBackgroundImages(),
  };
};

export default useGlobalSettings;
