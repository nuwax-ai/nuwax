import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useWorkspaceDirectoryFiles } from './useWorkspaceDirectoryFiles';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  error: vi.fn(),
  contextKey: 'host:1:old-context',
}));
vi.mock('@/services/vncDesktop', () => ({ apiGetStaticFileList: mocks.list }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('antd', () => ({ message: { error: mocks.error } }));
vi.mock('@/features/client-shell/localFileService', () => ({
  getLocalFilesContextKey: () => mocks.contextKey,
  // 模拟会话页已暂停渲染，授权释放先于页面收到新快照。
  useLocalFilesRevision: () => 0,
}));
const response = (name: string) => ({
  code: '0000',
  data: { recursive: false, files: [{ name, isDir: false }] },
});
const expired = () =>
  Object.assign(new Error('本机文件访问失败（expired）'), { code: 'expired' });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.contextKey = 'host:1:old-context';
});
afterEach(cleanup);

it('切换会话释放授权后，暂停页面的旧请求失败不再弹 expired', async () => {
  let reject!: (error: unknown) => void;
  mocks.list.mockImplementationOnce(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  renderHook(() => useWorkspaceDirectoryFiles(7));
  await waitFor(() => expect(mocks.list).toHaveBeenCalledOnce());
  await act(async () => {
    mocks.contextKey = '';
    reject(expired());
  });
  expect(mocks.error).not.toHaveBeenCalled();
});

it('授权已换代但页面尚未重渲染，旧回包不能写入文件树，恢复渲染后使用新目录', async () => {
  let finish!: (value: unknown) => void;
  mocks.list
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue(response('new.txt'));
  const { result, rerender } = renderHook(() => useWorkspaceDirectoryFiles(7));
  await waitFor(() => expect(mocks.list).toHaveBeenCalledOnce());
  await act(async () => {
    mocks.contextKey = 'host:1:new-context';
    finish(response('old.txt'));
  });
  expect(result.current.files).toEqual([]);
  rerender();
  await waitFor(() =>
    expect(result.current.files.map((file) => file.name)).toEqual(['new.txt']),
  );
  expect(result.current.loading).toBe(false);
});

it('当前授权未变化时的真实 expired 仍然明确报告，不全局吞掉访问错误', async () => {
  mocks.list.mockRejectedValueOnce(expired());
  renderHook(() => useWorkspaceDirectoryFiles(7));
  await waitFor(() =>
    expect(mocks.error).toHaveBeenCalledWith('本机文件访问失败（expired）'),
  );
});
