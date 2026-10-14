import { LocalFileAccessError } from '@/features/client-shell/localFileService';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchView from './index';
const mocks = vi.hoisted(() => ({ search: vi.fn(), revision: 0 }));
vi.mock('@/features/client-shell/localFileService', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/client-shell/localFileService')
  >()),
  useLocalFilesRevision: () => mocks.revision,
}));
vi.mock('@/services/vncDesktop', () => ({ apiSearchFiles: mocks.search }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('@/utils/fileTree', () => ({
  flattenFiles: (files: any[], keyword: string) =>
    files.filter((file) => file.name.includes(keyword)),
  getFileIcon: () => null,
}));
vi.mock('@/components/custom/EllipsisTooltip', () => ({
  EllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
}));

beforeEach(() => {
  mocks.search.mockReset();
  mocks.revision = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('本机搜索错误反馈', () => {
  it('同一会话换电脑后清空结果并丢弃旧上下文的迟到请求', async () => {
    let finish!: (result: unknown) => void;
    mocks.search.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const props = { files: [], remoteFileSearch: { cId: 7 } };
    const { rerender } = render(<SearchView {...props} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'report' },
    });
    await waitFor(() => expect(mocks.search).toHaveBeenCalledOnce());
    mocks.search.mockRejectedValueOnce(new LocalFileAccessError('expired'));
    mocks.revision++;
    rerender(<SearchView {...props} />);
    await act(async () =>
      finish({ code: '0000', data: { files: [{ name: 'report-old.txt' }] } }),
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('report-old.txt')).toBeNull();
    expect(mocks.search).toHaveBeenCalledTimes(2);
  });
  it.each([
    'file-service-unavailable',
    'permission-denied',
    'expired',
  ] as const)('%s 显示错误并允许重试，不显示缓存或无匹配结果', async (code) => {
    mocks.search.mockRejectedValueOnce(new LocalFileAccessError(code));
    render(
      <SearchView
        files={[
          {
            id: 'cached',
            path: 'report-old.txt',
            name: 'report-old.txt',
            type: 'file',
          },
        ]}
        remoteFileSearch={{ cId: 7 }}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'report' },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'PC.Components.SearchView.localSearchFailed',
    );
    expect(screen.queryByText('report-old.txt')).toBeNull();
    expect(
      screen.queryByText('PC.Components.SearchView.noMatchingFiles'),
    ).toBeNull();
    mocks.search.mockResolvedValueOnce({ code: '0000', data: { files: [] } });
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Components.FilePreview.retry' }),
    );
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(
      await screen.findByText('PC.Components.SearchView.noMatchingFiles'),
    ).toBeInTheDocument();
  });
  it('旧服务搜索失败仍可使用已加载文件过滤', async () => {
    mocks.search.mockRejectedValueOnce(
      new Error('old server has no search endpoint'),
    );
    render(
      <SearchView
        files={[
          {
            id: 'cached',
            path: 'report-old.txt',
            name: 'report-old.txt',
            type: 'file',
          },
        ]}
        remoteFileSearch={{ cId: 7 }}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'report' },
    });
    expect(await screen.findByText('report-old.txt')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
