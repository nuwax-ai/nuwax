import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WorkspaceDirPickerModal from './index';

const mocks = vi.hoisted(() => ({
  getApi: vi.fn(),
  roots: vi.fn(),
  children: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { localFiles: { getApi: mocks.getApi } },
}));
vi.mock('./index.less', () => ({ default: {} }));
vi.mock('@/services/vncDesktop', () => ({
  apiBrowseFsRoots: mocks.roots,
  apiBrowseFsChildren: mocks.children,
  apiFsMkdir: vi.fn(),
  apiFsRename: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/constants/fileTreeImages.constants', () => ({
  ICON_FOLDER: () => null,
}));
vi.mock('@/utils/fileTree', () => ({ getFileIcon: () => null }));
vi.mock('antd', () => ({
  Modal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  Input: () => null,
  Spin: () => <span>loading</span>,
  message: { error: mocks.error },
}));

const caps = { apiVersion: 2, available: true, sandboxId: '4418' };
let api: {
  getCapabilities: ReturnType<typeof vi.fn>;
  pickDirectory: ReturnType<typeof vi.fn>;
};
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  api = {
    getCapabilities: vi.fn().mockResolvedValue(caps),
    pickDirectory: vi
      .fn()
      .mockResolvedValue({ canceled: false, paths: ['C:\\work'] }),
  };
  mocks.getApi.mockReturnValue(api);
  mocks.roots.mockResolvedValue({
    success: true,
    data: { roots: [], home: '/remote' },
  });
});
afterEach(cleanup);

describe('共用工作目录入口', () => {
  it('StrictMode 下只打开一次系统选择器且不拉后端目录', async () => {
    const onConfirm = vi.fn();
    render(
      <StrictMode>
        <WorkspaceDirPickerModal
          open
          sandboxId="4418"
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      </StrictMode>,
    );
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('C:\\work'));
    expect(api.pickDirectory).toHaveBeenCalledTimes(1);
    expect(mocks.roots).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('选择其他电脑时保留原目录弹窗及 sandboxId', async () => {
    render(
      <WorkspaceDirPickerModal
        open
        sandboxId="999"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    await waitFor(() => expect(mocks.roots).toHaveBeenCalledWith('999'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(api.pickDirectory).not.toHaveBeenCalled();
  });

  it.each(['cancel', 'error'])('本机 %s 后关闭入口且不回后端', async (kind) => {
    if (kind === 'cancel')
      api.pickDirectory.mockResolvedValue({ canceled: true, paths: [] });
    else api.pickDirectory.mockRejectedValue(new Error('failed'));
    const onCancel = vi.fn();
    render(
      <WorkspaceDirPickerModal
        open
        sandboxId="4418"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    expect(mocks.roots).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledTimes(kind === 'error' ? 1 : 0);
  });

  it('切换电脑后旧系统选择不能覆盖新任务目录', async () => {
    let finish!: (value: { canceled: boolean; paths: string[] }) => void;
    api.pickDirectory.mockReturnValueOnce(
      new Promise((done) => {
        finish = done;
      }),
    );
    const onConfirm = vi.fn(),
      onCancel = vi.fn();
    const { rerender } = render(
      <WorkspaceDirPickerModal
        open
        sandboxId="4418"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await waitFor(() => expect(api.pickDirectory).toHaveBeenCalled());
    rerender(
      <WorkspaceDirPickerModal
        open
        sandboxId="999"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await waitFor(() => expect(mocks.roots).toHaveBeenCalledWith('999'));
    await act(async () => finish({ canceled: false, paths: ['C:\\old'] }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
