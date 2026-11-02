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
  init: vi.fn(),
  prepareLocalPreview: vi.fn(),
}));
vi.mock('@/features/client-shell/localFileService', () => ({
  getLocalFileReference: () => undefined,
  getLocalFilesContextKey: () => 'ctx',
  useLocalFilesRevision: () => 0,
  prepareLocalFilePreview: mocks.prepareLocalPreview,
  saveLocalFile: vi.fn(),
}));
vi.mock('@/services/filePreview', () => ({
  loadFilePreviewBuffer: mocks.load,
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
vi.mock('@/constants/common.constants', () => ({ SANDBOX: '' }));
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
vi.mock('@js-preview/pdf', () => ({ default: { init: mocks.init } }));
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

const buffer = new Uint8Array([37, 80, 68, 70]).buffer;
let layout = { width: 800, height: 600 };
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
  disconnect() {
    observers.delete(this.state);
  }
}
const resize = async (width: number, height: number) => {
  layout = { width, height };
  await act(async () => {
    Array.from(observers).forEach(({ callback, targets }) => {
      callback(
        Array.from(targets, (target) => ({
          target,
          contentRect: { width, height },
        })) as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
    });
  });
};
const flush = async () => {
  await act(async () => {
    for (let index = 0; index < 8; index += 1) await Promise.resolve();
  });
};
type PdfOptions = {
  width: number;
  onRendered: () => void;
  onError: (error: Error) => void;
};
const previews: Array<ReturnType<typeof vi.fn>> = [];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.load.mockReset().mockResolvedValue(buffer);
  mocks.prepareLocalPreview.mockReset().mockResolvedValue(null);
  mocks.init
    .mockReset()
    .mockImplementation((host: HTMLElement, options: PdfOptions) => {
      const preview = vi.fn(() => {
        host.textContent = 'PDF page';
        options.onRendered();
      });
      previews.push(preview);
      return { preview, destroy: vi.fn() };
    });
  previews.length = 0;
  observers.clear();
  layout = { width: 800, height: 600 };
  vi.stubGlobal('ResizeObserver', PreviewResizeObserver);
  // jsdom 无布局引擎；模拟隐藏容器和真实面板尺寸，避免让插件用零宽初始化。
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.style.display === 'none' ? 0 : layout.width;
    },
  );
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.style.display === 'none' ? 0 : layout.height;
    },
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('FilePreview PDF 首次打开与恢复', () => {
  it('推断 PDF 类型后，先提交可布局容器，再把已读取的 bytes 交给插件', async () => {
    const { container } = render(<FilePreview src="/old-report.pdf" />);
    await waitFor(() => expect(screen.getByText('PDF page')).toBeVisible());

    expect(mocks.load).toHaveBeenCalledWith('/old-report.pdf', {
      signal: expect.any(AbortSignal),
      refresh: false,
      maxBytes: Number.MAX_SAFE_INTEGER,
    });
    expect(mocks.init).toHaveBeenCalledTimes(1);
    expect(mocks.init.mock.calls[0][1].width).toBe(800);
    expect(mocks.init.mock.calls[0][1]).toMatchObject({
      CMapReaderFactory: expect.any(Function),
      useWorkerFetch: false,
    });
    expect(previews[0]).toHaveBeenCalledWith(buffer);
    expect(container.querySelector('.previewContent')).toHaveStyle({
      display: 'block',
      visibility: 'visible',
    });
  });

  it('面板首次打开为零尺寸时等待布局，显示后直接完成预览，不需要刷新页面', async () => {
    layout = { width: 0, height: 0 };
    render(<FilePreview src="/existing.pdf" fileType="pdf" />);
    await flush();
    expect(mocks.init).not.toHaveBeenCalled();
    expect(mocks.load).toHaveBeenCalledTimes(1);

    await resize(800, 600);
    await waitFor(() => expect(screen.getByText('PDF page')).toBeVisible());
    expect(mocks.init).toHaveBeenCalledTimes(1);
    expect(mocks.load).toHaveBeenCalledTimes(1);
  });

  it('等待面板布局时切换文件会取消旧请求，只初始化当前文件', async () => {
    layout = { width: 0, height: 0 };
    const newerBuffer = new Uint8Array([37, 80, 68, 70, 50]).buffer;
    mocks.load.mockResolvedValueOnce(buffer).mockResolvedValueOnce(newerBuffer);
    const { rerender } = render(<FilePreview src="/A.pdf" fileType="pdf" />);
    await flush();
    const signal = mocks.load.mock.calls[0][1].signal as AbortSignal;
    rerender(<FilePreview src="/B.pdf" fileType="pdf" />);
    await flush();
    expect(signal.aborted).toBe(true);

    await resize(800, 600);
    await waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));
    expect(previews[0]).toHaveBeenCalledWith(newerBuffer);
  });

  it('等待布局时关闭预览会释放观察器，稍后显示也不再初始化 PDF', async () => {
    layout = { width: 0, height: 0 };
    const { unmount } = render(<FilePreview src="/A.pdf" fileType="pdf" />);
    await flush();
    const signal = mocks.load.mock.calls[0][1].signal as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
    expect(observers.size).toBe(0);

    await resize(800, 600);
    expect(mocks.init).not.toHaveBeenCalled();
  });

  it('读取失败显示重试；用户重试才重新读取并绕过旧缓存', async () => {
    mocks.load.mockRejectedValueOnce(new Error('Unable to load file preview.'));
    const onError = vi.fn();
    render(
      <FilePreview src="/existing.pdf" fileType="pdf" onError={onError} />,
    );
    await waitFor(() =>
      expect(
        screen.getByText('PC.Components.FilePreview.alertPreviewFailed'),
      ).toBeVisible(),
    );
    await flush();
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.init).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /FilePreview.retry/ }));
    await waitFor(() => expect(screen.getByText('PDF page')).toBeVisible());
    expect(mocks.load).toHaveBeenCalledTimes(2);
    expect(mocks.load.mock.calls[1][1].refresh).toBe(true);
  });

  it('请求未结束时切换文件，迟到的旧数据不能初始化旧 PDF', async () => {
    let resolveOld!: (value: ArrayBuffer) => void;
    mocks.load.mockReturnValueOnce(
      new Promise<ArrayBuffer>((resolve) => {
        resolveOld = resolve;
      }),
    );
    const { rerender } = render(<FilePreview src="/A.pdf" fileType="pdf" />);
    await flush();
    const signal = mocks.load.mock.calls[0][1].signal as AbortSignal;
    rerender(<FilePreview src="/B.pdf" fileType="pdf" />);
    await waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));
    expect(signal.aborted).toBe(true);

    await act(async () => resolveOld(buffer));
    await flush();
    expect(mocks.init).toHaveBeenCalledTimes(1);
  });

  it.each([
    { name: '远程 URL', source: 'https://files.example.com/existing.pdf' },
    { name: 'File', source: new File([buffer], 'existing.pdf') },
    { name: 'ArrayBuffer', source: buffer },
  ])(
    '$name PDF 保留原容量口径，不新增读取服务的 50MiB 上限',
    async ({ source }) => {
      render(<FilePreview src={source} fileType="pdf" />);
      await waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));

      // 只检查选项，小 fixture 即可证明没有给原支持的来源增加默认上限。
      expect(mocks.load).toHaveBeenCalledWith(source, {
        signal: expect.any(AbortSignal),
        refresh: false,
        maxBytes: Number.MAX_SAFE_INTEGER,
      });
    },
  );

  it('本机授权 PDF 保留原读取服务的容量保护', async () => {
    const grant = {
      url: 'nuwax-local://grant/existing.pdf',
      baseUrl: 'nuwax-local://grant/',
      release: vi.fn(),
    };
    mocks.prepareLocalPreview.mockResolvedValueOnce(grant);
    render(
      <FilePreview
        src="/api/computer/static/9/existing.pdf"
        fileType="pdf"
        localFile={{ contextId: 'ctx', cId: '9', path: 'existing.pdf' }}
      />,
    );
    await waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));

    expect(mocks.load).toHaveBeenCalledWith(grant.url, {
      signal: expect.any(AbortSignal),
      refresh: false,
    });
  });

  it('等待布局时外部刷新会取消旧等待，面板展开后只呈现刷新后的预览', async () => {
    layout = { width: 0, height: 0 };
    const { rerender } = render(<FilePreview src="/A.pdf" fileType="pdf" />);
    await flush();
    const signal = mocks.load.mock.calls[0][1].signal as AbortSignal;
    rerender(<FilePreview src="/A.pdf" fileType="pdf" refreshKey={1} />);
    await flush();
    expect(signal.aborted).toBe(true);
    expect(mocks.load).toHaveBeenCalledTimes(2);
    expect(mocks.load.mock.calls[1][1].refresh).toBe(true);
    expect(mocks.init).not.toHaveBeenCalled();

    await resize(800, 600);
    await waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));
    expect(screen.getByText('PDF page')).toBeVisible();
  });
});
