import { LocalFileAccessError } from '@/features/client-shell/localFileService';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchView from './index';
const mocks = vi.hoisted(() => ({ search: vi.fn() }));
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
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('本机搜索错误反馈', () => {
  it.each([
    'file-service-unavailable',
    'permission-denied',
    'expired',
  ] as const)('%s 显示错误并允许重试，不显示缓存或无匹配结果', async (code) => {
    mocks.search.mockRejectedValueOnce(new LocalFileAccessError(code));
    render(
      <SearchView
        files={[{ id: 'cached', name: 'report-old.txt', type: 'file' }]}
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
        files={[{ id: 'cached', name: 'report-old.txt', type: 'file' }]}
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
