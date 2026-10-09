import type { FileNode } from '@/types/interfaces/appDev';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadFileByUrl } from './fileTree';
const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
}));
vi.mock('./exportImportFile', () => ({
  exportFileViaBrowserDownload: mocks.download,
}));
vi.mock('antd', () => ({
  message: {
    error: mocks.error,
    warning: mocks.warning,
    success: mocks.success,
  },
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('./htmlToPdf', () => ({ htmlToPdf: vi.fn() }));
vi.mock('./markdownToPdf', () => ({ markdownToPdf: vi.fn() }));
const file = {
  id: 'report',
  name: 'report.json',
  type: 'file',
  fileProxyUrl: '/api/computer/static/123/report.json',
} as FileNode;
beforeEach(() => {
  vi.clearAllMocks();
});
describe('artifact file-tree download', () => {
  it('waits for native save before the download action settles', async () => {
    let resolve!: (value: boolean) => void;
    mocks.download.mockReturnValueOnce(
      new Promise<boolean>((r) => {
        resolve = r;
      }),
    );
    let settled = false;
    const task = downloadFileByUrl(file).then(() => {
      settled = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
    resolve(true);
    await task;
    expect(settled).toBe(true);
    expect(mocks.error).not.toHaveBeenCalled();
  });
  it('shows the existing failure message after native download rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.download.mockRejectedValueOnce(new Error('disk full'));
    await downloadFileByUrl(file);
    expect(mocks.error).toHaveBeenCalledWith(
      'PC.Utils.FileTree.downloadFailedRetry',
    );
    vi.restoreAllMocks();
  });
  it('does not call cancellation a success or failure', async () => {
    mocks.download.mockResolvedValueOnce(false);
    await downloadFileByUrl(file);
    expect(mocks.error).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });
});
