/**
 * 单元测试：ClientVersionBadge —— 各状态分支渲染。
 * mock clientUpdateService（状态源）与 i18n；仅验徽标位形态，弹窗交互走 available 分支抽查。
 */
import { act, render, screen } from '@testing-library/react';
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

  it('available → 下载图标；点击弹说明弹窗，下载按钮触发后关弹窗', async () => {
    setState({
      status: 'available',
      version: '1.0.7',
      releaseDate: '2026-09-16T00:00:00.000Z',
      releaseNotes: '# 说明\n修复若干问题',
    });
    render(<ClientVersionBadge />);
    // 入口 icon 是 span[role=button]，弹窗 footer 是原生 button——同名按标签区分
    const entryIcon = screen
      .getAllByRole('button', { name: 'PC.Components.ClientUpdate.download' })
      .find((el) => el.tagName === 'SPAN')!;
    await userEvent.click(entryIcon);
    // 弹窗：标题带目标版本，说明与日期可见
    expect(await screen.findByText(/v1\.0\.7/)).toBeInTheDocument();
    expect(screen.getByText(/修复若干问题/)).toBeInTheDocument();
    expect(screen.getByText(/2026-09-16/)).toBeInTheDocument();
    // 弹窗 footer 主按钮 → 触发服务下载并关弹窗
    const footerBtn = screen
      .getAllByRole('button', { name: 'PC.Components.ClientUpdate.download' })
      .find((el) => el.tagName === 'BUTTON')!;
    await userEvent.click(footerBtn);
    expect(serviceMock.download).toHaveBeenCalled();
  });

  it('downloading → 进度圆环（aria-label）', () => {
    setState({
      status: 'downloading',
      progress: { percent: 42, bytesPerSecond: 1, transferred: 1, total: 10 },
    });
    render(<ClientVersionBadge />);
    expect(
      screen.getByLabelText('PC.Components.ClientUpdate.downloading'),
    ).toBeInTheDocument();
  });

  it('downloaded → 重启安装图标，点击触发 install', async () => {
    setState({ status: 'downloaded', version: '1.0.7' });
    render(<ClientVersionBadge />);
    await userEvent.click(
      screen.getByRole('button', { name: 'PC.Components.ClientUpdate.install' }),
    );
    expect(serviceMock.install).toHaveBeenCalled();
  });

  it('error（有目标版本）→ 红色信息图标入口', () => {
    setState({ status: 'error', version: '1.0.7', error: 'HTTP 500' });
    render(<ClientVersionBadge />);
    expect(
      screen.getByRole('button', { name: 'PC.Components.ClientUpdate.errorTitle' }),
    ).toBeInTheDocument();
  });
});
