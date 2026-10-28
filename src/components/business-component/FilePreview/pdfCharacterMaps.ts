// 由构建配置内联完整映射，首次预览不依赖外网请求或浏览器缓存。
declare const NUWAX_PDF_CMAPS: Record<string, string>;

export class BundledPdfCMapReaderFactory {
  async fetch({ name }: { name: string }) {
    if (!Object.prototype.hasOwnProperty.call(NUWAX_PDF_CMAPS, name))
      throw new Error(`Unknown PDF character map: ${name}`);
    const binary = atob(NUWAX_PDF_CMAPS[name]);
    return {
      cMapData: Uint8Array.from(binary, (character) => character.charCodeAt(0)),
      compressionType: 1,
    };
  }
}

export const bundledPdfResources = {
  CMapReaderFactory: BundledPdfCMapReaderFactory,
  // 映射由主线程的本地工厂提供，worker 不另行请求默认 CDN。
  useWorkerFetch: false,
};
