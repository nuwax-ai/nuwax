import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  FileTreePreviewViewProps,
  FileTreePreviewViewValue,
} from '../types';
import { useFileTreePreviewView } from './useFileTreePreviewView';

const mocks = vi.hoisted(() => ({
  fetchContent: vi.fn(),
  previewMount: vi.fn(),
}));

vi.mock('@/components/business-component/FilePreview', async () => {
  const { useEffect } = await import('react');
  const MockFilePreview = (props: {
    src: string;
    content?: string;
    fileType: string;
    refreshKey?: number | string;
  }) => {
    useEffect(() => {
      mocks.previewMount(props.fileType);
    }, []);
    return (
      <div
        data-testid="preview"
        data-src={props.src}
        data-content={props.content}
        data-refresh={props.refreshKey}
      />
    );
  };
  return { default: MockFilePreview };
});
vi.mock('@/components/business-component/AppDevEmptyState', () => ({
  default: () => null,
}));
vi.mock('@/components/business-component/OpenUiArtifactView', () => ({
  OpenUiRuntimeFrame: () => null,
}));
vi.mock('@/components/CodeViewer', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="code">{content}</div>
  ),
}));
vi.mock('@/components/custom/Loading', () => ({ default: () => null }));
vi.mock('@/pages/AppDev/components', () => ({ ImageViewer: () => null }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/skill', () => ({
  fetchContentFromUrl: mocks.fetchContent,
}));
vi.mock(
  '@/components/business-component/FileTreeGitSourcePanel/services/git-version-management',
  () => ({
    apiGitStatus: vi.fn(),
  }),
);
vi.mock('@/utils', () => ({ checkFileSizeExceedLimit: vi.fn() }));
vi.mock('@/utils/fileTree', () => ({
  downloadFileByUrl: vi.fn(),
  updateFileProxyUrl: vi.fn(),
  updateFileTreeName: vi.fn(),
  updateFileTreeContent: (id: string, content: string, nodes: any[]) =>
    nodes.map((node) => (node.id === id ? { ...node, content } : node)),
}));

let view: FileTreePreviewViewValue;
const files = [
  { name: 'first.md', fileProxyUrl: '/static/first.md', contents: 'cached' },
  { name: 'second.md', fileProxyUrl: '/static/second.md' },
  { name: 'movie.mp4', fileProxyUrl: '/static/movie.mp4' },
  { name: 'empty.md', contents: '' },
];

const Harness = (props: FileTreePreviewViewProps) => {
  view = useFileTreePreviewView({
    originalFiles: files,
    targetId: 'one',
    ...props,
  });
  return <>{view.preview.renderPreviewContent()}</>;
};

const selectFile = async (name: string) => {
  await act(async () => {
    await view.tree.handleFileSelect(name);
  });
};

