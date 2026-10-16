/**
 * 单元测试：ClientVersionBadge —— 各状态分支渲染与点击直连下载/安装。
 * mock clientUpdateService（状态源）与 i18n；hover 更新日志卡片走 available 分支抽查。
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ClientVersionBadge from './ClientVersionBadge';

const serviceMock = vi.hoisted(() => ({
  state: null as ClientUpdateState | null,
  download: vi.fn(),
  install: vi.fn(),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('./clientUpdateService', () => ({
  isAvailable: () => true,
  start: vi.fn(),
  subscribe: (cb: (s: ClientUpdateState | null) => void) => {
    cb(serviceMock.state);
    return () => {};
  },
  download: (...args: unknown[]) => serviceMock.download(...args),
  install: (...args: unknown[]) => serviceMock.install(...args),
}));

function setState(overrides: Partial<ClientUpdateState> = {}) {
  serviceMock.state = {
    status: 'idle',
    hostVersion: '1.0.6',
    ...overrides,
  };
}

beforeEach(() => {
  serviceMock.state = null;
  serviceMock.download.mockReset().mockResolvedValue(true);
  serviceMock.install.mockReset().mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ClientVersionBadge', () => {
  it('available → 「更新」文案胶囊（无下载图标），点击徽标直接触发下载', async () => {
    setState({
      status: 'available',
      version: '1.0.7',
      releaseDate: '2026-09-16T00:00:00.000Z',
      releaseNotes: '## 变更\n- 修复若干问题',
    });
    render(<ClientVersionBadge />);
    const badge = screen.getByRole('button', {
      name: 'PC.Components.ClientUpdate.download',
    });
    expect(badge.textContent).toBe('PC.Components.ClientUpdate.update');
    expect(document.querySelector('.anticon-download')).toBeNull();
    await userEvent.click(badge);
    expect(serviceMock.download).toHaveBeenCalled();
  });

  it('downloaded → 「重启更新」文案胶囊，点击触发 install 并进入 loading', async () => {
    setState({ status: 'downloaded', version: '1.0.7' });
    render(<ClientVersionBadge />);
    const badge = screen.getByRole('button', {
      name: 'PC.Components.ClientUpdate.install',
    });
    // 图标态已收敛为文案态
    expect(badge.textContent).toContain('PC.Components.ClientUpdate.install');
    expect(document.querySelector('.anticon-rocket')).toBeNull();
    let finishInstall!: (res: { success: boolean }) => void;
    serviceMock.install.mockReturnValue(
      new Promise<{ success: boolean }>((resolve) => {
        finishInstall = resolve;
      }),
    );
    await userEvent.click(badge);
    expect(serviceMock.install).toHaveBeenCalled();
    expect(document.querySelector('.anticon-loading')).toBeInTheDocument();
    // 全屏重启遮罩即刻出现（清理+退出空窗期的反馈）
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.ClientUpdate.installing'),
    ).toBeInTheDocument();
    // 成功：进程即将退出，遮罩保留到窗口关闭（不回退）
    finishInstall({ success: true });
    await vi.waitFor(() => {
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  it('downloaded → 宿主拒绝安装（dev/MSI）→ 收遮罩浮出错误，可关闭', async () => {
    setState({ status: 'downloaded', version: '1.0.7' });
    render(<ClientVersionBadge />);
    const badge = screen.getByRole('button', {
      name: 'PC.Components.ClientUpdate.install',
    });
    serviceMock.install.mockResolvedValue({
      success: false,
      error: 'dev build unsupported',
    });
    await userEvent.click(badge);
    // 遮罩切换为失败态：错误标题 + 宿主回传的错误详情
    expect(
      await screen.findByText('PC.Components.ClientUpdate.installFailed'),
    ).toBeInTheDocument();
    expect(screen.getByText('dev build unsupported')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'PC.Components.ClientUpdate.close' }),
    );
    expect(
      screen.queryByText('PC.Components.ClientUpdate.installFailed'),
    ).toBeNull();
  });

  it('error（有目标版本）→ 红色信息图标，点击重试触发 download', async () => {
    setState({ status: 'error', version: '1.0.7', error: 'HTTP 500' });
    render(<ClientVersionBadge />);
    await userEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.ClientUpdate.errorTitle',
      }),
    );
    expect(serviceMock.download).toHaveBeenCalled();
  });
});
