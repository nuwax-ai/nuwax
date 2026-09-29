import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getBusinessFileRequestAuth: vi.fn(),
  fetch: vi.fn(),
}));

// 隔离业务鉴权中的宿主桥与 umi 传递依赖。
vi.mock('@/utils/businessAuth', () => ({
  getBusinessFileRequestAuth: mocks.getBusinessFileRequestAuth,
}));

import { FilePreviewLoadError, loadFilePreviewBuffer } from './filePreview';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function bufferResponse(
  bytes: number[],
  {
    status = 200,
    contentLength,
  }: { status?: number; contentLength?: string } = {},
) {
  const arrayBuffer = vi.fn().mockResolvedValue(new Uint8Array(bytes).buffer);
  const response = {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: vi.fn().mockReturnValue(contentLength ?? null) },
    body: null,
    arrayBuffer,
  } as unknown as Response;
  return { response, arrayBuffer };
}

function streamResponse(chunks: number[][], contentLength?: string) {
  let index = 0;
  const reader = {
    read: vi
      .fn()
      .mockImplementation(async () =>
        index < chunks.length
          ? { done: false, value: new Uint8Array(chunks[index++]) }
          : { done: true, value: undefined },
      ),
    cancel: vi.fn().mockResolvedValue(undefined),
    releaseLock: vi.fn(),
  };
  const body = {
    getReader: vi.fn().mockReturnValue(reader),
    cancel: vi.fn().mockResolvedValue(undefined),
  };
  const response = {
    ok: true,
    status: 200,
    headers: { get: vi.fn().mockReturnValue(contentLength ?? null) },
    body,
    arrayBuffer: vi.fn(),
  } as unknown as Response;
  return { response, body, reader };
}

