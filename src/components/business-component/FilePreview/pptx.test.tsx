import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  prepare: vi.fn(),
  init: vi.fn(),
  pdfInit: vi.fn(),
}));

vi.mock('@/services/filePreview', () => ({
  loadFilePreviewBuffer: mocks.load,
}));
vi.mock('@/utils/pptxPackage', () => ({
  preparePptxForPreview: mocks.prepare,
}));
vi.mock('pptx-preview', () => ({ init: mocks.init }));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
// 本组只验证真实 FilePreview 的 PPTX 合同，隔离其他预览器和 umi 传递依赖。
vi.mock('@/constants/common.constants', () => ({
  SANDBOX: 'allow-scripts allow-same-origin',
}));
vi.mock('@/components/MarkdownRenderer/utils', () => ({
  extractTableToMarkdown: vi.fn(),
  unwrapLatexInlineCode: (value: string) => value,
}));
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('rehype-katex', () => ({ default: vi.fn() }));
vi.mock('rehype-raw', () => ({ default: vi.fn() }));
vi.mock('remark-gfm', () => ({ default: vi.fn() }));
vi.mock('remark-math', () => ({ default: vi.fn() }));
vi.mock('@js-preview/docx', () => ({ default: { init: vi.fn() } }));
vi.mock('@js-preview/excel', () => ({ default: { init: vi.fn() } }));
vi.mock('@js-preview/pdf', () => ({ default: { init: mocks.pdfInit } }));
vi.mock('@js-preview/docx/lib/index.css', () => ({}));
vi.mock('@js-preview/excel/lib/index.css', () => ({}));
vi.mock('ds-markdown/katex.css', () => ({}));
vi.mock('@/components/MarkdownRenderer/ds-markdown.css', () => ({}));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('ds-markdown', () => ({
  CodeBlockWrap: ({ children }: { children: ReactNode }) => <>{children}</>,
  CodeBlockActions: () => null,
  HighlightCode: () => null,
}));

import FilePreview from './index';

const SLIDE_ONE = 'ppt/slides/slide1.xml';
const SLIDE_TWO = 'ppt/slides/slide2.xml';
const originalBuffer = new Uint8Array([1, 2, 3]).buffer;
const repairedBuffer = new Uint8Array([4, 5, 6]).buffer;

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

type RendererPlan = {
  paths?: string[];
  label?: string;
  gate?: Promise<void>;
};

const instances: Array<{
  load: ReturnType<typeof vi.fn>;
  preview: ReturnType<typeof vi.fn>;
  htmlRender: { renderSlide: ReturnType<typeof vi.fn> };
  destroy: ReturnType<typeof vi.fn>;
}> = [];

const createRenderer = (host: HTMLElement, plan: RendererPlan = {}) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'pptx-preview-wrapper';
  host.appendChild(wrapper);
  const pptx = { slides: [] as Array<{ name: string }> };
  const load = vi.fn(async () => {
    await plan.gate;
    pptx.slides = (plan.paths ?? [SLIDE_ONE]).map((name) => ({ name }));
    return pptx;
  });
  const renderSlide = vi.fn((index: number) => {
    const { name } = pptx.slides[index];
    const slide = document.createElement('div');
    slide.className = `pptx-preview-slide-wrapper pptx-preview-slide-wrapper-${index}`;
    slide.dataset.slidePath = name;
    slide.textContent = `${plan.label ?? 'PPT'}:${name}`;
    wrapper.appendChild(slide);
    // mock 只能写 init 接收的 host，不能绕过组件的隔离容器。
    host.replaceChildren(wrapper);
  });
  const instance = {
    wrapper,
    pptx,
    get slideCount() {
      return pptx.slides.length;
    },
    load,
    htmlRender: { renderSlide },
    preview: vi.fn(async () => {
      await load();
      for (let index = 0; index < pptx.slides.length; index += 1) {
        renderSlide(index);
      }
      return pptx;
    }),
    destroy: vi.fn(),
  };
  instances.push(instance);
  return instance;
};

type ObserverState = {
  callback: ResizeObserverCallback;
  targets: Set<Element>;
};
const observers = new Set<ObserverState>();

class PreviewResizeObserver {
  private state: ObserverState;

