import JSZip from 'jszip';

export type PptxPackageErrorCode =
  | 'invalid'
  | 'legacy'
  | 'damaged'
  | 'tooLarge';

export class PptxPackageError extends Error {
  readonly code: PptxPackageErrorCode;

  constructor(code: PptxPackageErrorCode, message: string) {
    super(message);
    this.name = 'PptxPackageError';
    this.code = code;
  }
}

export interface PptxPackageLimits {
  maxCompressedBytes: number;
  maxUncompressedBytes: number;
  maxEntries: number;
}

export const DEFAULT_PPTX_PACKAGE_LIMITS: Readonly<PptxPackageLimits> =
  Object.freeze({
    maxCompressedBytes: 50 * 1024 * 1024,
    maxUncompressedBytes: 200 * 1024 * 1024,
    maxEntries: 10_000,
  });

export interface PptxPreparationOptions {
  signal?: AbortSignal;
  limits?: Partial<PptxPackageLimits>;
}

export interface PreparedPptxPackage {
  buffer: ArrayBuffer;
  slidePaths: string[];
  repairedParts: string[];
}

interface ZipEntryInfo {
  path: string;
  uncompressedSize: number;
  crc32: number;
  directory: boolean;
}

interface ZipInspection {
  entries: ZipEntryInfo[];
  readBuffer: ArrayBuffer;
  comment: Uint8Array;
}

interface PackageRelationship {
  id: string;
  type: string;
  target?: string;
}

// JSZip 3.10.1 的声明遗漏了这个公开的浏览器流式接口。
// https://stuk.github.io/jszip/documentation/api_zipobject/internal_stream.html
interface StreamingZipEntry extends JSZip.JSZipObject {
  internalStream(type: 'uint8array'): JSZip.JSZipStreamHelper<Uint8Array>;
}

const CONTENT_TYPES_NS =
  'http://schemas.openxmlformats.org/package/2006/content-types';
const PACKAGE_RELATIONSHIPS_NS =
  'http://schemas.openxmlformats.org/package/2006/relationships';
const PRESENTATION_NAMESPACES = new Set([
  'http://schemas.openxmlformats.org/presentationml/2006/main',
  'http://purl.oclc.org/ooxml/presentationml/main',
]);
const OFFICE_RELATIONSHIP_NAMESPACES = [
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  'http://purl.oclc.org/ooxml/officeDocument/relationships',
];
const SLIDE_MASTER_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml';
const PRESENTATION_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml';
const PRESENTATION_PATH = 'ppt/presentation.xml';
const CONTENT_TYPES_PATH = '[Content_Types].xml';

function damaged(message: string): never {
  throw new PptxPackageError('damaged', message);
}

function unsupported(message: string): never {
  throw new PptxPackageError('invalid', message);
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('预览已取消', 'AbortError');
  }
}

function getLimits(options?: PptxPreparationOptions): PptxPackageLimits {
  const limits = { ...DEFAULT_PPTX_PACKAGE_LIMITS, ...options?.limits };
  for (const value of Object.values(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new RangeError('PPTX 资源预算必须是正整数');
    }
  }
  return limits;
}

function decodeUtf8(bytes: Uint8Array, description: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    damaged(`${description}不是有效的 UTF-8 内容`);
  }
}

function validateZipPath(path: string): void {
  const segments = path.replace(/\/$/, '').split('/');
  if (
    path === '' ||
    path.startsWith('/') ||
    /[\\\u0000-\u001f:]/.test(path) ||
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..',
    )
  ) {
    damaged(`ZIP 中存在不安全的条目路径：${path}`);
  }
}

const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return crc >>> 0;
});

function updateCrc32(initialCrc: number, bytes: Uint8Array): number {
  let crc = initialCrc;
  for (const value of bytes) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ value) & 0xff];
  }
  return crc;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  crc = updateCrc32(crc, bytes);
  return (crc ^ 0xffffffff) >>> 0;
}

