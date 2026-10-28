import { useLocalPreviewSource } from '@/components/business-component/FilePreview/useLocalPreviewSource';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  clearLocalFilesContexts,
  getLocalFileList,
  registerLocalFilesContext,
} from './localFileService';

const mocks = vi.hoisted(() => ({ getApi: vi.fn() }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { localFiles: { getApi: mocks.getApi } },
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
