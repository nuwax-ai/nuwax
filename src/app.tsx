import { RequestConfig } from '@@/plugin-request/request';
import { theme as antdTheme } from 'antd';
import React, { useEffect, useRef } from 'react';
import { useAntdConfigSetter } from 'umi';
import { ACCESS_TOKEN } from './constants/home.constants';
import { darkThemeTokens, themeTokens } from './constants/theme.constants';
import useEventPolling from './hooks/useEventPolling';
import { request as requestCommon } from './services/common';
import { unifiedThemeService } from './services/unifiedThemeService';
/**
 * 全局轮询组件
 * 在应用运行期间保持活跃，处理全局事件
 */
const GlobalEventPolling: React.FC = () => {
  // 启动事件轮询，返回 contextHolder 用于渲染 Modal 上下文
  const contextHolder = useEventPolling();
  return contextHolder; // 返回 contextHolder 以支持 Modal 的动态主题
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

  // 全局错误处理，捕获Monaco Editor的CanceledError
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // 检查是否是Monaco Editor的CanceledError
      if (
        event.reason &&
        event.reason.name === 'Canceled' &&
        event.reason.message === 'Canceled'
      ) {
        // 阻止这个错误冒泡到控制台
        event.preventDefault();
        return;
      }

      // 检查是否是WordHighlighter相关的取消错误
      if (
        event.reason &&
        (event.reason.stack?.includes('WordHighlighter') ||
          event.reason.stack?.includes('Delayer.cancel'))
      ) {
        event.preventDefault();
        return;
      }
    };

    const handleError = (event: ErrorEvent) => {
      // 检查是否是Monaco Editor相关的错误
      if (
        event.error &&
        (event.error.message?.includes('Canceled') ||
          event.error.stack?.includes('WordHighlighter'))
      ) {
        event.preventDefault();
        return;
      }
    };

    // 添加全局错误监听器
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection,
      );
      window.removeEventListener('error', handleError);
    };
  }, []);

  // 初始化统一主题配置，并监听主题配置变更事件
  useEffect(() => {
    const applyThemeConfig = () => {
      try {
        const data = unifiedThemeService.getCurrentData();
        const darkMode = data.antdTheme === 'dark';

        const algorithm = darkMode
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm;
        const baseTokens = darkMode ? darkThemeTokens : themeTokens;
        const tokens = {
          ...baseTokens,
          colorPrimary: data.primaryColor,
        };

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
            components: {
              Segmented: {
                itemSelectedColor: data.primaryColor,
              },
            },
            cssVar: { prefix: 'xagi' },
          },
          appConfig: {},
        });

        // 统一主题服务会自动应用DOM样式，这里只设置 data 属性
        document.documentElement.setAttribute('data-theme', data.antdTheme);
        document.documentElement.setAttribute(
          'data-nav-theme',
          data.layoutStyle,
        );
        document.documentElement.setAttribute(
          'data-nav-style',
          data.navigationStyle === 'style1' ? 'compact' : 'expanded',
        );

        unifiedThemeService.updateData(data, {
          immediate: true,
          saveToStorage: false,
          emitEvent: false,
        }); //初始化挂载 layout navigation CSS 变量
      } catch (error) {
        console.error('应用主题配置失败:', error);
      }
    };

    // 初始应用
    applyThemeConfig();

    // 监听统一主题服务的配置变更
    const handleThemeChange = () => applyThemeConfig();
    unifiedThemeService.addListener(handleThemeChange);

    // 兼容旧的事件监听（确保向后兼容）
    window.addEventListener('unified-theme-changed', handleThemeChange as any);
    window.addEventListener(
      'xagi-theme-config-changed',
      handleThemeChange as any,
    );

    return () => {
      unifiedThemeService.removeListener(handleThemeChange);
      window.removeEventListener(
        'unified-theme-changed',
        handleThemeChange as any,
      );
      window.removeEventListener(
        'xagi-theme-config-changed',
        handleThemeChange as any,
      );
    };
  }, [setAntdConfig]);

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
export function onRouteChange() {
  // console.info('[router] onRouteChange', ...params);

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
