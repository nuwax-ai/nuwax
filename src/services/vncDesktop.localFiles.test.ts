import {
  clearLocalFilesContexts,
  initLocalFilesLifecycle,
  registerLocalFilesContext,
} from '@/features/client-shell/localFileService';
import {
  __resetForTest,
  handleComputerServiceStatePayload,
} from '@/services/computerServiceState';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  apiDownloadAllFiles,
  apiGetStaticFileList,
  apiSearchFiles,
  apiUpdateStaticFile,
} from './vncDesktop';
const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  getApi: vi.fn(),
  download: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('umi', () => ({ request: mocks.request }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { localFiles: { getApi: mocks.getApi } },
}));
vi.mock('@/utils/exportImportFile', () => ({
  exportFileViaBrowserDownload: mocks.download,
}));
vi.mock('antd', () => ({
  message: { success: mocks.success, error: mocks.error },
}));
vi.mock('@/services/i18nRuntime', () => ({ t: (s: string) => s }));
function localApi() {
  return {
    getCapabilities: vi.fn().mockResolvedValue({
      apiVersion: 2,
      available: true,
      writable: true,
      sandboxId: 'local',
    }),
    resolveContext: vi.fn().mockResolvedValue({
      success: true,
      data: { contextId: 'ctx', cId: '7', sandboxId: 'local', root: '/work' },
    }),
    listFiles: vi.fn().mockResolvedValue({
      success: true,
      data: { files: [{ name: 'a.txt', isDir: false }], recursive: false },
    }),
    searchFiles: vi.fn().mockResolvedValue({
      success: true,
      data: { files: [], truncated: true, visited: 12 },
    }),
    exportWorkspace: vi
      .fn()
      .mockResolvedValue({ success: true, data: { canceled: true } }),
    saveFile: vi.fn(),
    preparePreview: vi.fn(),
    openPath: vi.fn(),
    revealInFolder: vi.fn(),
    updateFiles: vi.fn().mockResolvedValue({ success: true }),
    releaseContext: vi.fn().mockResolvedValue(undefined),
  };
}
let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
});
beforeEach(() => {
  __resetForTest();
  clearLocalFilesContexts();
  vi.clearAllMocks();
  mocks.getApi.mockReturnValue(undefined);
  mocks.request.mockResolvedValue({ code: '0000', data: { files: [] } });
});
describe('computer static service local routing', () => {
  it('sends create/edit/rename/delete through the native bridge and retains remote writes', async () => {
    const data = {
      cId: 7,
      files: [
        { name: 'a.txt', operation: 'modify' as const, contents: 'saved' },
      ],
    };
    await apiUpdateStaticFile(data);
    expect(mocks.request).toHaveBeenCalledWith(
      '/api/computer/static/files-update',
      { method: 'POST', data },
    );
    mocks.request.mockClear();
    const api = localApi();
    mocks.getApi.mockReturnValue(api);
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    for (const operation of ['create', 'modify', 'rename', 'delete'] as const) {
      const result = await apiUpdateStaticFile({
        cId: 7,
        files: [
          {
            name: 'a.txt',
            operation,
            contents: 'saved',
            renameFrom: 'old.txt',
          },
        ],
      });
      expect(result.code).toBe('0000');
      expect(api.updateFiles).toHaveBeenLastCalledWith('ctx', [
        expect.objectContaining({ name: 'a.txt', operation }),
      ]);
    }
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('a local write error or an older read-only native bridge never falls back to cloud writes', async () => {
    const api = localApi();
    mocks.getApi.mockReturnValue(api);
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    api.updateFiles.mockResolvedValueOnce({
      success: false,
      code: 'permission-denied',
    });
    const data = {
      cId: 7,
      files: [{ name: 'a.txt', operation: 'delete' as const }],
    };
    await expect(apiUpdateStaticFile(data)).resolves.toMatchObject({
      success: false,
      code: 'permission-denied',
    });
    api.updateFiles.mockRejectedValueOnce(new Error('IPC disconnected'));
    await expect(apiUpdateStaticFile(data)).resolves.toMatchObject({
      success: false,
      code: 'failed',
    });
    clearLocalFilesContexts();
    api.getCapabilities.mockResolvedValueOnce({
      apiVersion: 1,
      available: true,
      sandboxId: 'local',
    });
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    await expect(apiUpdateStaticFile(data)).resolves.toMatchObject({
      success: false,
      code: 'unavailable',
    });
    expect(mocks.error).toHaveBeenCalledTimes(3);
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('a context replaced while a native save is pending cannot report success in the new session', async () => {
    const api = localApi();
    mocks.getApi.mockReturnValue(api);
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    let finish!: (result: { success: boolean }) => void;
    api.updateFiles.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = apiUpdateStaticFile({
      cId: 7,
      files: [{ name: 'a.txt', operation: 'modify', contents: 'saved' }],
    });
    await vi.waitFor(() => expect(api.updateFiles).toHaveBeenCalled());
    clearLocalFilesContexts();
    finish({ success: true });
    await expect(pending).resolves.toMatchObject({
      success: false,
      code: 'expired',
    });
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('retains cloud request parameters for browsers and old bridges', async () => {
    await apiGetStaticFileList(7, {
      relativePath: 'docs',
      type: 'file',
      limit: 100,
    });
    expect(mocks.request).toHaveBeenCalledWith(
      '/api/computer/static/file-list',
      {
        method: 'GET',
        params: {
          cId: 7,
          relativePath: 'docs',
          recursive: false,
          type: 'file',
          limit: 100,
          depth: 2,
        },
      },
    );
  });
  it('local list, search and full export never call the cloud static API', async () => {
    const api = localApi();
    mocks.getApi.mockReturnValue(api);
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    const list = await apiGetStaticFileList(7, { recursive: false, depth: 2 });
    const search = await apiSearchFiles({ cId: 7, kw: 'a' });
    await apiDownloadAllFiles(7);
    expect(list.data.files[0].localFile).toEqual({
      contextId: 'ctx',
      cId: '7',
      path: 'a.txt',
    });
    expect(search.data).toMatchObject({ truncated: true, visited: 12 });
    expect(api.searchFiles).toHaveBeenCalledWith('ctx', {
      kw: 'a',
      customTargetDir: '',
      relativePath: '',
      limit: 200,
      maxVisit: 20000,
      timeoutMs: 2000,
      type: 'file',
    });
    expect(mocks.request).not.toHaveBeenCalled();
    expect(mocks.download).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });
  it('determined local permission errors do not silently change source', async () => {
    const api = localApi();
    mocks.getApi.mockReturnValue(api);
    api.listFiles.mockResolvedValueOnce({
      success: false,
      code: 'permission-denied',
    });
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    await expect(apiGetStaticFileList(7)).rejects.toMatchObject({
      code: 'permission-denied',
    });
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it.each([
    'caps-unavailable',
    'caps-id-mismatch',
    'bridge-missing',
    'resolve-unavailable',
    'resolve-unresolved',
  ])('同一来源本机已成功后，恢复失败 %s 不得请求云端', async (failure) => {
    const api = localApi();
    mocks.getApi.mockReturnValue(api);
    dispose = initLocalFilesLifecycle();
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    await apiGetStaticFileList(7);
    handleComputerServiceStatePayload({ phase: 'stopped' });
    if (failure === 'caps-unavailable')
      api.getCapabilities.mockResolvedValue({
        apiVersion: 1,
        available: false,
      });
    if (failure === 'caps-id-mismatch')
      api.getCapabilities.mockResolvedValue({
        apiVersion: 1,
        available: true,
        sandboxId: 'other-computer',
      });
    if (failure === 'bridge-missing') mocks.getApi.mockReturnValue(undefined);
    if (failure === 'resolve-unavailable')
      api.resolveContext.mockResolvedValue({
        success: false,
        code: 'unavailable',
      });
    if (failure === 'resolve-unresolved')
      api.resolveContext.mockResolvedValue({
        success: false,
        code: 'context-unresolved',
      });
    const code =
      failure === 'caps-id-mismatch'
        ? 'not-local'
        : failure === 'resolve-unresolved'
        ? 'context-unresolved'
        : 'unavailable';
    handleComputerServiceStatePayload({
      phase: 'starting',
      sandboxId: 'local',
    });
    await expect(apiGetStaticFileList(7)).rejects.toMatchObject({ code });
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: 'local' });
    await expect(apiSearchFiles({ cId: 7, kw: 'a' })).rejects.toMatchObject({
      code,
    });
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('明确切换到远端电脑会创建新来源，允许恢复原静态 API', async () => {
    const api = localApi();
    mocks.getApi.mockReturnValue(api);
    dispose = initLocalFilesLifecycle();
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    await apiGetStaticFileList(7);
    handleComputerServiceStatePayload({ phase: 'stopped' });
    api.getCapabilities.mockResolvedValue({ apiVersion: 1, available: false });
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: 'local' });
    await expect(apiGetStaticFileList(7)).rejects.toMatchObject({
      code: 'unavailable',
    });
    expect(mocks.request).not.toHaveBeenCalled();
    registerLocalFilesContext({ cId: 7, sandboxId: 'remote' });
    await apiGetStaticFileList(7);
    expect(mocks.request).toHaveBeenCalledOnce();
  });
  it('a delayed cloud response cannot replace a newly registered local context', async () => {
    let complete!: (response: unknown) => void;
    mocks.request.mockReturnValueOnce(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const request = apiGetStaticFileList(7);
    await Promise.resolve();
    await Promise.resolve();
    mocks.getApi.mockReturnValue(localApi());
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    complete({ code: '0000', data: { files: [{ name: 'remote.txt' }] } });
    await expect(request).rejects.toMatchObject({ code: 'expired' });
  });
});