beforeEach(() => {
  vi.stubEnv('BASE_URL', '');
  mocks.fetchContent.mockReset().mockResolvedValue('latest content');
  mocks.previewMount.mockClear();
  vi.spyOn(Date, 'now').mockReturnValue(1000);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('Markdown 文件树刷新', () => {
  it('显式 preview 初始模式也由预览组件唯一加载 Markdown', async () => {
    render(<Harness initViewFileType="preview" />);
    await selectFile('first.md');
    expect(
      screen.getByTestId('preview').getAttribute('data-content'),
    ).toBeNull();
    expect(mocks.fetchContent).not.toHaveBeenCalled();
  });

  it('目录/工具刷新只通知预览加载，保持同一 Markdown 实例和滚动位置', async () => {
    const { rerender } = render(<Harness />);
    await selectFile('first.md');
    const preview = screen.getByTestId('preview');
    preview.scrollTop = 450;
    const initialRefresh = preview.getAttribute('data-refresh');

    for (let trigger = 1; trigger <= 5; trigger += 1) {
      vi.mocked(Date.now).mockReturnValue(1000 + trigger);
      rerender(
        <Harness fileTreeRefreshTrigger={trigger} originalFiles={[...files]} />,
      );
    }

    expect(screen.getByTestId('preview')).toBe(preview);
    expect(preview.scrollTop).toBe(450);
    expect(preview.getAttribute('data-src')).toBe('/static/first.md');
    expect(preview.getAttribute('data-content')).toBeNull();
    expect(preview.getAttribute('data-refresh')).not.toBe(initialRefresh);
    expect(mocks.previewMount).toHaveBeenCalledTimes(1);
    expect(mocks.fetchContent).not.toHaveBeenCalled();
  });

  it('代码视图仍读取正文，回到预览时不把缓存正文交给远程 Markdown', async () => {
    render(<Harness />);
    await selectFile('first.md');
    await act(async () => {
      await view.preview.filePathHeaderProps.onViewFileTypeChange?.('code');
    });
    expect(mocks.fetchContent).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('code').textContent).toBe('latest content');

    await act(async () => {
      await view.preview.filePathHeaderProps.onViewFileTypeChange?.('preview');
    });
    expect(
      screen.getByTestId('preview').getAttribute('data-content'),
    ).toBeNull();
    expect(mocks.fetchContent).toHaveBeenCalledTimes(1);
  });

  it('切换文件后到达的旧代码请求不会刷新或覆盖新 Markdown', async () => {
    let resolveContent!: (value: string) => void;
    mocks.fetchContent.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          resolveContent = resolve;
        }),
    );
    render(<Harness />);
    await selectFile('first.md');
    let pending: unknown;
    act(() => {
      pending = view.preview.filePathHeaderProps.onViewFileTypeChange?.('code');
    });
    await selectFile('second.md');
    const preview = screen.getByTestId('preview');
    const refresh = preview.getAttribute('data-refresh');

    await act(async () => {
      resolveContent('old first.md response');
      await pending;
    });
    expect(screen.getByTestId('preview')).toBe(preview);
    expect(preview.getAttribute('data-refresh')).toBe(refresh);
    expect(preview.getAttribute('data-src')).toBe('/static/second.md');
    expect(view.preview.selectedFileId).toBe('second.md');
    expect(view.preview.selectedFileNode?.content).not.toBe(
      'old first.md response',
    );
  });

  it('跨会话的同路径文件使用新实例，空内联 Markdown 保持显式空正文', async () => {
    const { rerender } = render(<Harness />);
    await selectFile('first.md');
    const first = screen.getByTestId('preview');
    rerender(<Harness targetId="two" originalFiles={[...files]} />);
    await selectFile('first.md');
    expect(screen.getByTestId('preview')).not.toBe(first);

    await selectFile('empty.md');
    expect(screen.getByTestId('preview').getAttribute('data-content')).toBe('');
    expect(mocks.fetchContent).not.toHaveBeenCalled();
  });

  it('媒体仍通过新 URL 和组件实例刷新', async () => {
    const { rerender } = render(<Harness />);
    await selectFile('movie.mp4');
    const initial = screen.getByTestId('preview');
    vi.mocked(Date.now).mockReturnValue(2000);
    rerender(<Harness fileTreeRefreshTrigger={1} />);
    expect(screen.getByTestId('preview')).not.toBe(initial);
    expect(screen.getByTestId('preview').getAttribute('data-src')).toBe(
      '/static/movie.mp4?t=2000',
    );
    expect(mocks.fetchContent).not.toHaveBeenCalled();
  });
});

describe('文件夹选中', () => {
  it('打开目录时仍记下选中文件夹，供高亮和工具栏新建使用', async () => {
    const onOpenDirectory = vi.fn();
    render(
      <Harness
        originalFiles={[
          {
            name: 'docs',
            isDir: true,
            fileId: 'workspace:docs',
            dataSourceId: 'workspace',
            relativePath: 'docs',
          },
        ]}
        onOpenDirectory={onOpenDirectory}
      />,
    );

    await act(async () => {
      await view.tree.handleFileSelect('workspace:docs', {
        selectFolder: true,
      });
    });

    expect(onOpenDirectory).toHaveBeenCalledTimes(1);
    expect(view.tree.selectedFolderId).toBe('workspace:docs');
    expect(view.preview.selectedFileId).toBe('');
  });
});

