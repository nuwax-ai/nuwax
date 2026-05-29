/**
 * Mock 使用方式大全
 *
 * 运行方式：
 *   npx vitest run src/__tests__/mockGuide.test.ts
 *   npx vitest src/__tests__/mockGuide.test.ts          # watch 模式
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================
// 1. Mock 整个模块（vi.mock）
// ============================================================
// 把 umi 的 request 替换成 spy，后续可以控制返回值
vi.mock('umi', () => ({
  request: vi.fn(),
}));

// 引入被 mock 后的模块（必须在 vi.mock 之后）
import { request } from 'umi';

// ============================================================
// 2. Mock 单个 service 函数
// ============================================================
vi.mock('@/services/userService', () => ({
  getUserInfo: vi.fn(),
  updateUser: vi.fn(),
}));

import { getUserInfo } from '@/services/userService';

// ============================================================
// 3. Mock localStorage / window 属性
// ============================================================
// 在 beforeEach 里手动设置，afterEach 里恢复

// ============================================================
// 4. Mock 定时器（vi.useFakeTimers）
// ============================================================

// ============================================================
// 5. Mock console（抑制日志输出）
// ============================================================

describe('Mock 使用指南', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    vi.mocked(getUserInfo).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ---------- 1. Mock 网络请求 ----------
  describe('1. Mock 网络请求 (vi.mock + request)', () => {
    it('mock 成功响应', async () => {
      // 给定：request 返回成功
      vi.mocked(request).mockResolvedValue({
        code: '0000',
        data: { userId: 1, name: '张三' },
        message: 'success',
      });

      const result = await request('/api/user/1');

      expect(result.code).toBe('0000');
      expect(result.data.name).toBe('张三');
      expect(request).toHaveBeenCalledWith('/api/user/1');
    });

    it('mock 失败响应', async () => {
      vi.mocked(request).mockResolvedValue({
        code: '9999',
        data: null,
        message: '服务器错误',
      });

      const result = await request('/api/user/999');
      expect(result.code).toBe('9999');
    });

    it('mock 网络异常', async () => {
      vi.mocked(request).mockRejectedValue(new Error('Network Error'));

      await expect(request('/api/user/1')).rejects.toThrow('Network Error');
    });
  });

  // ---------- 2. Mock Service 函数 ----------
  describe('2. Mock Service 函数', () => {
    it('mock getUserInfo 返回指定数据', async () => {
      vi.mocked(getUserInfo).mockResolvedValue({
        userId: 42,
        userName: 'mock-user',
        nickName: 'Mock 用户',
        avatar: 'https://example.com/avatar.png',
      });

      const user = await getUserInfo();
      expect(user.userId).toBe(42);
      expect(user.userName).toBe('mock-user');
    });

    it('mock getUserInfo 调用次数', async () => {
      vi.mocked(getUserInfo).mockResolvedValue({} as any);

      await getUserInfo();
      await getUserInfo();

      expect(getUserInfo).toHaveBeenCalledTimes(2);
    });
  });

  // ---------- 3. Mock localStorage ----------
  describe('3. Mock localStorage', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it('设置和读取 localStorage', () => {
      localStorage.setItem('agentFlow:mock', '1');
      expect(localStorage.getItem('agentFlow:mock')).toBe('1');
    });

    it('spy on localStorage 方法', () => {
      const setSpy = vi.spyOn(Storage.prototype, 'setItem');

      localStorage.setItem('test-key', 'test-value');

      expect(setSpy).toHaveBeenCalledWith('test-key', 'test-value');
      setSpy.mockRestore();
    });
  });

  // ---------- 4. Mock window.location ----------
  describe('4. Mock window.location (URL 参数)', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '/');
    });

    it('模拟 URL query 参数', () => {
      window.history.pushState(
        {},
        '',
        '/space/1/agent-flow/1?mockAgentFlow=true',
      );

      const search = new URLSearchParams(window.location.search);
      expect(search.get('mockAgentFlow')).toBe('true');
    });

    it('模拟不同路径', () => {
      window.history.pushState({}, '', '/space/42/agent-flow/7');

      expect(window.location.pathname).toContain('/space/42/agent-flow/7');
    });
  });

  // ---------- 5. Mock 定时器 ----------
  describe('5. Mock 定时器 (fakeTimers)', () => {
    it('加速 setTimeout', () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      setTimeout(callback, 5000);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5000);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('加速 setInterval', () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      setInterval(callback, 1000);

      vi.advanceTimersByTime(3500);
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  // ---------- 6. Mock console ----------
  describe('6. Mock console（抑制输出）', () => {
    it('spy on console.log', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      console.log('这条日志不会出现在终端');
      expect(logSpy).toHaveBeenCalledWith('这条日志不会出现在终端');

      logSpy.mockRestore();
    });
  });

  // ---------- 7. Mock 函数本身（vi.fn） ----------
  describe('7. 手动创建 mock 函数', () => {
    it('vi.fn() 创建 spy', () => {
      const mockFn = vi
        .fn()
        .mockReturnValueOnce('第一次')
        .mockReturnValueOnce('第二次')
        .mockReturnValue('默认值');

      expect(mockFn()).toBe('第一次');
      expect(mockFn()).toBe('第二次');
      expect(mockFn()).toBe('默认值');
      expect(mockFn()).toBe('默认值');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    it('vi.fn() 实现自定义逻辑', () => {
      const add = vi.fn((a: number, b: number) => a + b);

      expect(add(2, 3)).toBe(5);
      expect(add).toHaveBeenCalledWith(2, 3);
    });
  });
});
