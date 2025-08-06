import GlobalSettings from '@/components/GlobalSettings';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import useEventPolling from '@/hooks/useEventPolling';
import useGlobalSettings from '@/hooks/useGlobalSettings';
import { request as requestCommon } from '@/services/common';
import { getAntdLocale } from '@/utils/locales';
import { RequestConfig } from '@@/plugin-request/request';
import { App, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import React, { useEffect } from 'react';
import themeTokens from './utils/themeTokens';

/**
 * 全局轮询组件
 * 在应用运行期间保持活跃，处理全局事件
 */
const GlobalEventPolling: React.FC = () => {
  // 启动事件轮询
  useEventPolling();
  return null; // 这个组件不渲染任何内容
};

/**
 * 应用容器组件
 * 包含全局设置状态管理和主题配置
 */
const AppContainer: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { language, getThemeAlgorithm, isDarkMode } = useGlobalSettings();

  // 根据语言设置切换 dayjs 语言包
  useEffect(() => {
    if (language === 'zh-CN') {
      dayjs.locale('zh-cn');
    } else {
      dayjs.locale('en');
    }
  }, [language]);

  // 根据主题设置 body 的主题属性
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <ConfigProvider
      locale={getAntdLocale(language)}
      theme={{
        cssVar: {
          prefix: 'xagi',
        },
        hashed: false,
        token: themeTokens,
        // components: componentThemes,
        algorithm: getThemeAlgorithm(),
      }}
    >
      <App style={{ height: '100%' }}>
        {/* 只有用户已登录时才启动事件轮询 */}
        <GlobalEventPolling />
        {children}
        {/* 全局设置组件 */}
        <GlobalSettings />
      </App>
    </ConfigProvider>
  );
};

/**
 * 应用初始渲染
 * 在应用启动时，包装页面并插入全局组件
 */
export function rootContainer(container: React.ReactElement) {
  return <AppContainer>{container}</AppContainer>;
}

/**
 * 自定义渲染函数
 * 可以在这里添加全局错误边界等
 */
export function render(oldRender: () => void) {
  oldRender();
}

/**
 * 路由变化监听
 * 可以在这里处理页面切换逻辑
 */
export function onRouteChange({ location, ...rest }: any) {
  console.info('onRouteChange', location, rest);

  // 如果是登录成功后的路由变化，确保轮询启动
  if (localStorage.getItem(ACCESS_TOKEN) && location.pathname !== '/login') {
    // 这里不需要特别处理，因为GlobalEventPolling组件会确保轮询只启动一次
  }
}

export const request: RequestConfig = requestCommon;
