import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebVersionBadge from './WebVersionBadge';

const mocks = vi.hoisted(() => ({
  available: false,
  listeners: new Set<(available: boolean) => void>(),
  reload: vi.fn(),
}));

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('./webUpdateService', () => ({
  reloadWebPage: () => mocks.reload(),
  subscribeWebUpdate: (listener: (available: boolean) => void) => {
    mocks.listeners.add(listener);
    listener(mocks.available);
    return () => {
      mocks.listeners.delete(listener);
    };
  },
}));

function publish(available: boolean) {
  act(() => {
    mocks.available = available;
    mocks.listeners.forEach((listener) => listener(available));
  });
}

beforeEach(() => {
  mocks.available = false;
  mocks.reload.mockReset();
  mocks.listeners.clear();
});
afterEach(() => vi.restoreAllMocks());

describe('WebVersionBadge', () => {
  it('hides until the version service has confirmed an update, without reloading automatically', () => {
    render(<WebVersionBadge />);
    expect(screen.queryByRole('button')).toBeNull();
    publish(true);
    expect(
      screen.getByRole('button', { name: 'PC.Components.WebUpdate.update' }),
    ).toBeInTheDocument();
    expect(mocks.reload).not.toHaveBeenCalled();
    publish(false);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows a tooltip and reloads only when the user activates the button', async () => {
    mocks.available = true;
    render(<WebVersionBadge />);
    const button = screen.getByRole('button', {
      name: 'PC.Components.WebUpdate.update',
    });
    await userEvent.hover(button);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('PC.Components.WebUpdate.refreshHint');
    expect(tooltip.closest('.ant-tooltip')).toHaveClass(
      'ant-tooltip-placement-bottom',
    );
    expect(mocks.reload).not.toHaveBeenCalled();
    await userEvent.click(button);
    expect(mocks.reload).toHaveBeenCalledTimes(1);
  });

  it('is keyboard accessible and disposes its subscription on unmount', async () => {
    mocks.available = true;
    const { unmount } = render(
      <React.StrictMode>
        <WebVersionBadge />
      </React.StrictMode>,
    );
    expect(mocks.listeners.size).toBe(1);
    const button = screen.getByRole('button', {
      name: 'PC.Components.WebUpdate.update',
    });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(mocks.reload).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(' ');
    expect(mocks.reload).toHaveBeenCalledTimes(2);
    unmount();
    expect(mocks.listeners.size).toBe(0);
  });
});
