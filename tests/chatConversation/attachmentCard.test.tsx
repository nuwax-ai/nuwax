import ChatUploadFile from '@/components/ChatUploadFile';
import AttachFile from '@/components/ChatView/AttachFile';
import { UploadFileStatus } from '@/types/enums/common';
import { openRemoteFileUrl } from '@/utils/authProtectedFileUrl';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/authProtectedFileUrl', () => ({
  openRemoteFileUrl: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/components/base/FileTypeIcon', () => ({
  default: () => <span>文件</span>,
}));
vi.mock('@/components/ChatUploadFile/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/ChatView/AttachFile/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

const attachments = [
  {
    fileKey: 'doc',
    fileName: 'report.pdf',
    fileUrl: 'https://cdn.example.com/report.pdf',
    mimeType: 'application/pdf',
  },
  {
    fileKey: 'first',
    fileName: 'first.png',
    fileUrl: 'https://cdn.example.com/first.png',
    mimeType: 'image/png',
  },
  {
    fileKey: 'second',
    fileName: 'second.png',
    fileUrl: 'https://cdn.example.com/second.png',
    mimeType: 'image/png',
  },
];

function renderAttachments(
  kind: '消息' | '输入框',
  status = UploadFileStatus.done,
) {
  if (kind === '消息') return render(<AttachFile files={attachments} />);
  return render(
    <ChatUploadFile
      files={attachments.map((file) => ({
        uid: file.fileKey,
        name: file.fileName,
        url: file.fileUrl,
        type: file.mimeType,
        size: 100,
        status,
      }))}
      onDel={vi.fn()}
    />,
  );
}

describe('附件卡片双击打开', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(openRemoteFileUrl).mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe.each(['消息', '输入框'] as const)('%s', (kind) => {
    it('双击整个图片卡片预览对应图片，不受前面的文档影响', async () => {
      renderAttachments(kind);
      const card = screen.getByAltText('second.png').closest('.file-box')!;
      fireEvent.doubleClick(card);
      await waitFor(() =>
        expect(
          document.querySelector('.ant-image-preview img'),
        ).toHaveAttribute('src', 'https://cdn.example.com/second.png'),
      );
      expect(openRemoteFileUrl).not.toHaveBeenCalled();
    });

    it('双击文档卡片只打开一次，使用现有文件鉴权链路', async () => {
      renderAttachments(kind);
      fireEvent.doubleClick(screen.getByText('report.pdf'));
      await waitFor(() =>
        expect(openRemoteFileUrl).toHaveBeenCalledWith(
          'https://cdn.example.com/report.pdf',
          'report.pdf',
        ),
      );
      expect(openRemoteFileUrl).toHaveBeenCalledTimes(1);
    });

    it('打开失败时提示错误并保留附件', async () => {
      const errorToast = vi
        .spyOn(message, 'error')
        .mockImplementation(() => undefined as never);
      vi.mocked(openRemoteFileUrl).mockRejectedValueOnce(new Error('failed'));
      renderAttachments(kind);
      fireEvent.doubleClick(screen.getByText('report.pdf'));
      await waitFor(() =>
        expect(errorToast).toHaveBeenCalledWith(
          'PC.Common.Global.operationFailed',
        ),
      );
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });
  });

  it.each([UploadFileStatus.uploading, UploadFileStatus.error])(
    '输入框中 %s 的附件双击不打开',
    (status) => {
      renderAttachments('输入框', status);
      fireEvent.doubleClick(screen.getByText('report.pdf'));
      fireEvent.doubleClick(
        screen.getByAltText('first.png').closest('.file-box')!,
      );
      expect(openRemoteFileUrl).not.toHaveBeenCalled();
      expect(document.querySelector('.ant-image-preview')).toBeNull();
    },
  );

  it('双击删除图标不冒泡为打开图片', () => {
    renderAttachments('输入框');
    fireEvent.doubleClick(
      screen.getAllByRole('img', { name: 'close-circle' })[1],
    );
    expect(document.querySelector('.ant-image-preview')).toBeNull();
    expect(openRemoteFileUrl).not.toHaveBeenCalled();
  });
});
