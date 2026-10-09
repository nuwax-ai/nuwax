import eventBus from '@/utils/eventBus';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import MyComputerManage from './index';

vi.mock('./index.less', () => ({ default: {} }));

const { fetchList, location } = vi.hoisted(() => ({
  fetchList: vi.fn(),
  location: { pathname: '/my-computer' },
}));
vi.mock('umi', () => ({
  useLocation: () => location,
  history: { push: vi.fn() },
}));
vi.mock('@/components/WorkspaceLayout', () => ({
  default: ({ children }: any) => children,
}));
vi.mock('./components/EditComputerModal', () => ({ default: () => null }));
vi.mock('@/utils/clipboard', () => ({ copyTextToClipboard: vi.fn() }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/systemManage', () => ({
  apiGetSandboxUserConfigList: fetchList,
  apiCreateSandboxUserConfig: vi.fn(),
  apiDeleteSandboxUserConfig: vi.fn(),
  apiToggleSandboxConfig: vi.fn(),
  apiUpdateSandboxUserConfig: vi.fn(),
}));

const online = {
  id: 999,
  name: '刚上线的电脑',
  description: '',
  online: true,
  isActive: true,
};
beforeEach(() =>
  fetchList.mockReset().mockResolvedValue({ code: '0000', data: [] }),
);
afterEach(cleanup);

it('上线事件刷新我的电脑列表，卸载后不再请求', async () => {
  const { unmount } = render(<MyComputerManage />);
  await act(async () => {});
  fetchList.mockResolvedValue({ code: '0000', data: [online] });
  await act(async () => eventBus.emit('sandbox_online', { sandboxId: 999 }));
  expect(screen.getByText('刚上线的电脑')).toBeInTheDocument();
  expect(fetchList).toHaveBeenCalledTimes(2);
  unmount();
  eventBus.emit('sandbox_online');
  expect(fetchList).toHaveBeenCalledTimes(2);
});

it('事件后的新列表不被迟到的旧请求覆盖', async () => {
  let resolveOld!: (value: any) => void;
  fetchList.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveOld = resolve;
    }),
  );
  render(<MyComputerManage />);
  fetchList.mockResolvedValue({ code: '0000', data: [online] });
  await act(async () => eventBus.emit('sandbox_online'));
  await act(async () => resolveOld({ code: '0000', data: [] }));
  expect(screen.getByText('刚上线的电脑')).toBeInTheDocument();
});

it('刷新失败保留已有电脑，下一次上线事件可以重试', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fetchList.mockResolvedValueOnce({ code: '0000', data: [online] });
  render(<MyComputerManage />);
  await act(async () => {});
  fetchList.mockRejectedValueOnce(new Error('network'));
  await act(async () => eventBus.emit('sandbox_online'));
  expect(screen.getByText('刚上线的电脑')).toBeInTheDocument();
  fetchList.mockResolvedValue({ code: '0000', data: [] });
  await act(async () => eventBus.emit('sandbox_online'));
  expect(screen.queryByText('刚上线的电脑')).not.toBeInTheDocument();
  vi.restoreAllMocks();
});
