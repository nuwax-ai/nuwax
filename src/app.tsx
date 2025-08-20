import { RequestConfig } from '@@/plugin-request/request';
import { theme as antdTheme } from 'antd';
import React, { useEffect, useRef } from 'react';
import { useAntdConfigSetter } from 'umi';
import { ACCESS_TOKEN } from './constants/home.constants';
import { darkThemeTokens, themeTokens } from './constants/theme.constants';
import useEventPolling from './hooks/useEventPolling';
import { request as requestCommon } from './services/common';
import { getCurrentTheme, isCurrentDarkMode } from './utils/theme';

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
  const setAntdConfig = useAntdConfigSetter();
  const lastAppliedRef = useRef<string>('');

  // 初始化一次，并监听设置变更事件，动态更新 antd ConfigProvider
  useEffect(() => {
    const applyFromStorage = () => {
      try {
        const stored = getCurrentTheme();
        const darkMode = isCurrentDarkMode();

        const algorithm = darkMode
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm;
        const baseTokens = darkMode ? darkThemeTokens : themeTokens;
        const colorPrimary = (stored as any)?.primaryColor;
        const tokens = colorPrimary
          ? { ...baseTokens, colorPrimary }
          : baseTokens;

        const signature = JSON.stringify({
          mode: darkMode ? 'dark' : 'light',
          tokens,
        });
        if (signature === lastAppliedRef.current) return;
        lastAppliedRef.current = signature;

        setAntdConfig({
          theme: {
            algorithm,
            token: tokens as any,
            cssVar: { prefix: 'xagi' },
          },
          appConfig: {},
        });
      } catch {
        // ignore
      }
    };

    applyFromStorage();

    const handler = () => applyFromStorage();
    window.addEventListener('xagi-global-settings-changed', handler as any);
    return () =>
      window.removeEventListener(
        'xagi-global-settings-changed',
        handler as any,
      );
  }, []);

  return (
    <>
      {/* 只有用户已登录时才启动事件轮询 */}
      <GlobalEventPolling />
      {children}
    </>
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

/**
 * 运行时 antd 配置
 * 使用 Umi 的 RuntimeAntdConfig 动态设置主题、语言、App 包裹组件等
 * 以替换手写的 <ConfigProvider /> 包裹
 */
export const antd = (memo: any) => {
  try {
    memo.theme ??= {} as any;
    memo.theme.cssVar = { prefix: 'xagi' } as any;
    memo.direction = 'ltr' as any;
    memo.appConfig ??= {} as any;
  } catch {
    // 回退到基础配置
    memo.theme ??= {} as any;
    memo.theme.cssVar = { prefix: 'xagi' } as any;
    memo.appConfig ??= {} as any;
    memo.direction = 'ltr' as any;
  }
  return memo;
};
