import WorkspaceDirPickerModal, {
  FsDirEntry,
} from '@/components/ChatInputHome/WorkspaceDirPickerModal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/components/ChatInputHome/WorkspaceDirPickerModal/index.less',
  () => ({
    default: {},
  }),
);
vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => (
    <span data-testid="svg-icon" data-name={name} />
  ),
}));
vi.mock('@/constants/fileTreeImages.constants', () => ({
  ICON_FOLDER: () => <span data-testid="icon-folder" />,
}));
vi.mock('@/utils/fileTree', () => ({
  getFileIcon: (name: string) => (
    <span data-testid="icon-file" data-name={name} />
  ),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/vncDesktop', () => ({
  apiBrowseFsRoots: vi.fn(),
  apiBrowseFsChildren: vi.fn(),
  apiFsMkdir: vi.fn(),
  apiFsRename: vi.fn(),
}));
vi.mock('antd', () => ({
  Modal: ({ open, children, title, footer }: any) =>
    open ? (
      <div>
        <div>{title}</div>
        {children}
        {footer}
      </div>
    ) : null,
  Button: ({ children, onClick, disabled, icon }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  ),
  Input: (props: any) => <input {...props} />,
  Spin: () => <span>loading</span>,
  message: { warning: vi.fn() },
}));

const ROOT: FsDirEntry[] = [{ name: '/', path: '/', isDir: true }];
const CHILDREN: FsDirEntry[] = [
  { name: 'dirA', path: '/dirA', isDir: true },
  { name: 'file.txt', path: '/file.txt', isDir: false },
];

const browse = vi.fn();
const ops = { mkdir: vi.fn(), rename: vi.fn() };

const renderModal = () =>
  render(
    <WorkspaceDirPickerModal
      open
      sandboxId="11"
      onCancel={() => {}}
      onConfirm={() => {}}
      browse={browse}
      ops={ops}
    />,
  );

/** 根视图点进 '/'，落到含 dirA/file.txt 的子目录视图 */
const enterChildrenView = async () => {
  renderModal();
  await screen.findByText('/');
  fireEvent.click(screen.getByText('/'));
  await screen.findByText('dirA');
};

describe('工作目录弹窗 新建/重命名', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    browse.mockImplementation(async (path: string) => (path ? CHILDREN : ROOT));
    ops.mkdir.mockImplementation(async () => {});
    ops.rename.mockImplementation(async () => {});
  });

  it('根视图无写入口，进入目录后出现新建按钮', async () => {
    renderModal();
    await screen.findByText('/');
    expect(
      screen.queryByText('PC.Components.WorkspaceDir.newFolder'),
    ).toBeNull();
    expect(screen.queryByTitle('PC.Components.WorkspaceDir.rename')).toBeNull();

    fireEvent.click(screen.getByText('/'));
    await screen.findByText('dirA');
    expect(
      screen.getByText('PC.Components.WorkspaceDir.newFolder'),
    ).toBeInTheDocument();
  });

  it('新建目录：确认后调 ops.mkdir 并刷新当前列表', async () => {
    await enterChildrenView();
    fireEvent.click(screen.getByText('PC.Components.WorkspaceDir.newFolder'));
    const input = screen.getByPlaceholderText(
      'PC.Components.WorkspaceDir.newFolderPlaceholder',
    );
    fireEvent.change(input, { target: { value: 'newDir' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(ops.mkdir).toHaveBeenCalledWith('/', 'newDir'));
    await waitFor(() => expect(browse).toHaveBeenLastCalledWith('/'));
    // 编辑行已收起
    expect(
      screen.queryByPlaceholderText(
        'PC.Components.WorkspaceDir.newFolderPlaceholder',
      ),
    ).toBeNull();
  });

  it('非法名（含路径分隔符）不发请求且保留输入', async () => {
    await enterChildrenView();
    fireEvent.click(screen.getByText('PC.Components.WorkspaceDir.newFolder'));
    const input = screen.getByPlaceholderText(
      'PC.Components.WorkspaceDir.newFolderPlaceholder',
    );
    fireEvent.change(input, { target: { value: 'a/b' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(ops.mkdir).not.toHaveBeenCalled();
    expect(
      screen.getByPlaceholderText(
        'PC.Components.WorkspaceDir.newFolderPlaceholder',
      ),
    ).toBeInTheDocument();
  });

  it('Esc 取消新建编辑', async () => {
    await enterChildrenView();
    fireEvent.click(screen.getByText('PC.Components.WorkspaceDir.newFolder'));
    const input = screen.getByPlaceholderText(
      'PC.Components.WorkspaceDir.newFolderPlaceholder',
    );
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(ops.mkdir).not.toHaveBeenCalled();
    expect(
      screen.queryByPlaceholderText(
        'PC.Components.WorkspaceDir.newFolderPlaceholder',
      ),
    ).toBeNull();
  });

  it('重命名入口仅目录行提供，文件行没有', async () => {
    await enterChildrenView();
    const renameButtons = screen.getAllByTitle(
      'PC.Components.WorkspaceDir.rename',
    );
    // CHILDREN 里只有 dirA 一个目录
    expect(renameButtons).toHaveLength(1);
  });

  it('重命名确认调 ops.rename 并同步最近目录前缀', async () => {
    localStorage.setItem(
      'workspace_dir_recent_list',
      JSON.stringify(['/dirA/sub', '/other']),
    );
    await enterChildrenView();
    fireEvent.click(screen.getByTitle('PC.Components.WorkspaceDir.rename'));
    const input = screen.getByPlaceholderText(
      'PC.Components.WorkspaceDir.renamePlaceholder',
    );
    fireEvent.change(input, { target: { value: 'dirB' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(ops.rename).toHaveBeenCalledWith('/dirA', 'dirB'),
    );
    await waitFor(() => expect(browse).toHaveBeenLastCalledWith('/'));
    expect(
      JSON.parse(localStorage.getItem('workspace_dir_recent_list') || '[]'),
    ).toEqual(['/dirB/sub', '/other']);
  });
});
