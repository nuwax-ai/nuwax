import { useWorkspaceDirectoryFiles } from '@/pages/Chat/hooks/useWorkspaceDirectoryFiles';
import {
  mergeDirectoryLevelFiles,
  workspaceNodeId,
} from '@/pages/Chat/utils/fileDataSource';
import { transformFlatListToTree } from '@/utils/appDevUtils';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGetStaticFileList } = vi.hoisted(() => ({
  apiGetStaticFileList: vi.fn(),
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
vi.mock('@/services/vncDesktop', () => ({ apiGetStaticFileList }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('antd', () => ({ message: { error: vi.fn() } }));

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
});