/** 中央目录预检在 JSZip 读取前完成；不使用 JSZip 的压缩对象等内部字段。 */
function inspectZip(
  buffer: ArrayBuffer,
  limits: PptxPackageLimits,
): ZipInspection {
  const bytes = new Uint8Array(buffer);
  if (
    bytes.length >= 8 &&
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every(
      (value, index) => bytes[index] === value,
    )
  ) {
    throw new PptxPackageError('legacy', '旧版 PPT 需要先转换为 PPTX');
  }
  if (buffer.byteLength > limits.maxCompressedBytes) {
    throw new PptxPackageError('tooLarge', 'PPTX 文件超过压缩大小预算');
  }
  const view = new DataView(buffer);
  if (
    bytes.length < 4 ||
    ![0x04034b50, 0x06054b50].includes(view.getUint32(0, true))
  ) {
    unsupported('文件不是可识别的 PPTX ZIP 包');
  }

  // 注释内也可以出现 EOCD 签名，必须同时验证注释长度和中央目录边界。
  let endOffset = -1;
  let unsupportedEnd: 'ZIP64' | '分卷 ZIP' | undefined;
  const searchStart = Math.max(0, bytes.length - 22 - 0xffff);
  for (let offset = bytes.length - 22; offset >= searchStart; offset -= 1) {
    if (
      view.getUint32(offset, true) === 0x06054b50 &&
      offset + 22 + view.getUint16(offset + 20, true) === bytes.length
    ) {
      const size = view.getUint32(offset + 12, true);
      const start = view.getUint32(offset + 16, true);
      const count = view.getUint16(offset + 10, true);
      if (
        count === 0xffff ||
        view.getUint16(offset + 8, true) === 0xffff ||
        size === 0xffffffff ||
        start === 0xffffffff ||
        (offset >= 20 && view.getUint32(offset - 20, true) === 0x07064b50)
      ) {
        unsupportedEnd = 'ZIP64';
        continue;
      }
      if (
        view.getUint16(offset + 4, true) !== 0 ||
        view.getUint16(offset + 6, true) !== 0
      ) {
        unsupportedEnd = '分卷 ZIP';
        continue;
      }
      if (
        start + size === offset &&
        (count === 0
          ? start === 0 && size === 0
          : start + 46 <= offset && view.getUint32(start, true) === 0x02014b50)
      ) {
        endOffset = offset;
        break;
      }
    }
  }
  if (endOffset < 0) {
    if (unsupportedEnd) unsupported(`暂不支持 ${unsupportedEnd} 格式的 PPTX`);
    damaged('ZIP 中央目录缺失或边界不完整');
  }
  const disk = view.getUint16(endOffset + 4, true);
  const directoryDisk = view.getUint16(endOffset + 6, true);
  const diskEntries = view.getUint16(endOffset + 8, true);
  const declaredEntries = view.getUint16(endOffset + 10, true);
  const directorySize = view.getUint32(endOffset + 12, true);
  const directoryOffset = view.getUint32(endOffset + 16, true);
  if (
    declaredEntries === 0xffff ||
    diskEntries === 0xffff ||
    directorySize === 0xffffffff ||
    directoryOffset === 0xffffffff ||
    (endOffset >= 20 && view.getUint32(endOffset - 20, true) === 0x07064b50)
  ) {
    unsupported('暂不支持 ZIP64 格式的 PPTX');
  }
  if (disk !== 0 || directoryDisk !== 0 || diskEntries !== declaredEntries) {
    unsupported('暂不支持分卷 ZIP 格式的 PPTX');
  }
  if (declaredEntries > limits.maxEntries) {
    throw new PptxPackageError('tooLarge', 'PPTX ZIP 条目数超过预算');
  }

  const entries: ZipEntryInfo[] = [];
  const paths = new Set<string>();
  let cursor = directoryOffset;
  let totalSize = 0;
  while (cursor < endOffset) {
    if (
      cursor + 46 > endOffset ||
      view.getUint32(cursor, true) !== 0x02014b50
    ) {
      damaged('ZIP 中央目录条目损坏');
    }
    if (entries.length >= limits.maxEntries) {
      throw new PptxPackageError('tooLarge', 'PPTX ZIP 条目数超过预算');
    }
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const entryDisk = view.getUint16(cursor + 34, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const next = cursor + 46 + nameLength + extraLength + commentLength;
    if (next > endOffset || nameLength === 0) damaged('ZIP 条目边界不完整');
    if (entryDisk !== 0) unsupported('暂不支持分卷 ZIP 格式的 PPTX');
    if (
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localOffset === 0xffffffff
    ) {
      unsupported('暂不支持 ZIP64 格式的 PPTX');
    }
    if (flags & (0x0001 | 0x0040 | 0x2000)) {
      unsupported('暂不支持加密 ZIP 格式的 PPTX');
    }
    if (method !== 0 && method !== 8) {
      unsupported('PPTX 使用了不支持的 ZIP 压缩方式');
    }
    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    let path = decodeUtf8(nameBytes, 'ZIP 条目名');
    validateZipPath(path);
    let extraCursor = cursor + 46 + nameLength;
    const extraEnd = extraCursor + extraLength;
    while (extraCursor < extraEnd) {
      if (extraCursor + 4 > extraEnd) damaged('ZIP 扩展字段损坏');
      const id = view.getUint16(extraCursor, true);
      const size = view.getUint16(extraCursor + 2, true);
      const valueStart = extraCursor + 4;
      if (valueStart + size > extraEnd) damaged('ZIP 扩展字段越界');
      if (id === 0x0001) unsupported('暂不支持 ZIP64 格式的 PPTX');
      if (
        id === 0x7075 &&
        !(flags & 0x0800) &&
        size >= 5 &&
        bytes[valueStart] === 1 &&
        view.getUint32(valueStart + 1, true) === crc32(nameBytes)
      ) {
        path = decodeUtf8(
          bytes.subarray(valueStart + 5, valueStart + size),
          'ZIP Unicode 条目名',
        );
        validateZipPath(path);
      }
      extraCursor = valueStart + size;
    }
    if (paths.has(path)) damaged(`ZIP 存在重复条目：${path}`);
    paths.add(path);
    totalSize += uncompressedSize;
    if (totalSize > limits.maxUncompressedBytes) {
      throw new PptxPackageError('tooLarge', 'PPTX 总解压大小超过预算');
    }
    if (
      localOffset + 30 > directoryOffset ||
      view.getUint32(localOffset, true) !== 0x04034b50
    ) {
      damaged(`ZIP 本地文件头损坏：${path}`);
    }
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    if (
      dataStart + compressedSize > directoryOffset ||
      localNameLength !== nameLength ||
      nameBytes.some(
        (value, index) => value !== bytes[localOffset + 30 + index],
      ) ||
      view.getUint16(localOffset + 6, true) !== flags ||
      view.getUint16(localOffset + 8, true) !== method
    ) {
      damaged(`ZIP 本地文件头与中央目录不一致：${path}`);
    }
    const directory = path.endsWith('/');
    if (directory && uncompressedSize !== 0)
      damaged(`ZIP 目录条目包含文件内容：${path}`);
    entries.push({
      path,
      uncompressedSize,
      crc32: view.getUint32(cursor + 16, true),
      directory,
    });
    cursor = next;
  }
  if (cursor !== endOffset || entries.length !== declaredEntries) {
    damaged('ZIP 中央目录条目数不一致');
  }
  const comment = bytes.subarray(endOffset + 22);
  // JSZip 自己按末次签名查 EOCD，注释中的伪签名会误导它。读取副本去掉注释，
  // 修复输出再逐字节还原注释；原 buffer 及包内其他条目均不变。
  const readBuffer =
    comment.byteLength === 0 ? buffer : buffer.slice(0, endOffset + 22);
  if (readBuffer !== buffer)
    new DataView(readBuffer).setUint16(endOffset + 20, 0, true);
  return { entries, readBuffer, comment };
}

function restoreZipComment(
  buffer: ArrayBuffer,
  comment: Uint8Array,
): ArrayBuffer {
  if (comment.byteLength === 0) return buffer;
  const result = new Uint8Array(buffer.byteLength + comment.byteLength);
  result.set(new Uint8Array(buffer));
  result.set(comment, buffer.byteLength);
  new DataView(result.buffer).setUint16(
    buffer.byteLength - 2,
    comment.byteLength,
    true,
  );
  return result.buffer;
}

/** 关系路径在原始 ZIP 名称校验后解析；拒绝越出包根目录的引用。 */
function resolvePartTarget(source: string, target: string): string {
  if (
    target === '' ||
    /[\\\u0000-\u001f]/.test(target) ||
    target.startsWith('//')
  ) {
    damaged(`OOXML 关系路径无效：${target}`);
  }
  const path = target.split(/[?#]/, 1)[0];
  const parts = path.startsWith('/') ? [] : source.split('/').slice(0, -1);
  for (const rawSegment of path.split('/')) {
    let segment: string;
    try {
      segment = decodeURIComponent(rawSegment);
    } catch {
      damaged(`OOXML 关系路径编码无效：${target}`);
    }
    if (/[\\/\u0000-\u001f:]/.test(segment)) {
      damaged(`OOXML 关系路径无效：${target}`);
    }
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (parts.length === 0) damaged(`OOXML 关系越出包根目录：${target}`);
      parts.pop();
    } else {
      parts.push(segment);
    }
  }
  const resolved = path === '' ? source : parts.join('/');
  if (resolved === '') damaged(`OOXML 关系未指向文件：${target}`);
  return resolved;
}

function relationshipSource(path: string): string {
  if (path === '_rels/.rels') return '';
  const marker = path.lastIndexOf('/_rels/');
  if (marker < 0 || !path.endsWith('.rels'))
    damaged(`关系文件路径无效：${path}`);
  return `${path.slice(0, marker)}/${path.slice(marker + 7, -5)}`;
}

function parseXml(bytes: Uint8Array, path: string): Document {
  let text: string;
  try {
    const encoding =
      bytes[0] === 0xff && bytes[1] === 0xfe
        ? 'utf-16le'
        : bytes[0] === 0xfe && bytes[1] === 0xff
        ? 'utf-16be'
        : 'utf-8';
    text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    damaged(`XML 编码损坏：${path}`);
  }
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const root = doc.documentElement;
  if (root === null || root === undefined) damaged(`XML 解析失败：${path}`);
  if (doc.doctype !== null && doc.doctype !== undefined) {
    damaged(`XML 不支持文档类型声明：${path}`);
  }
  // Firefox/jsdom 返回专用 namespace 的错误根；Chromium 把 XHTML 错误报告
  // 放在文档内，结构为 h3、div、h3。普通自定义 parsererror 元素不代表解析失败。
  const firefoxError =
    root.localName === 'parsererror' &&
    root.namespaceURI ===
      'http://www.mozilla.org/newlayout/xml/parsererror.xml';
  const chromiumError = Array.from(
    doc.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'parsererror'),
  ).some((report) => {
    const children = report.children;
    return (
      children[0]?.localName === 'h3' &&
      children[1]?.localName === 'div' &&
      children[2]?.localName === 'h3'
    );
  });
  if (firefoxError || chromiumError) {
    damaged(`XML 解析失败：${path}`);
  }
  return doc;
}

function readEntry(
  entry: JSZip.JSZipObject,
  info: ZipEntryInfo,
  remainingBudget: number,
  retainBytes: boolean,
  signal?: AbortSignal,
): Promise<{ bytes: Uint8Array; size: number }> {
  checkAbort(signal);
  return new Promise((resolve, reject) => {
    const stream = (entry as StreamingZipEntry).internalStream('uint8array');
    const chunks: Uint8Array[] = [];
    let size = 0;
    let crc = 0xffffffff;
    let settled = false;
    // 清理闭包只在 abort 定义、监听注册之后执行，互相引用没有提前调用。
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      stream.pause();
      cleanup();
      reject(error);
    };
    function abort() {
      try {
        checkAbort(signal);
      } catch (error) {
        fail(error);
      }
    }
    signal?.addEventListener('abort', abort, { once: true });
    stream
      .on('data', (chunk) => {
        if (settled) return;
        size += chunk.byteLength;
        crc = updateCrc32(crc, chunk);
        if (size > remainingBudget) {
          fail(new PptxPackageError('tooLarge', 'PPTX 实际解压大小超过预算'));
        } else if (size > info.uncompressedSize) {
          fail(
            new PptxPackageError(
              'damaged',
              `ZIP 解压大小与声明不符：${info.path}`,
            ),
          );
        } else if (retainBytes) {
          chunks.push(chunk);
        }
      })
      .on('error', (error) =>
        fail(
          new PptxPackageError(
            'damaged',
            `ZIP 解压失败：${info.path} (${error.message})`,
          ),
        ),
      )
      .on('end', () => {
        if (settled) return;
        if (size !== info.uncompressedSize) {
          fail(
            new PptxPackageError(
              'damaged',
              `ZIP 解压大小与声明不符：${info.path}`,
            ),
          );
          return;
        }
        if ((crc ^ 0xffffffff) >>> 0 !== info.crc32) {
          fail(
            new PptxPackageError('damaged', `ZIP 内容校验失败：${info.path}`),
          );
          return;
        }
        settled = true;
        cleanup();
        const bytes = new Uint8Array(retainBytes ? size : 0);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        resolve({ bytes, size });
      });
    abort();
    if (!settled) stream.resume();
  });
}

