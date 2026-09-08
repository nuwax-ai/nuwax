import {
  I18N_KEY_REGEX,
  MIN_EN_I18N_MAP,
  MIN_ZH_I18N_MAP,
} from '@/constants/i18n.constants';
import {
  buildFilePathPreviewUrl,
  loadFilePathPreview,
} from '@/services/filePathPreview';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/constants/home.constants', () => ({ ACCESS_TOKEN: 'ACCESS_TOKEN' }));

describe('按路径预览真实文件请求', () => {
  it('入口与数据源文案符合真实运行时键规范，双语兜底存在', () => {
    for (const key of [
      'PC.Components.PathPreview.open',
      'PC.Components.PathPreview.error.missing',
      'PC.Components.LocalFiles.workspaceLabel',
    ]) {
      expect(I18N_KEY_REGEX.test(key)).toBe(true);
      expect(MIN_EN_I18N_MAP[key]).toBeTruthy();
      expect(MIN_ZH_I18N_MAP[key]).toBeTruthy();
    }
  });
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('隐藏路径、中文、空格、问号、井号、百分号逐段编码；本地根作为单独参数', () => {
    expect(
      buildFilePathPreviewUrl({
        conversationId: 12,
        path: '.config/说明 #%?.txt',
        customTargetDir: 'C:\\User Files\\项目',
      }),
    ).toBe(
      '/api/computer/static/12/.config/%E8%AF%B4%E6%98%8E%20%23%25%3F.txt?customTargetDir=C%3A%5CUser%20Files%5C%E9%A1%B9%E7%9B%AE',
    );
    expect(
      buildFilePathPreviewUrl({ conversationId: 12, path: 'docs\\demo.md' }),
    ).toBe('/api/computer/static/12/docs/demo.md');
  });

  it.each([
    '',
    '/tmp/demo',
    'C:\\tmp\\demo',
    'https://example.org/file',
    '../file',
    'foo/../file',
    'foo/',
    'foo\u0000bar',
  ])('非法输入 %s 不发请求', async (path) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      loadFilePathPreview(
        { conversationId: 12, path },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ reason: 'path' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('空文件有效；请求带登录态、signal、no-store，不请求文件列表', async () => {
    localStorage.setItem('ACCESS_TOKEN', 'test-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob([], { type: 'text/plain' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal;
    const file = await loadFilePathPreview(
      { conversationId: 12, path: '.gitignore' },
      signal,
    );
    expect(file.name).toBe('.gitignore');
    expect(file.size).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/computer/static/12/.gitignore'),
      {
        cache: 'no-store',
        signal,
        headers: { Authorization: 'Bearer test-token' },
      },
    );
  });

  it.each([
    [404, 'missing'],
    [403, 'denied'],
    [401, 'denied'],
    [500, 'load'],
  ])('HTTP %s 明确失败而不是展示错误页', async (status, reason) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(
      loadFilePathPreview(
        { conversationId: 12, path: 'file.txt' },
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ reason });
  });
});
