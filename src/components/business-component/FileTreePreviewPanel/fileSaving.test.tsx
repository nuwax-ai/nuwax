import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FileTreePreviewPanel from './index';
import type { FileTreePreviewPanelProps } from './types';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/appDevUtils', () => ({ isPreviewableFile: () => true }));
vi.mock('@/utils/common', () => ({ isMarkdownFile: () => true }));
vi.mock('./FileTreeViewPanel', () => ({ default: () => null }));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('./FilePreviewPathBar/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('./hooks/useFileTreePreviewView', () => ({
  useFileTreePreviewView: vi.fn(),
}));
vi.mock('@/components/business-component/GitVersionRecordPanel', () => ({
  default: () => <input aria-label="git" />,
}));
vi.mock('@/components/business-component/FileTreeGitSourcePanel', () => ({
  default: () => <input aria-label="tree" />,
}));
vi.mock('./hooks/useFileTreePreviewPanel', () => ({
  useFileTreePreviewPanel: () => ({
    header: null,
    content: <textarea aria-label="editor" />,
    restartOverlay: null,
  }),
}));

const makeProps = (
  save = vi.fn().mockResolvedValue(true),
): FileTreePreviewPanelProps =>
  ({
    viewMode: 'preview',
    tree: { isFileTreeVisible: true },
    preview: {
      changeFiles: [],
      fileSaveState: 'error',
      saveCurrentFile: save,
      selectedFileNode: {
        id: 'notes.md',
        name: 'notes.md',
        type: 'file',
        fileProxyUrl: '/notes.md',
      },
      filePathHeaderProps: {
        viewFileType: 'code',
        onViewFileTypeChange: vi.fn(),
      },
      refreshSelectedFileContent: vi.fn(),
    },
    bottomContent: <input aria-label="terminal" />,
  } as unknown as FileTreePreviewPanelProps);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('文件保存入口', () => {
  it.each(['MacIntel', 'Win32', 'Linux x86_64'])(
    '%s 保存快捷键仅在文件预览区消费',
    (platform) => {
      vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
      const props = makeProps();
      render(<FileTreePreviewPanel {...props} />);
      const modifiers = /mac/i.test(platform)
        ? { metaKey: true }
        : { ctrlKey: true };
      expect(
        fireEvent.keyDown(screen.getByRole('textbox', { name: 'editor' }), {
          key: 's',
          ...modifiers,
        }),
      ).toBe(false);
      expect(props.preview.saveCurrentFile).toHaveBeenCalledOnce();
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'tree' }), {
        key: 's',
        ...modifiers,
      });
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'terminal' }), {
        key: 's',
        ...modifiers,
      });
      expect(props.preview.saveCurrentFile).toHaveBeenCalledOnce();
    },
  );

  it('桌面和差异模式不截取快捷键；保存失败时保留重试并阻止覆盖刷新', () => {
    const props = makeProps();
    const { rerender } = render(<FileTreePreviewPanel {...props} />);
    const refresh = screen.getByRole('button', {
      name: 'PC.Components.FilePreview.tooltipRefresh',
    });
    expect(refresh).toBeDisabled();
    fireEvent.click(refresh);
    expect(props.preview.refreshSelectedFileContent).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.saveFile',
      }),
    );
    expect(props.preview.saveCurrentFile).toHaveBeenCalledOnce();
    rerender(<FileTreePreviewPanel {...props} viewMode="desktop" />);
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'editor' }), {
      key: 's',
      metaKey: true,
      ctrlKey: true,
    });
    rerender(<FileTreePreviewPanel {...props} diffFile={{} as any} />);
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'editor' }), {
      key: 's',
      metaKey: true,
      ctrlKey: true,
    });
    expect(props.preview.saveCurrentFile).toHaveBeenCalledOnce();
    rerender(
      <FileTreePreviewPanel
        {...props}
        preview={{ ...props.preview, fileSaveState: 'saved' }}
      />,
    );
    expect(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.saveFile',
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: 'PC.Components.FilePreview.tooltipRefresh',
      }),
    ).not.toBeDisabled();
  });
});
