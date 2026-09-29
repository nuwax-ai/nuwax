import AppStartup from '@/components/business-component/AppStartup';
import NoPermissionPage from '@/pages/403';
import {
  clearLoginStatusCache,
  getLoginStatusFromCache,
  setLoginStatusToCache,
  UserService,
} from '@/services/userService';
import { isRoutePathHidden } from '@/utils/permission';
import { redirectToLogin } from '@/utils/router';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useModel } from 'umi';

/**
 * 带加载状态的鉴权组件
 * 在页面加载前验证用户登录状态，展示loading
 * 使用sessionStorage缓存登录状态，避免重复验证
 */
const AuthWithLoading: React.FC = () => {
  // ===== 状态定义 =====
  // 初始化阶段已确认的登录态在首帧生效，避免等待 effect 时再闪一个加载页。
  const [loading, setLoading] = useState(
    () => getLoginStatusFromCache() !== true,
  );
  const location = useLocation();
  const { tenantConfigInfo, runTenantConfig } = useModel('tenantConfigInfo');

  // 首次渲染/刷新页面时，自动触发租户配置获取，确保即使是不包含主 Layout 的独立布局页面刷新后也能拉取到最新的租户控制状态
  useEffect(() => {
    runTenantConfig();
  }, []);

  // 排除不需要验证的页面路径
  const excludedPaths = [
    '/login',
    '/verify-code',
    '/set-password',
    '/chat-temp',
  ];

  const isExcludedPath = excludedPaths.some((path) =>
    location.pathname.includes(path),
  );

  // ===== 副作用 =====
  useEffect(() => {
    if (isExcludedPath) return;
    if (getLoginStatusFromCache() === true) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const checkLoginStatus = async () => {
      try {
        const data = await UserService.fetchUserInfoFromServer(false);
        if (cancelled) return;
        if (data) {
          setLoginStatusToCache(true);
          setLoading(false);
          return;
        }
        clearLoginStatusCache();
        redirectToLogin('-1');
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to verify login status:', error);
        clearLoginStatusCache();
        redirectToLogin('-1');
      }
    };

    void checkLoginStatus();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, isExcludedPath]);

  // ===== 渲染逻辑 =====
  // 如果是排除的页面，直接渲染内容
  if (isExcludedPath) {
    return <Outlet />;
  }

  // 如果还在加载中，显示loading
  if (loading) {
    return <AppStartup />;
  }

  // 校验当前访问路径是否由于租户配置限制而被隐藏
  if (isRoutePathHidden(location.pathname, tenantConfigInfo)) {
    return <NoPermissionPage />;
  }

  // 根据登录状态决定渲染内容或重定向
  return <Outlet />;
};

export default AuthWithLoading;