function matchesRelationship(type: string, kind: string): boolean {
  return OFFICE_RELATIONSHIP_NAMESPACES.some(
    (namespace) => type === `${namespace}/${kind}`,
  );
}

function readPresentationList(
  presentation: Document,
  listName: 'sldIdLst' | 'sldMasterIdLst',
  itemName: 'sldId' | 'sldMasterId',
  relationshipKind: 'slide' | 'slideMaster',
  relationships: Map<string, PackageRelationship>,
  documents: Map<string, Document>,
): string[] {
  const root = presentation.documentElement;
  const lists = Array.from(root.children).filter(
    (child) =>
      child.localName === listName && child.namespaceURI === root.namespaceURI,
  );
  if (lists.length > 1 || (listName === 'sldIdLst' && lists.length !== 1)) {
    damaged(`PPTX 的 ${listName} 列表缺失或重复`);
  }
  const paths: string[] = [];
  const numericIds = new Set<number>();
  const relationIds = new Set<string>();
  for (const item of Array.from(lists[0]?.children ?? [])) {
    if (
      item.localName !== itemName ||
      item.namespaceURI !== root.namespaceURI
    ) {
      damaged(`PPTX 的 ${listName} 列表结构无效`);
    }
    const id = item.getAttribute('id') ?? '';
    const numericId = Number(id);
    const relationId =
      OFFICE_RELATIONSHIP_NAMESPACES.map((namespace) =>
        item.getAttributeNS(namespace, 'id'),
      ).find(Boolean) ?? '';
    if (
      !/^\d+$/.test(id) ||
      !Number.isSafeInteger(numericId) ||
      numericId > 0xffffffff ||
      numericIds.has(numericId) ||
      relationId === '' ||
      relationIds.has(relationId)
    ) {
      damaged(`PPTX 的 ${listName} 列表 ID 无效或重复`);
    }
    numericIds.add(numericId);
    relationIds.add(relationId);
    const relation = relationships.get(relationId);
    if (
      relation === undefined ||
      relation.target === null ||
      relation.target === undefined ||
      !matchesRelationship(relation.type, relationshipKind) ||
      paths.includes(relation.target)
    ) {
      damaged(`PPTX 的 ${listName} 列表存在断链或重复页`);
    }
    const document = documents.get(relation.target);
    const expectedRoot = relationshipKind === 'slide' ? 'sld' : 'sldMaster';
    if (
      document?.documentElement.localName !== expectedRoot ||
      !PRESENTATION_NAMESPACES.has(document.documentElement.namespaceURI ?? '')
    ) {
      damaged(
        `PPTX 的 ${relationshipKind} 文件缺失或结构损坏：${relation.target}`,
      );
    }
    paths.push(relation.target);
  }
  if (listName === 'sldIdLst' && paths.length === 0)
    damaged('PPTX 中没有幻灯片');
  return paths;
}

