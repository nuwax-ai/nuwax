import JSZip from 'jszip';
import { canonicalPath, validateThemePackage, type ThemeFiles } from './core';

const MAX_FILE = 5 * 1024 * 1024;
const MAX_TOTAL = 20 * 1024 * 1024;
const fail = (): never => {
  throw new Error('Invalid or unsafe theme ZIP');
};
interface ChunkStream {
  on(event: 'data', listener: (chunk: Uint8Array) => void): ChunkStream;
  on(event: 'error', listener: (error: Error) => void): ChunkStream;
  on(event: 'end', listener: () => void): ChunkStream;
  pause(): void;
  resume(): void;
}
interface Entry {
  name: string;
  size: number;
  crc: number;
  directory: boolean;
  ignored: boolean;
}

/** Inspect original names and sizes before JSZip can normalize names or inflate data. */
function inspect(bytes: Uint8Array): Entry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (p: number) => view.getUint16(p, true);
  const u32 = (p: number) => view.getUint32(p, true);
  const range = (p: number, n: number) => {
    if (p < 0 || n < 0 || p + n > bytes.length) fail();
  };
  range(0, 22);
  let end = -1;
  for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--) {
    if (u32(p) === 0x06054b50 && p + 22 + u16(p + 20) === bytes.length) {
      end = p;
      break;
    }
  }
  if (end < 0 || u16(end + 4) || u16(end + 6)) fail();
  const count = u16(end + 10),
    length = u32(end + 12),
    start = u32(end + 16);
  if (
    !count ||
    count > 500 ||
    count !== u16(end + 8) ||
    start === 0xffffffff ||
    length === 0xffffffff ||
    start + length !== end
  )
    fail();
  range(start, length);
  const entries: Entry[] = [],
    seen = new Set<string>(),
    spans: [number, number][] = [];
  const nodes = new Map<string, { spelling: string; directory: boolean }>();
  let p = start,
    total = 0;
  const extras = (startOffset: number, length: number, name: string) => {
    let offset = startOffset;
    const stop = offset + length;
    while (offset < stop) {
      if (offset + 4 > stop) fail();
      const id = u16(offset),
        size = u16(offset + 2);
      // Alternate Unicode names may only repeat the already checked original name.
      if (id === 1 || offset + 4 + size > stop) fail();
      if (id === 0x7075) {
        if (size < 5 || bytes[offset + 4] !== 1) fail();
        let alternate: string;
        try {
          alternate = new TextDecoder('utf-8', { fatal: true }).decode(
            bytes.subarray(offset + 9, offset + 4 + size),
          );
        } catch {
          return fail();
        }
        if (alternate !== name) fail();
      }
      offset += 4 + size;
    }
  };
  for (let i = 0; i < count; i++) {
    range(p, 46);
    if (u32(p) !== 0x02014b50) fail();
    const flags = u16(p + 8),
      method = u16(p + 10),
      crc = u32(p + 16);
    const compressed = u32(p + 20),
      size = u32(p + 24);
    const nl = u16(p + 28),
      el = u16(p + 30),
      cl = u16(p + 32),
      local = u32(p + 42);
    if (
      flags & ~0x080e ||
      flags & 1 ||
      ![0, 8].includes(method) ||
      u16(p + 6) >= 45 ||
      u16(p + 34) ||
      size > MAX_FILE ||
      compressed > MAX_TOTAL ||
      (method === 0 && compressed !== size)
    )
      fail();
    range(p + 46, nl + el + cl);
    const raw = bytes.subarray(p + 46, p + 46 + nl);
    let name: string;
    try {
      name = new TextDecoder('utf-8', { fatal: true }).decode(raw);
    } catch {
      return fail();
    }
    if (!(flags & 0x800) && raw.some((b) => b > 127)) fail();
    const directory = name.endsWith('/'),
      path = directory ? name.slice(0, -1) : name;
    if (
      !path ||
      /[\\\x00-\x1f\x7f]/.test(path) ||
      path.startsWith('/') ||
      path.includes(':') ||
      path.split('/').some((part) => !part || part === '.' || part === '..')
    )
      fail();
    if (canonicalPath(path) !== path) fail();
    const key = path.normalize('NFC').toLowerCase();
    if (seen.has(key)) fail();
    seen.add(key);
    const parts = path.split('/');
    for (let depth = 1; depth <= parts.length; depth++) {
      const spelling = parts.slice(0, depth).join('/');
      const nodeKey = spelling.normalize('NFC').toLowerCase();
      const isDirectory = depth < parts.length || directory;
      const previous = nodes.get(nodeKey);
      if (
        previous &&
        (previous.spelling !== spelling || previous.directory !== isDirectory)
      )
        fail();
      nodes.set(nodeKey, { spelling, directory: isDirectory });
    }
    const unixType = (u32(p + 38) >>> 16) & 0xf000;
    if (unixType && unixType !== 0x8000 && unixType !== 0x4000) fail();
    if (directory && size) fail();
    total += size;
    if (total > MAX_TOTAL) fail();
    extras(p + 46 + nl, el, name);
    range(local, 30);
    if (
      u32(local) !== 0x04034b50 ||
      u16(local + 4) >= 45 ||
      u16(local + 6) !== flags ||
      u16(local + 8) !== method
    )
      fail();
    const lnl = u16(local + 26),
      lel = u16(local + 28);
    range(local + 30, lnl + lel + compressed);
    if (lnl !== nl || !raw.every((b, j) => b === bytes[local + 30 + j])) fail();
    extras(local + 30 + lnl, lel, name);
    if (
      !(flags & 8) &&
      (u32(local + 14) !== crc ||
        u32(local + 18) !== compressed ||
        u32(local + 22) !== size)
    )
      fail();
    let stop = local + 30 + lnl + lel + compressed;
    if (flags & 8) {
      range(stop, 12);
      if (u32(stop) === 0x08074b50) stop += 4;
      range(stop, 12);
      if (
        u32(stop) !== crc ||
        u32(stop + 4) !== compressed ||
        u32(stop + 8) !== size
      )
        fail();
      stop += 12;
    }
    if (stop > start) fail();
    spans.push([local, stop]);
    entries.push({
      name,
      size,
      crc,
      directory,
      ignored: path
        .split('/')
        .some((s) => s === '__MACOSX' || s === '.DS_Store'),
    });
    p += 46 + nl + el + cl;
  }
  if (p !== end) fail();
  spans.sort((a, b) => a[0] - b[0]);
  if (
    spans[0][0] !== 0 ||
    spans.some((s, i) => i > 0 && s[0] !== spans[i - 1][1]) ||
    spans[spans.length - 1][1] !== start
  )
    fail();
  return entries;
}

