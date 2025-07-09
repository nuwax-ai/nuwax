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
  const [loading, setLoading] = useState(true); // 默认显示加载状态
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const location = useLocation();

  // 排除不需要验证的页面路径
  const excludedPaths = [
    '/login',
    '/verify-code',
    '/set-password',
    '/chat-temp',
  ];

  // sessionStorage管理方法
  const loginStatusKey = 'userLoginStatus';

  /**
   * 从缓存中获取登录状态
   * @returns {boolean|null} 缓存的登录状态，如果不存在则返回null
   */
  const getLoginStatusFromCache = (): boolean | null => {
    const cachedStatus = sessionStorage.getItem(loginStatusKey);
    if (cachedStatus === null) return null;
    return cachedStatus === 'true';
  };

  /**
   * 将登录状态保存到缓存
   * @param status 登录状态
   */
  const setLoginStatusToCache = (status: boolean): void => {
    sessionStorage.setItem(loginStatusKey, status ? 'true' : 'false');
  };

  /**
   * 清除登录状态缓存
   */
  const clearLoginStatusCache = (): void => {
    sessionStorage.removeItem(loginStatusKey);
  };

  const isExcludedPath = excludedPaths.some((path) =>
    location.pathname.includes(path),
  );

  useEffect(() => {
    // 验证登录状态
    const checkLoginStatus = async () => {
      // 设置一个定时器，确保loading至少显示500ms
      const minLoadingTime = 500;
      const startTime = Date.now();

      try {
        // 先检查sessionStorage中是否有登录状态记录
        const cachedLoginStatus = getLoginStatusFromCache();

        // 如果有缓存的登录状态，直接使用
        if (cachedLoginStatus !== null) {
          setIsLoggedIn(cachedLoginStatus);
        } else {
          // 如果没有缓存，调用用户信息接口验证登录状态
          const data = await UserService.fetchUserInfoFromServer(false);
          if (data) {
            // 更新本地用户信息并缓存登录状态
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime >= minLoadingTime) {
              setIsLoggedIn(true);
            } else {
              setTimeout(() => {
                setIsLoggedIn(true);
              }, minLoadingTime - elapsedTime);
            }
            setLoginStatusToCache(true);
          } else {
            setIsLoggedIn(false);
            setLoginStatusToCache(false);
          }
        }
      } catch (error) {
        console.error('验证登录状态失败:', error);
        setIsLoggedIn(false);
        setLoading(false);
        // 清除可能存在的无效缓存
        clearLoginStatusCache();

        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= minLoadingTime) {
          redirectToLogin(location.pathname);
        } else {
          setTimeout(() => {
            redirectToLogin(location.pathname);
          }, minLoadingTime - elapsedTime);
        }
      } finally {
        // 计算已经过去的时间
        const elapsedTime = Date.now() - startTime;

        // 如果已经过了300ms，直接关闭loading
        // 否则，等待剩余时间后再关闭loading
        if (elapsedTime >= minLoadingTime) {
          setLoading(false);
        } else {
          setTimeout(() => {
            setLoading(false);
          }, minLoadingTime - elapsedTime);
        }
      }
    };

    checkLoginStatus();
  }, []);

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
