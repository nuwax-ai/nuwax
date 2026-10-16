/**
 * 单元测试：ClientVersionBadge —— 各状态渲染、日志入口与明确操作。
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
  it.each(['downloading', 'installing'] as const)(
    '一键更新 %s 阶段自动显示进度对话框，不要求第二次点击',
    async (status) => {
      setState({
        status,
        installAfterDownload: true,
        version: '1.0.7',
        progress:
          status === 'downloading'
            ? { percent: 42, bytesPerSecond: 1, transferred: 42, total: 100 }
            : undefined,
      });
      render(<ClientVersionBadge />);
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      if (status === 'downloading')
        expect(screen.getByRole('dialog').textContent).toContain('42%');
      else
        expect(screen.getByRole('dialog').textContent).toContain(
          'PC.Components.ClientUpdate.installingHint',
        );
      expect(serviceMock.download).not.toHaveBeenCalled();
      expect(serviceMock.install).not.toHaveBeenCalled();
    },
  );

  it('一键更新从日志内发起，单次点击只调用宿主下载编排', async () => {
    setState({
      status: 'available',
      installAfterDownload: true,
      version: '1.0.7',
    });
    render(<ClientVersionBadge />);
    await userEvent.click(
      screen.getByRole('button', { name: 'PC.Components.ClientUpdate.ready' }),
    );
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'PC.Components.ClientUpdate.install',
      }),
    );
    expect(serviceMock.download).toHaveBeenCalledTimes(1);
    expect(serviceMock.install).not.toHaveBeenCalled();
  });

  it('available → 就绪胶囊点击仅查看日志，无下载图标', async () => {
    setState({
      status: 'available',
      version: '1.0.7',
      releaseDate: '2026-09-16T00:00:00.000Z',
      releaseNotes: '## 变更\n- 修复若干问题',
    });
    render(<ClientVersionBadge />);
    const badge = screen.getByRole('button', {
      name: 'PC.Components.ClientUpdate.ready',
    });
    expect(badge.textContent).toBe('PC.Components.ClientUpdate.ready');
    expect(document.querySelector('.anticon-download')).toBeNull();
    await userEvent.click(badge);
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    expect(serviceMock.download).not.toHaveBeenCalled();
  });

  it('downloaded → 就绪胶囊打开日志，明确安装后显示遮罩', async () => {
    setState({ status: 'downloaded', version: '1.0.7' });
    render(<ClientVersionBadge />);
    const badge = screen.getByRole('button', {
      name: 'PC.Components.ClientUpdate.ready',
    });
    // 图标态已收敛为文案态
    expect(badge.textContent).toContain('PC.Components.ClientUpdate.ready');
    expect(document.querySelector('.anticon-rocket')).toBeNull();
    let finishInstall!: (res: { success: boolean }) => void;
    serviceMock.install.mockReturnValue(
      new Promise<{ success: boolean }>((resolve) => {
        finishInstall = resolve;
      }),
    );
    await userEvent.click(badge);
    expect(serviceMock.install).not.toHaveBeenCalled();
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'PC.Components.ClientUpdate.install',
      }),
    );
    expect(serviceMock.install).toHaveBeenCalled();
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
      name: 'PC.Components.ClientUpdate.ready',
    });
    serviceMock.install.mockResolvedValue({
      success: false,
      error: 'dev build unsupported',
    });
    await userEvent.click(badge);
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'PC.Components.ClientUpdate.install',
      }),
    );
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

  it('error（有目标版本）→ 日志展示错误，明确重试才下载', async () => {
    setState({ status: 'error', version: '1.0.7', error: 'HTTP 500' });
    render(<ClientVersionBadge />);
    await userEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.ClientUpdate.errorTitle',
      }),
    );
    expect(serviceMock.download).not.toHaveBeenCalled();
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'PC.Components.ClientUpdate.retry',
      }),
    );
    expect(serviceMock.download).toHaveBeenCalledTimes(1);
  });
});
