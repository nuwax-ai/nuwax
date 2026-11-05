import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DshLauncher from './DshLauncher';

const mocks = vi.hoisted(() => ({ bridge: vi.fn(), error: vi.fn() }));
vi.mock('@/utils/hostBridge', () => ({ getDshLauncherBridge: mocks.bridge }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('./DshLauncher.less', () => ({ default: { launcher: 'launcher' } }));
vi.mock('antd', () => ({
  Button: ({ children, onClick, loading }: any) => (
    <button type="button" onClick={onClick} disabled={loading}>
      {children}
    </button>
  ),
  message: { error: mocks.error },
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('DS Bot shortcut', () => {
  it('stays hidden in an older client and follows enable/stop state changes', async () => {
    vi.useFakeTimers();
    mocks.bridge.mockReturnValue(null);
    render(<DshLauncher />);
    await act(async () => {});
    expect(screen.queryByRole('button', { name: 'DS Bot' })).toBeNull();
    const getState = vi.fn(async () => ({ enabled: true }));
    mocks.bridge.mockReturnValue({ getState });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'DS Bot' })).toBeTruthy();
    getState.mockResolvedValue({ enabled: false });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByRole('button', { name: 'DS Bot' })).toBeNull();
  });

  it('opens the existing runtime and consumes failures without sending the input draft', async () => {
    const open = vi.fn(async () => ({ ok: true }));
    mocks.bridge.mockReturnValue({
      getState: async () => ({ enabled: true }),
      open,
    });
    render(<DshLauncher />);
    fireEvent.click(await screen.findByRole('button', { name: 'DS Bot' }));
    await waitFor(() => expect(open).toHaveBeenCalledWith());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'DS Bot' })).not.toBeDisabled(),
    );
    open.mockRejectedValue(new Error('unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'DS Bot' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledOnce());
  });
});
