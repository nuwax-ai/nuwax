import FileResourceLink from '@/features/conversation/presentation-v2/react/FileResourceLink';
import { LocalToolFileContext } from '@/features/conversation/presentation-v2/react/LocalToolFileContext';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const adapter = vi.hoisted(() => ({ reference: vi.fn(), open: vi.fn() }));
vi.mock('@/features/client-shell/localFileService', () => ({
  useLocalFilesRevision: () => 0,
  getLocalFileReference: adapter.reference,
  openLocalFile: adapter.open,
}));
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe('工具文件路径本机点击', () => {
  it('无内嵌预览回调的宿主入口仍可通过本机默认应用打开', () => {
    const ref = { contextId: 'ctx', cId: '9', path: '/Users/alice/report.md' };
    adapter.reference.mockReturnValue(ref);
    adapter.open.mockResolvedValue(true);
    render(
      <LocalToolFileContext.Provider value="9">
        <FileResourceLink target={ref.path} />
      </LocalToolFileContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(adapter.open).toHaveBeenCalledWith(ref);
  });
  it.each(['/Users/alice/demo/report.md', 'C:\\Users\\alice\\demo\\report.md'])(
    '按消息会话定位路径 %s，支持键盘button且保留原路径',
    (target) => {
      adapter.reference.mockImplementation((_: unknown, cId: string) =>
        cId === '9' ? { contextId: 'ctx', cId, path: target } : undefined,
      );
      const open = vi.fn();
      render(
        <LocalToolFileContext.Provider value="9">
          <FileResourceLink target={target} onOpen={open} />
        </LocalToolFileContext.Provider>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', target);
      expect(button).toHaveTextContent('report.md');
      expect(adapter.reference).toHaveBeenCalledWith(target, '9', target);
      fireEvent.click(button);
      expect(open).toHaveBeenCalledOnce();
    },
  );

  it('远端、其他会话和缺少会话归属的路径保持纯展示', () => {
    const open = vi.fn();
    const { rerender } = render(
      <LocalToolFileContext.Provider value="10">
        <FileResourceLink target="/home/user/a.md" onOpen={open} />
      </LocalToolFileContext.Provider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    adapter.reference.mockReturnValue({
      contextId: 'ctx',
      cId: '9',
      path: '/home/user/a.md',
    });
    rerender(<FileResourceLink target="/home/user/a.md" onOpen={open} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });
});
