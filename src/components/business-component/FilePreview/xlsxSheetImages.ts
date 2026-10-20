import JSZip from 'jszip';

/** 12700 EMU = 1 磅。表格组件把磅值直接当成 CSS 像素。 */
const EMU_PER_POINT = 12700;
/** exceljs 把锚点宽高换成 96dpi 像素，表格内部再用 96/72 折回磅。 */
const PIXELS_PER_POINT = 96 / 72;

const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

/** 插件画布能直接解码、且字节没有被截断时，不再叠第二份。 */
const CANVAS_EXTENSIONS = new Set(['png', 'jpeg', 'gif', 'webp', 'bmp']);

export interface XlsxImageAnchor {
  fromCol: number;
  fromColOff: number;
  fromRow: number;
  fromRowOff: number;
  toCol?: number;
  toColOff?: number;
  toRow?: number;
  toRowOff?: number;
  extCx?: number;
  extCy?: number;
  extWidthPx?: number;
  extHeightPx?: number;
}

export interface XlsxOverlayImage {
  sheetIndex: number;
  anchor: XlsxImageAnchor;
  mime: string;
  bytes: Uint8Array;
}

export interface XlsxGridMetrics {
  getColWidth: (index: number) => number;
  getRowHeight: (index: number) => number;
}

interface PreviewMedia {
  buffer?: unknown;
  extension?: string;
}

interface PreviewSheetImage {
  type?: string;
  imageId?: number;
  range?: {
    tl?: AnchorPoint;
    br?: AnchorPoint;
    ext?: { width?: number; height?: number };
  };
}

interface AnchorPoint {
  nativeCol?: number;
  nativeColOff?: number;
  nativeRow?: number;
  nativeRowOff?: number;
  model?: AnchorPoint;
}

interface XlsxPreviewerData {
  mediasSource?: PreviewMedia[];
  workbookDataSource?: Array<{
    _media?: PreviewSheetImage[];
  }>;
}

