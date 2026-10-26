import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildExportZipName,
  exportFileViaBrowserDownload,
} from './exportImportFile';

const mocks = vi.hoisted(() => ({ local: vi.fn(), desktop: vi.fn() }));
vi.mock('@/features/client-shell/localFileService', () => ({
  saveLocalFile: mocks.local,
}));
vi.mock('@/services/agentDev', () => ({ apiTemplateExport: vi.fn() }));
vi.mock('@/services/dataTable', () => ({ apiExportExcel: vi.fn() }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('umi', () => ({ request: vi.fn() }));
vi.mock('./downloadCompletion', () => ({ saveWithDesktopHost: mocks.desktop }));

beforeEach(() => {
  mocks.local.mockReset().mockResolvedValue(undefined);
  mocks.desktop.mockReset();
});

describe('带资源名称的导出回执', () => {
  it('保留中文名称并去除路径分隔符，空名称沿用默认名', () => {
    expect(buildExportZipName(' 我的技能/测试:*? ')).toBe('我的技能-测试.zip');
    expect(buildExportZipName(null)).toBeUndefined();
    expect(buildExportZipName(' / ')).toBeUndefined();
  });
  it('把资源名传给宿主，实际保存完成前不返回成功', async () => {
    let finish!: (saved: boolean) => void;
    mocks.desktop.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    let completed = false;
    const pending = exportFileViaBrowserDownload(
      '/api/skill/export/1',
      buildExportZipName('我的技能'),
    ).then((saved) => {
      completed = true;
      return saved;
    });
    await vi.waitFor(() =>
      expect(mocks.desktop).toHaveBeenCalledWith(
        '/api/skill/export/1',
        '我的技能.zip',
      ),
    );
    expect(completed).toBe(false);
    finish(true);
    await expect(pending).resolves.toBe(true);
  });
  it('取消不报告成功，失败保留拒绝给页面消费，随后允许重试', async () => {
    mocks.desktop
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('disk full'))
      .mockResolvedValueOnce(true);
    await expect(
      exportFileViaBrowserDownload('/export', '项目.zip'),
    ).resolves.toBe(false);
    await expect(
      exportFileViaBrowserDownload('/export', '项目.zip'),
    ).rejects.toThrow('disk full');
    await expect(
      exportFileViaBrowserDownload('/export', '项目.zip'),
    ).resolves.toBe(true);
  });
});