/** 校验包关系，仅清理无人引用且目标缺失的母版 Content Types 声明。 */
export async function preparePptxForPreview(
  buffer: ArrayBuffer,
  options?: PptxPreparationOptions,
): Promise<PreparedPptxPackage> {
  const signal = options?.signal;
  checkAbort(signal);
  const limits = getLimits(options);
  const inspection = inspectZip(buffer, limits);
  const { entries } = inspection;
  checkAbort(signal);
  let zip: JSZip;
  try {
    checkAbort(signal);
    zip = await JSZip.loadAsync(inspection.readBuffer);
    checkAbort(signal);
  } catch (error) {
    checkAbort(signal);
    if (error instanceof PptxPackageError) throw error;
    damaged('ZIP 包读取失败');
  }
  const files = new Set(
    entries.filter((entry) => !entry.directory).map((entry) => entry.path),
  );
  if (!files.has(CONTENT_TYPES_PATH)) {
    if (files.has(PRESENTATION_PATH)) damaged('PPTX 缺少 Content Types 声明');
    unsupported('ZIP 包不是 PPTX 文件');
  }
  const documents = new Map<string, Document>();
  let actualTotal = 0;
  for (const info of entries) {
    checkAbort(signal);
    if (info.directory) continue;
    const entry = zip.file(info.path);
    if (entry === null || entry === undefined)
      damaged(`ZIP 条目名称无法匹配：${info.path}`);
    const isXml = info.path.endsWith('.xml') || info.path.endsWith('.rels');
    checkAbort(signal);
    const result = await readEntry(
      entry,
      info,
      limits.maxUncompressedBytes - actualTotal,
      isXml,
      signal,
    );
    checkAbort(signal);
    actualTotal += result.size;
    if (isXml) documents.set(info.path, parseXml(result.bytes, info.path));
  }

  const contentTypes = documents.get(CONTENT_TYPES_PATH)!;
  if (
    contentTypes.documentElement.localName !== 'Types' ||
    contentTypes.documentElement.namespaceURI !== CONTENT_TYPES_NS
  ) {
    damaged('Content Types 声明结构无效');
  }
  const overrides = new Map<string, Element>();
  for (const element of Array.from(contentTypes.documentElement.children)) {
    if (element.namespaceURI !== CONTENT_TYPES_NS)
      damaged('Content Types 命名空间无效');
    if (element.localName !== 'Override') continue;
    const rawPath = element.getAttribute('PartName') ?? '';
    if (
      !rawPath.startsWith('/') ||
      element.getAttribute('ContentType') === null ||
      element.getAttribute('ContentType') === undefined
    ) {
      damaged('Content Types 文件声明无效');
    }
    const path = resolvePartTarget('', rawPath);
    if (overrides.has(path)) damaged(`Content Types 存在重复声明：${path}`);
    overrides.set(path, element);
  }
  if (
    overrides.get(PRESENTATION_PATH)?.getAttribute('ContentType') !==
    PRESENTATION_CONTENT_TYPE
  ) {
    unsupported('ZIP 包不是受支持的 PPTX 演示文稿');
  }
  const presentation = documents.get(PRESENTATION_PATH);
  if (
    presentation?.documentElement.localName !== 'presentation' ||
    !PRESENTATION_NAMESPACES.has(
      presentation.documentElement.namespaceURI ?? '',
    )
  ) {
    damaged('PPTX 的 presentation.xml 缺失或结构损坏');
  }

  const allRelationships = new Map<string, Map<string, PackageRelationship>>();
  const referencedParts = new Set<string>();
  for (const [path, doc] of documents) {
    checkAbort(signal);
    if (!path.endsWith('.rels')) continue;
    const source = relationshipSource(path);
    if (source !== '' && !files.has(source))
      damaged(`关系文件的源文件缺失：${path}`);
    if (
      doc.documentElement.localName !== 'Relationships' ||
      doc.documentElement.namespaceURI !== PACKAGE_RELATIONSHIPS_NS
    ) {
      damaged(`关系文件结构无效：${path}`);
    }
    const relationships = new Map<string, PackageRelationship>();
    for (const element of Array.from(doc.documentElement.children)) {
      const id = element.getAttribute('Id') ?? '';
      const type = element.getAttribute('Type') ?? '';
      const target = element.getAttribute('Target') ?? '';
      const mode = element.getAttribute('TargetMode');
      if (
        element.localName !== 'Relationship' ||
        element.namespaceURI !== PACKAGE_RELATIONSHIPS_NS ||
        id === '' ||
        type === '' ||
        target === '' ||
        relationships.has(id) ||
        (mode !== null && mode !== 'Internal' && mode !== 'External')
      ) {
        damaged(`关系声明无效或 ID 重复：${path}`);
      }
      const resolved =
        mode === 'External' ? undefined : resolvePartTarget(source, target);
      relationships.set(id, { id, type, target: resolved });
      // 即使目标文件不存在，也必须保留引用，防止把真正断链的母版当作废声明。
      if (resolved !== undefined) referencedParts.add(resolved);
    }
    allRelationships.set(source, relationships);
  }
  const rootRelationships = allRelationships.get('');
  const officeDocuments = Array.from(rootRelationships?.values() ?? []).filter(
    (relation) => matchesRelationship(relation.type, 'officeDocument'),
  );
  if (
    officeDocuments.length !== 1 ||
    officeDocuments[0].target !== PRESENTATION_PATH
  ) {
    damaged('PPTX 的根演示文稿关系缺失或重复');
  }
  const presentationRelationships = allRelationships.get(PRESENTATION_PATH);
  if (
    presentationRelationships === null ||
    presentationRelationships === undefined
  )
    damaged('PPTX 的演示文稿关系文件缺失');
  const slidePaths = readPresentationList(
    presentation,
    'sldIdLst',
    'sldId',
    'slide',
    presentationRelationships,
    documents,
  );
  readPresentationList(
    presentation,
    'sldMasterIdLst',
    'sldMasterId',
    'slideMaster',
    presentationRelationships,
    documents,
  );
  for (const target of referencedParts) {
    if (!files.has(target)) damaged(`OOXML 内部关系目标缺失：${target}`);
  }

  const repairedParts: string[] = [];
  for (const [path, declaration] of overrides) {
    if (files.has(path)) continue;
    if (
      declaration.getAttribute('ContentType') !== SLIDE_MASTER_CONTENT_TYPE ||
      referencedParts.has(path)
    ) {
      damaged(`Content Types 声明的文件缺失：${path}`);
    }
    declaration.remove();
    repairedParts.push(path);
  }
  checkAbort(signal);
  if (repairedParts.length === 0) return { buffer, slidePaths, repairedParts };
  zip.file(
    CONTENT_TYPES_PATH,
    new XMLSerializer().serializeToString(contentTypes),
  );
  checkAbort(signal);
  const generatedBuffer = await zip.generateAsync(
    {
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
      comment: '',
    },
    () => checkAbort(signal),
  );
  checkAbort(signal);
  const repairedBuffer = restoreZipComment(generatedBuffer, inspection.comment);
  if (repairedBuffer.byteLength > limits.maxCompressedBytes) {
    throw new PptxPackageError(
      'tooLarge',
      '修复后的 PPTX 文件超过压缩大小预算',
    );
  }
  return { buffer: repairedBuffer, slidePaths, repairedParts };
}
