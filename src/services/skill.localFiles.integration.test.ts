import {
  clearLocalFilesContexts,
  getLocalFileList,
  getLocalFileReference,
  registerLocalFilesContext,
} from '@/features/client-shell/localFileService';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchContentFromUrl } from './skill';
const mocks = vi.hoisted(() => ({
  getApi: vi.fn(),
  fetch: vi.fn(),
  auth: vi.fn(),
}));
vi.mock('umi', () => ({ request: vi.fn() }));
vi.mock('@/utils/exportImportFile', () => ({ apiExportFileBlob: vi.fn() }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { localFiles: { getApi: mocks.getApi } },
}));
vi.mock('@/utils/businessAuth', () => ({
  getBusinessFileRequestAuth: mocks.auth,
}));
beforeEach(() => {
  clearLocalFilesContexts();
  vi.clearAllMocks();
  vi.stubGlobal('fetch', mocks.fetch);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  clearLocalFilesContexts();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('正文读取保留已确认的本机来源', () => {
  it.each(['clear', 'switch-remote', 'switch-root'])(
    '旧 node 引用在 %s 后明确 expired，零文件网络请求',
    async (change) => {
      const api = {
        getCapabilities: vi.fn().mockResolvedValue({
          apiVersion: 1,
          available: true,
          sandboxId: 'local',
        }),
        resolveContext: vi.fn().mockImplementation(async (input) => ({
          success: true,
          data: {
            contextId: `ctx-${input.workspacePath}`,
            cId: '7',
            sandboxId: 'local',
            root: input.workspacePath,
          },
        })),
        listFiles: vi
          .fn()
          .mockResolvedValue({ success: true, data: { files: [] } }),
        releaseContext: vi.fn().mockResolvedValue(undefined),
        searchFiles: vi.fn(),
        preparePreview: vi.fn(),
        saveFile: vi.fn(),
        exportWorkspace: vi.fn(),
        openPath: vi.fn(),
        revealInFolder: vi.fn(),
      };
      mocks.getApi.mockReturnValue(api);
      registerLocalFilesContext({
        cId: 7,
        sandboxId: 'local',
        workspacePath: '/work',
      });
      await getLocalFileList(7);
      const oldRef = getLocalFileReference('/api/computer/static/7/a.md')!;
      if (change === 'clear') clearLocalFilesContexts();
      else
        registerLocalFilesContext({
          cId: 7,
          sandboxId: change === 'switch-remote' ? 'remote' : 'local',
          workspacePath: '/new-work',
        });
      await expect(
        fetchContentFromUrl('/api/computer/static/7/a.md', oldRef),
      ).rejects.toMatchObject({ code: 'expired' });
      expect(api.preparePreview).not.toHaveBeenCalled();
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(mocks.auth).not.toHaveBeenCalled();
    },
  );
});
