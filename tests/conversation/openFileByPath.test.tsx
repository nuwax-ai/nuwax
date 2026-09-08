import OpenFileByPath from '@/components/business-component/FileTreeGitSourcePanel/FileTreePanel/OpenFileByPath';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/filePathPreview', () => ({
  loadFilePathPreview: load,
  FilePathPreviewError: class extends Error {},
}));
vi.mock('@/components/business-component/FilePreview', () => ({
  default: ({ src }: { src: File }) => (
    <div data-testid="preview">{src.name}</div>
  ),
}));

const props = {
  conversationId: 12,
  sourceId: 'workspace',
  currentPath: 'docs',
};
const open = () =>
  fireEvent.click(
    screen.getByRole('button', { name: /PC.Components.PathPreview.open/ }),
  );
const submit = () =>
  fireEvent.click(
    screen.getByRole('button', { name: 'PC.Components.PathPreview.preview' }),
  );
afterEach(() => {
  cleanup();
  load.mockReset();
});

describe('按路径打开弹窗', () => {
  it('初值为当前层路径；失败可重试，空文件仍进入预览', async () => {
    load
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(new File([], '.gitignore'));
    render(<OpenFileByPath {...props} />);
    open();
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('docs/');
    fireEvent.change(input, { target: { value: '.gitignore' } });
    submit();
    await screen.findByText('PC.Components.PathPreview.error.load');
    submit();
    expect(await screen.findByTestId('preview')).toHaveTextContent(
      '.gitignore',
    );
    expect(load.mock.calls[1][0]).toEqual({
      conversationId: 12,
      path: '.gitignore',
      customTargetDir: undefined,
    });
  });

  it('切换数据源取消在途请求，旧结果不能在新数据源显示', async () => {
    let resolve!: (file: File) => void;
    load.mockImplementationOnce(
      () =>
        new Promise<File>((done) => {
          resolve = done;
        }),
    );
    const view = render(<OpenFileByPath {...props} />);
    open();
    submit();
    const signal = load.mock.calls[0][1] as AbortSignal;
    view.rerender(
      <OpenFileByPath
        {...props}
        sourceId="local-1"
        customTargetDir="/chosen"
      />,
    );
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolve(new File(['old'], 'old.txt'));
    });
    await waitFor(() =>
      expect(screen.queryByTestId('preview')).not.toBeInTheDocument(),
    );
    open();
    expect(screen.queryByTestId('preview')).not.toBeInTheDocument();
  });
});
