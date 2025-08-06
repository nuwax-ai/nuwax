import Loading from '@/components/custom/Loading';
import {
  clearLoginStatusCache,
  getLoginStatusFromCache,
  setLoginStatusToCache,
  UserService,
} from '@/services/userService';
import { redirectToLogin } from '@/utils/router';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'umi';

/**
 * 带加载状态的鉴权组件
 * 在页面加载前验证用户登录状态，展示loading
 * 使用sessionStorage缓存登录状态，避免重复验证
 */
const AuthWithLoading: React.FC = () => {
  // ===== 状态定义 =====
  const [loading, setLoading] = useState(true); // 默认显示加载状态
  const location = useLocation();

  // ===== 常量定义 =====
  const MIN_LOADING_TIME = 500; // 最小加载时间，毫秒

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
    console.time('authWithLoading');
    const checkLoginStatus = async () => {
      const startTime = Date.now();
      console.timeLog('authWithLoading', 'start');
      try {
        // 先检查sessionStorage中是否有登录状态记录
        const cachedLoginStatus = getLoginStatusFromCache();

        // 如果有缓存的登录状态，直接使用
        if (cachedLoginStatus !== null) {
          setLoading(false); //直接展示内容
          console.timeLog(
            'authWithLoading',
            'cachedLoginStatus',
            cachedLoginStatus,
          );
        } else {
          console.timeLog('authWithLoading', 'fetchUserInfoFromServer:start');
          // 如果没有缓存，调用用户信息接口验证登录状态
          const data = await UserService.fetchUserInfoFromServer(false);
          console.timeLog(
            'authWithLoading',
            'fetchUserInfoFromServer:data',
            data,
          );
          if (data) {
            // 更新本地用户信息并缓存登录状态
            console.timeLog(
              'authWithLoading',
              'fetchUserInfoFromServer:success',
            );
            setLoginStatusToCache(true);
          } else {
            clearLoginStatusCache();
            executeWithMinTime(() => {
              console.timeLog(
                'authWithLoading',
                'fetchUserInfoFromServer:error',
                'setLoading(false)',
              );
              setLoading(false);
            }, startTime);
          }
        }
      } catch (error) {
        console.timeLog('authWithLoading', 'catch', error);
        console.error('验证登录状态失败:', error);

        // 清除可能存在的无效缓存
        clearLoginStatusCache();

        // 确保重定向也遵循最小加载时间
        executeWithMinTime(() => {
          console.timeLog(
            'authWithLoading',
            'catch',
            'redirectToLogin',
            location.pathname,
          );
          redirectToLogin('-1');
        }, startTime);
      } finally {
        console.timeLog('authWithLoading', 'finally');
        executeWithMinTime(() => {
          console.timeLog('authWithLoading', 'finally', 'setLoading(false)');
          setLoading(false);
        }, startTime);
      }
    };

    checkLoginStatus();
    return () => {
      console.timeEnd('authWithLoading');
    };
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
  return <Outlet />;
};

export default AuthWithLoading;
