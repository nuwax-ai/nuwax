import { collectUnloadedExpandedFolders } from '@/components/business-component/FileTreeGitSourcePanel/FileTreePanel/FileTree/utils';
import { useChatFiles } from '@/pages/Chat/hooks/useChatFiles';
import { useWorkspaceDirectoryFiles } from '@/pages/Chat/hooks/useWorkspaceDirectoryFiles';
import {
  mergeDirectoryLevelFiles,
  workspaceNodeId,
} from '@/pages/Chat/utils/fileDataSource';
import { transformFlatListToTree } from '@/utils/appDevUtils';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGetStaticFileList, apiUpdateStaticFile } = vi.hoisted(() => ({
  apiGetStaticFileList: vi.fn(),
  apiUpdateStaticFile: vi.fn(),
}));

vi.mock('@/constants/agent.constants', () => ({
  isAgentVersionControlEnabled: () => false,
}));
vi.mock('@/constants/appDevConstants', () => ({
  FILE_CONSTANTS: {
    IGNORED_FILE_PATTERNS: [],
    FALLBACK_SIZE: 0,
  },
}));
vi.mock('@/services/vncDesktop', () => ({
  apiGetStaticFileList,
  apiUpdateStaticFile,
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
vi.mock('@/utils/ant-custom', () => ({
  modalConfirm: (_title: unknown, _content: unknown, onOk: () => void) =>
    onOk(),
}));
vi.mock('@/utils/fileTree', () => ({
  updateFilesListContent: vi.fn(),
  updateFilesListName: vi.fn(),
}));
vi.mock('@/utils/index', () => ({ checkFileSizeExceedLimit: vi.fn() }));
vi.mock('lodash/debounce', () => ({ default: (fn: unknown) => fn }));
vi.mock('antd', () => ({
  message: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

interface WorkspaceFile {
  name: string;
  fileId: string;
  dataSourceId: string;
  relativePath: string;
  isDir: boolean;
}

const file = (name: string, isDir: boolean): WorkspaceFile => ({
  name,
  fileId: workspaceNodeId(name),
  dataSourceId: 'workspace',
  relativePath: name,
  isDir,
});

describe('工作区文件树异步懒加载', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('重新进入会话时始终先加载根目录文件', async () => {
    sessionStorage.setItem('nuwax:workspace-files:2592', 'src/components');
    apiGetStaticFileList.mockResolvedValue({
      code: '0000',
      data: {
        recursive: false,
        files: [
          { name: 'src', isDir: true },
          { name: 'markdown-style-test.md', isDir: false },
        ],
      },
    });

    const { result } = renderHook(() => useWorkspaceDirectoryFiles(2592));

    await waitFor(() =>
      expect(apiGetStaticFileList).toHaveBeenCalledWith(2592, {
        relativePath: '',
        recursive: false,
      }),
    );
    await waitFor(() =>
      expect(result.current.files.map((item) => item.name)).toContain(
        'markdown-style-test.md',
      ),
    );
  });

  it('加载下一级时保留父级并把新节点挂到父级下', () => {
    const rootFiles = [file('src', true), file('README.md', false)];
    const loadedFiles = mergeDirectoryLevelFiles(
      rootFiles,
      [file('src/components', true), file('src/index.ts', false)],
      'src',
    );

    const tree = transformFlatListToTree(loadedFiles, false);
    const src = tree.find((node) => node.id === workspaceNodeId('src'));

    expect(tree.map((node) => node.name)).toEqual(['src', 'README.md']);
    expect(src?.children?.map((node) => node.name)).toEqual([
      'components',
      'index.ts',
    ]);
  });

  it('继续加载更深目录时保留完整祖先链', () => {
    const loadedFiles = mergeDirectoryLevelFiles(
      mergeDirectoryLevelFiles(
        [file('src', true)],
        [file('src/components', true)],
        'src',
      ),
      [file('src/components/Button.tsx', false)],
      'src/components',
    );

    const tree = transformFlatListToTree(loadedFiles, false);
    const components = tree[0]?.children?.[0];

    expect(tree[0]).toMatchObject({ name: 'src', type: 'folder' });
    expect(components).toMatchObject({ name: 'components', type: 'folder' });
    expect(components?.children?.[0]).toMatchObject({
      name: 'Button.tsx',
      type: 'file',
    });
  });

  it('刷新父目录时清理已删除目录及其已加载后代', () => {
    const loadedFiles = [
      file('src', true),
      file('src/components', true),
      file('src/components/Button.tsx', false),
      file('README.md', false),
    ];

    const refreshedFiles = mergeDirectoryLevelFiles(
      loadedFiles,
      [file('README.md', false)],
      '',
    );

    expect(refreshedFiles.map((item) => item.name)).toEqual(['README.md']);
  });

  it('支持按指定父目录刷新删除节点所在层级', async () => {
    apiGetStaticFileList
      .mockResolvedValueOnce({
        code: '0000',
        data: {
          recursive: false,
          files: [{ name: 'src', isDir: true }],
        },
      })
      .mockResolvedValueOnce({
        code: '0000',
        data: {
          recursive: false,
          files: [{ name: 'src/index.ts', isDir: false }],
        },
      });

    const { result } = renderHook(() => useWorkspaceDirectoryFiles(2592));
    await waitFor(() => expect(result.current.files).toHaveLength(1));

    await act(async () => result.current.refresh('src'));

    expect(apiGetStaticFileList).toHaveBeenLastCalledWith(2592, {
      relativePath: 'src',
      recursive: false,
    });
  });

  it('父目录刷新后同步清理已删除目录的加载记录', async () => {
    apiGetStaticFileList
      .mockResolvedValueOnce({
        code: '0000',
        data: {
          recursive: false,
          files: [{ name: 'src', isDir: true }],
        },
      })
      .mockResolvedValueOnce({
        code: '0000',
        data: {
          recursive: false,
          files: [{ name: 'src/index.ts', isDir: false }],
        },
      })
      .mockResolvedValueOnce({
        code: '0000',
        data: { recursive: false, files: [] },
      });

    const { result } = renderHook(() => useWorkspaceDirectoryFiles(2592));
    await waitFor(() => expect(result.current.files).toHaveLength(1));
    await act(async () => result.current.loadDirectory('src'));
    expect(result.current.loadedDirectoryPaths.has('src')).toBe(true);

    await act(async () => result.current.refresh(''));

    expect(result.current.files).toEqual([]);
    expect(result.current.loadedDirectoryPaths.has('src')).toBe(false);
  });

  it('缓存恢复后识别仍展开但尚未加载的目录', () => {
    const expandedSrc = {
      id: workspaceNodeId('src'),
      name: 'src',
      type: 'folder' as const,
      path: 'src',
      relativePath: 'src',
      children: [
        {
          id: workspaceNodeId('src/index.ts'),
          name: 'index.ts',
          type: 'file' as const,
          path: 'src/index.ts',
        },
      ],
    };

    expect(
      collectUnloadedExpandedFolders(
        [{ ...expandedSrc, children: [] }],
        new Set([workspaceNodeId('src')]),
        new Set(),
      ),
    ).toEqual([{ id: workspaceNodeId('src'), path: 'src' }]);
    expect(
      collectUnloadedExpandedFolders(
        [expandedSrc],
        new Set([workspaceNodeId('src')]),
        new Set([workspaceNodeId('src')]),
      ),
    ).toEqual([]);
  });

  it('删除目录后刷新被删除节点的父目录', async () => {
    apiUpdateStaticFile.mockResolvedValue({ code: '0000' });
    const handleRefreshFileList = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useChatFiles({
        id: 2592,
        fileTreeData: [],
        handleRefreshFileList,
      }),
    );

    await act(async () => {
      await result.current.handleDeleteFile({
        id: 'src/components',
        name: 'components',
        type: 'folder',
        path: 'src/components',
        parentPath: 'src',
      });
    });

    expect(handleRefreshFileList).toHaveBeenCalledWith(2592, 'src');
  });

  // ── 首拉门控（「打开文件树面板才拉」：新会话 file-list 不先于 chat）──

  it('enabled=false 挂载不预发 file-list，面板打开（enabled 翻 true）才拉根层', async () => {
    apiGetStaticFileList.mockResolvedValue({
      code: '0000',
      data: { recursive: false, files: [] },
    });

    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useWorkspaceDirectoryFiles(2592, { enabled }),
      { initialProps: { enabled: false } },
    );

    await act(async () => {});
    expect(apiGetStaticFileList).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await waitFor(() =>
      expect(apiGetStaticFileList).toHaveBeenCalledWith(2592, {
        relativePath: '',
        recursive: false,
      }),
    );
  });

  it('refreshAllLoaded：根层与已加载子目录一并重拉（「打开的目录不刷新」修复）', async () => {
    apiGetStaticFileList
      .mockResolvedValueOnce({
        code: '0000',
        data: {
          recursive: false,
          files: [
            { name: 'src', isDir: true },
            { name: 'README.md', isDir: false },
          ],
        },
      })
      .mockResolvedValueOnce({
        code: '0000',
        data: {
          recursive: false,
          files: [{ name: 'src/index.ts', isDir: false }],
        },
      })
      .mockResolvedValueOnce({
        code: '0000',
        data: {
          recursive: false,
          files: [
            { name: 'src', isDir: true },
            { name: 'README.md', isDir: false },
            { name: 'new.md', isDir: false },
          ],
        },
      })
      .mockResolvedValueOnce({
        code: '0000',
        data: {
          recursive: false,
          files: [
            { name: 'src/index.ts', isDir: false },
            { name: 'src/new-file.ts', isDir: false },
          ],
        },
      });

    const { result } = renderHook(() => useWorkspaceDirectoryFiles(2592));
    await waitFor(() => expect(result.current.files).toHaveLength(2));

    await act(async () => {
      await result.current.loadDirectory('src');
    });
    await waitFor(() =>
      expect(result.current.loadedDirectoryPaths.has('src')).toBe(true),
    );

    await act(async () => {
      result.current.refreshAllLoaded();
    });

    // 根层与已加载的 src 都被重拉（请求序列：首拉根 → 展开 src → 全量刷新两条）
    const requestedPaths = apiGetStaticFileList.mock.calls.map(
      (call) => (call[1] as { relativePath: string }).relativePath,
    );
    expect(requestedPaths).toEqual(['', 'src', '', 'src']);
    // 新文件进入列表（无需整页刷新）
    await waitFor(() =>
      expect(result.current.files.map((item) => item.name)).toContain('new.md'),
    );
    expect(result.current.files.map((item) => item.name)).toContain(
      'src/new-file.ts',
    );
  });
});
