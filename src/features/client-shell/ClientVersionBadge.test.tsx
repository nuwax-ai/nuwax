/**
 * 单元测试：ClientVersionBadge —— 各状态分支渲染与点击直连下载/安装。
 * mock clientUpdateService（状态源）与 i18n；hover 更新日志卡片走 available 分支抽查。
 */
import { fireEvent, render, screen } from '@testing-library/react';
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
  serviceMock.install.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ClientVersionBadge', () => {
  it('不可用（旧宿主/浏览器）→ 不渲染', () => {
    // subscribe 回调 null 状态 + isAvailable mock 恒 true，这里改为状态缺失分支：
    const { container } = render(<ClientVersionBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('idle/checking/not-available → 仅版本号小字', () => {
    for (const status of ['idle', 'checking', 'not-available'] as const) {
      setState({ status });
      const { container, unmount } = render(<ClientVersionBadge />);
      expect(container.textContent).toContain('v1.0.6');
      unmount();
    }
  });

  it('available → 「更新」文案胶囊（无下载图标），点击徽标直接触发下载', async () => {
    setState({
      status: 'available',
      version: '1.0.7',
      releaseDate: '2026-09-16T00:00:00.000Z',
      releaseNotes: '## 变更\n- 修复若干问题',
    });
    render(<ClientVersionBadge />);
    const badge = screen.getByRole('button', { name: 'PC.Components.ClientUpdate.download' });
    expect(badge.textContent).toBe('PC.Components.ClientUpdate.update');
    expect(document.querySelector('.anticon-download')).toBeNull();
    await userEvent.click(badge);
    expect(serviceMock.download).toHaveBeenCalled();
  });

  it('available → hover 弹更新日志卡片（目标版本/日期/日志）', async () => {
    setState({
      status: 'available',
      version: '1.0.7',
      releaseDate: '2026-09-16T00:00:00.000Z',
      releaseNotes: '## 变更\n- **客户端版本**：修复若干问题',
    });
    render(<ClientVersionBadge />);
    fireEvent.mouseEnter(
      screen.getByRole('button', { name: 'PC.Components.ClientUpdate.download' }),
    );
    // 卡片标题 = 目标版本 + 更新日志
    expect(
      await screen.findByText(/v1\.0\.7 PC\.Components\.ClientUpdate\.releaseNotesTitle/),
    ).toBeInTheDocument();
    expect(screen.getByText(/2026-09-16/)).toBeInTheDocument();
    expect(screen.getByText(/修复若干问题/)).toBeInTheDocument();
  });

  it('downloading → 进度圆环（加粗描边+缩小尺寸），卡片内下载中态带百分比', async () => {
    setState({
      status: 'downloading',
      progress: { percent: 42, bytesPerSecond: 1, transferred: 1, total: 10 },
    });
    render(<ClientVersionBadge />);
    fireEvent.mouseEnter(
      screen.getByLabelText('PC.Components.ClientUpdate.downloading'),
    );
    expect(await screen.findByText(/42%/)).toBeInTheDocument();
    const inner = document.querySelector('.ant-progress-inner');
    expect(inner).not.toBeNull();
    expect(inner.getAttribute('style')).toContain('width: 16px');
    const ring = document.querySelector('svg.ant-progress-circle');
    expect(ring).not.toBeNull();
    const strokeWidths = Array.from(ring.querySelectorAll('circle')).map((c) =>
      c.getAttribute('stroke-width'),
    );
    expect(strokeWidths).toContain('18');
  });

  it('downloaded → 「重启更新」文案胶囊，点击触发 install 并进入 loading', async () => {
    setState({ status: 'downloaded', version: '1.0.7' });
    render(<ClientVersionBadge />);
    const badge = screen.getByRole('button', { name: 'PC.Components.ClientUpdate.install' });
    // 图标态已收敛为文案态
    expect(badge.textContent).toContain('PC.Components.ClientUpdate.install');
    expect(document.querySelector('.anticon-rocket')).toBeNull();
    let finishInstall!: () => void;
    serviceMock.install.mockReturnValue(
      new Promise<void>((resolve) => {
        finishInstall = resolve;
      }),
    );
    await userEvent.click(badge);
    expect(serviceMock.install).toHaveBeenCalled();
    expect(document.querySelector('.anticon-loading')).toBeInTheDocument();
    finishInstall();
  });

  it('error（有目标版本）→ 红色信息图标，点击重试触发 download', async () => {
    setState({ status: 'error', version: '1.0.7', error: 'HTTP 500' });
    render(<ClientVersionBadge />);
    await userEvent.click(
      screen.getByRole('button', { name: 'PC.Components.ClientUpdate.errorTitle' }),
    );
    expect(serviceMock.download).toHaveBeenCalled();
  });
});
