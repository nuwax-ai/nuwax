import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FileContextMenu from '../FileTreeGitSourcePanel/FileTreePanel/FileContextMenu';
import LocalFileActions from './LocalFileActions';

const api = vi.hoisted(() => ({
  open: vi.fn(),
  reveal: vi.fn(),
  reference: vi.fn(),
}));
vi.mock('@/features/client-shell/localFileService', () => ({
  openLocalFile: api.open,
  revealLocalFile: api.reveal,
  getLocalFileReference: api.reference,
  useLocalFilesRevision: () => 0,
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));
vi.mock('@/utils/common', () => ({
  isMarkdownFile: (name: string) => name.endsWith('.md'),
}));
vi.mock(
  '../FileTreeGitSourcePanel/FileTreePanel/FileContextMenu/index.less',
  () => ({ default: new Proxy({}, { get: (_, key) => String(key) }) }),
);
const ref = { contextId: 'ctx', cId: '9', path: 'notes.md' };
beforeEach(() => {
  vi.resetAllMocks();
  api.open.mockResolvedValue(true);
  api.reveal.mockResolvedValue(true);
});
afterEach(cleanup);

describe('本机文件操作入口', () => {
  it('只有已验证引用展示系统打开和文件夹定位，并通过adapter调用', () => {
    const { rerender } = render(<LocalFileActions />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<LocalFileActions reference={ref} />);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.openInSystem',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.revealInFolder',
      }),
    );
    expect(api.open).toHaveBeenCalledWith(ref);
    expect(api.reveal).toHaveBeenCalledWith(ref);
  });

  it('文件树菜单本机显示操作，远端隐藏；点击关闭菜单', () => {
    const close = vi.fn();
    const props = {
      visible: true,
      position: { x: 20, y: 20 },
      targetNode: {
        id: 'notes.md',
        name: 'notes.md',
        path: 'notes.md',
        type: 'file' as const,
        fileProxyUrl: '/api/computer/static/9/notes.md',
      },
      onClose: close,
      onDelete: vi.fn(),
    };
    const { rerender } = render(<FileContextMenu {...props} />);
    expect(
      screen.queryByText('PC.Components.FilePreview.openInSystem'),
    ).toBeNull();
    api.reference.mockReturnValue(ref);
    rerender(<FileContextMenu {...props} />);
    fireEvent.click(
      screen.getByText('PC.Components.FilePreview.revealInFolder'),
    );
    expect(api.reveal).toHaveBeenCalledWith(ref);
    expect(close).toHaveBeenCalledOnce();
  });
});
