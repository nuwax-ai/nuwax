import {
  clearLocalFilesContexts,
  getLocalFileList,
  initLocalFilesLifecycle,
  registerLocalFilesContext,
} from '@/features/client-shell/localFileService';
import {
  __resetForTest,
  handleComputerServiceStatePayload,
} from '@/services/computerServiceState';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useWorkspaceDirectoryFiles } from './useWorkspaceDirectoryFiles';
const mocks = vi.hoisted(() => ({
  getApi: vi.fn(),
  list: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { localFiles: { getApi: mocks.getApi } },
}));
vi.mock('@/services/vncDesktop', () => ({ apiGetStaticFileList: mocks.list }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (s: string) => s }));
vi.mock('antd', () => ({ message: { error: mocks.error } }));
let cleanup: (() => void) | undefined;
beforeEach(() => {
  __resetForTest();
  clearLocalFilesContexts();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup?.();
  clearLocalFilesContexts();
});
it('本机迟到ready重拉工作区，旧云端回包不能覆盖本机树或清掉新请求状态', async () => {
  let finishCloud!: (value: unknown) => void;
  const cloud = new Promise((resolve) => {
    finishCloud = resolve;
  });
  const api = {
    getCapabilities: vi
      .fn()
      .mockResolvedValueOnce({
        apiVersion: 2,
        available: false,
        writable: false,
      })
      .mockResolvedValue({
        apiVersion: 2,
        available: true,
        writable: true,
        sandboxId: 'local',
      }),
    resolveContext: vi.fn().mockResolvedValue({
      success: true,
      data: { contextId: 'ctx', cId: '7', sandboxId: 'local', root: '/work' },
    }),
    releaseContext: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue({
      success: true,
      data: {
        recursive: false,
        files: [{ name: 'local.txt', isDir: false }],
      },
    }),
    searchFiles: vi.fn(),
    preparePreview: vi.fn(),
    saveFile: vi.fn(),
    exportWorkspace: vi.fn(),
    openPath: vi.fn(),
    revealInFolder: vi.fn(),
    updateFiles: vi.fn(),
  };
  mocks.getApi.mockReturnValue(api);
  cleanup = initLocalFilesLifecycle();
  registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
  await getLocalFileList(7);
  mocks.list.mockImplementation(
    async (cId, options) => (await getLocalFileList(cId, options)) ?? cloud,
  );
  const { result, unmount } = renderHook(() => useWorkspaceDirectoryFiles(7));
  await waitFor(() => expect(mocks.list).toHaveBeenCalled());
  act(() =>
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: 'local' }),
  );
  await waitFor(() => expect(result.current.files[0]?.name).toBe('local.txt'));
  await act(async () => {
    finishCloud({
      code: '0000',
      data: {
        recursive: false,
        files: [{ name: 'old-cloud.txt', isDir: false }],
      },
    });
    await cloud;
  });
  expect(result.current.files.map((file) => file.name)).toEqual(['local.txt']);
  expect(result.current.loading).toBe(false);
  expect(mocks.error).not.toHaveBeenCalled();
  unmount();
});
