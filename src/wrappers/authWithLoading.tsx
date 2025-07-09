import Loading from '@/components/Loading';
import { UserService } from '@/services/userService';
import { redirectToLogin } from '@/utils/router';
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'umi';

/**
 * 带加载状态的鉴权组件
 * 在页面加载前验证用户登录状态，展示loading
 * 使用sessionStorage缓存登录状态，避免重复验证
 */
const AuthWithLoading: React.FC = () => {
  // ===== 状态定义 =====
  const [loading, setLoading] = useState(true); // 默认显示加载状态
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const location = useLocation();

  // ===== 常量定义 =====
  const MIN_LOADING_TIME = 500; // 最小加载时间，毫秒
  const LOGIN_STATUS_KEY = 'userLoginStatus';

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

  // ===== 缓存管理方法 =====
  /**
   * 从缓存中获取登录状态
   * @returns {boolean|null} 缓存的登录状态，如果不存在则返回null
   */
  const getLoginStatusFromCache = (): boolean | null => {
    const cachedStatus = sessionStorage.getItem(LOGIN_STATUS_KEY);
    if (cachedStatus === null) return null;
    return cachedStatus === 'true';
  };

  /**
   * 将登录状态保存到缓存
   * @param status 登录状态
   */
  const setLoginStatusToCache = (status: boolean): void => {
    sessionStorage.setItem(LOGIN_STATUS_KEY, status ? 'true' : 'false');
  };

  /**
   * 清除登录状态缓存
   */
  const clearLoginStatusCache = (): void => {
    sessionStorage.removeItem(LOGIN_STATUS_KEY);
  };

  // ===== 辅助方法 =====
  /**
   * 执行带有最小时间保证的操作
   * @param callback 要执行的回调函数
   * @param startTime 开始时间戳
   */
  const executeWithMinTime = (
    callback: () => void,
    startTime: number,
  ): void => {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= MIN_LOADING_TIME) {
      callback();
    } else {
      setTimeout(
        callback,
        MIN_LOADING_TIME - elapsedTime <= 0
          ? 0
          : MIN_LOADING_TIME - elapsedTime,
      );
    }
  };

  // ===== 副作用 =====
  useEffect(() => {
    // 验证登录状态
    const checkLoginStatus = async () => {
      const startTime = Date.now();

      try {
        // 先检查sessionStorage中是否有登录状态记录
        const cachedLoginStatus = getLoginStatusFromCache();

        // 如果有缓存的登录状态，直接使用
        if (cachedLoginStatus !== null) {
          setIsLoggedIn(cachedLoginStatus);
          executeWithMinTime(() => setLoading(false), startTime);
        } else {
          // 如果没有缓存，调用用户信息接口验证登录状态
          const data = await UserService.fetchUserInfoFromServer(false);
          if (data) {
            // 更新本地用户信息并缓存登录状态
            executeWithMinTime(() => setIsLoggedIn(true), startTime);
            setLoginStatusToCache(true);
          } else {
            setIsLoggedIn(false);
            clearLoginStatusCache();
            executeWithMinTime(() => setLoading(false), startTime);
          }
        }
      } catch (error) {
        console.error('验证登录状态失败:', error);
        setIsLoggedIn(false);
        setLoading(false);

        // 清除可能存在的无效缓存
        clearLoginStatusCache();

        // 确保重定向也遵循最小加载时间
        executeWithMinTime(() => redirectToLogin(location.pathname), startTime);
      } finally {
        executeWithMinTime(() => setLoading(false), startTime);
      }
    };

    checkLoginStatus();
  }, [location.pathname]);

  // ===== 渲染逻辑 =====
  // 如果是排除的页面，直接渲染内容
  if (isExcludedPath) {
    return <Outlet />;
  }

  // 如果还在加载中，显示loading
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Loading />
      </div>
    );
  }

  // 根据登录状态决定渲染内容或重定向
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};

export default AuthWithLoading;
