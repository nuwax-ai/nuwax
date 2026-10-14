import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalPreviewSource } from './useLocalPreviewSource';

const api = vi.hoisted(() => ({
  prepare: vi.fn(),
  reference: vi.fn(),
  key: vi.fn(),
}));
vi.mock('@/features/client-shell/localFileService', () => ({
  useLocalFilesRevision: () => 0,
  getLocalFileReference: api.reference,
  getLocalFilesContextKey: api.key,
  prepareLocalFilePreview: api.prepare,
}));
const ref = { contextId: 'ctx', cId: '9', path: 'docs/a.md' };
const preview = (name: string) => ({
  url: `nuwax-local://grant/${name}`,
  baseUrl: 'nuwax-local://grant/',
  release: vi.fn(),
});
beforeEach(() => {
  vi.resetAllMocks();
  api.key.mockReturnValue('ctx');
});
afterEach(cleanup);

describe('本机预览授权生命周期', () => {
  it('已明确本机的URL在上下文失效后直接expired，拒绝云端换源', async () => {
    api.reference.mockReturnValue(ref);
    const grant = preview('a.md');
    api.prepare
      .mockResolvedValueOnce(grant)
      .mockRejectedValueOnce(new Error('expired'));
    const { result, rerender } = renderHook(() =>
      useLocalPreviewSource('/api/computer/static/9/a.md'),
    );
    await act(async () => {
      await Promise.resolve();
    });
    api.reference.mockReturnValue(undefined);
    api.key.mockReturnValue('expired');
    rerender();
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.error?.message).toBe('expired');
    expect(result.current.source).toBeUndefined();
    expect(api.prepare).toHaveBeenLastCalledWith(ref);
    expect(api.prepare).toHaveBeenCalledTimes(2);
    expect(grant.release).toHaveBeenCalledOnce();
  });
  it('等待首屏上下文；切源释放旧授权，卸载释放当前授权', async () => {
    api.reference.mockReturnValue(ref);
    const a = preview('a.md');
    const b = preview('b.md');
    api.prepare.mockResolvedValueOnce(a).mockResolvedValueOnce(b);
    const { result, rerender, unmount } = renderHook(
      ({ source }) => useLocalPreviewSource(source),
      { initialProps: { source: '/api/computer/static/9/a.md' } },
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.source).toBeUndefined();
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.source).toBe(a.url);
    rerender({ source: '/api/computer/static/9/b.md' });
    expect(a.release).toHaveBeenCalledOnce();
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.source).toBe(b.url);
    unmount();
    expect(b.release).toHaveBeenCalledOnce();
  });

  it('卸载后迟到的授权响应立即释放', async () => {
    let complete!: (value: ReturnType<typeof preview>) => void;
    api.prepare.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const { unmount } = renderHook(() =>
      useLocalPreviewSource('/api/computer/static/9/a.md'),
    );
    unmount();
    const stale = preview('stale.md');
    await act(async () => complete(stale));
    expect(stale.release).toHaveBeenCalledOnce();
  });

  it('旧桥返回null才回原URL，确定本机的失败保留错误', async () => {
    api.prepare
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('文件不存在'));
    const { result, rerender } = renderHook(
      ({ source }) => useLocalPreviewSource(source),
      { initialProps: { source: '/api/computer/static/9/a.md' } },
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.source).toBe('/api/computer/static/9/a.md');
    expect(result.current.isLocal).toBe(false);
    rerender({ source: '/api/computer/static/9/missing.md' });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.error?.message).toBe('文件不存在');
  });

  it('刷新撤销并重取授权，不持久化到传入引用', async () => {
    const a = preview('a.md');
    const b = preview('a-fresh.md');
    api.prepare.mockResolvedValueOnce(a).mockResolvedValueOnce(b);
    const { result } = renderHook(() => useLocalPreviewSource(undefined, ref));
    await act(async () => {
      await Promise.resolve();
    });
    act(() => result.current.refresh());
    expect(a.release).toHaveBeenCalledOnce();
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.source).toBe(b.url);
    expect(ref.path).toBe('docs/a.md');
  });
});
