import { getBusinessFileRequestAuth } from '@/utils/businessAuth';

export interface FilePreviewLoadOptions {
  signal?: AbortSignal;
  refresh?: boolean;
  maxBytes?: number;
}

export class FilePreviewLoadError extends Error {
  readonly code: 'http' | 'tooLarge';
  readonly status?: number;

  constructor(code: 'http' | 'tooLarge', status?: number) {
    super(
      code === 'http'
        ? 'Unable to load file preview.'
        : 'File preview exceeds the size limit.',
    );
    this.name = 'FilePreviewLoadError';
    this.code = code;
    this.status = status;
  }
}

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

function abortError(): DOMException {
  return new DOMException('File preview loading was aborted.', 'AbortError');
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError();
}

function checkSize(size: number, maxBytes: number): void {
  if (size > maxBytes) throw new FilePreviewLoadError('tooLarge');
}

/** 清理失败不能覆盖原本的 HTTP、超限或取消错误。 */
function cancelRead(
  target: { cancel: () => Promise<unknown> } | null | undefined,
): void {
  try {
    void target?.cancel().catch(() => {});
  } catch {
    // 流可能已关闭或释放；主流程仍按原错误结束。
  }
}

/** 底层不响应 signal 时也及时结束等待，并处理取消后迟到的响应。 */
function waitWithAbort<T>(
  pending: Promise<T>,
  signal?: AbortSignal,
  onLateValue?: (value: T) => void,
): Promise<T> {
  if (!signal) return pending;
  return new Promise((resolve, reject) => {
    // 清理闭包只在 onAbort 定义、监听注册之后执行。
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const cleanup = () => signal.removeEventListener('abort', onAbort);
    function onAbort() {
      cleanup();
      reject(abortError());
    }
    signal.addEventListener('abort', onAbort, { once: true });
    pending.then(
      (value) => {
        cleanup();
        if (signal.aborted) {
          onLateValue?.(value);
          reject(abortError());
        } else {
          resolve(value);
        }
      },
      (error: unknown) => {
        cleanup();
        reject(signal.aborted ? abortError() : error);
      },
    );
    if (signal.aborted) onAbort();
  });
}

function readBlobBuffer(
  blob: Blob,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();

  // 部分浏览器和 jsdom 的 Blob 没有 arrayBuffer，沿用可取消的 FileReader。
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => {
      // 清理闭包只在 onAbort 定义、读取开始之后执行。
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      signal?.removeEventListener('abort', onAbort);
      reader.onload = reader.onerror = reader.onabort = null;
    };
    function onAbort() {
      cleanup();
      reader.abort();
      reject(abortError());
    }
    reader.onload = () => {
      cleanup();
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error('Unable to read file preview.'));
    };
    reader.onabort = () => {
      cleanup();
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      return;
    }
    try {
      reader.readAsArrayBuffer(blob);
    } catch {
      cleanup();
      reject(new Error('Unable to read file preview.'));
    }
  });
}

/** 文件预览统一读取入口：鉴权、限额、刷新与取消均在渲染之前处理。 */
export async function loadFilePreviewBuffer(
  src: string | Blob | ArrayBuffer,
  options: FilePreviewLoadOptions = {},
): Promise<ArrayBuffer> {
  const { signal, refresh = false, maxBytes = DEFAULT_MAX_BYTES } = options;
  throwIfAborted(signal);
  if (!Number.isFinite(maxBytes) || maxBytes < 0) {
    throw new RangeError(
      'File preview size limit must be a finite non-negative number.',
    );
  }

  if (typeof src !== 'string') {
    // 支持从其他窗口传入的 ArrayBuffer，避免 instanceof 的 realm 差异。
    if (Object.prototype.toString.call(src) === '[object ArrayBuffer]') {
      const buffer = src as ArrayBuffer;
      checkSize(buffer.byteLength, maxBytes);
      return buffer;
    }
    const blob = src as Blob;
    checkSize(blob.size, maxBytes);
    throwIfAborted(signal);
    const buffer = await waitWithAbort(readBlobBuffer(blob, signal), signal);
    throwIfAborted(signal);
    checkSize(buffer.byteLength, maxBytes);
    return buffer;
  }

  const auth = getBusinessFileRequestAuth(src);
  throwIfAborted(signal);
  const response = await waitWithAbort(
    fetch(src, {
      ...auth,
      signal,
      ...(refresh ? { cache: 'no-cache' as const } : {}),
    }),
    signal,
    (lateResponse) => cancelRead(lateResponse.body),
  );
  if (signal?.aborted) cancelRead(response.body);
  throwIfAborted(signal);
  if (!response.ok) {
    cancelRead(response.body);
    throw new FilePreviewLoadError('http', response.status);
  }

  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    cancelRead(response.body);
    throw new FilePreviewLoadError('tooLarge');
  }
  if (!response.body) {
    throwIfAborted(signal);
    const buffer = await waitWithAbort(response.arrayBuffer(), signal);
    throwIfAborted(signal);
    checkSize(buffer.byteLength, maxBytes);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let canceled = false;
  const cancelReader = () => {
    if (canceled) return;
    canceled = true;
    cancelRead(reader);
  };
  signal?.addEventListener('abort', cancelReader, { once: true });
  try {
    while (true) {
      throwIfAborted(signal);
      const { done, value } = await waitWithAbort(reader.read(), signal);
      throwIfAborted(signal);
      if (done) break;
      total += value.byteLength;
      checkSize(total, maxBytes);
      chunks.push(value);
    }
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return buffer.buffer;
  } catch (error) {
    cancelReader();
    throwIfAborted(signal);
    throw error;
  } finally {
    signal?.removeEventListener('abort', cancelReader);
    try {
      reader.releaseLock();
    } catch {
      // 已取消的读取器可能仍在结束底层读取，不能让清理覆盖取消错误。
    }
  }
}
