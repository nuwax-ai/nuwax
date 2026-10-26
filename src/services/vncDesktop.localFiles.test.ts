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
  exportNamedDownload: mocks.download,
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
  it('所选容器不是宿主本机时，列表、搜索、写入和导出仍全部走原接口', async () => {
    const api = localApi();
    mocks.getApi.mockReturnValue(api);
    registerLocalFilesContext({ cId: 7, sandboxId: 'other-computer' });
    await apiGetStaticFileList(7);
    await apiSearchFiles({ cId: 7, kw: '报告' });
    const data = {
      cId: 7,
      files: [
        { name: 'a.txt', operation: 'modify' as const, contents: 'remote' },
      ],
    };
    await apiUpdateStaticFile(data);
    await apiDownloadAllFiles(7, '其他电脑');
    expect(mocks.request.mock.calls.map(([url]) => url)).toEqual([
      '/api/computer/static/file-list',
      '/api/computer/static/search-files',
      '/api/computer/static/files-update',
    ]);
    expect(mocks.download).toHaveBeenCalledWith(
      expect.stringContaining('download-all-files?cId=7'),
      '其他电脑',
    );
    for (const method of [
      api.resolveContext,
      api.listFiles,
      api.searchFiles,
      api.updateFiles,
      api.exportWorkspace,
    ]) {
      expect(method).not.toHaveBeenCalled();
    }
  });

  it('云端导出使用会话名，名称不可用时回退带会话ID的名称', async () => {
    mocks.download.mockResolvedValue(false);
    await apiDownloadAllFiles(7, '我的/会话');
    expect(mocks.download).toHaveBeenLastCalledWith(
      expect.stringContaining('download-all-files?cId=7'),
      '我的-会话',
    );
    await apiDownloadAllFiles(7, '???');
    expect(mocks.download).toHaveBeenLastCalledWith(
      expect.stringContaining('download-all-files?cId=7'),
      'PC.Pages.Chat.exportAllFilesName-7',
    );
    expect(mocks.success).not.toHaveBeenCalled();
  });
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

  it('a selected local write error never falls back to cloud writes', async () => {
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
    expect(mocks.error).toHaveBeenCalledTimes(2);
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it.each([
    { compatibility: 'v1', cId: 71 },
    { compatibility: 'missing-update', cId: 72 },
    { compatibility: 'read-only-v2', cId: 73 },
  ])(
    'new direct PC Web retains the complete legacy route for $compatibility clients',
    async ({ compatibility, cId }) => {
      const api = localApi();
      if (compatibility === 'v1')
        api.getCapabilities.mockResolvedValue({
          apiVersion: 1,
          available: true,
          sandboxId: 'local',
        });
      if (compatibility === 'missing-update')
        delete (api as Partial<typeof api>).updateFiles;
      if (compatibility === 'read-only-v2')
        api.getCapabilities.mockResolvedValue({
          apiVersion: 2,
          available: true,
          writable: false,
          sandboxId: 'local',
        });
      mocks.getApi.mockReturnValue(api);
      registerLocalFilesContext({ cId, sandboxId: 'local' });
      await apiGetStaticFileList(cId);
      const data = {
        cId,
        files: [
          { name: 'a.txt', operation: 'modify' as const, contents: 'saved' },
        ],
      };
      await expect(apiUpdateStaticFile(data)).resolves.toMatchObject({
        code: '0000',
      });
      expect(mocks.request).toHaveBeenLastCalledWith(
        '/api/computer/static/files-update',
        { method: 'POST', data },
      );
      expect(mocks.request).toHaveBeenCalledTimes(2);
      expect(api.resolveContext).not.toHaveBeenCalled();
      expect(api.listFiles).not.toHaveBeenCalled();
      expect(mocks.error).not.toHaveBeenCalled();
    },
  );

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

  it('delayed saves after disposal and stale file references after a remote switch cannot become cloud writes', async () => {
    const api = localApi();
    mocks.getApi.mockReturnValue(api);
    registerLocalFilesContext({ cId: 7, sandboxId: 'local' });
    await apiGetStaticFileList(7);
    clearLocalFilesContexts();
    const file = {
      name: 'a.txt',
      operation: 'modify' as const,
      contents: 'late',
    };
    expect(await apiUpdateStaticFile({ cId: 7, files: [file] })).toMatchObject({
      success: false,
      code: 'expired',
    });
    registerLocalFilesContext({ cId: 7, sandboxId: 'remote' });
    expect(
      await apiUpdateStaticFile({
        cId: 7,
        files: [
          { ...file, localFile: { cId: '7', contextId: 'ctx', path: 'a.txt' } },
        ],
      }),
    ).toMatchObject({ success: false, code: 'expired' });
    expect(mocks.request).not.toHaveBeenCalled();
    expect(api.updateFiles).not.toHaveBeenCalled();
    // A new remote selection still accepts its own files without local provenance.
    await apiUpdateStaticFile({ cId: 7, files: [file] });
    expect(mocks.request).toHaveBeenCalledTimes(1);
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
    'caps-legacy',
    'bridge-readonly',
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
        apiVersion: 2,
        available: true,
        writable: true,
        sandboxId: 'other-computer',
      });
    if (failure === 'caps-legacy')
      api.getCapabilities.mockResolvedValue({
        apiVersion: 1,
        available: true,
        sandboxId: 'local',
      });
    if (failure === 'bridge-readonly')
      delete (api as Partial<typeof api>).updateFiles;
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
