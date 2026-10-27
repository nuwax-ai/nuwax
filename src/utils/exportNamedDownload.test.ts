import { Blob } from 'node:buffer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportFileViaBrowserDownload,
  exportNamedDownload,
  sanitizeDownloadBaseName,
} from './exportImportFile';

const desktop = vi.hoisted(() => ({
  save: vi.fn(),
  request: vi.fn(),
}));

vi.mock('./downloadCompletion', () => ({
  saveWithDesktopHost: desktop.save,
}));
vi.mock('@/features/client-shell/localFileService', () => ({
  saveLocalFile: vi.fn(async () => undefined),
}));
vi.mock('@/services/agentDev', () => ({ apiTemplateExport: vi.fn() }));
vi.mock('@/services/dataTable', () => ({ apiExportExcel: vi.fn() }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (k: string) => k }));
vi.mock('antd', () => ({
  message: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock('umi', () => ({ request: desktop.request }));

beforeEach(() => {
  desktop.save.mockReset().mockResolvedValue(undefined);
  desktop.request.mockReset();
});

describe('sanitizeDownloadBaseName', () => {
  it.each([
    ['我的技能', '我的技能'],
    ['a/b\\c:d*e?f"g<h>i|j', 'a-b-c-d-e-f-g-h-i-j'],
    ['  技能  名  ', '技能-名'],
    ['...技能...', '技能'],
    ['---技能---', '技能'],
    ['../../etc/passwd', 'etc-passwd'],
    ['///', ''],
    ['', ''],
    ['CON', '_CON'],
    ['CON.txt', '_CON.txt'],
    ['a\u0000\u0001b', 'a-b'],
    ['aux', '_aux'],
    ['技能1', '技能1'],
  ])('sanitizes %j -> %j', (raw, expected) => {
    expect(sanitizeDownloadBaseName(raw)).toBe(expected);
  });

  it('truncates long names by code point within the limit', () => {
    expect(sanitizeDownloadBaseName('a'.repeat(80))).toBe('a'.repeat(60));
    expect(sanitizeDownloadBaseName('技'.repeat(80))).toBe('技'.repeat(60));
    // emoji 是 surrogate pair，按码点截断不应切出半个字符
    expect(sanitizeDownloadBaseName('😀'.repeat(70))).toBe('😀'.repeat(60));
  });

  it('returns empty string when nothing usable remains', () => {
    expect(sanitizeDownloadBaseName('???')).toBe('');
  });
});

describe('exportNamedDownload', () => {
  it('passes the sanitized resource name with extension to the host download', async () => {
    desktop.save.mockResolvedValueOnce(true);
    await exportNamedDownload('/api/skill/export/1', '我的/技能:名');
    expect(desktop.save).toHaveBeenCalledWith(
      '/api/skill/export/1',
      '我的-技能-名.zip',
    );
    expect(desktop.request).not.toHaveBeenCalled();
  });

  it('keeps the default naming when the resource name is unusable', async () => {
    desktop.save.mockResolvedValueOnce(true);
    await exportNamedDownload('/api/skill/export/1', '???');
    expect(desktop.save).toHaveBeenCalledWith(
      '/api/skill/export/1',
      'export.zip',
    );
  });

  it('supports custom extensions', async () => {
    desktop.save.mockResolvedValueOnce(true);
    await exportNamedDownload('/api/export/1', '报表', 'xlsx');
    expect(desktop.save).toHaveBeenCalledWith('/api/export/1', '报表.xlsx');
  });
});

describe('浏览器命名归档下载', () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();
  let downloads: { href: string; name: string }[];
  const archive = new Blob(['zip bytes'], { type: 'application/zip' });

  beforeEach(() => {
    vi.useFakeTimers();
    downloads = [];
    createObjectURL.mockReset().mockReturnValue('blob:https://nuwax.test/zip');
    revokeObjectURL.mockReset();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push({ href: this.href, name: this.download });
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('响应头仍为数字文件名时，用 Blob 下载保留资源名且不假报落盘成功', async () => {
    desktop.request.mockResolvedValue({
      data: archive,
      headers: {
        'content-type': 'application/zip',
        'content-disposition': 'attachment; filename="project_123.zip"',
      },
    });
    await expect(
      exportNamedDownload('/api/export/123', '项目/名称'),
    ).resolves.toBe(false);
    expect(desktop.request).toHaveBeenCalledWith('/api/export/123', {
      method: 'GET',
      responseType: 'blob',
      getResponse: true,
      skipErrorHandler: true,
    });
    expect(createObjectURL).toHaveBeenCalledWith(archive);
    expect(downloads).toEqual([
      { href: 'blob:https://nuwax.test/zip', name: '项目-名称.zip' },
    ]);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:https://nuwax.test/zip');
  });

  it('业务错误不下载伪归档，错误交调用方消费，随后可以重试', async () => {
    desktop.request
      .mockResolvedValueOnce({
        data: new Blob([
          JSON.stringify({ success: false, message: '导出失败，请重试' }),
        ]),
        headers: { 'content-type': 'application/json' },
      })
      .mockResolvedValueOnce({
        data: archive,
        headers: { 'content-type': 'application/zip' },
      });
    await expect(exportNamedDownload('/export', '会话')).rejects.toThrow(
      '导出失败，请重试',
    );
    expect(downloads).toEqual([]);
    expect(createObjectURL).not.toHaveBeenCalled();
    await expect(exportNamedDownload('/export', '会话')).resolves.toBe(false);
    expect(downloads[0].name).toBe('会话.zip');
  });

  it('请求失败不触发下载', async () => {
    desktop.request.mockRejectedValue(new Error('network offline'));
    await expect(exportNamedDownload('/export', '会话')).rejects.toThrow(
      'network offline',
    );
    expect(downloads).toEqual([]);
  });

  it('无可用资源名称时保留服务端默认命名，不额外读取归档', async () => {
    await expect(exportNamedDownload('/export', '???')).resolves.toBe(false);
    expect(desktop.request).not.toHaveBeenCalled();
    expect(downloads[0].name).toBe('');
    expect(downloads[0].href).toMatch(/\/export$/);
  });

  it('普通 JSON 文件下载继续使用原链接，不把文件正文当业务错误', async () => {
    await expect(
      exportFileViaBrowserDownload('/files/config.json', 'config.json'),
    ).resolves.toBe(false);
    expect(desktop.request).not.toHaveBeenCalled();
    expect(downloads[0].name).toBe('config.json');
    expect(downloads[0].href).toMatch(/\/files\/config.json$/);
  });
});