function base64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 32768)
    result += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(result);
}
const crcTable = Array.from({ length: 256 }, (_, value) => {
  let n = value;
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});

function blobBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(reader.error ?? new Error('Cannot read theme ZIP'));
    reader.onabort = () => reject(new Error('Theme ZIP read aborted'));
    reader.readAsArrayBuffer(blob);
  });
}

export async function readThemeZip(
  file: Blob | ArrayBuffer,
): Promise<ThemeFiles> {
  if (file instanceof Blob && file.size > MAX_TOTAL) fail();
  const bytes = new Uint8Array(
    file instanceof Blob ? await blobBuffer(file) : file,
  );
  if (bytes.length > MAX_TOTAL) fail();
  const entries = inspect(bytes);
  const relevant = entries.filter((e) => !e.directory && !e.ignored);
  let prefix = '';
  if (!relevant.some((e) => e.name === 'theme.json')) {
    const roots = relevant.filter((e) => /^[^/]+\/theme\.json$/.test(e.name));
    if (roots.length !== 1) fail();
    prefix = roots[0].name.slice(0, -'theme.json'.length);
    if (relevant.some((e) => !e.name.startsWith(prefix))) fail();
  }
  const zip = await JSZip.loadAsync(bytes, { createFolders: false });
  const files: ThemeFiles = Object.create(null);
  const inflated = { total: 0 };
  for (const entry of relevant) {
    const item = zip.file(entry.name);
    if (!item) fail();
    const data = await new Promise<Uint8Array>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      let size = 0,
        crc = 0xffffffff,
        done = false;
      // JSZip exposes this runtime API, but its bundled declaration omits it.
      const stream = (
        item as typeof item & {
          internalStream(type: 'uint8array'): ChunkStream;
        }
      ).internalStream('uint8array');
      stream.on('data', (chunk: Uint8Array) => {
        if (done) return;
        size += chunk.length;
        inflated.total += chunk.length;
        if (
          size > entry.size ||
          size > MAX_FILE ||
          inflated.total > MAX_TOTAL
        ) {
          done = true;
          stream.pause();
          reject(new Error('Theme ZIP inflation limit exceeded'));
          return;
        }
        for (const b of chunk) crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8);
        chunks.push(chunk);
      });
      stream.on('error', (error: Error) => {
        done = true;
        reject(error);
      });
      stream.on('end', () => {
        if (done) return;
        done = true;
        if (size !== entry.size || (crc ^ 0xffffffff) >>> 0 !== entry.crc) {
          reject(new Error('Theme ZIP size or checksum mismatch'));
          return;
        }
        const result = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(result);
      });
      stream.resume();
    });
    files[entry.name.slice(prefix.length)] = base64(data);
  }
  return validateThemePackage(files).files;
}

export async function writeThemeZip(files: ThemeFiles): Promise<Blob> {
  const pkg = validateThemePackage(files);
  const zip = new JSZip();
  for (const [path, data] of Object.entries(pkg.files))
    zip.file(path, data, { base64: true, createFolders: false });
  const result = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
  });
  if (result.size > MAX_TOTAL)
    throw new Error('Theme ZIP compressed limit exceeded');
  return result;
}
