import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchContentFromUrl, fetchContentOutcome } from './skill';
const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  assertCurrent: vi.fn(),
  auth: vi.fn(),
  release: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock('umi', () => ({ request: vi.fn() }));
vi.mock('@/utils/exportImportFile', () => ({ apiExportFileBlob: vi.fn() }));
vi.mock('@/features/client-shell/localFileService', () => ({
  prepareLocalFilePreview: mocks.preview,
  assertLocalFileReferenceCurrent: mocks.assertCurrent,
  isLocalPreviewUrl: (s: string) => s.startsWith('nuwax-local://'),
  isAbsoluteFileUrl: (s: string) =>
    /^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//'),
}));
vi.mock('@/utils/businessAuth', () => ({
  getBusinessFileRequestAuth: mocks.auth,
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.preview.mockResolvedValue({
    url: 'nuwax-local://grant/dir/a.md',
    release: mocks.release,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('local text preview fetch', () => {
  it('reads the local protocol without business credentials and releases after the body', async () => {
    mocks.fetch.mockResolvedValue(new Response('文档正文'));
    expect(await fetchContentFromUrl('/api/computer/static/7/dir/a.md')).toBe(
      '文档正文',
    );
    expect(mocks.fetch).toHaveBeenCalledWith(
      'nuwax-local://grant/dir/a.md',
      expect.objectContaining({
        credentials: 'omit',
        headers: { Accept: 'text/plain, application/json, */*' },
      }),
    );
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledOnce();
  });
  it('显式旧本机引用失效时不按静态 URL 重新选择来源', async () => {
    const ref = { cId: '7', contextId: 'old-context', path: 'a.md' };
    mocks.preview.mockRejectedValueOnce(
      Object.assign(new Error('expired'), { code: 'expired' }),
    );
    await expect(
      fetchContentFromUrl('/api/computer/static/7/a.md', ref),
    ).rejects.toMatchObject({ code: 'expired' });
    expect(mocks.preview).toHaveBeenCalledWith(ref);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it.each([
    ['not-found', 'missing'],
    ['permission-denied', 'error'],
    ['expired', 'error'],
  ])('maps native %s to %s without a backend request', async (code, status) => {
    mocks.preview.mockRejectedValueOnce(
      Object.assign(new Error(code), { name: 'LocalFileAccessError', code }),
    );
    expect(await fetchContentOutcome('/api/computer/static/7/a.md')).toEqual({
      status,
    });
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it('preserves text size budgets and closes an oversized body', async () => {
    mocks.fetch.mockResolvedValue(
      new Response('huge', {
        headers: { 'content-length': String(60 * 1024 * 1024) },
      }),
    );
    await expect(
      fetchContentFromUrl('/api/computer/static/7/big.txt'),
    ).rejects.toMatchObject({ name: 'PreviewFileTooLargeError' });
    expect(mocks.release).toHaveBeenCalledOnce();
  });
  it('releases on missing files and on network failure', async () => {
    mocks.fetch.mockResolvedValueOnce(new Response('', { status: 404 }));
    expect(await fetchContentOutcome('/api/computer/static/7/a.md')).toEqual({
      status: 'missing',
    });
    expect(mocks.release).toHaveBeenCalledOnce();
    mocks.fetch.mockRejectedValueOnce(new Error('read failed'));
    await expect(
      fetchContentFromUrl('/api/computer/static/7/a.md'),
    ).rejects.toThrow('read failed');
    expect(mocks.release).toHaveBeenCalledTimes(2);
  });
});
