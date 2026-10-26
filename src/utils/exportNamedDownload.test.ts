import { describe, expect, it, vi } from 'vitest';
import {
  exportNamedDownload,
  sanitizeDownloadBaseName,
} from './exportImportFile';

const desktop = vi.hoisted(() => ({
  save: vi.fn(),
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
vi.mock('umi', () => ({ request: vi.fn() }));

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
