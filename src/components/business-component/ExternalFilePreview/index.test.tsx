/**
 * 工作区外沙箱文件独立预览面板单测：
 * 1. 直连静态代理地址契约锚定：
 *    /api/computer/static/{cId}/{fileName}?t=…&customTargetDir={文件所在父目录绝对路径}
 *    （customTargetDir=父目录而非家目录锚，URL 段只带末段文件名，t 防缓存）；
 * 2. 头部展示沙箱内绝对路径（targetDir + relativePath 拼接归一）；
 * 3. 传入 onBack 时渲染返回入口，点击回退（本面板整块顶替文件树面板，
 *    文件树/终端/云电脑同时不可见，必须留一条回工作区的退路）；
 * 4. 未传 onBack 时不渲染返回入口（向后兼容，交由调用方决定是否提供）。
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const local = vi.hoisted(() => ({ reference: vi.fn() }));
vi.mock('@/features/client-shell/localFileService', () => ({
  getLocalFileReference: local.reference,
  useLocalFilesRevision: () => 0,
  openLocalFile: vi.fn(),
  revealLocalFile: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

vi.mock('@/components/business-component/FilePreview', () => ({
  default: ({
    src,
    localFile,
  }: {
    src: string;
    localFile?: { path: string };
  }) => (
    <div
      data-testid="file-preview"
      data-src={src}
      data-local-path={localFile?.path}
    />
  ),
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

import ExternalFilePreview from './index';

afterEach(() => {
  vi.restoreAllMocks();
  local.reference.mockReset();
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
  it.each(['C:', 'C:\\', 'C:/'])(
    '盘符根目录 %s 保留正确本机路径和代理父目录',
    (targetDir) => {
      local.reference.mockImplementation((_url, _id, path) => ({
        contextId: 'live',
        cId: '100',
        path,
      }));
      renderPreview({ targetDir, relativePath: 'readme.md' });
      expect(screen.getByTestId('file-preview').dataset.localPath).toBe(
        'C:\\readme.md',
      );
      const url = new URL(
        screen.getByTestId('file-preview').dataset.src!,
        'https://test.invalid',
      );
      expect(url.searchParams.get('customTargetDir')).toMatch(/^C:[\\/]+$/);
    },
  );

  it('Windows绝对路径保持盘符，不强加POSIX根斜杠', () => {
    renderPreview({
      targetDir: 'C:\\Users\\alice',
      relativePath: 'Desktop\\note.md',
    });
    expect(
      screen.getByText('C:\\Users\\alice\\Desktop\\note.md'),
    ).toBeInTheDocument();
    const parsed = new URL(
      screen.getByTestId('file-preview').dataset.src!,
      'https://test.invalid',
    );
    expect(parsed.pathname).toBe('/api/computer/static/100/note.md');
    expect(parsed.searchParams.get('customTargetDir')).toBe(
      'C:\\Users\\alice/Desktop',
    );
  });
  it('直连静态代理地址：customTargetDir=文件父目录，URL 段只带文件名', () => {
    renderPreview();

    expect(screen.getByTestId('file-preview').dataset.src).toMatch(
      /^\/api\/computer\/static\/100\/note\.md\?t=\d+&customTargetDir=%2Fhome%2Fuser%2FDesktop$/,
    );
  });

  it('多级目录：父目录拼完整相对目录段', () => {
    renderPreview({ relativePath: 'Desktop/sub/报告 v2.md' });

    expect(screen.getByTestId('file-preview').dataset.src).toMatch(
      /^\/api\/computer\/static\/100\/%E6%8A%A5%E5%91%8A%20v2\.md\?t=\d+&customTargetDir=%2Fhome%2Fuser%2FDesktop%2Fsub$/,
    );
  });

  it('头部展示沙箱内绝对路径', () => {
    renderPreview();

    expect(screen.getByText('/home/user/Desktop/note.md')).toBeInTheDocument();
  });

  it('传入 onBack 时渲染返回入口，点击回调一次', () => {
    const onBack = vi.fn();

    renderPreview({ onBack });

    fireEvent.click(
      screen.getByLabelText('PC.Pages.Chat.externalFilePreviewBack'),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('未传 onBack 时不渲染返回入口', () => {
    renderPreview();

    expect(
      screen.queryByLabelText('PC.Pages.Chat.externalFilePreviewBack'),
    ).toBeNull();
  });
});
