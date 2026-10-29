import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatFiles } from './useChatFiles';

const mocks = vi.hoisted(() => ({ update: vi.fn(), sourceKey: '' }));
vi.mock('@/features/client-shell/localFileService', () => ({
  getLocalFilesContextKey: () => mocks.sourceKey,
  useLocalFilesRevision: () => 0,
}));
vi.mock('@/services/vncDesktop', () => ({
  apiUpdateStaticFile: mocks.update,
  apiDownloadAllFiles: vi.fn(),
  apiUploadFiles: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('@/utils/ant-custom', () => ({ modalConfirm: vi.fn() }));
vi.mock('@/utils/index', () => ({ checkFileSizeExceedLimit: vi.fn() }));
vi.mock('@/utils/fileTree', () => ({
  updateFilesListName: vi.fn(),
  updateFilesListContent: (_files: unknown, changes: any[]) =>
    changes.map((change) => ({
      name: change.fileId,
      contents: change.fileContent,
      operation: 'modify',
    })),
}));
vi.mock('antd', () => ({ message: { success: vi.fn(), warning: vi.fn() } }));

const input = {
  id: 7,
  fileTreeData: [],
  handleRefreshFileList: async () => undefined,
};
beforeEach(() => {
  vi.useFakeTimers();
  mocks.update.mockReset().mockResolvedValue({ code: '0000' });
  mocks.sourceKey = '';
});
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('文件编辑自动保存回执', () => {
  it('500ms等待期间授权换代，旧草稿不得通过最新文件树写入新工作区', async () => {
    mocks.sourceKey = 'old-context';
    const { result } = renderHook(() => useChatFiles(input));
    const pending = result.current.handleSaveFileContent(
      'a.txt',
      'old draft',
      '',
    );
    mocks.sourceKey = 'new-context';
    await act(() => vi.advanceTimersByTimeAsync(500));
    await expect(pending).resolves.toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('授权换代取消旧队列，重新编辑可以保存到明确的新来源', async () => {
    mocks.sourceKey = 'old-context';
    const { result, rerender } = renderHook(() => useChatFiles(input));
    const old = result.current.handleSaveFileContent('a.txt', 'old draft', '');
    mocks.sourceKey = 'new-context';
    rerender();
    await expect(old).resolves.toBe(false);
    const fresh = result.current.handleSaveFileContent(
      'a.txt',
      'new draft',
      '',
    );
    await act(() => vi.advanceTimersByTimeAsync(500));
    await expect(fresh).resolves.toBe(true);
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it('附属 Git 状态刷新失败不能改变已经成功的写入回执', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const notify = vi.fn().mockRejectedValue(new Error('git offline'));
    const { result } = renderHook(() =>
      useChatFiles({ ...input, onFileMutationSuccessRef: { current: notify } }),
    );
    const saved = result.current.handleSaveFileContent('a.txt', 'draft', '');
    await act(() => vi.advanceTimersByTimeAsync(500));
    await expect(saved).resolves.toBe(true);
    expect(notify).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
  it('返回本次实际写入完成的 Promise，不能把 debounce 的空返回值当成失败', async () => {
    const { result } = renderHook(() => useChatFiles(input));
    const pending = result.current.handleSaveFileContent(
      'a.txt',
      'draft',
      'original',
    );
    expect(pending).toBeInstanceOf(Promise);
    expect(mocks.update).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(500));
    await expect(pending).resolves.toBe(true);
  });
  it('快速编辑两个文件都提交，不因共享 debounce 丢弃前一个文件', async () => {
    const { result } = renderHook(() => useChatFiles(input));
    const first = result.current.handleSaveFileContent('a.txt', 'first', '');
    const second = result.current.handleSaveFileContent('b.txt', 'second', '');
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(mocks.update).toHaveBeenCalledTimes(2);
    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
  });
  it('切换会话取消尚未投递的旧保存，不写入旧会话或新会话', async () => {
    const { result, rerender } = renderHook(
      ({ id }) => useChatFiles({ ...input, id }),
      { initialProps: { id: 7 } },
    );
    const pending = result.current.handleSaveFileContent('a.txt', 'draft', '');
    rerender({ id: 8 });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(mocks.update).not.toHaveBeenCalled();
    await expect(pending).resolves.toBe(false);
  });
});
