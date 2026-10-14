import {
  __resetForTest,
  handleComputerServiceStatePayload,
} from '@/services/computerServiceState';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLocalFilesContexts,
  exportLocalWorkspace,
  getLocalFileList,
  getLocalFileReference,
  initLocalFilesLifecycle,
  isAbsoluteFileUrl,
  prepareLocalFilePreview,
  registerLocalFilesContext,
  saveLocalFile,
} from './localFileService';
const mocks = vi.hoisted(() => ({ getApi: vi.fn() }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { localFiles: { getApi: mocks.getApi } },
}));

function makeApi() {
  return {
    getCapabilities: vi.fn().mockResolvedValue({
      apiVersion: 1,
      available: true,
      sandboxId: 'local-1',
    }),
    resolveContext: vi.fn().mockImplementation(async (input) => ({
      success: true,
      data: {
        contextId: `ctx-${input.sandboxId}`,
        cId: String(input.cId),
        sandboxId: input.sandboxId,
        root: '/work',
      },
    })),
    releaseContext: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue({
      success: true,
      data: {
        recursive: false,
        files: [{ name: '文档/a #1.md', isDir: false }],
      },
    }),
    searchFiles: vi.fn().mockResolvedValue({
      success: true,
      data: { recursive: false, files: [] },
    }),
    preparePreview: vi.fn().mockResolvedValue({
      success: true,
      data: {
        grantId: 'grant',
        url: 'nuwax-local://grant/a.md',
        baseUrl: 'nuwax-local://grant/',
        mime: 'text/plain',
        bytes: 10,
      },
    }),
    releasePreview: vi.fn().mockResolvedValue(undefined),
    saveFile: vi
      .fn()
      .mockResolvedValue({ success: true, data: { canceled: false } }),
    exportWorkspace: vi
      .fn()
      .mockResolvedValue({ success: true, data: { canceled: false } }),
    openPath: vi.fn().mockResolvedValue({ success: true }),
    revealInFolder: vi.fn().mockResolvedValue({ success: true }),
  };
}
let api: ReturnType<typeof makeApi>;
beforeEach(() => {
  __resetForTest();
  clearLocalFilesContexts();
  api = makeApi();
  mocks.getApi.mockReturnValue(api);
});
afterEach(() => clearLocalFilesContexts());
const bind = (sandboxId = 'local-1') =>
  registerLocalFilesContext({
    cId: 12,
    sandboxId,
    workspacePath: '/work',
    userId: 9,
  });

