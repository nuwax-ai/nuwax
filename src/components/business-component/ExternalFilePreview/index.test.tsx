/**
 * 工作区外沙箱文件独立预览面板单测：
 * 1. 头部展示沙箱绝对路径（targetDir + relativePath 拼接归一）；
 * 2. 传入 onBack 时渲染返回入口，点击回退（本面板整块顶替文件树面板，
 *    文件树/终端/云电脑同时不可见，必须留一条回工作区的退路）；
 * 3. 未传 onBack 时不渲染返回入口（向后兼容，交由调用方决定是否提供）。
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

vi.mock('@/services/vncDesktop', () => ({
  apiGetStaticFileList: vi.fn(),
}));

vi.mock('@/components/business-component/FilePreview', () => ({
  default: () => <div data-testid="file-preview" />,
}));

vi.mock('@/components/base/CopyIconButton', () => ({
  default: () => <span data-testid="copy-path" />,
}));

vi.mock('@/components/base/SvgIcon', () => ({
  default: () => <span data-testid="svg-icon" />,
}));

// TooltipIcon 依赖自身 less，vitest 下按仓库既有约定整体 mock
vi.mock('@/components/custom/TooltipIcon', () => ({
  default: ({ title, onClick }: { title: string; onClick?: () => void }) => (
    <button type="button" aria-label={title} onClick={onClick} />
  ),
}));

import { apiGetStaticFileList } from '@/services/vncDesktop';
import ExternalFilePreview from './index';

const fileListMock = vi.mocked(apiGetStaticFileList);

afterEach(() => {
  vi.restoreAllMocks();
  fileListMock.mockReset();
});

const renderPreview = (
  props: Partial<React.ComponentProps<typeof ExternalFilePreview>> = {},
) =>
  render(
    <ExternalFilePreview
      cId={100}
      targetDir="/home/user"
      relativePath="Desktop/note.md"
      {...props}
    />,
  );

describe('ExternalFilePreview', () => {
  it('头部展示沙箱内绝对路径', async () => {
    fileListMock.mockResolvedValue({ code: 0, data: { files: [] } } as any);

    renderPreview();

    await waitFor(() => {
      expect(
        screen.getByText('/home/user/Desktop/note.md'),
      ).toBeInTheDocument();
    });
  });

  it('传入 onBack 时渲染返回入口，点击回调一次', async () => {
    fileListMock.mockResolvedValue({ code: 0, data: { files: [] } } as any);
    const onBack = vi.fn();

    renderPreview({ onBack });

    const back = await screen.findByLabelText(
      'PC.Pages.Chat.externalFilePreviewBack',
    );
    fireEvent.click(back);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('未传 onBack 时不渲染返回入口', async () => {
    fileListMock.mockResolvedValue({ code: 0, data: { files: [] } } as any);

    renderPreview();

    await waitFor(() => {
      expect(
        screen.queryByLabelText('PC.Pages.Chat.externalFilePreviewBack'),
      ).toBeNull();
    });
  });
});