describe('懒加载嵌套自动选中（abandon 竞态修复）', () => {
  /** 根层仅目录节点：嵌套目标必然不在已加载层，且模糊匹配零候选 */
  const rootOnly = [
    {
      name: 'docs',
      isDir: true,
      fileId: 'workspace:docs',
      dataSourceId: 'workspace',
      relativePath: 'docs',
    },
  ];
  const withReport = [
    ...rootOnly,
    {
      name: 'docs/report.md',
      isDir: false,
      fileId: 'workspace:docs/report.md',
      dataSourceId: 'workspace',
      relativePath: 'docs/report.md',
      fileProxyUrl: '/static/docs/report.md',
    },
  ];
  /** fileId（workspace: 前缀）→ 父目录相对路径（与 Chat 页谓词同口径） */
  const parentDirOf = (fileId: string) =>
    fileId
      .replace(/^workspace:/, '')
      .split('/')
      .slice(0, -1)
      .join('/');

  it('父目录导航在途：不误判 miss，目录层到达后完成选中', async () => {
    const missing = vi.fn();
    const loadedDirs = new Set<string>(['']);
    const predicate = (fileId: string) => loadedDirs.has(parentDirOf(fileId));
    const { rerender } = render(
      <Harness
        originalFiles={rootOnly}
        taskAgentSelectedFileId="workspace:docs/report.md"
        taskAgentSelectTrigger={1}
        isAutoSelectDirectoryLoaded={predicate}
        onSelectedFileMissing={missing}
      />,
    );
    await act(async () => {});
    // 目标父目录 docs 尚未加载：保持等待，不通知 miss、不清空目标
    expect(missing).not.toHaveBeenCalled();

    // 父目录数据到达（navigate 完成），目标出现在树中 → 自动选中成功
    loadedDirs.add('docs');
    rerender(
      <Harness
        originalFiles={withReport}
        taskAgentSelectedFileId="workspace:docs/report.md"
        taskAgentSelectTrigger={1}
        isAutoSelectDirectoryLoaded={predicate}
        onSelectedFileMissing={missing}
      />,
    );
    await waitFor(() =>
      expect(view.preview.selectedFileId).toBe('workspace:docs/report.md'),
    );
    expect(missing).not.toHaveBeenCalled();
  });

  it('父目录已加载仍不命中：维持旧语义判 miss（onSelectedFileMissing）', async () => {
    const missing = vi.fn();
    render(
      <Harness
        originalFiles={rootOnly}
        taskAgentSelectedFileId="workspace:docs/report.md"
        taskAgentSelectTrigger={1}
        isAutoSelectDirectoryLoaded={() => true}
        onSelectedFileMissing={missing}
      />,
    );
    await act(async () => {});
    expect(missing).toHaveBeenCalledWith('workspace:docs/report.md');
  });

  it('未传谓词（全量树宿主）：不命中即判 miss（旧行为不变）', async () => {
    const missing = vi.fn();
    render(
      <Harness
        originalFiles={rootOnly}
        taskAgentSelectedFileId="workspace:docs/report.md"
        taskAgentSelectTrigger={1}
        onSelectedFileMissing={missing}
      />,
    );
    await act(async () => {});
    expect(missing).toHaveBeenCalledWith('workspace:docs/report.md');
  });

  it('不在已加载树中时用搜索结果的 fileProxyUrl 打开，不判 miss', async () => {
    const missing = vi.fn();
    const resolveAutoSelectFile = vi.fn().mockResolvedValue({
      id: 'workspace:docs/report.md',
      name: 'report.md',
      type: 'file',
      path: 'docs/report.md',
      relativePath: 'docs/report.md',
      fileProxyUrl: '/static/docs/report.md',
    });
    render(
      <Harness
        originalFiles={rootOnly}
        taskAgentSelectedFileId="workspace:docs/report.md"
        taskAgentSelectTrigger={1}
        isAutoSelectDirectoryLoaded={() => true}
        resolveAutoSelectFile={resolveAutoSelectFile}
        onSelectedFileMissing={missing}
      />,
    );
    await waitFor(() =>
      expect(view.preview.selectedFileId).toBe('workspace:docs/report.md'),
    );
    expect(resolveAutoSelectFile).toHaveBeenCalledWith(
      'workspace:docs/report.md',
    );
    expect(missing).not.toHaveBeenCalled();
  });
});
