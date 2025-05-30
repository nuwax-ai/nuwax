import { UserService } from '@/services/userService';
import type { UserInfo } from '@/types/interfaces/login';
import { useCallback, useState } from 'react';

/**
 * 用户信息模型
 * 基于新的 UserService 进行改造，提供 React Hook 接口
 */
export default () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取用户信息（优先从本地存储，如果没有则从服务器获取）
   */
  const getUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await UserService.getUserInfo();
      setUserInfo(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '获取用户信息失败';
      setError(errorMessage);
      console.error('获取用户信息失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 刷新用户信息（强制从服务器获取最新信息）
   */
  const refreshUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await UserService.refreshUserInfo();
      setUserInfo(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '刷新用户信息失败';
      setError(errorMessage);
      console.error('刷新用户信息失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 更新用户信息（部分更新）
   */
  const updateUserInfo = useCallback((updates: Partial<UserInfo>) => {
    try {
      UserService.updateUserInfo(updates);
      // 更新本地状态
      setUserInfo((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      console.error('更新用户信息失败:', err);
    }
  }, []);

  /**
   * 用户登出
   */
  const logout = useCallback(() => {
    UserService.logout();
    setUserInfo(null);
    setError(null);
  }, []);

  /**
   * 检查用户是否已登录
   */
  const isLoggedIn = useCallback(() => {
    return UserService.isLoggedIn();
  }, []);

  /**
   * 检查用户是否为管理员
   */
  const isAdmin = useCallback(() => {
    return UserService.isAdmin();
  }, []);

  /**
   * 从本地存储初始化用户信息
   */
  const initUserInfoFromStorage = useCallback(() => {
    const localUserInfo = UserService.getUserInfoFromStorage();
    if (localUserInfo) {
      setUserInfo(localUserInfo);
    }
  }, []);

  return {
    // 状态
    userInfo,
    loading,
    error,

    // 方法
    getUserInfo,
    refreshUserInfo,
    updateUserInfo,
    logout,
    isLoggedIn,
    isAdmin,
    initUserInfoFromStorage,

    // 兼容旧版本的方法名
    setUserInfo,
    runUserInfo: getUserInfo, // 兼容旧的 runUserInfo 方法名
  };
};