describe('文件预览内容读取', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getBusinessFileRequestAuth.mockReturnValue({
      credentials: 'same-origin',
      headers: { Authorization: 'stubbed-auth' },
    });
    vi.stubGlobal('fetch', mocks.fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('URL 请求复用文件业务鉴权并传入取消信号', async () => {
    const controller = new AbortController();
    const { response } = bufferResponse([1, 2, 3]);
    mocks.fetch.mockResolvedValue(response);

    const buffer = await loadFilePreviewBuffer('/api/f/preview.pptx', {
      signal: controller.signal,
    });

    expect(new Uint8Array(buffer)).toEqual(new Uint8Array([1, 2, 3]));
    expect(mocks.getBusinessFileRequestAuth).toHaveBeenCalledWith(
      '/api/f/preview.pptx',
    );
    expect(mocks.fetch).toHaveBeenCalledWith('/api/f/preview.pptx', {
      credentials: 'same-origin',
      headers: { Authorization: 'stubbed-auth' },
      signal: controller.signal,
    });
  });

  it('手动刷新请求重新验证缓存，普通请求不覆盖浏览器缓存策略', async () => {
    const { response } = bufferResponse([1]);
    mocks.fetch.mockResolvedValue(response);

    await loadFilePreviewBuffer('/api/f/preview.pptx');
    await loadFilePreviewBuffer('/api/f/preview.pptx', { refresh: true });

    expect(mocks.fetch.mock.calls[0][1]).not.toHaveProperty('cache');
    expect(mocks.fetch.mock.calls[1][1]).toHaveProperty('cache', 'no-cache');
  });

  it.each([403, 404])(
    'HTTP %i 在读取内容前结束且不暴露 URL',
    async (status) => {
      const { response, arrayBuffer } = bufferResponse([9, 9], { status });
      mocks.fetch.mockResolvedValue(response);

      const error = await loadFilePreviewBuffer('/api/f/private.pptx').catch(
        (caught: unknown) => caught,
      );

      expect(error).toBeInstanceOf(FilePreviewLoadError);
      expect(error).toMatchObject({ code: 'http', status });
      expect((error as Error).message).not.toContain('/api/f/private.pptx');
      expect(arrayBuffer).not.toHaveBeenCalled();
    },
  );

  it('Content-Length 超限时取消响应且不开始读流', async () => {
    const { response, body, reader } = streamResponse([[1, 2]], '7');
    mocks.fetch.mockResolvedValue(response);

    await expect(
      loadFilePreviewBuffer('/api/f/preview.pptx', { maxBytes: 6 }),
    ).rejects.toMatchObject({ code: 'tooLarge' });

    expect(body.cancel).toHaveBeenCalledOnce();
    expect(body.getReader).not.toHaveBeenCalled();
    expect(reader.read).not.toHaveBeenCalled();
  });

  it.each([undefined, '2', 'invalid'])(
    '声明长度 %s 时仍累计实际流大小',
    async (contentLength) => {
      const { response, reader } = streamResponse(
        [[1, 2, 3, 4], [5, 6, 7], [8]],
        contentLength,
      );
      mocks.fetch.mockResolvedValue(response);

      await expect(
        loadFilePreviewBuffer('/api/f/preview.pptx', { maxBytes: 6 }),
      ).rejects.toMatchObject({ code: 'tooLarge' });

      expect(reader.cancel).toHaveBeenCalledOnce();
      expect(reader.read).toHaveBeenCalledTimes(2);
      expect(reader.releaseLock).toHaveBeenCalledOnce();
    },
  );

  it('流大小刚好等于限额时完整返回并释放读取锁', async () => {
    const { response, reader } = streamResponse([[1, 2], [3]], '3');
    mocks.fetch.mockResolvedValue(response);

    const buffer = await loadFilePreviewBuffer('/api/f/preview.pptx', {
      maxBytes: 3,
    });

    expect(Array.from(new Uint8Array(buffer))).toEqual([1, 2, 3]);
    expect(reader.cancel).not.toHaveBeenCalled();
    expect(reader.releaseLock).toHaveBeenCalledOnce();
  });

  it('无响应流时仍检查 arrayBuffer 的实际大小', async () => {
    const { response, arrayBuffer } = bufferResponse([1, 2, 3]);
    mocks.fetch.mockResolvedValue(response);

    await expect(
      loadFilePreviewBuffer('/api/f/preview.pptx', { maxBytes: 2 }),
    ).rejects.toMatchObject({ code: 'tooLarge' });
    expect(arrayBuffer).toHaveBeenCalledOnce();
  });

  it('ArrayBuffer 在限额内原样返回且不请求业务鉴权', async () => {
    const buffer = new Uint8Array([1, 2]).buffer;
    await expect(loadFilePreviewBuffer(buffer, { maxBytes: 2 })).resolves.toBe(
      buffer,
    );
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.getBusinessFileRequestAuth).not.toHaveBeenCalled();
  });

  it('默认限额是 50 MiB', async () => {
    await expect(
      loadFilePreviewBuffer(new ArrayBuffer(50 * 1024 * 1024 + 1)),
    ).rejects.toMatchObject({ code: 'tooLarge' });
  });

  it.each(['Blob', 'File'])(
    '%s 缺少 arrayBuffer 时可通过 FileReader 读取',
    async (kind) => {
      const bytes = new Uint8Array([1, 2, 3]);
      const source =
        kind === 'File' ? new File([bytes], 'preview.pptx') : new Blob([bytes]);
      Object.defineProperty(source, 'arrayBuffer', { value: undefined });

      const buffer = await loadFilePreviewBuffer(source, { maxBytes: 3 });

      expect(Array.from(new Uint8Array(buffer))).toEqual([1, 2, 3]);
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(mocks.getBusinessFileRequestAuth).not.toHaveBeenCalled();
    },
  );

  it('Blob 优先使用原生 arrayBuffer 并检查返回内容大小', async () => {
    const source = new Blob([new Uint8Array([1])]);
    const arrayBuffer = vi
      .fn()
      .mockResolvedValue(new Uint8Array([1, 2]).buffer);
    Object.defineProperty(source, 'arrayBuffer', { value: arrayBuffer });

    await expect(
      loadFilePreviewBuffer(source, { maxBytes: 1 }),
    ).rejects.toMatchObject({ code: 'tooLarge' });
    expect(arrayBuffer).toHaveBeenCalledOnce();
  });

  it.each(['Blob', 'File'])('%s size 超限时不开始读取', async (kind) => {
    const bytes = new Uint8Array([1, 2, 3]);
    const source =
      kind === 'File' ? new File([bytes], 'preview.pptx') : new Blob([bytes]);
    const arrayBuffer = vi.fn();
    Object.defineProperty(source, 'arrayBuffer', { value: arrayBuffer });

    await expect(
      loadFilePreviewBuffer(source, { maxBytes: 2 }),
    ).rejects.toMatchObject({ code: 'tooLarge' });
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it.each(['URL', 'Blob', 'ArrayBuffer'])(
    '已取消的 %s 不开始读取',
    async (kind) => {
      const controller = new AbortController();
      controller.abort(new Error('caller canceled'));
      const source =
        kind === 'URL'
          ? '/api/f/preview.pptx'
          : kind === 'Blob'
          ? new Blob([new Uint8Array([1])])
          : new ArrayBuffer(1);

      await expect(
        loadFilePreviewBuffer(source, { signal: controller.signal }),
      ).rejects.toMatchObject({ name: 'AbortError' });
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(mocks.getBusinessFileRequestAuth).not.toHaveBeenCalled();
    },
  );

  it('fetch 忽略 signal 时取消立即结束，并清理迟到的响应', async () => {
    const pending = deferred<Response>();
    const controller = new AbortController();
    const { response, body } = streamResponse([[1]]);
    mocks.fetch.mockReturnValue(pending.promise);
    const loading = loadFilePreviewBuffer('/api/f/preview.pptx', {
      signal: controller.signal,
    });
    const assertion = expect(loading).rejects.toMatchObject({
      name: 'AbortError',
    });

    controller.abort();
    await assertion;
    pending.resolve(response);
    await Promise.resolve();

    expect(body.cancel).toHaveBeenCalledOnce();
    expect(body.getReader).not.toHaveBeenCalled();
  });

  it('fetch 在取消后失败时不遗留未处理的 rejection', async () => {
    const pending = deferred<Response>();
    const controller = new AbortController();
    mocks.fetch.mockReturnValue(pending.promise);
    const assertion = expect(
      loadFilePreviewBuffer('/api/f/preview.pptx', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    controller.abort();
    await assertion;
    pending.reject(new Error('late network failure'));
    await Promise.resolve();
  });

  it('fetch 刚返回但读取尚未开始时取消，仍会清理响应', async () => {
    const pending = deferred<Response>();
    const controller = new AbortController();
    const { response, body } = streamResponse([[1]]);
    mocks.fetch.mockReturnValue(pending.promise);
    const assertion = expect(
      loadFilePreviewBuffer('/api/f/preview.pptx', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    pending.resolve(response);
    queueMicrotask(() => controller.abort());
    await assertion;

    expect(body.cancel).toHaveBeenCalledOnce();
    expect(body.getReader).not.toHaveBeenCalled();
  });

  it('原生流读取等待期间取消不会被释放锁错误覆盖', async () => {
    const controller = new AbortController();
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ cancel });
    const { response } = bufferResponse([]);
    Object.defineProperty(response, 'body', { value: body });
    const getReader = vi.spyOn(body, 'getReader');
    mocks.fetch.mockResolvedValue(response);
    const assertion = expect(
      loadFilePreviewBuffer('/api/f/preview.pptx', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(getReader).toHaveBeenCalledOnce());

    controller.abort();
    await assertion;

    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it('读取响应流期间取消会取消 reader 并释放锁', async () => {
    const pending = deferred<{ done: boolean; value?: Uint8Array }>();
    const controller = new AbortController();
    const { response, reader } = streamResponse([]);
    reader.read.mockReturnValue(pending.promise);
    mocks.fetch.mockResolvedValue(response);
    const loading = loadFilePreviewBuffer('/api/f/preview.pptx', {
      signal: controller.signal,
    });
    const assertion = expect(loading).rejects.toMatchObject({
      name: 'AbortError',
    });
    await vi.waitFor(() => expect(reader.read).toHaveBeenCalledOnce());

    controller.abort();
    await assertion;
    pending.resolve({ done: true });

    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.releaseLock).toHaveBeenCalledOnce();
  });

  it('无响应流的 arrayBuffer 忽略取消时仍立即结束', async () => {
    const pending = deferred<ArrayBuffer>();
    const controller = new AbortController();
    const { response, arrayBuffer } = bufferResponse([]);
    arrayBuffer.mockReturnValue(pending.promise);
    mocks.fetch.mockResolvedValue(response);
    const assertion = expect(
      loadFilePreviewBuffer('/api/f/preview.pptx', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(arrayBuffer).toHaveBeenCalledOnce());

    controller.abort();
    await assertion;
    pending.resolve(new ArrayBuffer(1));
  });

  it('Blob 原生读取忽略取消时仍立即结束', async () => {
    const pending = deferred<ArrayBuffer>();
    const controller = new AbortController();
    const source = new Blob([new Uint8Array([1])]);
    Object.defineProperty(source, 'arrayBuffer', {
      value: () => pending.promise,
    });
    const assertion = expect(
      loadFilePreviewBuffer(source, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    controller.abort();
    await assertion;
    pending.resolve(new ArrayBuffer(1));
  });
});
