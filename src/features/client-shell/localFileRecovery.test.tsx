import { useLocalPreviewSource } from '@/components/business-component/FilePreview/useLocalPreviewSource';
import { useWorkspaceFileTreeSession } from '@/components/business-component/FileTreeGitSourcePanel/hooks/useWorkspaceFileTreeSession';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  clearLocalFilesContexts,
  getLocalFileList,
  getLocalFilesContextKey,
  prepareLocalFilePreview,
  registerLocalFilesContext,
} from './localFileService';

const mocks = vi.hoisted(() => ({
  getApi: vi.fn(),
  cloud: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { localFiles: { getApi: mocks.getApi } },
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('antd', () => ({ message: { error: mocks.error } }));
vi.mock('@/services/vncDesktop', () => ({
  apiGetStaticFileList: async (cId: number, options: object) =>
    (await getLocalFileList(cId, options)) ?? mocks.cloud(),
  apiSearchFiles: async ({ cId, kw }: { cId: number; kw: string }) =>
    (await getLocalFileList(cId, {}, { kw })) ?? mocks.cloud(),
}));

let api: ReturnType<typeof makeApi>;
function makeApi() {
  return {
    getCapabilities: vi.fn().mockResolvedValue({
      apiVersion: 2,
      available: true,
      writable: true,
      sandboxId: 'host-local',
    }),
    resolveContext: vi.fn().mockImplementation(async (input) => ({
      success: true,
      data: {
        contextId: `ctx-${input.cId}`,
        cId: String(input.cId),
        sandboxId: 'host-local',
        root: '/work',
      },
    })),
    releaseContext: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue({
      success: true,
      data: { files: [], recursive: false },
    }),
    searchFiles: vi.fn(),
    saveFile: vi.fn(),
    exportWorkspace: vi.fn(),
    openPath: vi.fn(),
    revealInFolder: vi.fn(),
    updateFiles: vi.fn(),
    preparePreview: vi.fn().mockResolvedValue({
      success: true,
      data: {
        grantId: 'review',
        url: 'nuwax-local://review/a.md',
        baseUrl: 'nuwax-local://review/',
        mime: 'text/markdown',
        bytes: 1,
      },
    }),
    releasePreview: vi.fn().mockResolvedValue(undefined),
  };
}
beforeEach(() => {
  clearLocalFilesContexts();
  vi.clearAllMocks();
  api = makeApi();
  mocks.getApi.mockReturnValue(api);
});
afterEach(() => {
  cleanup();
  clearLocalFilesContexts();
});

it('本机身份在前一会话已确认，新会话遇到服务未就绪也应明确本机不可用', async () => {
  const release = registerLocalFilesContext({
    cId: 881001,
    sandboxId: 'host-local',
  });
  await getLocalFileList(881001);
  release();
  api.getCapabilities.mockResolvedValue({
    apiVersion: 2,
    available: false,
    writable: false,
  });
  registerLocalFilesContext({ cId: 881002, sandboxId: 'host-local' });
  await expect(getLocalFileList(881002)).rejects.toMatchObject({
    code: 'unavailable',
  });
});

it('工作目录首次未就绪，恢复后点击预览重试应重新解析并成功', async () => {
  api.resolveContext.mockResolvedValueOnce({
    success: false,
    code: 'context-unresolved',
  });
  registerLocalFilesContext({ cId: 881003, sandboxId: 'host-local' });
  const { result } = renderHook(() =>
    useLocalPreviewSource('/api/computer/static/881003/a.md'),
  );
  await waitFor(() =>
    expect(result.current.error).toMatchObject({ code: 'context-unresolved' }),
  );
  await act(async () => result.current.refresh());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(api.resolveContext).toHaveBeenCalledTimes(2);
  expect(result.current.error).toBeUndefined();
  expect(result.current.source).toBe('nuwax-local://review/a.md');
});

const unresolved = { success: false, code: 'context-unresolved' };
const fileList = {
  success: true,
  data: {
    files: [{ name: 'hello_world.text', isDir: false }],
    recursive: false,
  },
};
const resolved = (cId: number) => ({
  success: true,
  data: {
    contextId: `ctx-${cId}`,
    cId: String(cId),
    sandboxId: 'host-local',
    root: '/Users/test/Downloads/自定义项目',
  },
});

it('当前会话首次解析失败后刷新可恢复文件树，持续失败不会触发重试循环或走云端', async () => {
  api.resolveContext.mockResolvedValue(unresolved);
  api.listFiles.mockResolvedValue(fileList);
  registerLocalFilesContext({ cId: 881004, sandboxId: 'host-local' });
  const { result } = renderHook(() =>
    useWorkspaceFileTreeSession({ conversationId: 881004 }),
  );
  await waitFor(() => expect(mocks.error).toHaveBeenCalled());
  await waitFor(() => expect(result.current.loading).toBe(false));
  const failedKey = getLocalFilesContextKey(881004);
  const attempts = api.resolveContext.mock.calls.length;
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  expect(api.resolveContext).toHaveBeenCalledTimes(attempts);
  expect(attempts).toBeLessThanOrEqual(2);
  api.resolveContext.mockResolvedValue(resolved(881004));
  act(() => result.current.refreshAllLoaded());
  await waitFor(() =>
    expect(result.current.files.map((file) => file.name)).toEqual([
      'hello_world.text',
    ]),
  );
  expect(getLocalFilesContextKey(881004)).not.toBe(failedKey);
  expect(mocks.cloud).not.toHaveBeenCalled();
});

it('首次失败后直接点击 task-result，可重新解析自定义目录并打开文件，无需切换会话', async () => {
  api.resolveContext.mockResolvedValueOnce(unresolved);
  api.searchFiles.mockResolvedValue(fileList);
  registerLocalFilesContext({ cId: 881005, sandboxId: 'host-local' });
  await expect(getLocalFileList(881005)).rejects.toMatchObject({
    code: 'context-unresolved',
  });
  api.resolveContext.mockResolvedValue(resolved(881005));
  const { result, rerender } = renderHook(
    ({ trigger }: { trigger?: number }) =>
      useWorkspaceFileTreeSession({
        conversationId: 881005,
        enabled: false,
        taskAgentSelectedFileId: 'hello_world.text',
        taskAgentSelectTrigger: trigger,
      }),
    { initialProps: { trigger: undefined as number | undefined } },
  );
  const select = vi.fn(async (_id, options) => {
    await prepareLocalFilePreview(options.fallbackNode.localFile);
  });
  result.current.selectFileRef.current = select;
  rerender({ trigger: 1 });
  await waitFor(() =>
    expect(api.preparePreview).toHaveBeenCalledWith({
      contextId: 'ctx-881005',
      cId: '881005',
      path: 'hello_world.text',
    }),
  );
  expect(select).toHaveBeenCalledOnce();
  expect(api.resolveContext).toHaveBeenCalledTimes(2);
  expect(mocks.cloud).not.toHaveBeenCalled();
});

it('并发文件访问共用一次恢复，切换会话后迟到的工作区不能恢复旧授权', async () => {
  api.resolveContext.mockResolvedValueOnce(unresolved);
  const release = registerLocalFilesContext({
    cId: 881006,
    sandboxId: 'host-local',
  });
  await expect(getLocalFileList(881006)).rejects.toMatchObject({
    code: 'context-unresolved',
  });
  let finish!: (value: unknown) => void;
  api.resolveContext.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const first = getLocalFileList(881006);
  const second = prepareLocalFilePreview(
    '/api/computer/static/881006/hello_world.text',
  );
  const rejected = Promise.all([
    expect(first).rejects.toMatchObject({ code: 'expired' }),
    expect(second).rejects.toMatchObject({ code: 'expired' }),
  ]);
  await waitFor(() => expect(api.resolveContext).toHaveBeenCalledTimes(2));
  release();
  finish(resolved(881006));
  await rejected;
  expect(api.releaseContext).toHaveBeenCalledWith('ctx-881006');
  expect(api.preparePreview).not.toHaveBeenCalled();
});