  constructor(callback: ResizeObserverCallback) {
    this.state = { callback, targets: new Set() };
    observers.add(this.state);
  }

  observe(target: Element) {
    this.state.targets.add(target);
  }

  unobserve(target: Element) {
    this.state.targets.delete(target);
  }

  disconnect() {
    observers.delete(this.state);
  }
}

const triggerResize = (width: number, height: number) => {
  observers.forEach(({ callback, targets }) => {
    const entries = Array.from(targets, (target) => ({
      target,
      contentRect: { width, height },
    })) as ResizeObserverEntry[];
    callback(entries, {} as ResizeObserver);
  });
};

const flushPromises = async () => {
  await act(async () => {
    for (let index = 0; index < 8; index += 1) await Promise.resolve();
  });
};

const prepareResult = (paths = [SLIDE_ONE], buffer = originalBuffer) => ({
  buffer,
  slidePaths: paths,
  repairedParts: [] as string[],
});

const captureDownloadBlobs = () => {
  const blobs: Blob[] = [];
  const OriginalURL = URL;
  vi.stubGlobal(
    'URL',
    class extends OriginalURL {
      static createObjectURL(blob: Blob | MediaSource) {
        blobs.push(blob as Blob);
        return 'blob:original-download';
      }

      static revokeObjectURL = vi.fn();
    },
  );
  return blobs;
};

