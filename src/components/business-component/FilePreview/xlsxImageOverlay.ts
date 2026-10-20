import { placeXlsxImage, type XlsxOverlayImage } from './xlsxSheetImages';

interface SpreadsheetData {
  cols?: { getWidth?: (index: number) => number; width?: number };
  rows?: { getHeight?: (index: number) => number; height?: number };
  scroll?: { x?: number; y?: number };
  scrollx?: (...args: unknown[]) => unknown;
  scrolly?: (...args: unknown[]) => unknown;
}

interface XlsxPreviewer {
  sheetIndex?: number;
  xs?: {
    sheet?: { data?: SpreadsheetData };
    bottombar?: { swapFunc?: (...args: unknown[]) => unknown };
  };
}

/**
 * 把图片叠到已经画好的单元格区域上，并跟随切表和滚动。
 * 没有图片时不改表格 DOM。
 */
export function mountXlsxImageOverlay(
  container: HTMLElement,
  previewer: XlsxPreviewer,
  images: XlsxOverlayImage[],
): () => void {
  if (!images.length) return () => undefined;
  const urls = images.map((image) =>
    URL.createObjectURL(
      new Blob([image.bytes.slice().buffer], { type: image.mime }),
    ),
  );
  const layer = document.createElement('div');
  layer.dataset.xlsxImageLayer = 'true';
  layer.style.cssText =
    'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:1;';
  const nodes = images.map((image, index) => {
    const element = document.createElement('img');
    element.src = urls[index];
    element.alt = '';
    element.draggable = false;
    element.style.cssText =
      'position:absolute;display:none;pointer-events:none;user-select:none;';
    layer.appendChild(element);
    return { element, image };
  });

  let hookedData: SpreadsheetData | null = null;
  const sync = () => {
    try {
      const host = container.querySelector('.x-spreadsheet-overlayer-content');
      if (!(host instanceof HTMLElement)) return;
      if (layer.parentElement !== host) host.appendChild(layer);
      const data = previewer.xs?.sheet?.data;
      layer.style.transform = `translate(${-(data?.scroll?.x || 0)}px, ${-(
        data?.scroll?.y || 0
      )}px)`;
      const metrics = {
        getColWidth: (index: number) =>
          data?.cols?.getWidth?.(index) ?? data?.cols?.width ?? 80,
        getRowHeight: (index: number) =>
          data?.rows?.getHeight?.(index) ?? data?.rows?.height ?? 24,
      };
      const sheetIndex = previewer.sheetIndex ?? 0;
      nodes.forEach(({ element, image }) => {
        if (image.sheetIndex !== sheetIndex) {
          element.style.display = 'none';
          return;
        }
        const box = placeXlsxImage(image.anchor, metrics);
        if (!box) {
          element.style.display = 'none';
          return;
        }
        element.style.display = 'block';
        element.style.left = `${box.left}px`;
        element.style.top = `${box.top}px`;
        element.style.width = `${box.width}px`;
        element.style.height = `${box.height}px`;
      });
    } catch (error) {
      console.warn('[FilePreview] 定位 xlsx 图片失败', error);
    }
  };

  const hookScroll = () => {
    const data = previewer.xs?.sheet?.data;
    if (!data || data === hookedData) return;
    hookedData = data;
    (['scrollx', 'scrolly'] as const).forEach((method) => {
      const original = data[method];
      if (typeof original !== 'function') return;
      data[method] = (...args: unknown[]) => {
        const result = original.apply(data, args);
        sync();
        return result;
      };
    });
  };

  const bottombar = previewer.xs?.bottombar;
  const originalSwap = bottombar?.swapFunc;
  if (bottombar && originalSwap) {
    bottombar.swapFunc = (...args: unknown[]) => {
      const result = originalSwap.apply(bottombar, args);
      hookScroll();
      sync();
      return result;
    };
  }
  const sheet = container.querySelector('.x-spreadsheet') ?? container;
  const onScroll = () => sync();
  sheet.addEventListener('wheel', onScroll, { passive: true });
  sheet.addEventListener('mouseup', onScroll);
  hookScroll();
  let attempts = 0;
  const waitForSheet = () => {
    sync();
    attempts += 1;
    if (!layer.isConnected && attempts < 8) requestAnimationFrame(waitForSheet);
  };
  waitForSheet();

  return () => {
    sheet.removeEventListener('wheel', onScroll);
    sheet.removeEventListener('mouseup', onScroll);
    if (bottombar && originalSwap) bottombar.swapFunc = originalSwap;
    layer.remove();
    urls.forEach((url) => URL.revokeObjectURL(url));
  };
}
