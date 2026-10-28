import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  FileTreePreviewViewProps,
  FileTreePreviewViewValue,
} from '../types';
import { useFileTreePreviewView } from './useFileTreePreviewView';

const mocks = vi.hoisted(() => ({
  fetchContent: vi.fn(),
  previewMount: vi.fn(),
  localReference: vi.fn(),
  assertReference: vi.fn(),
  download: vi.fn(),
  save: vi.fn(),
  editor: null as any,
}));
vi.mock('@/features/client-shell/localFileService', () => ({
  getLocalFileReference: mocks.localReference,
  assertLocalFileReferenceCurrent: mocks.assertReference,
  useLocalFilesRevision: () => 0,
  isAbsoluteFileUrl: (url: string) =>
    /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//'),
  saveLocalFile: mocks.save,
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
  default: ({ description }: { description?: string }) => (
    <div>{description}</div>
  ),
}));
vi.mock('@/components/business-component/OpenUiArtifactView', () => ({
  OpenUiRuntimeFrame: () => <div data-testid="openui" />,
}));
vi.mock('@/components/CodeViewer', () => ({
  default: (props: any) => {
    mocks.editor = props;
    return (
      <div data-testid="code" data-readonly={props.readOnly}>
        {props.content}
      </div>
    );
  },
}));
vi.mock('@/components/custom/Loading', () => ({ default: () => null }));
vi.mock('@/pages/AppDev/components', () => ({ ImageViewer: () => null }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/vncDesktop', () => ({ apiUpdateStaticFile: vi.fn() }));
vi.mock('@/services/skill', () => ({
  fetchContentFromUrl: mocks.fetchContent,
  isPreviewFileTooLargeError: (error: unknown) =>
    error instanceof Error && error.name === 'PreviewFileTooLargeError',
}));
vi.mock(
  '@/components/business-component/FileTreeGitSourcePanel/services/git-version-management',
  () => ({
    apiGitStatus: vi.fn(),
  }),
);
vi.mock('@/utils', () => ({ checkFileSizeExceedLimit: vi.fn() }));
vi.mock('@/utils/fileTree', () => ({
  downloadFileByUrl: mocks.download,
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
  mocks.localReference.mockReset().mockReturnValue(undefined);
  mocks.assertReference.mockReset();
  mocks.download.mockReset();
  mocks.save.mockReset();
  mocks.editor = null;
  vi.spyOn(Date, 'now').mockReturnValue(1000);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('Markdown 文件树刷新', () => {
  it('切换来源后旧写入回执不能覆盖新来源的编辑状态', async () => {
    const finishes: Array<(saved: boolean) => void> = [];
    const save = vi.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finishes.push(resolve);
        }),
    );
    const props = {
      initViewFileType: 'code' as const,
      readOnly: false,
      onSaveFileContent: save,
    };
    const { rerender } = render(<Harness {...props} />);
    await selectFile('first.md');
    act(() => mocks.editor.onContentChange('first.md', 'old source draft'));
    rerender(<Harness {...props} targetId="two" originalFiles={[...files]} />);
    await selectFile('first.md');
    act(() => mocks.editor.onContentChange('first.md', 'new source draft'));
    await act(async () => finishes[0](true));
    expect(view.preview.fileSaveState).toBe('saving');
    expect(screen.getByTestId('code')).toHaveTextContent('new source draft');
    await act(async () => finishes[1](true));
    expect(view.preview.fileSaveState).toBe('saved');
  });

  it('删除前串行完成草稿，等待期间禁止继续编辑旧路径', async () => {
    const finishes: Array<(saved: boolean) => void> = [];
    let deleted!: (success: boolean) => void;
    const save = vi.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finishes.push(resolve);
        }),
    );
    const remove = vi.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          deleted = resolve;
        }),
    );
    render(
      <Harness
        initViewFileType="code"
        readOnly={false}
        onSaveFileContent={save}
        onDeleteFile={remove}
      />,
    );
    await selectFile('first.md');
    act(() => mocks.editor.onContentChange('first.md', 'draft'));
    let pending!: Promise<void>;
    act(() => {
      pending = view.tree.handleDelete(view.preview.selectedFileNode!);
    });
    expect(save).toHaveBeenLastCalledWith(
      'first.md',
      'draft',
      expect.any(String),
      { immediate: true },
    );
    expect(remove).not.toHaveBeenCalled();
    expect(mocks.editor.readOnly).toBe(true);
    act(() => mocks.editor.onContentChange('first.md', 'blocked edit'));
    expect(save).toHaveBeenCalledTimes(2);
    await act(async () => finishes.forEach((finish) => finish(true)));
    expect(remove).toHaveBeenCalledOnce();
    await act(async () => {
      deleted(true);
      await pending;
    });
    expect(view.preview.selectedFileNode).toBeNull();
  });

  it('重命名前保存失败保留草稿并阻止路径变化', async () => {
    const save = vi.fn().mockResolvedValue(false);
    const rename = vi.fn();
    vi.spyOn(message, 'error').mockImplementation(() => (() => {}) as any);
    render(
      <Harness
        initViewFileType="code"
        readOnly={false}
        onSaveFileContent={save}
        onRenameFile={rename}
      />,
    );
    await selectFile('first.md');
    await act(async () => mocks.editor.onContentChange('first.md', 'draft'));
    await act(async () =>
      view.tree.handleRenameFile(view.preview.selectedFileNode!, 'new.md'),
    );
    expect(rename).not.toHaveBeenCalled();
    expect(mocks.editor.readOnly).toBe(false);
    expect(screen.getByTestId('code')).toHaveTextContent('draft');
    expect(view.preview.fileSaveState).toBe('error');
  });

  it('保存实际完成前保留草稿，失败显示重试，手动保存走同一回执', async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    render(
      <Harness
        initViewFileType="code"
        readOnly={false}
        onSaveFileContent={save}
      />,
    );
    await selectFile('first.md');
    await act(async () => mocks.editor.onContentChange('first.md', 'draft'));
    expect(view.preview.fileSaveState).toBe('error');
    expect(screen.getByTestId('code')).toHaveTextContent('draft');
    expect(
      view.preview.changeFiles.some((file) => file.fileContent === 'draft'),
    ).toBe(true);
    await act(async () => {
      expect(await view.preview.saveCurrentFile?.()).toBe(true);
    });
    expect(save).toHaveBeenLastCalledWith(
      'first.md',
      'draft',
      expect.any(String),
      { immediate: true },
    );
    expect(view.preview.fileSaveState).toBe('saved');
    expect(
      view.preview.changeFiles.some((file) => file.fileId === 'first.md'),
    ).toBe(false);
  });
  it('旧保存回执不能把较新草稿标为已保存', async () => {
    const finishes: Array<(value: boolean) => void> = [];
    const save = vi.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finishes.push(resolve);
        }),
    );
    render(
      <Harness
        initViewFileType="code"
        readOnly={false}
        onSaveFileContent={save}
      />,
    );
    await selectFile('first.md');
    act(() => mocks.editor.onContentChange('first.md', 'first draft'));
    act(() => mocks.editor.onContentChange('first.md', 'latest draft'));
    await act(async () => finishes[0](true));
    expect(view.preview.fileSaveState).toBe('saving');
    expect(screen.getByTestId('code')).toHaveTextContent('latest draft');
    await act(async () => finishes[1](true));
    expect(view.preview.fileSaveState).toBe('saved');
  });
  it('回到初始内容也会覆盖在途旧输入，避免撤销后磁盘仍是旧草稿', async () => {
    const finishes: Array<(value: boolean) => void> = [];
    const save = vi.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finishes.push(resolve);
        }),
    );
    render(
      <Harness
        initViewFileType="code"
        readOnly={false}
        onSaveFileContent={save}
      />,
    );
    await selectFile('first.md');
    const original = mocks.editor.content;
    act(() => mocks.editor.onContentChange('first.md', 'draft'));
    act(() => mocks.editor.onContentChange('first.md', original));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(
      'first.md',
      original,
      expect.any(String),
      undefined,
    );
    await act(async () => {
      finishes.forEach((finish) => finish(true));
    });
    expect(view.preview.fileSaveState).toBe('saved');
    expect(screen.getByTestId('code')).toHaveTextContent(original);
  });
  it('写入拒绝保留草稿；刷新页面前有未保存提示，保存后解除提示', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(true);
    render(
      <Harness
        initViewFileType="code"
        readOnly={false}
        onSaveFileContent={save}
      />,
    );
    await selectFile('first.md');
    await act(async () => mocks.editor.onContentChange('first.md', 'draft'));
    expect(view.preview.fileSaveState).toBe('error');
    const before = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(before);
    expect(before.defaultPrevented).toBe(true);
    await act(async () => {
      await view.preview.saveCurrentFile?.();
    });
    const after = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });

  it('本机链接文件可以预览、刷新和读取代码视图', async () => {
    const reference = { contextId: 'live', cId: '9', path: 'linked.md' };
    render(
      <Harness
        targetId="9"
        originalFiles={[
          {
            name: 'linked.md',
            isDir: false,
            isLink: true,
            fileProxyUrl: '/api/computer/static/9/linked.md',
            localFile: reference,
          },
        ]}
      />,
    );
    await selectFile('linked.md');
    expect(screen.getByTestId('preview')).toBeInTheDocument();
    const refresh = Number(screen.getByTestId('preview').dataset.refresh);
    await act(async () => {
      await view.preview.refreshSelectedFileContent();
    });
    expect(
      Number(screen.getByTestId('preview').dataset.refresh),
    ).toBeGreaterThan(refresh);
    await act(async () => {
      await view.preview.filePathHeaderProps.onViewFileTypeChange?.('code');
    });
    await waitFor(() =>
      expect(mocks.fetchContent).toHaveBeenCalledWith(
        '/api/computer/static/9/linked.md',
        reference,
      ),
    );
    expect(screen.getByTestId('code')).toHaveTextContent('latest content');
    expect(screen.getByTestId('code')).toHaveAttribute('data-readonly', 'true');
  });

  it.each([
    ['linked.html', 'preview'],
    ['linked.openui.json', 'openui'],
  ])('本机链接 %s 可进入对应预览', async (name, testId) => {
    render(
      <Harness
        targetId="9"
        originalFiles={[
          {
            name,
            isLink: true,
            fileProxyUrl: `/api/computer/static/9/${name}`,
            localFile: { contextId: 'live', cId: '9', path: name },
          },
        ]}
      />,
    );
    await selectFile(name);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it('旧桥或远端链接仍保留既有不支持预览行为', async () => {
    render(
      <Harness
        originalFiles={[
          {
            name: 'linked.md',
            isLink: true,
            fileProxyUrl: '/static/linked.md',
          },
        ]}
      />,
    );
    await selectFile('linked.md');
    expect(
      screen.getByText('PC.Components.FileTreeView.unsupportedFormat'),
    ).toBeInTheDocument();
    expect(mocks.previewMount).not.toHaveBeenCalled();
    expect(mocks.fetchContent).not.toHaveBeenCalled();
  });

  const oldReference = { contextId: 'old-context', cId: '9', path: 'first.md' };
  const oldLocalFiles = [
    {
      name: 'first.md',
      fileProxyUrl: '/api/computer/static/9/first.md',
      localFile: oldReference,
    },
  ];
  const expired = () =>
    Object.assign(new Error('expired'), { name: 'LocalFileAccessError' });
  it.each(['clear', 'switch'])(
    '代码视图刷新在 %s 后仍携带旧引用，错误不换成云端或新root正文',
    async (change) => {
      let valid = true;
      const cloudOrNewRootRead = vi.fn();
      mocks.fetchContent.mockImplementation(
        async (_url: string, reference?: typeof oldReference) => {
          if (reference !== oldReference) {
            cloudOrNewRootRead();
            return '新root正文';
          }
          if (!valid) throw expired();
          return '旧本机正文';
        },
      );
      vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <Harness
          targetId="9"
          originalFiles={oldLocalFiles}
          initViewFileType="code"
        />,
      );
      await selectFile('first.md');
      expect(screen.getByTestId('code')).toHaveTextContent('旧本机正文');
      valid = false;
      mocks.localReference.mockReturnValue(
        change === 'switch'
          ? { ...oldReference, contextId: 'new-context' }
          : undefined,
      );
      await act(async () => {
        await view.preview.refreshSelectedFileContent();
      });
      expect(mocks.fetchContent).toHaveBeenLastCalledWith(
        '/api/computer/static/9/first.md',
        oldReference,
      );
      expect(screen.getByText('expired')).toBeInTheDocument();
      expect(cloudOrNewRootRead).not.toHaveBeenCalled();
      expect(screen.queryByText('新root正文')).toBeNull();
    },
  );

  it.each(['clear', 'switch'])(
    'PDF导出在 %s 后拒绝旧引用并提示expired，不继续空正文转换',
    async (change) => {
      const toast = vi
        .spyOn(message, 'error')
        .mockImplementation(() => undefined as never);
      render(<Harness targetId="9" originalFiles={oldLocalFiles} />);
      await selectFile('first.md');
      mocks.assertReference.mockImplementation(() => {
        throw expired();
      });
      mocks.localReference.mockReturnValue(
        change === 'switch'
          ? { ...oldReference, contextId: 'new-context' }
          : undefined,
      );
      await act(async () => {
        await view.preview.filePathHeaderProps.onExportPdf?.(
          view.preview.selectedFileNode!,
        );
      });
      expect(mocks.assertReference).toHaveBeenCalledWith(oldReference);
      expect(mocks.fetchContent).not.toHaveBeenCalled();
      expect(mocks.download).not.toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith('expired');
    },
  );

  it('PDF读取期间失效会停止导出并提示expired，不把失败转为空文档', async () => {
    const toast = vi
      .spyOn(message, 'error')
      .mockImplementation(() => undefined as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.fetchContent.mockRejectedValue(expired());
    render(<Harness targetId="9" originalFiles={oldLocalFiles} />);
    await selectFile('first.md');
    await act(async () => {
      await view.preview.filePathHeaderProps.onExportPdf?.(
        view.preview.selectedFileNode!,
      );
    });
    expect(mocks.fetchContent).toHaveBeenCalledWith(
      '/api/computer/static/9/first.md',
      oldReference,
    );
    expect(mocks.download).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith('expired');
  });
  it('确定本机的代码读取失败直接显示权限错误，不显示空编辑器', async () => {
    const error = new Error('权限不足');
    error.name = 'LocalFileAccessError';
    mocks.fetchContent.mockRejectedValue(error);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Harness initViewFileType="code" />);
    await selectFile('first.md');
    expect(screen.getByText('权限不足')).toBeInTheDocument();
    expect(screen.queryByTestId('code')).toBeNull();
    expect(mocks.fetchContent).toHaveBeenCalledOnce();
  });
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

  it('折叠文件夹只保留选中态，不请求这一层文件列表', async () => {
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
        openDirectory: false,
      });
    });

    expect(onOpenDirectory).not.toHaveBeenCalled();
    expect(view.tree.selectedFolderId).toBe('workspace:docs');
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
  /** fileId（workspace: 前缀）→ 父目录相对路径（与 Chat 页谓词同口径） */
  const parentDirOf = (fileId: string) =>
    fileId
      .replace(/^workspace:/, '')
      .split('/')
      .slice(0, -1)
      .join('/');

  it('父目录导航在途：不从已加载列表打开，先用搜索结果选中', async () => {
    const missing = vi.fn();
    const resolveAutoSelectFile = vi.fn().mockResolvedValue({
      id: 'workspace:docs/report.md',
      name: 'report.md',
      type: 'file',
      path: 'docs/report.md',
      relativePath: 'docs/report.md',
      fileProxyUrl: '/static/docs/report.md',
    });
    const loadedDirs = new Set<string>(['']);
    const predicate = (fileId: string) => loadedDirs.has(parentDirOf(fileId));
    render(
      <Harness
        originalFiles={rootOnly}
        taskAgentSelectedFileId="workspace:docs/report.md"
        taskAgentSelectTrigger={1}
        isAutoSelectDirectoryLoaded={predicate}
        resolveAutoSelectFile={resolveAutoSelectFile}
        onSelectedFileMissing={missing}
      />,
    );
    await act(async () => {});
    // 目标父目录尚未加载：不判 miss，也不从根目录列表里模糊匹配
    expect(missing).not.toHaveBeenCalled();
    expect(resolveAutoSelectFile).toHaveBeenCalledWith(
      'workspace:docs/report.md',
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
