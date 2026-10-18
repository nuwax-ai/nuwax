import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ClientVersionBadge from './ClientVersionBadge';

const h = vi.hoisted(() => ({
  state: null as ClientUpdateState | null,
  listeners: new Set<(state: ClientUpdateState | null) => void>(),
  download: vi.fn(),
  install: vi.fn(),
}));

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('./clientUpdateService', () => ({
  isAvailable: () => true,
  start: vi.fn(),
  subscribe: (listener: (state: ClientUpdateState | null) => void) => {
    h.listeners.add(listener);
    listener(h.state);
    return () => h.listeners.delete(listener);
  },
  download: () => h.download(),
  install: () => h.install(),
}));

const key = (name: string) => `PC.Components.ClientUpdate.${name}`;

function state(overrides: Partial<ClientUpdateState> = {}) {
  h.state = {
    hostVersion: '3.0.15',
    version: '3.0.17-beta.2',
    status: 'available',
    releaseDate: '2026-10-16T00:00:00Z',
    releaseNotes: '## 更新日志\n- 保留安装进度',
    ...overrides,
  };
}

async function openLog() {
  await userEvent.click(screen.getByRole('button', { name: key('ready') }));
  return screen.findByRole('tooltip');
}

beforeEach(() => {
  state();
  h.listeners.clear();
  h.download.mockReset().mockResolvedValue(true);
  h.install.mockReset().mockResolvedValue({ success: true });
});
afterEach(() => vi.restoreAllMocks());

describe('更新就绪日志入口与主进程一键策略', () => {
  it('点击徽标只打开版本、日期和日志，明确点击日志内动作后才开始升级', async () => {
    state({ installAfterDownload: true });
    render(<ClientVersionBadge />);
    const card = await openLog();
    expect(card).toHaveTextContent('v3.0.17-beta.2');
    expect(card).toHaveTextContent('2026-10-16');
    expect(card).toHaveTextContent('保留安装进度');
    expect(h.download).not.toHaveBeenCalled();
    expect(h.install).not.toHaveBeenCalled();
    await userEvent.click(
      within(card).getByRole('button', { name: key('install') }),
    );
    expect(h.download).toHaveBeenCalledTimes(1);
    expect(h.install).not.toHaveBeenCalled();
  });

  it('旧宿主仍只下载，不由 renderer 追加安装调用', async () => {
    render(<ClientVersionBadge />);
    const card = await openLog();
    await userEvent.click(
      within(card).getByRole('button', { name: key('download') }),
    );
    expect(h.download).toHaveBeenCalledTimes(1);
    expect(h.install).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('已经下载的更新先查看日志，安装动作复用缓存且重复点击不重复提交', async () => {
    state({ status: 'downloaded', installAfterDownload: true });
    let finish!: (value: { success: boolean }) => void;
    h.install.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<ClientVersionBadge />);
    const card = await openLog();
    expect(h.install).not.toHaveBeenCalled();
    const action = within(card).getByRole('button', { name: key('install') });
    await userEvent.dblClick(action);
    expect(h.install).toHaveBeenCalledTimes(1);
    expect(h.download).not.toHaveBeenCalled();
    await act(async () => finish({ success: true }));
    expect(
      await screen.findByRole('dialog', {}, { timeout: 2_000 }),
    ).toHaveTextContent(key('installing'));
  });

  it('下载到安装状态由宿主推进，显示进度并且不追加第二次安装', async () => {
    state({ installAfterDownload: true });
    let finish!: (value: boolean) => void;
    h.download.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<ClientVersionBadge />);
    const card = await openLog();
    await userEvent.dblClick(
      within(card).getByRole('button', { name: key('install') }),
    );
    expect(h.download).toHaveBeenCalledTimes(1);
    act(() => {
      state({
        status: 'downloading',
        installAfterDownload: true,
        progress: {
          percent: 42,
          bytesPerSecond: 1,
          transferred: 42,
          total: 100,
        },
      });
      h.listeners.forEach((listener) => listener(h.state));
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByRole('button', { name: key('downloading') }),
    ).toBeInTheDocument();
    act(() => {
      state({ status: 'installing', installAfterDownload: true });
      h.listeners.forEach((listener) => listener(h.state));
    });
    expect(
      await screen.findByRole('dialog', {}, { timeout: 2_000 }),
    ).toHaveTextContent(key('installingHint'));
    await act(async () => finish(true));
    expect(h.install).not.toHaveBeenCalled();
    expect(
      await screen.findByRole('dialog', {}, { timeout: 2_000 }),
    ).toHaveTextContent(key('installingHint'));
  });

  it('一键任务失败后可以从日志重试，不触发安装', async () => {
    state({ installAfterDownload: true });
    h.download.mockResolvedValue(false);
    render(<ClientVersionBadge />);
    const card = await openLog();
    await userEvent.click(
      within(card).getByRole('button', { name: key('install') }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(key('installFailed'));
    await userEvent.click(
      within(dialog).getByRole('button', { name: key('close') }),
    );
    const retryCard = await openLog();
    await userEvent.click(
      within(retryCard).getByRole('button', { name: key('install') }),
    );
    expect(h.download).toHaveBeenCalledTimes(2);
    expect(h.install).not.toHaveBeenCalled();
  });

  it('MSI 等不支持自动更新时保留下载页动作', async () => {
    state({ canAutoUpdate: false, installAfterDownload: true });
    render(<ClientVersionBadge />);
    const card = await openLog();
    await userEvent.click(
      within(card).getByRole('button', { name: key('download') }),
    );
    expect(h.download).toHaveBeenCalledTimes(1);
    expect(h.install).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('任务已交给宿主后再报告安装错误，撤下等待状态并显示具体原因', async () => {
    state({ installAfterDownload: true });
    render(<ClientVersionBadge />);
    const card = await openLog();
    await userEvent.click(
      within(card).getByRole('button', { name: key('install') }),
    );
    expect(
      await screen.findByRole('dialog', {}, { timeout: 2_000 }),
    ).toHaveTextContent(key('installingHint'));
    act(() => {
      state({
        status: 'error',
        installAfterDownload: true,
        error: 'installer start failed',
      });
      h.listeners.forEach((listener) => listener(h.state));
    });
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'installer start failed',
    );
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: key('close'),
      }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('安装状态在延迟内结束时不残留进度弹窗', () => {
    vi.useFakeTimers();
    try {
      state({ status: 'installing', installAfterDownload: true });
      render(<ClientVersionBadge />);
      act(() => vi.advanceTimersByTime(500));
      act(() => {
        state({ status: 'error', installAfterDownload: true, error: 'failed' });
        h.listeners.forEach((listener) => listener(h.state));
      });
      act(() => vi.advanceTimersByTime(1_000));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(
        screen.getByRole('button', { name: key('errorTitle') }),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('键盘打开日志不会发起下载或安装', async () => {
    render(<ClientVersionBadge />);
    screen.getByRole('button', { name: key('ready') }).focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      '保留安装进度',
    );
    expect(h.download).not.toHaveBeenCalled();
    expect(h.install).not.toHaveBeenCalled();
  });
});
