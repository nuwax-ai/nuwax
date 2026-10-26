import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { message } from 'antd';
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
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('本机文件操作入口', () => {
  it('只有已验证引用展示系统打开和文件夹定位，并通过adapter调用', async () => {
    const { rerender } = render(<LocalFileActions />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<LocalFileActions reference={ref} />);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.openInSystem',
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'PC.Components.FilePreview.revealInFolder',
        }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.revealInFolder',
      }),
    );
    expect(api.open).toHaveBeenCalledWith(ref);
    expect(api.reveal).toHaveBeenCalledWith(ref);
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'PC.Components.FilePreview.openInSystem',
        }),
      ).not.toBeDisabled(),
    );
  });

  it('系统操作等待期间不重复投递，失效错误可见并允许重试', async () => {
    let reject!: (error: unknown) => void;
    api.open.mockImplementationOnce(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    );
    const error = vi
      .spyOn(message, 'error')
      .mockImplementation(() => (() => {}) as any);
    render(<LocalFileActions reference={ref} />);
    const open = screen.getByRole('button', {
      name: 'PC.Components.FilePreview.openInSystem',
    });
    const reveal = screen.getByRole('button', {
      name: 'PC.Components.FilePreview.revealInFolder',
    });
    fireEvent.click(open);
    fireEvent.click(open);
    fireEvent.click(reveal);
    expect(api.open).toHaveBeenCalledOnce();
    expect(api.reveal).not.toHaveBeenCalled();
    expect(open).toBeDisabled();
    await act(async () => reject({ code: 'expired' }));
    expect(error).toHaveBeenCalledWith(
      'PC.Components.FilePreview.localSourceChanged',
    );
    expect(open).not.toBeDisabled();
    await act(async () => fireEvent.click(open));
    expect(api.open).toHaveBeenCalledTimes(2);
  });

  it('切换文件后旧操作完成不能解除新文件的等待状态', async () => {
    const finish: Array<(value: boolean) => void> = [];
    api.open.mockImplementation(
      () => new Promise<boolean>((resolve) => finish.push(resolve)),
    );
    const { rerender } = render(<LocalFileActions reference={ref} />);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.openInSystem',
      }),
    );
    rerender(<LocalFileActions reference={{ ...ref, path: 'other.md' }} />);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.openInSystem',
      }),
    );
    expect(api.open).toHaveBeenCalledTimes(2);
    await act(async () => finish[0](true));
    expect(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.revealInFolder',
      }),
    ).toBeDisabled();
    await act(async () => finish[1](true));
    expect(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.revealInFolder',
      }),
    ).not.toBeDisabled();
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
