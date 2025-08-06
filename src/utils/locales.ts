import { Language } from '@/hooks/useGlobalSettings';
import type { Locale } from 'antd/es/locale';
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';

// Ant Design 语言配置映射
export const antdLocaleMap: Record<Language, Locale> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

// 应用内文本配置
export const appTexts = {
  'zh-CN': {
    // 通用
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    loading: '加载中...',
    noData: '暂无数据',

    // 主题相关
    theme: '主题',
    lightTheme: '浅色主题',
    darkTheme: '深色主题',
    toggleTheme: '切换主题',

    // 语言相关
    language: '语言',
    chinese: '中文',
    english: 'English',
    toggleLanguage: '切换语言',

    // 设置相关
    settings: '设置',
    globalSettings: '全局设置',
    appearance: '外观设置',

    // 导航相关
    home: '首页',
    profile: '个人资料',
    logout: '退出登录',

    // 错误信息
    error: '错误',
    networkError: '网络错误',
    unknownError: '未知错误',

    // 成功信息
    success: '成功',
    saveSuccess: '保存成功',
    deleteSuccess: '删除成功',
  },
  'en-US': {
    // Common
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    noData: 'No Data',

    // Theme related
    theme: 'Theme',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    toggleTheme: 'Toggle Theme',

    // Language related
    language: 'Language',
    chinese: '中文',
    english: 'English',
    toggleLanguage: 'Toggle Language',

    // Settings related
    settings: 'Settings',
    globalSettings: 'Global Settings',
    appearance: 'Appearance',

    // Navigation related
    home: 'Home',
    profile: 'Profile',
    logout: 'Logout',

    // Error messages
    error: 'Error',
    networkError: 'Network Error',
    unknownError: 'Unknown Error',

    // Success messages
    success: 'Success',
    saveSuccess: 'Save Successfully',
    deleteSuccess: 'Delete Successfully',
  },
};

// 获取当前语言的文本
export const getTexts = (language: Language) => {
  return appTexts[language];
};

// 获取当前语言的 Ant Design 配置
export const getAntdLocale = (language: Language) => {
  return antdLocaleMap[language];
};

export default appTexts;
