import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const translations = vi.hoisted(() => ({ table: '表格' }));
const local = vi.hoisted(() => ({
  reference: vi.fn(),
  prepare: vi.fn(),
  save: vi.fn(),
}));
vi.mock('@/features/client-shell/localFileService', () => ({
  useLocalFilesRevision: () => 0,
  getLocalFileReference: local.reference,
  getLocalFilesContextKey: () => 'ctx',
  prepareLocalFilePreview: local.prepare,
  retryLocalFilesContext: vi.fn(),
  saveLocalFile: local.save,
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) =>
    key === 'PC.Components.MarkdownRenderer.tableCodeBlock'
      ? translations.table
      : key,
}));

// 保留真实解析器与插件，只统计昂贵的全文解析入口。
vi.mock('react-markdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-markdown')>();
  return { ...actual, default: vi.fn(actual.default) };
});

vi.mock('@js-preview/docx', () => ({ default: { init: vi.fn() } }));
vi.mock('@js-preview/excel', () => ({ default: { init: vi.fn() } }));
vi.mock('@js-preview/pdf', () => ({ default: { init: vi.fn() } }));
vi.mock('pptx-preview', () => ({ init: vi.fn() }));
vi.mock('@js-preview/docx/lib/index.css', () => ({}));
vi.mock('@js-preview/excel/lib/index.css', () => ({}));
vi.mock('ds-markdown/katex.css', () => ({}));
vi.mock('@/components/MarkdownRenderer/ds-markdown.css', () => ({}));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

vi.mock('ds-markdown', () => ({
  CodeBlockWrap: ({
    title,
    children,
  }: {
    title: ReactNode;
    children: ReactNode;
  }) => (
    <section>
      {title}
      {children}
    </section>
  ),
  CodeBlockActions: ({ codeContent }: { codeContent: string }) => (
    <button type="button" aria-label="复制代码" data-code={codeContent} />
  ),
  HighlightCode: ({ code, language }: { code: string; language: string }) => (
    <pre data-language={language}>{code}</pre>
  ),
}));

import jsPreviewExcel from '@js-preview/excel';
import ReactMarkdown from 'react-markdown';
import FilePreview from './index';

const documentContent = [
  '# 文档预览',
  '',
  '| 项目 | 状态 |',
  '| --- | --- |',
  '| 编辑 | 完成 |',
  '',
  'H<sub>2</sub>O',
  '',
  '$x^2$',
  '',
  '```typescript',
  'const value = 1;',
  '```',
  '',
  '![图例](./diagram.png)',
].join('\n');

const previewProps = {
  src: '/document.md',
  fileType: 'markdown' as const,
  content: documentContent,
  staticFileBasePath: '/workspace',
};