describe('local file routing', () => {
  it('falls back without a real bridge or explicit matching conversation', async () => {
    mocks.getApi.mockReturnValue(undefined);
    bind();
    expect(await getLocalFileList(12)).toBeNull();
    expect(
      await prepareLocalFilePreview('/api/computer/static/99/a.md'),
    ).toBeNull();
    expect(api.resolveContext).not.toHaveBeenCalled();
  });
  it('remote selection cannot borrow the local computer capability', async () => {
    bind('remote-2');
    expect(await getLocalFileList(12)).toBeNull();
    expect(api.resolveContext).not.toHaveBeenCalled();
  });
  it('uses one resolved context for list/search, preserving limits and compatibility URL', async () => {
    bind();
    const list = await getLocalFileList(12, { depth: 2, recursive: false });
    expect(list?.data.files[0].fileProxyUrl).toBe(
      '/api/computer/static/12/%E6%96%87%E6%A1%A3/a%20%231.md',
    );
    expect(list?.data.files[0].localFile).toEqual({
      cId: '12',
      contextId: 'ctx-local-1',
      path: '文档/a #1.md',
    });
    await getLocalFileList(
      12,
      {},
      { kw: 'a', limit: 100, maxVisit: 20000, timeoutMs: 2000 },
    );
    expect(api.resolveContext).toHaveBeenCalledTimes(1);
    expect(api.listFiles).toHaveBeenCalledWith('ctx-local-1', {
      depth: 2,
      recursive: false,
    });
    expect(api.searchFiles).toHaveBeenCalledWith('ctx-local-1', {
      kw: 'a',
      limit: 100,
      maxVisit: 20000,
      timeoutMs: 2000,
    });
  });
  it('only unresolved local context falls back; determined local read failures propagate', async () => {
    api.resolveContext.mockResolvedValueOnce({
      success: false,
      code: 'context-unresolved',
    });
    bind();
    expect(await getLocalFileList(12)).toBeNull();
    clearLocalFilesContexts();
    bind();
    api.listFiles.mockResolvedValueOnce({
      success: false,
      code: 'permission-denied',
      error: 'no access',
    });
    await expect(getLocalFileList(12)).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });
  it('customTargetDir keeps absolute paths for Windows and POSIX explicit files', async () => {
    bind();
    await getLocalFileList(12);
    const url = '/api/computer/static/12/a%20b.md?customTargetDir=C%3A%5Cwork';
    await prepareLocalFilePreview(url);
    expect(api.preparePreview).toHaveBeenCalledWith({
      contextId: 'ctx-local-1',
      cId: '12',
      path: 'C:\\work/a b.md',
    });
    expect(getLocalFileReference(url, 12, '/tmp/a b.md')?.path).toBe(
      '/tmp/a b.md',
    );
    expect(isAbsoluteFileUrl('nuwax-local://grant/path')).toBe(true);
  });
  it('keeps cancellations silent and never requests a fallback after local denial', async () => {
    bind();
    api.saveFile.mockResolvedValueOnce({
      success: true,
      data: { canceled: true },
    });
    expect(await saveLocalFile('/api/computer/static/12/a.md')).toBe(false);
    api.exportWorkspace.mockResolvedValueOnce({
      success: false,
      code: 'canceled',
    });
    expect(await exportLocalWorkspace(12)).toBe(false);
    api.saveFile.mockResolvedValueOnce({ success: false, code: 'not-found' });
    await expect(
      saveLocalFile('/api/computer/static/12/a.md'),
    ).rejects.toMatchObject({ code: 'not-found' });
  });
  it('releases preview grants on close and invalidates old refs on computer switch', async () => {
    const unbind = bind();
    const preview = await prepareLocalFilePreview(
      '/api/computer/static/12/a.md',
    );
    preview?.release();
    preview?.release();
    expect(api.releasePreview).toHaveBeenCalledTimes(1);
    const ref = getLocalFileReference('/api/computer/static/12/a.md')!;
    bind('remote-2');
    unbind();
    await expect(prepareLocalFilePreview(ref)).rejects.toMatchObject({
      code: 'expired',
    });
    expect(await getLocalFileList(12)).toBeNull();
  });
  it('identical parent/child registrations share leases until both unmount', async () => {
    const first = bind();
    const second = bind();
    await getLocalFileList(12);
    first();
    expect(getLocalFileReference('/api/computer/static/12/a.md')).toBeDefined();
    expect(api.releaseContext).not.toHaveBeenCalled();
    second();
    expect(api.releaseContext).toHaveBeenCalledWith('ctx-local-1');
  });
  it('re-resolves unavailable capabilities when the local service becomes ready', async () => {
    const dispose = initLocalFilesLifecycle();
    api.getCapabilities.mockResolvedValueOnce({
      apiVersion: 1,
      available: false,
    });
    bind();
    expect(await getLocalFileList(12)).toBeNull();
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: 'local-1' });
    expect((await getLocalFileList(12))?.data.files[0].localFile).toBeDefined();
    dispose();
  });
  it('starting 到 ready 或重复 ready 不撤销当前预览，停服后明确失败并允许恢复', async () => {
    const dispose = initLocalFilesLifecycle();
    bind();
    const preview = await prepareLocalFilePreview(
      '/api/computer/static/12/a.md',
    );
    handleComputerServiceStatePayload({
      phase: 'starting',
      sandboxId: 'local-1',
    });
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: 'local-1' });
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: 'local-1' });
    expect(api.resolveContext).toHaveBeenCalledTimes(1);
    expect(api.releasePreview).not.toHaveBeenCalled();
    handleComputerServiceStatePayload({ phase: 'stopped' });
    expect(api.releasePreview).toHaveBeenCalledWith(preview!.grantId);
    await expect(getLocalFileList(12)).rejects.toMatchObject({
      code: 'unavailable',
    });
    handleComputerServiceStatePayload({ phase: 'ready', sandboxId: 'local-1' });
    expect((await getLocalFileList(12))?.data.files[0].localFile).toBeDefined();
    expect(api.resolveContext).toHaveBeenCalledTimes(2);
    dispose();
  });
  it('drops delayed preview authorization when its owning conversation unmounts', async () => {
    const unbind = bind();
    await getLocalFileList(12);
    let finish!: (result: unknown) => void;
    api.preparePreview.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const task = prepareLocalFilePreview('/api/computer/static/12/a.md');
    await Promise.resolve();
    await Promise.resolve();
    unbind();
    finish({
      success: true,
      data: {
        grantId: 'late',
        url: 'nuwax-local://late/a.md',
        baseUrl: 'nuwax-local://late/',
        mime: 'text/plain',
        bytes: 10,
      },
    });
    await expect(task).rejects.toMatchObject({ code: 'expired' });
    expect(api.releasePreview).toHaveBeenCalledWith('late');
  });
});