const readBlob = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.load.mockReset().mockResolvedValue(originalBuffer);
  mocks.prepare.mockReset().mockResolvedValue(prepareResult());
  mocks.init
    .mockReset()
    .mockImplementation((host: HTMLElement) => createRenderer(host));
  mocks.pdfInit.mockReset().mockReturnValue({
    preview: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  });
  instances.length = 0;
  observers.clear();
  vi.stubGlobal('ResizeObserver', PreviewResizeObserver);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => originalBuffer,
    }),
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('FilePreview PPTX 渲染结果', () => {
  it('使用兼容 buffer，按关系页序呈现，而不是按文件名排序', async () => {
    const paths = [SLIDE_TWO, SLIDE_ONE];
    mocks.prepare.mockResolvedValue(prepareResult(paths, repairedBuffer));
    mocks.init.mockImplementation((host: HTMLElement) =>
      createRenderer(host, { paths: [SLIDE_ONE, SLIDE_TWO] }),
    );
    const onRendered = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <FilePreview
        src="/normal.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );

    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));

    expect(mocks.load).toHaveBeenCalledWith(
      '/normal.pptx',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(mocks.prepare).toHaveBeenCalledWith(
      originalBuffer,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(instances[0].load).toHaveBeenCalledWith(repairedBuffer);
    expect(
      Array.from(container.querySelectorAll<HTMLElement>('[data-slide-path]')),
    ).toHaveLength(2);
    expect(
      Array.from(
        container.querySelectorAll<HTMLElement>('[data-slide-path]'),
        (slide) => slide.dataset.slidePath,
      ),
    ).toEqual(paths);
    expect(onError).not.toHaveBeenCalled();
  });

  it.each<[string, string[]]>([
    ['0 页', []],
    ['缺页', [SLIDE_ONE]],
    ['重复页', [SLIDE_ONE, SLIDE_ONE]],
    ['未知页', [SLIDE_ONE, 'ppt/slides/slide3.xml']],
  ])('%s：Promise resolve 也不能触发成功回调', async (_label, actualPaths) => {
    mocks.prepare.mockResolvedValue(prepareResult([SLIDE_ONE, SLIDE_TWO]));
    mocks.init.mockImplementation((host: HTMLElement) =>
      createRenderer(host, { paths: actualPaths }),
    );
    const onRendered = vi.fn();
    const onError = vi.fn();
    render(
      <FilePreview
        src="/invalid-result.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );

    await screen.findByText('PC.Components.FilePreview.alertPreviewFailed');

    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(instances[0].load).toHaveBeenCalledTimes(1);
    expect(onRendered).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe('FilePreview PPTX 请求和生命周期', () => {
  it('A 下载慢、B 下载快：中断 A，忽略晚到的旧数据', async () => {
    const slowLoad = deferred<ArrayBuffer>();
    mocks.load.mockImplementation((src: string) =>
      src === '/A.pptx' ? slowLoad.promise : Promise.resolve(repairedBuffer),
    );
    mocks.prepare.mockImplementation(async (buffer: ArrayBuffer) =>
      prepareResult([SLIDE_ONE], buffer),
    );
    mocks.init.mockImplementation((host: HTMLElement) =>
      createRenderer(host, { label: 'B' }),
    );
    const onRendered = vi.fn();
    const onError = vi.fn();
    const { container, rerender } = render(
      <FilePreview
        src="/A.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
    const aSignal = mocks.load.mock.calls[0][1].signal as AbortSignal;

    rerender(
      <FilePreview
        src="/B.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));
    await act(async () => slowLoad.resolve(originalBuffer));
    await flushPromises();

    expect(aSignal.aborted).toBe(true);
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.init).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-slide-path]')?.textContent).toBe(
      `B:${SLIDE_ONE}`,
    );
    expect(onRendered).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('A 渲染慢、B 渲染快：旧实例完成后不能改 B 的 DOM 或回调', async () => {
    const slowRender = deferred<void>();
    mocks.init
      .mockImplementationOnce((host: HTMLElement) =>
        createRenderer(host, { label: 'A', gate: slowRender.promise }),
      )
      .mockImplementationOnce((host: HTMLElement) =>
        createRenderer(host, { label: 'B' }),
      );
    const onRendered = vi.fn();
    const onError = vi.fn();
    const { container, rerender } = render(
      <FilePreview
        src="/A.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));

    rerender(
      <FilePreview
        src="/B.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));
    await act(async () => slowRender.resolve());
    await flushPromises();

    expect(instances[0].destroy).toHaveBeenCalled();
    expect(instances[0].htmlRender.renderSlide).not.toHaveBeenCalled();
    expect(container.querySelector('[data-slide-path]')?.textContent).toBe(
      `B:${SLIDE_ONE}`,
    );
    expect(onRendered).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('解析兼容处理中切文件，晚到的旧结果不创建 renderer', async () => {
    const slowPrepare = deferred<ReturnType<typeof prepareResult>>();
    mocks.load.mockImplementation(async (src: string) =>
      src === '/A.pptx' ? originalBuffer : repairedBuffer,
    );
    mocks.prepare.mockImplementation((buffer: ArrayBuffer) =>
      buffer === originalBuffer
        ? slowPrepare.promise
        : Promise.resolve(prepareResult([SLIDE_ONE], buffer)),
    );
    const onRendered = vi.fn();
    const { rerender } = render(
      <FilePreview src="/A.pptx" fileType="pptx" onRendered={onRendered} />,
    );
    await waitFor(() => expect(mocks.prepare).toHaveBeenCalledTimes(1));
    const aSignal = mocks.prepare.mock.calls[0][1].signal as AbortSignal;

    rerender(
      <FilePreview src="/B.pptx" fileType="pptx" onRendered={onRendered} />,
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));
    await act(async () => slowPrepare.resolve(prepareResult()));
    await flushPromises();

    expect(aSignal.aborted).toBe(true);
    expect(mocks.init).toHaveBeenCalledTimes(1);
    expect(onRendered).toHaveBeenCalledTimes(1);
  });

  it('B 已成功后 A 才报错，不显示旧错误或触发 onError', async () => {
    const slowRender = deferred<void>();
    mocks.init
      .mockImplementationOnce((host: HTMLElement) =>
        createRenderer(host, { label: 'A', gate: slowRender.promise }),
      )
      .mockImplementationOnce((host: HTMLElement) =>
        createRenderer(host, { label: 'B' }),
      );
    const onRendered = vi.fn();
    const onError = vi.fn();
    const { rerender } = render(
      <FilePreview
        src="/A.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));

    rerender(
      <FilePreview
        src="/B.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));
    await act(async () => slowRender.reject(new Error('A parse failed')));
    await flushPromises();

    expect(screen.getByText(`B:${SLIDE_ONE}`)).toBeInTheDocument();
    expect(onError).not.toHaveBeenCalled();
    expect(
      screen.queryByText('PC.Components.FilePreview.alertPreviewFailed'),
    ).toBeNull();
  });

  it('加载中卸载立即销毁已创建实例，晚到的渲染不通知成功', async () => {
    const slowRender = deferred<void>();
    mocks.init.mockImplementation((host: HTMLElement) =>
      createRenderer(host, { gate: slowRender.promise }),
    );
    const onRendered = vi.fn();
    const onError = vi.fn();
    const { unmount } = render(
      <FilePreview
        src="/loading.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));

    unmount();

    expect(instances[0].destroy).toHaveBeenCalled();
    expect((mocks.load.mock.calls[0][1].signal as AbortSignal).aborted).toBe(
      true,
    );
    await act(async () => slowRender.resolve());
    await flushPromises();
    expect(instances[0].htmlRender.renderSlide).not.toHaveBeenCalled();
    expect(onRendered).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('旧 PDF 的成功和错误回调均不能覆盖新 PPTX', async () => {
    const pendingPdf = deferred<void>();
    type PdfCallbacks = {
      onRendered: () => void;
      onError: (error: Error) => void;
    };
    const callbacks: PdfCallbacks[] = [];
    const pdfInstance = {
      preview: vi.fn(() => pendingPdf.promise),
      destroy: vi.fn(),
    };
    mocks.pdfInit.mockImplementation((...args: [HTMLElement, PdfCallbacks]) => {
      callbacks.push(args[1]);
      return pdfInstance;
    });
    mocks.init.mockImplementation((host: HTMLElement) =>
      createRenderer(host, { label: 'B' }),
    );
    const onRendered = vi.fn();
    const onError = vi.fn();
    const { container, rerender } = render(
      <FilePreview
        src="/A.pdf"
        fileType="pdf"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(mocks.pdfInit).toHaveBeenCalledTimes(1));

    rerender(
      <FilePreview
        src="/B.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));
    await act(async () => {
      callbacks[0].onRendered();
      callbacks[0].onError(new Error('Old PDF failed'));
      pendingPdf.resolve();
    });
    await flushPromises();

    expect(onRendered).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(screen.getByText(`B:${SLIDE_ONE}`)).toBeInTheDocument();
    expect(container.querySelector('.previewContent')).toHaveStyle({
      visibility: 'visible',
    });
    expect(
      screen.queryByText('PC.Components.FilePreview.alertPreviewFailed'),
    ).toBeNull();
  });

  it('取消下载不触发 onError 或错误提示', async () => {
    mocks.load.mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
    const onError = vi.fn();
    const onRendered = vi.fn();
    render(
      <FilePreview
        src="/cancelled.pptx"
        fileType="pptx"
        onError={onError}
        onRendered={onRendered}
      />,
    );

    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
    await flushPromises();

    expect(onError).not.toHaveBeenCalled();
    expect(onRendered).not.toHaveBeenCalled();
    expect(
      screen.queryByText('PC.Components.FilePreview.alertPreviewFailed'),
    ).toBeNull();
  });

  it('失败仍可下载原件，重试重新加载并恢复成功', async () => {
    mocks.load
      .mockRejectedValueOnce(new Error('Load file failed: 403'))
      .mockResolvedValue(originalBuffer);
    const onRendered = vi.fn();
    const downloadedBlobs = captureDownloadBlobs();
    const downloaded: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloaded.push(this.getAttribute('href') ?? '');
    });
    render(
      <FilePreview
        src="/original.pptx?version=1"
        fileType="pptx"
        onRendered={onRendered}
      />,
    );
    await screen.findByText('PC.Components.FilePreview.alertPreviewFailed');

    fireEvent.click(
      screen.getByRole('button', {
        name: /PC\.Components\.FilePreview\.downloadFile/,
      }),
    );
    await waitFor(() => expect(downloaded).toEqual(['blob:original-download']));
    expect(mocks.load).toHaveBeenCalledTimes(2);
    expect(mocks.load.mock.calls[1]).toEqual([
      '/original.pptx?version=1',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        maxBytes: Number.MAX_SAFE_INTEGER,
      }),
    ]);
    expect(downloadedBlobs).toHaveLength(1);
    expect(new Uint8Array(await readBlob(downloadedBlobs[0]))).toEqual(
      new Uint8Array(originalBuffer),
    );
    expect(onRendered).not.toHaveBeenCalled();
    expect(
      screen.getByText('PC.Components.FilePreview.alertPreviewFailed'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /PC\.Components\.FilePreview\.retry/,
      }),
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));

    expect(mocks.load).toHaveBeenCalledTimes(3);
    expect(mocks.load.mock.calls[2][1]).toEqual(
      expect.objectContaining({ refresh: true }),
    );
    expect(
      screen.queryByText('PC.Components.FilePreview.alertPreviewFailed'),
    ).toBeNull();
  });

  it('原件下载自身失败时保持错误态，不触发 anchor 下载', async () => {
    mocks.load
      .mockRejectedValueOnce(new Error('Preview load failed'))
      .mockRejectedValueOnce(new Error('Download load failed'));
    const downloadedBlobs = captureDownloadBlobs();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    render(<FilePreview src="/failed-download.pptx" fileType="pptx" />);
    await screen.findByText('PC.Components.FilePreview.alertPreviewFailed');

    fireEvent.click(
      screen.getByRole('button', {
        name: /PC\.Components\.FilePreview\.downloadFile/,
      }),
    );
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    await flushPromises();

    expect(mocks.load.mock.calls[1][1]).toEqual(
      expect.objectContaining({ maxBytes: Number.MAX_SAFE_INTEGER }),
    );
    expect(click).not.toHaveBeenCalled();
    expect(downloadedBlobs).toHaveLength(0);
    expect(
      screen.getByText('PC.Components.FilePreview.alertPreviewFailed'),
    ).toBeInTheDocument();
  });

  it('下载中切换到 B，中止 A 下载且丢弃晚到的原件 bytes', async () => {
    const slowDownload = deferred<ArrayBuffer>();
    mocks.load.mockImplementation(
      (src: string, options: { maxBytes?: number }) => {
        if (src === '/A.pptx') {
          return options.maxBytes === Number.MAX_SAFE_INTEGER
            ? slowDownload.promise
            : Promise.reject(new Error('A preview failed'));
        }
        return Promise.resolve(repairedBuffer);
      },
    );
    mocks.init.mockImplementation((host: HTMLElement) =>
      createRenderer(host, { label: 'B' }),
    );
    const downloadedBlobs = captureDownloadBlobs();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const onRendered = vi.fn();
    const onError = vi.fn();
    const { rerender } = render(
      <FilePreview
        src="/A.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await screen.findByText('PC.Components.FilePreview.alertPreviewFailed');
    fireEvent.click(
      screen.getByRole('button', {
        name: /PC\.Components\.FilePreview\.downloadFile/,
      }),
    );
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    const downloadSignal = mocks.load.mock.calls[1][1].signal as AbortSignal;

    rerender(
      <FilePreview
        src="/B.pptx"
        fileType="pptx"
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));
    await act(async () => slowDownload.resolve(originalBuffer));
    await flushPromises();

    expect(downloadSignal.aborted).toBe(true);
    expect(click).not.toHaveBeenCalled();
    expect(downloadedBlobs).toHaveLength(0);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onRendered).toHaveBeenCalledTimes(1);
    expect(screen.getByText(`B:${SLIDE_ONE}`)).toBeInTheDocument();
    expect(
      screen.queryByText('PC.Components.FilePreview.alertPreviewFailed'),
    ).toBeNull();
  });

  it('同 URL 下载中重试，中止旧下载且迟到 bytes 不能覆盖刷新原件', async () => {
    const slowDownload = deferred<ArrayBuffer>();
    const refreshedBuffer = new Uint8Array([7, 8, 9]).buffer;
    mocks.load
      .mockRejectedValueOnce(new Error('Initial preview failed'))
      .mockImplementationOnce(() => slowDownload.promise)
      .mockResolvedValue(refreshedBuffer);
    mocks.prepare.mockImplementation(async (buffer: ArrayBuffer) =>
      prepareResult([SLIDE_ONE], buffer),
    );
    const downloadedBlobs = captureDownloadBlobs();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const onRendered = vi.fn();
    const onError = vi.fn();
    render(
      <FilePreview
        src="/same.pptx"
        fileType="pptx"
        showDownload
        onRendered={onRendered}
        onError={onError}
      />,
    );
    await screen.findByText('PC.Components.FilePreview.alertPreviewFailed');
    fireEvent.click(
      screen.getByRole('button', {
        name: /PC\.Components\.FilePreview\.downloadFile/,
      }),
    );
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    const downloadSignal = mocks.load.mock.calls[1][1].signal as AbortSignal;

    fireEvent.click(
      screen.getByRole('button', {
        name: /PC\.Components\.FilePreview\.retry/,
      }),
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));
    expect(downloadSignal.aborted).toBe(true);
    await act(async () => slowDownload.resolve(originalBuffer));
    await flushPromises();
    expect(click).not.toHaveBeenCalled();
    expect(downloadedBlobs).toHaveLength(0);

    fireEvent.click(
      screen.getByRole('button', { name: /cloud-download|tooltipDownload/ }),
    );
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));

    expect(mocks.load).toHaveBeenCalledTimes(3);
    expect(downloadedBlobs).toHaveLength(1);
    expect(new Uint8Array(await readBlob(downloadedBlobs[0]))).toEqual(
      new Uint8Array(refreshedBuffer),
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onRendered).toHaveBeenCalledTimes(1);
  });

  it('兼容副本渲染失败时，下载的 bytes 仍是加载的原件', async () => {
    mocks.prepare.mockResolvedValue(prepareResult([SLIDE_ONE], repairedBuffer));
    mocks.init.mockImplementation((host: HTMLElement) =>
      createRenderer(host, { paths: [] }),
    );
    const downloadedBlobs: Blob[] = [];
    const OriginalURL = URL;
    vi.stubGlobal(
      'URL',
      class extends OriginalURL {
        static createObjectURL(blob: Blob | MediaSource) {
          downloadedBlobs.push(blob as Blob);
          return 'blob:original-download';
        }

        static revokeObjectURL = vi.fn();
      },
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<FilePreview src="/original.pptx" fileType="pptx" />);
    await screen.findByText('PC.Components.FilePreview.alertPreviewFailed');

    fireEvent.click(
      screen.getByRole('button', {
        name: /PC\.Components\.FilePreview\.downloadFile/,
      }),
    );

    expect(instances[0].load).toHaveBeenCalledWith(repairedBuffer);
    expect(downloadedBlobs).toHaveLength(1);
    const reader = new FileReader();
    const downloadBuffer = new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
    });
    reader.readAsArrayBuffer(downloadedBlobs[0]);
    expect(new Uint8Array(await downloadBuffer)).toEqual(
      new Uint8Array(originalBuffer),
    );
  });

  it('显式刷新重新加载；普通 resize 不新增下载或兼容处理', async () => {
    const onRendered = vi.fn();
    render(
      <FilePreview
        src="/refresh.pptx"
        fileType="pptx"
        showRefresh
        onRendered={onRendered}
      />,
    );
    await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.prepare).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    await act(async () => {
      triggerResize(640, 480);
      await vi.advanceTimersByTimeAsync(600);
    });
    await flushPromises();
    vi.useRealTimers();

    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(screen.getByText(`PPT:${SLIDE_ONE}`)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /reload|tooltipRefresh/ }),
    );
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mocks.prepare).toHaveBeenCalledTimes(2));
    expect(mocks.load.mock.calls[1][1]).toEqual(
      expect.objectContaining({ refresh: true }),
    );
  });

  it.each(['Blob', 'File', 'ArrayBuffer'] as const)(
    '%s 原样交给统一 loader，而不由组件另开读取路径',
    async (kind) => {
      const src =
        kind === 'Blob'
          ? new Blob([originalBuffer])
          : kind === 'File'
          ? new File([originalBuffer], 'input.pptx')
          : originalBuffer;
      const onRendered = vi.fn();
      render(<FilePreview src={src} fileType="pptx" onRendered={onRendered} />);

      await waitFor(() => expect(onRendered).toHaveBeenCalledTimes(1));

      expect(mocks.load).toHaveBeenCalledWith(
        src,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(mocks.load).toHaveBeenCalledTimes(1);
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
