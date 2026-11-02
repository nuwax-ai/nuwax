import { afterEach, expect, it, vi } from 'vitest';
import { BundledPdfCMapReaderFactory } from './pdfCharacterMaps';

afterEach(() => vi.unstubAllGlobals());

it('直接解码随包映射，不执行任何网络请求，未知映射明确失败', async () => {
  vi.stubGlobal('NUWAX_PDF_CMAPS', { 'UniGB-UCS2-H': btoa('\0\x80\xff') });
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const factory = new BundledPdfCMapReaderFactory();
  const result = await factory.fetch({ name: 'UniGB-UCS2-H' });
  expect(result.compressionType).toBe(1);
  expect(Array.from(result.cMapData)).toEqual([0, 128, 255]);
  await expect(factory.fetch({ name: 'missing' })).rejects.toThrow(
    'Unknown PDF',
  );
  await expect(factory.fetch({ name: 'constructor' })).rejects.toThrow(
    'Unknown PDF',
  );
  expect(fetch).not.toHaveBeenCalled();
});