const settlePreview = async () => {
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  local.reference.mockReturnValue(undefined);
  local.prepare.mockResolvedValue(null);
  local.save.mockResolvedValue(false);
  translations.table = '表格';
  vi.stubGlobal('fetch', vi.fn());
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('FilePreview 本机流式预览', () => {
  const reference = { contextId: 'ctx', cId: '9', path: 'docs/report.md' };
  const grant = {
    url: 'nuwax-local://grant/docs/report.md',
    baseUrl: 'nuwax-local://grant/',
    bytes: 60 * 1024 * 1024,
    release: vi.fn(),
  };
  beforeEach(() => {
    local.reference.mockReturnValue(reference);
    local.prepare.mockResolvedValue(grant);
    grant.release.mockClear();
  });

  it('大媒体直接使用授权地址，HTML仅允许脚本与同源且不使用srcDoc', async () => {
    const { container, rerender } = render(
      <FilePreview src="/api/computer/static/9/video.mp4" fileType="video" />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector('video source')).toHaveAttribute(
      'src',
      grant.url,
    );
    expect(fetch).not.toHaveBeenCalled();
    rerender(
      <FilePreview
        src="/api/computer/static/9/page.html"
        content="旧缓存"
        fileType="html"
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    const frame = screen.getByTitle('HTML Preview');
    expect(frame).toHaveAttribute('src', grant.url);
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
    expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(frame).not.toHaveAttribute('srcdoc');
    expect(grant.release).toHaveBeenCalledOnce();
  });

  it('Markdown图片相对本机文件解析，授权scheme通过Markdown安全URL转换', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        '![邻居](images/a.png)\n![上级](../b.png)\n<img src="./raw.png" alt="HTML图" />',
      ),
    );
    render(
      <FilePreview
        src="/api/computer/static/9/docs/report.md"
        content="旧缓存"
        fileType="markdown"
      />,
    );
    await settlePreview();
    expect(screen.getByAltText('邻居')).toHaveAttribute(
      'src',
      'nuwax-local://grant/docs/images/a.png',
    );
    expect(screen.getByAltText('上级')).toHaveAttribute(
      'src',
      'nuwax-local://grant/b.png',
    );
    expect(screen.getByAltText('HTML图')).toHaveAttribute(
      'src',
      'nuwax-local://grant/docs/raw.png',
    );
    expect(fetch).toHaveBeenCalledWith(
      grant.url,
      expect.objectContaining({ credentials: 'omit' }),
    );
    expect(screen.queryByText('旧缓存')).not.toBeInTheDocument();
  });

  it('本机 Markdown 内的同会话静态图片也改走授权来源', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        '![本机](/api/computer/static/9/images/a.png)\n![绝对](https://business.example/api/computer/static/9/images/b.png)',
      ),
    );
    render(
      <FilePreview
        src="/api/computer/static/9/docs/report.md"
        fileType="markdown"
      />,
    );
    await settlePreview();
    expect(screen.getByAltText('本机')).toHaveAttribute(
      'src',
      'nuwax-local://grant/images/a.png',
    );
    expect(screen.getByAltText('绝对')).toHaveAttribute(
      'src',
      'nuwax-local://grant/images/b.png',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      grant.url,
      expect.objectContaining({ credentials: 'omit' }),
    );
  });

  it('空目录参数沿用默认根，显式根交给原生协议校验', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        '![空根](/api/computer/static/9/images/a.png?customTargetDir=)\n![显式根](/api/computer/static/9/images/b.png?customTargetDir=%2Fwork)\n![其他会话](/api/computer/static/10/secret.png)',
      ),
    );
    render(
      <FilePreview
        src="/api/computer/static/9/docs/report.md"
        fileType="markdown"
      />,
    );
    await settlePreview();
    expect(screen.getByAltText('空根')).toHaveAttribute(
      'src',
      'nuwax-local://grant/images/a.png?customTargetDir=',
    );
    expect(screen.getByAltText('显式根')).toHaveAttribute(
      'src',
      'nuwax-local://grant/api/computer/static/9/images/b.png?customTargetDir=%2Fwork',
    );
    expect(screen.getByAltText('其他会话')).toHaveAttribute('src', '');
  });

  it('下载取消由宿主消费，不创建浏览器下载或错误', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    const onError = vi.fn();
    render(
      <FilePreview
        src="/api/computer/static/9/docs/report.md"
        fileType="image"
        showDownload
        onError={onError}
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole('button', { name: /download/ }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(local.save).toHaveBeenCalledOnce();
    expect(click).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    click.mockRestore();
  });
});

