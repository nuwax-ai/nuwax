import { apiUserInfo } from '@/services/account';

const USER_INFO = 'userInfo';

/**
 * 用户信息服务
 * 统一管理用户信息的获取、存储和清除
 */
export class UserService {
  /**
   * 从本地存储获取用户信息
   */
  static getUserInfoFromStorage(): any {
    try {
      const userInfoStr = localStorage.getItem(USER_INFO);
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('解析本地用户信息失败:', error);
      this.clearUserInfo();
      return null;
    }
  }

  /**
   * 保存用户信息到本地存储
   */
  static saveUserInfoToStorage(userInfo: any): void {
    try {
      localStorage.setItem(USER_INFO, JSON.stringify(userInfo));
    } catch (error) {
      console.error('保存用户信息到本地存储失败:', error);
    }
  }

  /**
   * 清除本地存储的用户信息
   */
  static clearUserInfo(): void {
    localStorage.removeItem(USER_INFO);
  }

  /**
   * 从服务器获取用户信息
   */
  static async fetchUserInfoFromServer(): Promise<any> {
    try {
      const result = await apiUserInfo();

      if (result.code === '0000' && result.data) {
        // 保存到本地存储
        this.saveUserInfoToStorage(result.data);
        return result.data;
      } else {
        // 服务器返回错误，清除本地存储
        this.clearUserInfo();
        return null;
      }
    } catch (error) {
      console.error('从服务器获取用户信息失败:', error);
      this.clearUserInfo();
      throw error;
    }
  }

  /**
   * 获取用户信息（优先从本地存储，如果没有则从服务器获取）
   */
  static async getUserInfo(): Promise<any> {
    // 先尝试从本地存储获取
    const localUserInfo = this.getUserInfoFromStorage();
    if (localUserInfo) {
      return localUserInfo;
    }

    // 本地没有，从服务器获取
    return await this.fetchUserInfoFromServer();
  }

  /**
   * 刷新用户信息（强制从服务器获取最新信息）
   */
  static async refreshUserInfo(): Promise<any> {
    return await this.fetchUserInfoFromServer();
  }

  /**
   * 检查用户是否已登录
   */
  static isLoggedIn(): boolean {
    const userInfo = this.getUserInfoFromStorage();
    return !!userInfo;
  }

  /**
   * 检查用户是否为管理员
   */
  static isAdmin(): boolean {
    const userInfo = this.getUserInfoFromStorage();
    return userInfo?.role === 'Admin';
  }

  /**
   * 用户登出
   */
  static logout(): void {
    this.clearUserInfo();
    // 可以在这里添加其他登出逻辑，比如清除其他缓存、跳转到登录页等
  }

  /**
   * 更新本地用户信息（部分更新）
   */
  static updateUserInfo(updates: Partial<any>): void {
    const currentUserInfo = this.getUserInfoFromStorage();
    if (currentUserInfo) {
      const updatedUserInfo = { ...currentUserInfo, ...updates };
      this.saveUserInfoToStorage(updatedUserInfo);
    }
  }
}

// 导出默认实例方法（如果喜欢函数式调用）
export const userService = {
  getUserInfo: () => UserService.getUserInfo(),
  refreshUserInfo: () => UserService.refreshUserInfo(),
  getUserInfoFromStorage: () => UserService.getUserInfoFromStorage(),
  saveUserInfoToStorage: (userInfo: any) =>
    UserService.saveUserInfoToStorage(userInfo),
  clearUserInfo: () => UserService.clearUserInfo(),
  isLoggedIn: () => UserService.isLoggedIn(),
  isAdmin: () => UserService.isAdmin(),
  logout: () => UserService.logout(),
  updateUserInfo: (updates: Partial<any>) =>
    UserService.updateUserInfo(updates),
};
