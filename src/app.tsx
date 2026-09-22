import '@/utils/setupDayjsPlugins';
import { RequestConfig } from '@@/plugin-request/request';
import { OpenUIDevtools } from '@openuidev/devtools';
import { theme as antdTheme, Modal } from 'antd';
import React, { useEffect, useRef } from 'react';
import { history, useAntdConfigSetter, useModel } from 'umi';
import AppStartup from './components/business-component/AppStartup';
import {
  REDIRECT_LOGIN,
  SUCCESS_CODE,
  USER_NO_LOGIN,
} from './constants/codes.constants';
import { ACCESS_TOKEN } from './constants/home.constants';
import { darkThemeTokens, themeTokens } from './constants/theme.constants';
import { APP_NAME, APP_VERSION } from './constants/version';
import { initClientShell } from './features/client-shell';
import useEventPolling from './hooks/useEventPolling';
import {
  BRAND_PRIMARY,
  initBrandTheme,
  isDefaultBrandThemeActive,
} from './services/brandTheme';
import { request as requestCommon } from './services/common';
import {
  dict,
  getCurrentLang,
  initI18n,
  syncLangFromUserInfo,
} from './services/i18nRuntime';
import { apiQueryMenus } from './services/menuService';
import {
  resolveEffectiveNavigationStyle,
  unifiedThemeService,
} from './services/unifiedThemeService';
import { UserService } from './services/userService';
import type { MenuItemDto } from './types/interfaces/menu';
import { migrateConversationDefaultsToV2 } from './utils/conversationV2Rollout';
import { installDirectorySyncLegacyBridge } from './utils/directorySyncEvents';
import { hostBridge, syncShellAvoidanceCss } from './utils/hostBridge';
import { getAntdLocale } from './utils/i18nAdapters';
import { isConversationMockPage } from './utils/isConversationMockPage';
// 工作台页历史栈兜底：模块副作用须在 umi router history 创建前执行（仍在
// import 求值期内，早于 runtime render）。必须排在 i18nRuntime 之后——它会经
// unifiedThemeService → theme.constants 提前拉起 i18nRuntime 的循环依赖链，
// 置顶会让 home.constants 在 dict 就绪前求值而炸（dict is not a function）。
import '@/layouts/workbenchHistoryBase';
/**
 * 全局初始状态类型
 */
export interface InitialStateType {
  menuData?: MenuItemDto[];
}

/**
 * 获取初始状态
 * 在应用启动时执行（路由渲染前），用于加载全局数据
 * 这里加载菜单数据，确保在任何页面刷新时都能获取到菜单权限
 */
export async function getInitialState(): Promise<InitialStateType> {
  // 必须在首个会话组件挂载前完成，避免首屏先读到旧偏好。
  migrateConversationDefaultsToV2();
  try {
    await initI18n();

    // nuwaclaw 客户端：启动时从宿主恢复 ACCESS_TOKEN（重启免登）。
    // 浏览器环境无桥自动跳过；须在 UserService.getUserInfo 之前执行，确保首个鉴权请求带 token。
    const token = await hostBridge.auth.getToken();
    if (token) localStorage.setItem(ACCESS_TOKEN, token);

    // 如果不是登录页面，执行获取用户信息和菜单数据
    const publicPaths = ['/login', '/examples/agent-intervention-demo'];
    const initialPathname =
      typeof window === 'undefined'
        ? history.location.pathname
        : window.location.pathname;
    // Mock 验收页（dev-only 路由）跳过用户信息请求，避免未登录时被重定向
    if (
      !publicPaths.some((path) => initialPathname.includes(path)) &&
      !isConversationMockPage()
    ) {
      const userInfo = await UserService.getUserInfo();
      await syncLangFromUserInfo(userInfo);

      if (userInfo?.id) {
        const res = await apiQueryMenus();
        if (res.code === SUCCESS_CODE && res.data) {
          return { menuData: res.data };
        }
        // 鉴权失效已有请求层业务跳转，不要用启动错误遮挡登录页。
        if (res.code !== USER_NO_LOGIN && res.code !== REDIRECT_LOGIN) {
          throw new Error('App startup menu request failed');
        }
      }
    }
    return { menuData: [] };
  } catch (error) {
    // 请求层可能无 reason 地 reject；必须给 Umi 一个可识别的错误态。
    // 不把原始服务 payload、宿主凭据或请求信息渲染到错误界面。
    throw error instanceof Error ? error : new Error('App startup failed');
  }
}

/**
 * 全局轮询组件
 * 在应用运行期间保持活跃，处理全局事件
 */
const GlobalEventPolling: React.FC = () => {
  // 启动事件轮询，返回 contextHolder 用于渲染 Modal 上下文
  const contextHolder = useEventPolling();
  return contextHolder; // 返回 contextHolder 以支持 Modal 的动态主题
};

