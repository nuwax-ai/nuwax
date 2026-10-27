import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useAuthProtectedImageSrc } from './useAuthProtectedImageSrc';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), auth: vi.fn() }));
vi.mock('@/utils/authProtectedFileUrl', () => ({
  isAuthProtectedFileUrl: (url?: string) => !!url?.includes('/api/f/'),
  resolveAuthProtectedFileFetchUrl: (url: string) => url,
  fetchAuthProtectedFileBlobUrl: mocks.fetch,
}));
vi.mock('@/utils/businessAuth', () => ({
  getBusinessFileRequestAuth: mocks.auth,
}));

beforeEach(() => {
  mocks.fetch.mockReset();
  mocks.auth
    .mockReset()
    .mockReturnValue({ headers: { Authorization: 'test' } });
  vi.stubGlobal('URL', { revokeObjectURL: vi.fn() });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('开发鉴权图片等待带凭据的请求完成，卸载后释放 blob', async () => {
  mocks.fetch.mockResolvedValue('blob:protected');
  const { result, unmount } = renderHook(() =>
    useAuthProtectedImageSrc('/api/f/icon.svg'),
  );
  expect(result.current).toEqual({
    displaySrc: undefined,
    loading: true,
    error: false,
  });
  await waitFor(() => expect(result.current.displaySrc).toBe('blob:protected'));
  expect(mocks.fetch).toHaveBeenCalledWith('/api/f/icon.svg');
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:protected');
});

it('Cookie 环境和公开地址保留原 URL，不额外请求', () => {
  mocks.auth.mockReturnValue({ headers: {} });
  const { result, rerender } = renderHook(
    ({ url }) => useAuthProtectedImageSrc(url),
    {
      initialProps: { url: '/api/f/icon.svg' },
    },
  );
  expect(result.current.displaySrc).toBe('/api/f/icon.svg');
  rerender({ url: 'https://public.example/icon.svg' });
  expect(result.current.displaySrc).toBe('https://public.example/icon.svg');
  expect(mocks.fetch).not.toHaveBeenCalled();
});

it('切换来源后迟到的图片只能释放，不能覆盖新图片', async () => {
  let finish!: (url: string) => void;
  mocks.fetch
    .mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce('blob:new');
  const { result, rerender } = renderHook(
    ({ url }) => useAuthProtectedImageSrc(url),
    {
      initialProps: { url: '/api/f/old.svg' },
    },
  );
  rerender({ url: '/api/f/new.svg' });
  await waitFor(() => expect(result.current.displaySrc).toBe('blob:new'));
  await act(async () => finish('blob:old'));
  expect(result.current.displaySrc).toBe('blob:new');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old');
});

it('拒绝被消费并清除 loading，换图后可以恢复', async () => {
  mocks.fetch
    .mockRejectedValueOnce(new Error('denied'))
    .mockResolvedValueOnce('blob:next');
  const { result, rerender } = renderHook(
    ({ url }) => useAuthProtectedImageSrc(url),
    {
      initialProps: { url: '/api/f/denied.svg' },
    },
  );
  await waitFor(() => expect(result.current.error).toBe(true));
  expect(result.current.loading).toBe(false);
  expect(result.current.displaySrc).toBeUndefined();
  rerender({ url: '/api/f/next.svg' });
  await waitFor(() => expect(result.current.displaySrc).toBe('blob:next'));
  expect(result.current.error).toBe(false);
});
