import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ClientVersionBadge from './ClientVersionBadge';
import type { PageBuildInfo } from './pageBuildInfo';
import WebVersionBadge from './WebVersionBadge';

const mocks = vi.hoisted(() => ({
  available: false,
  listeners: new Set<(available: boolean) => void>(),
  reload: vi.fn(),
  clientAvailable: true,
  clientState: null as ClientUpdateState | null,
  clientListeners: new Set<(state: ClientUpdateState | null) => void>(),
  startClient: vi.fn(),
  currentBuildInfo: {
    appVersion: '1.1.9',
    gitHash: 'aaaaaaa',
    buildAt: '2026-10-09T13:40:34.791Z',
  } as PageBuildInfo,
  latestBuildInfo: undefined as PageBuildInfo | undefined,
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) =>
    key === 'PC.Components.ClientUpdate.update'
      ? '更新'
      : key === 'PC.Components.WebUpdate.refreshHint'
      ? '网页已更新，点击刷新'
      : key,
}));
vi.mock('./clientUpdateService', () => ({
  isAvailable: () => mocks.clientAvailable,
  start: () => mocks.startClient(),
  subscribe: (listener: (state: ClientUpdateState | null) => void) => {
    mocks.clientListeners.add(listener);
    listener(mocks.clientState);
    return () => {
      mocks.clientListeners.delete(listener);
    };
  },
  download: vi.fn().mockResolvedValue(true),
  install: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('./webUpdateService', () => ({
  reloadWebPage: () => mocks.reload(),
  getLatestWebBuildInfo: () => mocks.latestBuildInfo,
  subscribeWebUpdate: (listener: (available: boolean) => void) => {
    mocks.listeners.add(listener);
    listener(mocks.available);
    return () => {
      mocks.listeners.delete(listener);
    };
  },
}));

vi.mock('./pageBuildInfo', () => ({
  getPageBuildInfo: () => mocks.currentBuildInfo,
}));

function publish(available: boolean) {
  act(() => {
    mocks.available = available;
    mocks.listeners.forEach((listener) => listener(available));
  });
}

function publishClient(overrides: Partial<ClientUpdateState>) {
  act(() => {
    mocks.clientState = { hostVersion: '3.0.11', status: 'idle', ...overrides };
    mocks.clientListeners.forEach((listener) => listener(mocks.clientState));
  });
}

beforeEach(() => {
  mocks.available = false;
  mocks.reload.mockReset();
  mocks.listeners.clear();
  mocks.clientAvailable = true;
  mocks.clientState = null;
  mocks.clientListeners.clear();
  mocks.startClient.mockReset();
  mocks.currentBuildInfo = {
    appVersion: '1.1.9',
    gitHash: 'aaaaaaa',
    buildAt: '2026-10-09T13:40:34.791Z',
  };
  mocks.latestBuildInfo = {
    appVersion: '1.2.0',
    gitHash: '9339573f3',
    buildAt: '2026-10-09T14:40:34.791Z',
  };
});
afterEach(() => vi.restoreAllMocks());

describe('WebVersionBadge', () => {
  it('hides until the version service has confirmed an update, without reloading automatically', () => {
    render(<WebVersionBadge />);
    expect(screen.queryByRole('button')).toBeNull();
    publish(true);
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
    expect(mocks.reload).not.toHaveBeenCalled();
    publish(false);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('matches the client hover card, compares actual web builds, and reloads only on activation', async () => {
    mocks.available = true;
    mocks.clientState = {
      hostVersion: '3.0.11',
      version: '3.0.12',
      status: 'checking',
    };
    render(<WebVersionBadge />);
    const button = screen.getByRole('button', {
      name: '更新',
    });
    await userEvent.hover(button);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('网页已更新，点击刷新');
    expect(tooltip).not.toHaveTextContent('3.0.11');
    expect(tooltip).not.toHaveTextContent('3.0.12');
    expect(tooltip).toHaveTextContent('1.1.9');
    expect(tooltip).toHaveTextContent('1.2.0');
    expect(tooltip).toHaveTextContent('aaaaaaa');
    expect(tooltip).toHaveTextContent('9339573f3');
    expect(tooltip).toHaveTextContent(
      new Date('2026-10-09T13:40:34.791Z').toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    );
    expect(tooltip).toHaveTextContent(
      new Date('2026-10-09T14:40:34.791Z').toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    );
    expect(tooltip).not.toHaveTextContent(
      'PC.Components.ClientUpdate.releaseDate',
    );
    expect(tooltip).not.toHaveTextContent(
      'PC.Components.ClientUpdate.releaseNotesTitle',
    );
    expect(tooltip.closest('.ant-popover')).toHaveClass(
      'ant-popover-placement-bottomLeft',
    );
    expect(mocks.reload).not.toHaveBeenCalled();
    await userEvent.click(
      within(tooltip).getByRole('button', { name: '更新' }),
    );
    expect(mocks.reload).toHaveBeenCalledTimes(1);
    await userEvent.click(button);
    expect(mocks.reload).toHaveBeenCalledTimes(2);
  });

  it('shows unknown metadata safely and refreshes latest details without changing the loaded page snapshot', async () => {
    mocks.available = true;
    mocks.currentBuildInfo = { gitHash: 'aaaaaaa' };
    mocks.latestBuildInfo = { gitHash: 'bbbbbbb' };
    render(<WebVersionBadge />);
    await userEvent.hover(screen.getByRole('button', { name: '更新' }));
    const card = await screen.findByRole('tooltip');
    expect(card.textContent?.match(/—/g)).toHaveLength(4);
    mocks.latestBuildInfo = {
      appVersion: '1.2.0',
      gitHash: '9339573f3',
      buildAt: '2026-10-09T14:40:34.791Z',
    };
    publish(true);
    expect(card).toHaveTextContent('9339573f3');
    expect(card).toHaveTextContent('aaaaaaa');
    expect(card).not.toHaveTextContent('bbbbbbb');
    expect(mocks.currentBuildInfo).toEqual({ gitHash: 'aaaaaaa' });
    expect(mocks.reload).not.toHaveBeenCalled();
  });

  it.each(['available', 'downloading', 'downloaded', 'error'] as const)(
    'gives a known client update priority during %s, then restores the web entry',
    (status) => {
      mocks.available = true;
      render(<WebVersionBadge />);
      publishClient({ status, version: '3.0.12' });
      expect(screen.queryByRole('button', { name: '更新' })).toBeNull();
      expect(mocks.reload).not.toHaveBeenCalled();
      publishClient({ status: 'not-available' });
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
      expect(mocks.startClient).not.toHaveBeenCalled();
    },
  );

  it.each(['idle', 'checking', 'not-available', 'error'] as const)(
    'keeps the web entry during %s without a confirmed client update',
    (status) => {
      mocks.available = true;
      render(<WebVersionBadge />);
      publishClient({ status });
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
    },
  );

  it('keeps the web entry when the host updater or visible host version is missing', () => {
    mocks.available = true;
    mocks.clientAvailable = false;
    render(<WebVersionBadge />);
    publishClient({ status: 'available', version: '3.0.12' });
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
    mocks.clientAvailable = true;
    publishClient({ status: 'available', version: '3.0.12', hostVersion: '' });
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
  });

  it('renders only one update capsule beside the actual client badge', () => {
    mocks.available = true;
    mocks.clientState = {
      hostVersion: '3.0.11',
      version: '3.0.12',
      status: 'available',
    };
    render(
      <>
        <ClientVersionBadge />
        <WebVersionBadge />
      </>,
    );
    expect(screen.getAllByText('更新')).toHaveLength(1);
    expect(
      screen.getByRole('button', {
        name: 'PC.Components.ClientUpdate.download',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '更新' })).toBeNull();
    publishClient({ status: 'not-available' });
    expect(screen.getByText('v3.0.11')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
  });

  it('is keyboard accessible and disposes its subscription on unmount', async () => {
    mocks.available = true;
    const { unmount } = render(
      <React.StrictMode>
        <WebVersionBadge />
      </React.StrictMode>,
    );
    expect(mocks.listeners.size).toBe(1);
    expect(mocks.clientListeners.size).toBe(1);
    const button = screen.getByRole('button', {
      name: '更新',
    });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(mocks.reload).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(' ');
    expect(mocks.reload).toHaveBeenCalledTimes(2);
    unmount();
    expect(mocks.listeners.size).toBe(0);
    expect(mocks.clientListeners.size).toBe(0);
  });
});