const AppContainer: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const setAntdConfig = useAntdConfigSetter();
  const lastAppliedRef = useRef<string>('');

  useEffect(() => installDirectorySyncLegacyBridge(), []);

  // 输出版本信息到控制台
  useEffect(() => {
    console.log(
      `%c${APP_NAME} v${APP_VERSION}`,
      'color: #1890ff; font-size: 14px; font-weight: bold;',
    );
  }, []);

  // 全局错误处理，捕获Monaco Editor的CanceledError
  useEffect(() => {
    const isChunkLoadError = (error: any): boolean => {
      const msg = error?.message || '';
      const name = error?.name || '';
      return (
        name === 'ChunkLoadError' ||
        msg.includes('Loading chunk') ||
        msg.includes('Loading CSS chunk') ||
        msg.includes('error in async loading') ||
        (msg.includes('dynamically imported module') && name === 'TypeError')
      );
    };

    const handleChunkError = () => {
      if (sessionStorage.getItem('__chunk_reload')) return;
      sessionStorage.setItem('__chunk_reload', '1');

      Modal.confirm({
        title: dict('PC.Modal.chunkLoadErrorTitle'),
        content: dict('PC.Modal.chunkLoadErrorContent'),
        okText: dict('PC.Modal.chunkLoadErrorRefresh'),
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: () => {
          sessionStorage.removeItem('__chunk_reload');
          window.location.reload();
        },
        onCancel: () => {
          sessionStorage.removeItem('__chunk_reload');
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // 检测 chunk 加载失败（部署新版本后旧 chunk 不存在）
      if (isChunkLoadError(event.reason)) {
        event.preventDefault();
        handleChunkError();
        return;
      }

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

      if (
        event.reason &&
        (event.reason.stack?.includes('WordHighlighter') ||
          event.reason.stack?.includes('Delayer.cancel'))
      ) {
        event.preventDefault();
        return;
      }

      // 检查是否是 fetch 失败（通常是网络问题或被拦截）
      if (
        event.reason &&
        (event.reason.message === 'Failed to fetch' ||
          event.reason.message?.includes('NetworkError'))
      ) {
        // 阻止这个错误冒泡到控制台，从而避免在开发环境下弹出全屏错误弹框
        event.preventDefault();
        return;
      }
    };

    const handleError = (event: ErrorEvent) => {
      // 检测 chunk 加载失败
      if (isChunkLoadError(event.error)) {
        event.preventDefault();
        handleChunkError();
        return;
      }

      if (
        event.error &&
        (event.error.message?.includes('Canceled') ||
          event.error.stack?.includes('WordHighlighter'))
      ) {
        event.preventDefault();
        return;
      }

      // 检查是否是 fetch 失败（通常是网络问题或被拦截）
      if (
        event.error &&
        (event.error.message === 'Failed to fetch' ||
          event.error.message?.includes('NetworkError'))
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
        // nuwaclaw 桌面专属默认主色：仅桌面端且用户未显式定制主题时强制品牌蓝
        // （见 brandTheme）；显式定制后主色跟随用户选择——灰白 solid 布局已
        // 改挂背景维度（isBrandThemeActive），不再反向绑架 antd 主色
        const effectivePrimary = isDefaultBrandThemeActive()
          ? BRAND_PRIMARY
          : data.primaryColor;

        const algorithm = darkMode
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm;
        const baseTokens = darkMode ? darkThemeTokens : themeTokens;
        const tokens = {
          ...baseTokens,
          colorPrimary: effectivePrimary,
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
                itemSelectedColor: effectivePrimary,
              },
            },
            cssVar: { prefix: 'xagi' },
          },
          locale: getAntdLocale(data.language || getCurrentLang()),
          appConfig: {},
        });

        // 统一主题服务会自动应用DOM样式，这里只设置 data 属性
        document.documentElement.setAttribute('data-theme', data.antdTheme);
        document.documentElement.setAttribute(
          'data-nav-theme',
          data.layoutStyle,
        );
        // 生效导航风格（桌面端锁定单栏）：与 unifiedThemeService.applyToDOM
        // 同源，避免单栏布局挂存储风格的 data-nav-style（sidebar 专属豁免失配）
        const effectiveNavigationStyle = resolveEffectiveNavigationStyle(
          data.navigationStyle,
        );
        document.documentElement.setAttribute(
          'data-nav-style',
          effectiveNavigationStyle === 'style1'
            ? 'compact'
            : effectiveNavigationStyle === 'style3'
            ? 'sidebar'
            : 'expanded',
        );

        unifiedThemeService.updateData(data, {
          immediate: true,
          saveToStorage: false,
          emitEvent: false,
        }); //初始化挂载 layout navigation CSS 变量
      } catch (error) {
        console.error('Failed to apply theme config:', error);
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

  // nuwaclaw 桌面专属主题适配（独立模块，不侵入核心 unifiedThemeService）；
  // 沉浸壳避让状态（html 类 + CSS 变量）同步就位——immersiveShellAvoid wrapper
  // 首帧前还会再同步一次（幂等），这里覆盖未被该 wrapper 包裹的路由。
  useEffect(() => {
    syncShellAvoidanceCss();
    const disposeTheme = initBrandTheme();
    // 客户端专属适配聚合入口（构建版本上报/标题栏热区/未来适配统一在此登记）
    const disposeClientShell = initClientShell();
    return () => {
      disposeTheme();
      disposeClientShell();
    };
  }, []);

  return (
    <>
      <OpenUIDevtools enabled={false} />
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

const InitialStateBoundary: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { error } = useModel('@@initialState');
  return error ? <AppStartup failed /> : children;
};

// innerProvider 位于 Umi model provider 内部，rootContainer 不能读取初始状态。
export function innerProvider(container: React.ReactElement) {
  return <InitialStateBoundary>{container}</InitialStateBoundary>;
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

    // 根据自定义 i18n 系统设置 antd locale（适配层自动处理回退链）
    memo.locale = getAntdLocale(getCurrentLang());
  } catch {
    // 回退到基础配置
    memo.theme ??= {} as any;
    memo.theme.cssVar = { prefix: 'xagi' } as any;
    memo.appConfig ??= {} as any;
    memo.direction = 'ltr' as any;
  }
  return memo;
};
