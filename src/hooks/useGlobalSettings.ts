import { theme as antdTheme } from 'antd';
import { useEffect, useState } from 'react';

// 主题类型定义
export type ThemeMode = 'light' | 'dark';

// 语言类型定义
export type Language = 'zh-CN' | 'en-US';

// 全局设置接口
export interface GlobalSettings {
  theme: ThemeMode;
  language: Language;
}

// 本地存储的键名
const SETTINGS_STORAGE_KEY = 'xagi-global-settings';

// 默认设置
const defaultSettings: GlobalSettings = {
  theme: 'light',
  language: 'zh-CN',
};

/**
 * 全局设置管理 Hook
 * 提供主题切换和语言切换功能
 */
export const useGlobalSettings = () => {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);

  // 从本地存储加载设置
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.warn('加载全局设置失败:', error);
    }
  }, []);

  // 保存设置到本地存储
  const saveSettings = (newSettings: GlobalSettings) => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('保存全局设置失败:', error);
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
  };

  // 设置语言
  const setLanguage = (language: Language) => {
    saveSettings({ ...settings, language });
  };

  // 获取当前主题算法
  const getThemeAlgorithm = () => {
    return settings.theme === 'dark' ? [antdTheme.darkAlgorithm] : [];
  };

  // 判断是否为暗色主题
  const isDarkMode = settings.theme === 'dark';

  // 判断是否为中文
  const isChineseLanguage = settings.language === 'zh-CN';

  return {
    settings,
    theme: settings.theme,
    language: settings.language,
    isDarkMode,
    isChineseLanguage,
    toggleTheme,
    setTheme,
    toggleLanguage,
    setLanguage,
    getThemeAlgorithm,
  };
};

export default useGlobalSettings;
