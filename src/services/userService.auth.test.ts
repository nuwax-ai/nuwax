import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiUserInfo: vi.fn(),
  redirectToLogin: vi.fn(),
  navigateToAuthUrl: vi.fn(),
  warning: vi.fn(),
}));
vi.mock('@/constants/home.constants', () => ({ USER_INFO: 'USER_INFO' }));
vi.mock('@/services/account', () => ({ apiUserInfo: mocks.apiUserInfo }));
vi.mock('@/utils/authNavigation', () => ({
  navigateToAuthUrl: mocks.navigateToAuthUrl,
}));
vi.mock('@/utils/router', () => ({
  isChatTemp: () => false,
  redirectToLogin: mocks.redirectToLogin,
}));
vi.mock('antd', () => ({ message: { warning: mocks.warning } }));

import {
  getCurrentLoginStatus,
  getLoginStatusFromCache,
  setLoginStatusToCache,
  UserService,
} from './userService';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  localStorage.clear();
  sessionStorage.clear();
  UserService.saveUserInfoToStorage({ id: 123, userName: 'existing-user' });
  setLoginStatusToCache(true);
});

describe('用户资料查询失败与认证失效分离', () => {
  it.each(['5000', '9999', '0000'])(
    '业务码 %s 且无用户资料时保留原会话',
    async (code) => {
      mocks.apiUserInfo.mockResolvedValue({
        code,
        data: null,
        message: 'temporary failure',
      });
      await expect(UserService.fetchUserInfoFromServer()).rejects.toThrow(
        'User info request failed',
      );
      expect(UserService.getUserInfoFromStorage()).toEqual({
        id: 123,
        userName: 'existing-user',
      });
      expect(getLoginStatusFromCache()).toBe(true);
      expect(getCurrentLoginStatus()).toBe(true);
      expect(mocks.redirectToLogin).not.toHaveBeenCalled();
      expect(mocks.navigateToAuthUrl).not.toHaveBeenCalled();
    },
  );

  it('网络失败不清除已登录用户，服务恢复后可正常刷新', async () => {
    const failure = new TypeError('Failed to fetch');
    mocks.apiUserInfo.mockRejectedValueOnce(failure);
    await expect(UserService.refreshUserInfo()).rejects.toBe(failure);
    expect(getLoginStatusFromCache()).toBe(true);
    expect(getCurrentLoginStatus()).toBe(true);
    expect(UserService.getUserInfoFromStorage()).toMatchObject({ id: 123 });
    mocks.apiUserInfo.mockResolvedValue({
      code: '0000',
      data: { id: 123, userName: 'updated-user' },
    });
    await expect(UserService.refreshUserInfo()).resolves.toMatchObject({
      userName: 'updated-user',
    });
    expect(mocks.redirectToLogin).not.toHaveBeenCalled();
  });

  it.each(['4010', '4011'])(
    '仅认证码 %s 清理资料并导航至对应入口',
    async (code) => {
      mocks.apiUserInfo.mockResolvedValue({
        code,
        data: null,
        message: 'https://sso.example/login',
      });
      await expect(UserService.fetchUserInfoFromServer()).resolves.toBeNull();
      expect(UserService.getUserInfoFromStorage()).toBeNull();
      expect(getLoginStatusFromCache()).toBeNull();
      expect(getCurrentLoginStatus()).toBe(false);
      if (code === '4010') {
        expect(mocks.redirectToLogin).toHaveBeenCalledWith(-1);
        expect(mocks.navigateToAuthUrl).not.toHaveBeenCalled();
      } else {
        expect(mocks.navigateToAuthUrl).toHaveBeenCalledWith(
          'https://sso.example/login',
        );
        expect(mocks.redirectToLogin).not.toHaveBeenCalled();
      }
    },
  );
});
