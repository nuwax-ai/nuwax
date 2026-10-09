import { getPageBySlug, listMySpaces } from '@repo-api';
import { beginRepoRuntime, endRepoRuntime } from '@repo-host-runtime';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  endRepoRuntime();
  vi.unstubAllGlobals();
});

describe('资料库真实 main API 的宿主认证边界', () => {
  it('业务 4011 交给宿主，匿名探测保持静默', async () => {
    const expired = vi.fn();
    beginRepoRuntime(
      document.createElement('div'),
      { onAuthExpired: expired },
      true,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        json: async () => ({
          code: '4011',
          message: 'https://sso.example/login',
        }),
      })),
    );
    await expect(getPageBySlug('a')).rejects.toMatchObject({ code: '4011' });
    expect(expired).toHaveBeenCalledWith('https://sso.example/login');
    expired.mockClear();
    await expect(listMySpaces(true)).rejects.toMatchObject({ code: '4011' });
    expect(expired).not.toHaveBeenCalled();
  });

  it('裸 HTTP 401 交给宿主，匿名探测仍不跳转', async () => {
    const expired = vi.fn();
    beginRepoRuntime(
      document.createElement('div'),
      { onAuthExpired: expired },
      true,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 401,
        json: async () => {
          throw new SyntaxError('not JSON');
        },
      })),
    );
    await expect(getPageBySlug('a')).rejects.toMatchObject({ code: '401' });
    expect(expired).toHaveBeenCalledWith('/login');
    expired.mockClear();
    await expect(listMySpaces(true)).rejects.toMatchObject({ code: '401' });
    expect(expired).not.toHaveBeenCalled();
  });

  it('旧实例的 fetch body 晚到 401 不清除重挂后的账号会话', async () => {
    const expired = vi.fn();
    const nextExpired = vi.fn();
    const root = document.createElement('div');
    beginRepoRuntime(root, { onAuthExpired: expired }, true);
    let resolveBody!: (body: unknown) => void;
    const body = new Promise((resolve) => {
      resolveBody = resolve;
    });
    const json = vi.fn(() => body);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 200, json })),
    );
    const request = getPageBySlug('a');
    await vi.waitFor(() => expect(json).toHaveBeenCalledOnce());
    endRepoRuntime();
    beginRepoRuntime(root, { onAuthExpired: nextExpired }, true);
    resolveBody({ code: '4010', message: 'expired' });
    await expect(request).rejects.toMatchObject({ code: '4010' });
    expect(expired).not.toHaveBeenCalled();
    expect(nextExpired).not.toHaveBeenCalled();
  });
});