function normalizeExtension(extension: string | undefined): string {
  return extension?.toLowerCase().replace(/^\./, '') || '';
}
function copyArrayBuffer(source: unknown): ArrayBuffer | null {
  if (source instanceof ArrayBuffer) return source.slice(0);
  if (ArrayBuffer.isView(source)) {
    return source.buffer.slice(
      source.byteOffset,
      source.byteOffset + source.byteLength,
    );
  }
  return null;
}
function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, 'text/xml');
}
function directChild(parent: Element, name: string): Element | null {
  return (
    Array.from(parent.children).find((element) => element.localName === name) ??
    null
  );
}
function parseCellRef(ref: string): { col: number; row: number } | null {
  const match = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!match) return null;
  let col = 0;
  for (const char of match[1]) col = col * 26 + (char.charCodeAt(0) - 64);
  const row = Number(match[2]);
  if (!(col > 0) || !(row > 0)) return null;
  return { col: col - 1, row: row - 1 };
}
function relsPathFor(partPath: string): string {
  const segments = partPath.split('/');
  const fileName = segments.pop() || '';
  return [...segments, '_rels', `${fileName}.rels`].join('/');
}
function resolveZipPath(baseFile: string, target: string): string {
  let normalized = target.replace(/\\/g, '/');
  try {
    normalized = decodeURIComponent(normalized);
  } catch (error) {
    /* 非法转义保持原样 */
  }
  if (/^[a-z]+:/i.test(normalized)) return normalized;
  if (normalized.startsWith('/')) return normalized.slice(1);
  const segments = baseFile.split('/').slice(0, -1);
  normalized.split('/').forEach((segment) => {
    if (segment === '..') segments.pop();
    else if (segment && segment !== '.') segments.push(segment);
  });
  return segments.join('/');
}
function findZipPath(zip: JSZip, pattern: RegExp): string | null {
  return Object.keys(zip.files).find((name) => pattern.test(name)) ?? null;
}
async function readText(zip: JSZip, path: string): Promise<string | null> {
  const file = zip.file(path);
  return file ? file.async('string') : null;
}
function mediaView(buffer: unknown): Uint8Array | null {
  if (buffer instanceof Uint8Array) return buffer;
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  if (
    buffer &&
    typeof buffer === 'object' &&
    'buffer' in buffer &&
    (buffer as ArrayBufferView).buffer instanceof ArrayBuffer &&
    typeof (buffer as ArrayBufferView).byteLength === 'number'
  ) {
    const view = buffer as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  return null;
}
function anchorOrigin(
  col: number,
  colOff: number,
  row: number,
  rowOff: number,
  metrics: XlsxGridMetrics,
): { x: number; y: number } {
  let x = 0;
  for (let index = 0; index < col; index += 1) x += metrics.getColWidth(index);
  let y = 0;
  for (let index = 0; index < row; index += 1) {
    y += metrics.getRowHeight(index);
  }
  return { x: x + colOff / EMU_PER_POINT, y: y + rowOff / EMU_PER_POINT };
}
function readRelationships(
  xml: string,
): Array<{ id: string; type: string; target: string }> {
  return Array.from(parseXml(xml).getElementsByTagName('*'))
    .filter((element) => element.localName === 'Relationship')
    .map((element) => ({
      id: element.getAttribute('Id') || '',
      type: element.getAttribute('Type') || '',
      target: element.getAttribute('Target') || '',
    }))
    .filter((item) => item.id && item.target);
}
function readEmbedId(anchorElement: Element): string | null {
  const blip = Array.from(anchorElement.getElementsByTagName('*')).find(
    (element) => element.localName === 'blip',
  );
  return (
    Array.from(blip?.attributes ?? []).find(
      (attribute) => attribute.localName === 'embed',
    )?.value ?? null
  );
}
function readAnchorPoint(node: Element | null): {
  col: number;
  colOff: number;
  row: number;
  rowOff: number;
} | null {
  if (!node) return null;
  const value = (name: string) =>
    Number(directChild(node, name)?.textContent || 0) || 0;
  return {
    col: value('col'),
    colOff: value('colOff'),
    row: value('row'),
    rowOff: value('rowOff'),
  };
}
function readEmuExtension(
  anchorElement: Element,
): { extCx: number; extCy: number } | null {
  const extension = directChild(anchorElement, 'ext');
  const extCx = Number(extension?.getAttribute('cx') || 0) || 0;
  const extCy = Number(extension?.getAttribute('cy') || 0) || 0;
  if (!(extCx > 0) || !(extCy > 0)) return null;
  return { extCx, extCy };
}
function readDrawingAnchor(anchorElement: Element): XlsxImageAnchor | null {
  if (anchorElement.localName === 'absoluteAnchor') {
    const position = directChild(anchorElement, 'pos');
    const extension = readEmuExtension(anchorElement);
    if (!extension) return null;
    return {
      fromCol: 0,
      fromColOff: Number(position?.getAttribute('x') || 0) || 0,
      fromRow: 0,
      fromRowOff: Number(position?.getAttribute('y') || 0) || 0,
      ...extension,
    };
  }
  const from = readAnchorPoint(directChild(anchorElement, 'from'));
  if (!from) return null;
  const anchor: XlsxImageAnchor = {
    fromCol: from.col,
    fromColOff: from.colOff,
    fromRow: from.row,
    fromRowOff: from.rowOff,
  };
  const to = readAnchorPoint(directChild(anchorElement, 'to'));
  if (to) {
    return {
      ...anchor,
      toCol: to.col,
      toColOff: to.colOff,
      toRow: to.row,
      toRowOff: to.rowOff,
    };
  }
  return { ...anchor, ...readEmuExtension(anchorElement) };
}
function anchorNumbers(
  point: AnchorPoint | undefined,
): { col: number; colOff: number; row: number; rowOff: number } | null {
  if (!point) return null;
  const model = point.model || point;
  return {
    col: Number(model.nativeCol) || 0,
    colOff: Number(model.nativeColOff) || 0,
    row: Number(model.nativeRow) || 0,
    rowOff: Number(model.nativeRowOff) || 0,
  };
}
function anchorFromRange(
  range: NonNullable<PreviewSheetImage['range']>,
): XlsxImageAnchor | null {
  const from = anchorNumbers(range.tl);
  if (!from) return null;
  const anchor: XlsxImageAnchor = {
    fromCol: from.col,
    fromColOff: from.colOff,
    fromRow: from.row,
    fromRowOff: from.rowOff,
  };
  const to = anchorNumbers(range.br);
  if (to) {
    anchor.toCol = to.col;
    anchor.toColOff = to.colOff;
    anchor.toRow = to.row;
    anchor.toRowOff = to.rowOff;
    return anchor;
  }
  const width = Number(range.ext?.width) || 0;
  const height = Number(range.ext?.height) || 0;
  if (width > 0 && height > 0) {
    anchor.extWidthPx = width;
    anchor.extHeightPx = height;
  }
  return anchor;
}
function canvasCanDraw(media: PreviewMedia | undefined): boolean {
  const extension = normalizeExtension(media?.extension);
  const raw = media?.buffer;
  if (
    !extension ||
    !CANVAS_EXTENSIONS.has(extension) ||
    !ArrayBuffer.isView(raw)
  ) {
    return false;
  }
  // 插件用 buffer.buffer 做 Blob。只有视图刚好占满自己的 ArrayBuffer 时才能画出图。
  return raw.byteOffset === 0 && raw.buffer.byteLength === raw.byteLength;
}
function mediaBytes(
  media: PreviewMedia | undefined,
): { mime: string; bytes: Uint8Array } | null {
  const mime = IMAGE_MIME[normalizeExtension(media?.extension)];
  const view = mediaView(media?.buffer);
  if (!mime || !view?.byteLength) return null;
  return { mime, bytes: new Uint8Array(view) };
}
async function readImageFile(
  zip: JSZip,
  path: string,
): Promise<{ mime: string; bytes: Uint8Array } | null> {
  const mime = IMAGE_MIME[normalizeExtension(path.split('.').pop())];
  const file = zip.file(path);
  if (!mime || !file) return null;
  const bytes = (await file.async('uint8array')).slice();
  return bytes.byteLength ? { mime, bytes } : null;
}
function readCellImageNames(xml: string): Map<string, string> {
  const names = new Map<string, string>();
  Array.from(parseXml(xml).getElementsByTagName('*'))
    .filter((element) => element.localName === 'pic')
    .forEach((pic) => {
      const name = Array.from(pic.getElementsByTagName('*'))
        .find((element) => element.localName === 'cNvPr')
        ?.getAttribute('name');
      const embedId = readEmbedId(pic);
      if (name && embedId) names.set(name, embedId);
    });
  return names;
}
function readMergeRanges(sheetXml: string): Array<{
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
}> {
  return Array.from(sheetXml.matchAll(/\bref="([A-Z]+\d+):([A-Z]+\d+)"/g))
    .map((match) => {
      const from = parseCellRef(match[1]);
      const to = parseCellRef(match[2]);
      if (!from || !to) return null;
      return {
        fromCol: from.col,
        fromRow: from.row,
        toCol: to.col + 1,
        toRow: to.row + 1,
      };
    })
    .filter((merge): merge is NonNullable<typeof merge> => Boolean(merge));
}
function readSheetTargets(workbookXml: string, relsXml: string): string[] {
  const rels = new Map(
    readRelationships(relsXml).map((item) => [item.id, item.target]),
  );
  return Array.from(parseXml(workbookXml).getElementsByTagName('*'))
    .filter((element) => element.localName === 'sheet')
    .map((sheet) => {
      const id = Array.from(sheet.attributes).find(
        (attribute) => attribute.localName === 'id',
      )?.value;
      return id ? rels.get(id) : undefined;
    })
    .filter(
      (target): target is string =>
        Boolean(target) && /worksheets\//i.test(target),
    );
}
async function removeDrawingParts(zip: JSZip): Promise<boolean> {
  const names = Object.keys(zip.files);
  let changed = false;
  await Promise.all(
    names.map(async (name) => {
      const lower = name.toLowerCase();
      const file = zip.file(name);
      const readsWorksheet = /^xl\/worksheets\/[^/]+\.xml$/i.test(lower);
      const readsSheetRels = /^xl\/worksheets\/_rels\/.+\.rels$/i.test(lower);
      const readsContentTypes = lower.endsWith('[content_types].xml');
      if (
        !file ||
        file.dir ||
        (!readsWorksheet && !readsSheetRels && !readsContentTypes)
      ) {
        return;
      }
      const xml = await file.async('string');
      let next = xml;
      if (lower.endsWith('[content_types].xml')) {
        next = xml.replace(/<Override\b[^>]*\/>/g, (tag) =>
          /PartName="\/xl\/drawings\//i.test(tag) ? '' : tag,
        );
      } else if (/^xl\/worksheets\/_rels\/.+\.rels$/i.test(lower)) {
        next = xml.replace(/<Relationship\b[^>]*\/>/g, (tag) =>
          /\/(?:drawing|vmlDrawing)"/.test(tag) ? '' : tag,
        );
      } else if (/^xl\/worksheets\/[^/]+\.xml$/i.test(lower)) {
        next = xml
          .replace(/<[\w:-]*drawing\b[^>]*\/>/gi, '')
          .replace(/<[\w:-]*drawing\b[^>]*>[\s\S]*?<\/[\w:-]*drawing>/gi, '');
      }
      if (next !== xml) {
        zip.file(name, next);
        changed = true;
      }
    }),
  );
  names.forEach((name) => {
    if (/^xl\/drawings\//i.test(name) && zip.file(name)) {
      zip.remove(name);
      changed = true;
    }
  });
  return changed;
}
async function readDrawingImages(
  zip: JSZip,
  sheetPath: string,
  sheetRels: string,
  sheetIndex: number,
): Promise<XlsxOverlayImage[]> {
  const images: XlsxOverlayImage[] = [];
  for (const relation of readRelationships(sheetRels)) {
    if (!relation.type.endsWith('/drawing')) continue;
    const drawingPath = resolveZipPath(sheetPath, relation.target);
    const drawingXml = await readText(zip, drawingPath);
    const drawingRels = await readText(zip, relsPathFor(drawingPath));
    if (!drawingXml || !drawingRels) continue;
    const mediaById = new Map(
      readRelationships(drawingRels).map((item) => [item.id, item.target]),
    );
    const anchors = Array.from(
      parseXml(drawingXml).getElementsByTagName('*'),
    ).filter((element) =>
      ['twoCellAnchor', 'oneCellAnchor', 'absoluteAnchor'].includes(
        element.localName,
      ),
    );
    for (const anchorElement of anchors) {
      const embedId = readEmbedId(anchorElement);
      const target = embedId ? mediaById.get(embedId) : undefined;
      if (!target) continue;
      const loaded = await readImageFile(
        zip,
        resolveZipPath(drawingPath, target),
      );
      const anchor = readDrawingAnchor(anchorElement);
      if (!loaded || !anchor) continue;
      images.push({ sheetIndex, anchor, ...loaded });
    }
  }
  return images;
}
async function readCellImages(
  zip: JSZip,
  sheetXml: string,
  sheetIndex: number,
): Promise<XlsxOverlayImage[]> {
  if (!sheetXml.includes('DISPIMG')) return [];
  const cellImagePath = findZipPath(zip, /^xl\/cellimages\.xml$/i);
  if (!cellImagePath) return [];
  const cellImageXml = await readText(zip, cellImagePath);
  const cellImageRels = await readText(zip, relsPathFor(cellImagePath));
  if (!cellImageXml || !cellImageRels) return [];
  const mediaById = new Map(
    readRelationships(cellImageRels).map((item) => [item.id, item.target]),
  );
  const imageIdByName = readCellImageNames(cellImageXml);
  const merges = readMergeRanges(sheetXml);
  const images: XlsxOverlayImage[] = [];
  for (const match of sheetXml.matchAll(
    /<c\b[^>]*\br="([A-Z]+\d+)"[^>]*>([\s\S]*?)<\/c>/g,
  )) {
    const formula = match[2].match(/DISPIMG\(\s*["']([^"']+)["']/);
    const embedId = formula ? imageIdByName.get(formula[1]) : undefined;
    const target = embedId ? mediaById.get(embedId) : undefined;
    const origin = parseCellRef(match[1]);
    if (!formula || !target || !origin) continue;
    const loaded = await readImageFile(
      zip,
      resolveZipPath(cellImagePath, target),
    );
    if (!loaded) continue;
    const span = merges.find(
      (merge) => merge.fromCol === origin.col && merge.fromRow === origin.row,
    ) ?? { toCol: origin.col + 1, toRow: origin.row + 1 };
    images.push({
      sheetIndex,
      ...loaded,
      anchor: {
        fromCol: origin.col,
        fromColOff: 0,
        fromRow: origin.row,
        fromRowOff: 0,
        toCol: span.toCol,
        toColOff: 0,
        toRow: span.toRow,
        toRowOff: 0,
      },
    });
  }
  return images;
}
async function readImages(
  zip: JSZip,
  options: { includeDrawings: boolean; includeCellImages: boolean },
): Promise<XlsxOverlayImage[]> {
  const workbookPath = findZipPath(zip, /^xl\/workbook\.xml$/i);
  if (!workbookPath) return [];
  const workbookXml = await readText(zip, workbookPath);
  const workbookRels = await readText(zip, relsPathFor(workbookPath));
  if (!workbookXml || !workbookRels) return [];
  const images: XlsxOverlayImage[] = [];
  const sheetTargets = readSheetTargets(workbookXml, workbookRels);
  for (let sheetIndex = 0; sheetIndex < sheetTargets.length; sheetIndex += 1) {
    const sheetPath = resolveZipPath(workbookPath, sheetTargets[sheetIndex]);
    if (options.includeDrawings) {
      const sheetRels = await readText(zip, relsPathFor(sheetPath));
      if (sheetRels) {
        images.push(
          ...(await readDrawingImages(zip, sheetPath, sheetRels, sheetIndex)),
        );
      }
    }
    if (options.includeCellImages) {
      const sheetXml = await readText(zip, sheetPath);
      if (sheetXml) {
        images.push(...(await readCellImages(zip, sheetXml, sheetIndex)));
      }
    }
  }
  return images;
}

/**
 * 插件已经登记过的图片不再从压缩包重读，避免和画布上的图叠两份。
 */
export function previewerHasSheetImages(
  previewer: XlsxPreviewerData | null | undefined,
): boolean {
  try {
    return (previewer?.workbookDataSource || []).some((sheet) =>
      (sheet?._media || []).some(
        (item) => item?.type === 'image' && item.range,
      ),
    );
  } catch (error) {
    return false;
  }
}
export function imagesFromPreviewer(
  previewer: XlsxPreviewerData | null | undefined,
): XlsxOverlayImage[] {
  try {
    const sheets = previewer?.workbookDataSource;
    const medias = previewer?.mediasSource;
    if (!Array.isArray(sheets) || !Array.isArray(medias)) return [];
    const images: XlsxOverlayImage[] = [];
    sheets.forEach((sheet, sheetIndex) => {
      (sheet?._media || []).forEach((item) => {
        if (item?.type !== 'image' || !item.range) return;
        const media = medias[item.imageId ?? -1];
        if (canvasCanDraw(media)) return;
        const loaded = mediaBytes(media);
        const anchor = anchorFromRange(item.range);
        if (!loaded || !anchor) return;
        images.push({ sheetIndex, anchor, ...loaded });
      });
    });
    return images;
  } catch (error) {
    console.warn('[FilePreview] 读取表格图片失败', error);
    return [];
  }
}

/**
 * 只读解析浮动图片和 WPS 单元格图片。解析失败时返回空数组。
 * includeDrawings 为 false 时只补单元格图片，避免和插件结果重复。
 */
export async function extractXlsxImages(
  source: unknown,
  options: { includeDrawings?: boolean } = {},
): Promise<XlsxOverlayImage[]> {
  const buffer = copyArrayBuffer(source);
  if (!buffer) return [];
  try {
    const zip = await JSZip.loadAsync(buffer);
    const names = Object.keys(zip.files);
    const hasDrawings = names.some((name) => /^xl\/drawings\//i.test(name));
    const hasCellImages = names.some((name) =>
      /^xl\/cellimages\.xml$/i.test(name),
    );
    if (!hasCellImages && !(options.includeDrawings !== false && hasDrawings)) {
      return [];
    }
    return await readImages(zip, {
      includeDrawings: options.includeDrawings !== false && hasDrawings,
      includeCellImages: hasCellImages,
    });
  } catch (error) {
    console.warn('[FilePreview] 解析 xlsx 图片失败', error);
    return [];
  }
}

/**
 * 原文件预览失败时，去掉绘图部件再交给插件。
 * 没有绘图时返回 null，调用方必须继续使用原文件。
 */
export async function omitXlsxDrawings(
  source: unknown,
): Promise<ArrayBuffer | null> {
  const buffer = copyArrayBuffer(source);
  if (!buffer) return null;
  try {
    const zip = await JSZip.loadAsync(buffer);
    const removed = await removeDrawingParts(zip);
    if (!removed) return null;
    return zip.generateAsync({ type: 'arraybuffer' });
  } catch (error) {
    console.warn('[FilePreview] 去除 xlsx 绘图失败', error);
    return null;
  }
}

/** 把锚点换成当前表格列宽、行高下的像素框。 */
export function placeXlsxImage(
  anchor: XlsxImageAnchor,
  metrics: XlsxGridMetrics,
): { left: number; top: number; width: number; height: number } | null {
  const origin = anchorOrigin(
    anchor.fromCol,
    anchor.fromColOff,
    anchor.fromRow,
    anchor.fromRowOff,
    metrics,
  );
  let width = 0;
  let height = 0;
  if (anchor.toCol !== undefined && anchor.toRow !== undefined) {
    const end = anchorOrigin(
      anchor.toCol,
      anchor.toColOff ?? 0,
      anchor.toRow,
      anchor.toRowOff ?? 0,
      metrics,
    );
    width = end.x - origin.x;
    height = end.y - origin.y;
  } else if (anchor.extCx && anchor.extCy) {
    width = anchor.extCx / EMU_PER_POINT;
    height = anchor.extCy / EMU_PER_POINT;
  } else if (anchor.extWidthPx && anchor.extHeightPx) {
    width = anchor.extWidthPx / PIXELS_PER_POINT;
    height = anchor.extHeightPx / PIXELS_PER_POINT;
  }
  if (!(width > 0) || !(height > 0)) return null;
  return { left: origin.x, top: origin.y, width, height };
}
