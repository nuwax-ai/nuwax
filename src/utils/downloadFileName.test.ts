import { describe, expect, it } from 'vitest';
import { getDownloadFileName } from './downloadFileName';

describe('getDownloadFileName', () => {
  it.each([
    ['attachment; filename="demo.zip"', 'demo.zip'],
    ['attachment; filename=demo.zip; size=42', 'demo.zip'],
    ['attachment; FILENAME = "demo.zip"', 'demo.zip'],
    ['attachment; filename="report; final.zip"', 'report; final.zip'],
    ['attachment; filename="report \\"final\\".zip"', 'report "final".zip'],
    ['attachment; filename="100%ready.zip"', '100%ready.zip'],
    ['attachment; filename="%E6%8A%A5%E5%91%8A.zip"', '报告.zip'],
    ["attachment; filename*=UTF-8''%E6%8A%A5%E5%91%8A.zip", '报告.zip'],
    ["attachment; filename*=utf-8'zh-CN'%E6%8A%A5%E5%91%8A.zip", '报告.zip'],
    [
      "attachment; filename=report.zip; filename*=UTF-8''%E6%8A%A5%E5%91%8A.zip",
      '报告.zip',
    ],
    [
      "attachment; filename*=UTF-8''%E6%8A%A5%E5%91%8A.zip; filename=report.zip",
      '报告.zip',
    ],
    [
      'attachment; description="example; filename=wrong.zip"; filename=demo.zip',
      'demo.zip',
    ],
  ])('parses %s', (header, expected) => {
    expect(getDownloadFileName(header, 'config-123.zip')).toBe(expected);
  });

  it.each([
    "attachment; filename*=UTF-8''bad%ZZ.zip; filename=report.zip",
    "attachment; filename=report.zip; filename*=UTF-8''%E6.zip",
    "attachment; filename*=ISO-8859-1''%E9.zip; filename=report.zip",
    "attachment; filename*=UTF-8''; filename=report.zip",
    'attachment; filename*=report.zip; filename=report.zip',
  ])('falls back to filename for an unusable filename*: %s', (header) => {
    expect(getDownloadFileName(header, 'config-123.zip')).toBe('report.zip');
  });

  it.each([
    undefined,
    '',
    'attachment',
    'attachment; filename=""',
    "attachment; filename*=UTF-8''bad%ZZ.zip",
    'attachment; description="example; filename=wrong.zip"',
  ])('uses the default when no filename is available: %s', (header) => {
    expect(getDownloadFileName(header, 'config-123.zip')).toBe(
      'config-123.zip',
    );
  });
});