describe('FilePreview Markdown 渲染隔离', () => {
  it('显示状态和连续父级更新不重复解析，保留文档节点与滚动位置', async () => {
    const { container, rerender } = render(<FilePreview {...previewProps} />);
    await settlePreview();

    const table = screen.getByRole('table');
    const scrollContainer = container.querySelector('.ds-markdown')!;
    scrollContainer.scrollTop = 120;
    expect(scrollContainer).toHaveStyle({ visibility: 'visible' });

    for (let revision = 1; revision <= 13; revision += 1) {
      // 强制外层重渲染，覆盖目录状态、布局和回调引用变化。
      rerender(
        <FilePreview
          {...previewProps}
          className={`revision-${revision}`}
          style={{ width: '100%' }}
          onRendered={() => {}}
        />,
      );
    }
    await settlePreview();

    expect(ReactMarkdown).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('table')).toBe(table);
    expect(scrollContainer.scrollTop).toBe(120);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('正文变化只新增一次解析，且保留表格、HTML、公式与代码展示', async () => {
    const { container, rerender } = render(<FilePreview {...previewProps} />);
    await settlePreview();

    expect(screen.getByRole('columnheader', { name: '项目' })).toBeVisible();
    expect(container.querySelector('sub')).toHaveTextContent('2');
    expect(container.querySelector('.katex')).toBeInTheDocument();
    expect(
      container.querySelector('pre[data-language="typescript"]'),
    ).toHaveTextContent('const value = 1;');
    expect(
      screen
        .getAllByRole('button', { name: '复制代码' })
        .some((button) =>
          button.getAttribute('data-code')?.includes('| 编辑 | 完成 |'),
        ),
    ).toBe(true);

    vi.mocked(ReactMarkdown).mockClear();
    const content = `${documentContent}\n\n## 新内容`;
    rerender(<FilePreview {...previewProps} content={content} />);
    await settlePreview();

    expect(screen.getByRole('heading', { name: '新内容' })).toBeVisible();
    expect(ReactMarkdown).toHaveBeenCalledTimes(1);

    rerender(<FilePreview {...previewProps} content={content} />);
    await settlePreview();
    expect(ReactMarkdown).toHaveBeenCalledTimes(1);
  });

  it('图片基础路径变化使正文缓存失效', async () => {
    const { rerender } = render(<FilePreview {...previewProps} />);
    await settlePreview();
    expect(screen.getByAltText('图例')).toHaveAttribute(
      'src',
      '/workspace/diagram.png',
    );

    vi.mocked(ReactMarkdown).mockClear();
    rerender(
      <FilePreview {...previewProps} staticFileBasePath="/other-workspace" />,
    );
    await settlePreview();

    expect(screen.getByAltText('图例')).toHaveAttribute(
      'src',
      '/other-workspace/diagram.png',
    );
    expect(ReactMarkdown).toHaveBeenCalledTimes(1);
  });

  it('子目录 Markdown 的相对图片按文件所在目录解析，绝对路径仍接工作区根', async () => {
    const content = [
      '![相对](images/fig-01.png)',
      '![当前](./images/fig-02.png)',
      '![上级](../images/fig-03.png)',
      '![根绝对](/images/root.png)',
      '![外链](https://example.com/a.png)',
    ].join('\n');
    render(
      <FilePreview
        src="/api/computer/static/9/docs/核心实现架构图.md"
        fileType="markdown"
        content={content}
        staticFileBasePath="/api/computer/static/9"
      />,
    );
    await settlePreview();

    expect(screen.getByAltText('相对')).toHaveAttribute(
      'src',
      '/api/computer/static/9/docs/images/fig-01.png',
    );
    expect(screen.getByAltText('当前')).toHaveAttribute(
      'src',
      '/api/computer/static/9/docs/images/fig-02.png',
    );
    expect(screen.getByAltText('上级')).toHaveAttribute(
      'src',
      '/api/computer/static/9/images/fig-03.png',
    );
    expect(screen.getByAltText('根绝对')).toHaveAttribute(
      'src',
      '/api/computer/static/9/images/root.png',
    );
    expect(screen.getByAltText('外链')).toHaveAttribute(
      'src',
      'https://example.com/a.png',
    );
  });

  it('词典更新后表格标签同步变化', async () => {
    const { rerender } = render(<FilePreview {...previewProps} />);
    await settlePreview();
    expect(screen.getByText('表格')).toBeVisible();

    translations.table = 'Table';
    rerender(<FilePreview {...previewProps} />);
    await settlePreview();

    expect(screen.getByText('Table')).toBeVisible();
    expect(screen.queryByText('表格')).not.toBeInTheDocument();
  });
});

const responseWith = (content: string) =>
  ({ ok: true, text: async () => content } as Response);

const deferredResponse = () => {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('FilePreview Markdown 后台刷新', () => {
  const remoteProps = { src: '/document.md', fileType: 'markdown' as const };

  it('每个刷新信号只读取一次，同一正文保留 DOM、可见性和滚动位置', async () => {
    vi.mocked(fetch).mockResolvedValue(responseWith(documentContent));
    const { container, rerender } = render(
      <FilePreview {...remoteProps} refreshKey={0} />,
    );
    await settlePreview();
    const table = screen.getByRole('table');
    const scrollContainer = container.querySelector('.ds-markdown')!;
    scrollContainer.scrollTop = 120;

    const pending = deferredResponse();
    vi.mocked(fetch).mockReturnValueOnce(pending.promise);
    rerender(<FilePreview {...remoteProps} refreshKey={1} />);
    expect(screen.getByRole('table')).toBe(table);
    expect(scrollContainer).toHaveStyle({ visibility: 'visible' });
    expect(
      screen.queryByText('PC.Components.FilePreview.loadingPreview'),
    ).toBeNull();

    await act(async () => pending.resolve(responseWith(documentContent)));
    await settlePreview();
    rerender(<FilePreview {...remoteProps} refreshKey={1} />);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('/document.md', {
      signal: expect.any(AbortSignal),
      cache: 'no-cache',
    });
    expect(ReactMarkdown).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('table')).toBe(table);
    expect(scrollContainer.scrollTop).toBe(120);
  });

  it('真实正文变化只解析一次，空文件正确清空且不额外下载', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(responseWith(documentContent));
    const { container, rerender } = render(
      <FilePreview {...remoteProps} refreshKey={0} />,
    );
    await settlePreview();

    vi.mocked(fetch).mockResolvedValueOnce(responseWith('# 更新正文'));
    rerender(<FilePreview {...remoteProps} refreshKey={1} />);
    await settlePreview();
    expect(screen.getByRole('heading', { name: '更新正文' })).toBeVisible();
    expect(ReactMarkdown).toHaveBeenCalledTimes(2);

    vi.mocked(fetch).mockResolvedValueOnce(responseWith(''));
    rerender(<FilePreview {...remoteProps} refreshKey={2} />);
    await settlePreview();
    expect(container.querySelector('.ds-markdown')).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(
      screen.queryByText('PC.Components.FilePreview.loadingPreview'),
    ).toBeNull();
  });

  it('显式传入空正文时不退回远端下载，也支持无 URL 的内联 Markdown', async () => {
    const { rerender } = render(<FilePreview {...previewProps} />);
    await settlePreview();
    rerender(<FilePreview {...previewProps} content="" />);
    await settlePreview();
    expect(screen.queryByRole('heading', { name: '文档预览' })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();

    rerender(<FilePreview fileType="markdown" content="# 内联正文" />);
    await settlePreview();
    expect(screen.getByRole('heading', { name: '内联正文' })).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('刷新失败后重试显示加载状态，并能恢复同一文档', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(responseWith(documentContent));
    const { rerender } = render(
      <FilePreview {...remoteProps} refreshKey={0} />,
    );
    await settlePreview();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);
    rerender(<FilePreview {...remoteProps} refreshKey={1} />);
    await settlePreview();
    expect(
      screen.getByText('PC.Components.FilePreview.alertPreviewFailed'),
    ).toBeVisible();

    const pending = deferredResponse();
    vi.mocked(fetch).mockReturnValueOnce(pending.promise);
    rerender(<FilePreview {...remoteProps} refreshKey={2} />);
    expect(
      screen.getByText('PC.Components.FilePreview.loadingPreview'),
    ).toBeVisible();
    expect(
      screen.queryByText('PC.Components.FilePreview.alertPreviewFailed'),
    ).toBeNull();
    await act(async () => pending.resolve(responseWith(documentContent)));
    await settlePreview();
    expect(screen.getByRole('heading', { name: '文档预览' })).toBeVisible();
  });

  it('切换文件和连续刷新都丢弃晚到的旧响应', async () => {
    const first = deferredResponse();
    const second = deferredResponse();
    const third = deferredResponse();
    vi.mocked(fetch)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    const { rerender, unmount } = render(
      <FilePreview {...remoteProps} refreshKey={0} />,
    );
    const firstSignal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    rerender(<FilePreview {...remoteProps} src="/other.md" refreshKey={0} />);
    expect(firstSignal?.aborted).toBe(true);
    const secondSignal = vi.mocked(fetch).mock.calls[1][1]?.signal;
    rerender(<FilePreview {...remoteProps} src="/other.md" refreshKey={1} />);
    expect(secondSignal?.aborted).toBe(true);

    await act(async () => third.resolve(responseWith('# 最新正文')));
    await settlePreview();
    // 模拟底层即使收到 abort，已进入读取阶段的旧请求仍晚到。
    await act(async () => {
      second.resolve(responseWith('# 过期刷新'));
      first.resolve(responseWith('# 上个文件'));
    });
    await settlePreview();
    expect(screen.getByRole('heading', { name: '最新正文' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: '过期刷新' })).toBeNull();
    expect(screen.queryByRole('heading', { name: '上个文件' })).toBeNull();
    expect(ReactMarkdown).toHaveBeenCalledTimes(1);
    const lastSignal = vi.mocked(fetch).mock.calls[2][1]?.signal;
    unmount();
    expect(lastSignal?.aborted).toBe(true);
  });
});

describe('FilePreview xlsx', () => {
  it('预览成功时把原文件交给插件，不替换成另一份数据', async () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
    const preview = vi.fn().mockResolvedValue(undefined);
    vi.mocked(jsPreviewExcel.init).mockReturnValue({
      preview,
      destroy: vi.fn(),
      fileData: buffer,
      workbookDataSource: [],
      mediasSource: [],
    });

    render(<FilePreview src={buffer} fileType="xlsx" />);
    await settlePreview();

    expect(preview).toHaveBeenCalledTimes(1);
    expect(preview.mock.calls[0][0]).toBe(buffer);
  });
});
