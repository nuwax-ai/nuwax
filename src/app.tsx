import { ACCESS_TOKEN } from '@/constants/home.constants';
import useEventPolling from '@/hooks/useEventPolling';
import { request as requestCommon } from '@/services/common';
import { RequestConfig } from '@@/plugin-request/request';
import { App, ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import React from 'react';
import componentThemes from './utils/componentThemes';
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
 * 应用初始渲染
 * 在应用启动时，包装页面并插入全局组件
 */
export function rootContainer(container: React.ReactElement) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        cssVar: {
          prefix: 'xagi',
          key: 'default',
        },
        token: themeTokens,
        components: componentThemes,
        algorithm: [],
      }}
    >
      <App style={{ height: '100vh' }}>
        {/* 只有用户已登录时才启动事件轮询 */}
        <GlobalEventPolling />
        {container}
      </App>
    </ConfigProvider>
  );
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
export function onRouteChange({ location }: any) {
  // 如果是登录成功后的路由变化，确保轮询启动
  if (localStorage.getItem(ACCESS_TOKEN) && location.pathname !== '/login') {
    // 这里不需要特别处理，因为GlobalEventPolling组件会确保轮询只启动一次
  }
}

export const request: RequestConfig = requestCommon;
