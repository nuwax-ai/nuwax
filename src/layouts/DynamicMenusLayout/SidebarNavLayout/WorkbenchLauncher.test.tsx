import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WorkbenchLauncher from './WorkbenchLauncher';

const fixture = vi.hoisted(() => ({
  location: { pathname: '/space/1/agent/1', search: '?conversationId=42' },
  open: vi.fn(),
  available: true,
  error: vi.fn(),
}));
vi.mock('umi', () => ({ useLocation: () => fixture.location }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/hostBridge', () => ({
  getWorkbenchBridge: () => (fixture.available ? { open: fixture.open } : null),
}));
vi.mock('antd', () => ({
  Button: ({ children, onClick, loading }: any) => (
    <button type="button" onClick={onClick} disabled={loading}>
      {children}
    </button>
  ),
  message: { error: fixture.error },
}));
vi.mock('@ant-design/icons', () => ({ AppstoreOutlined: () => null }));
vi.mock('./DshLauncher.less', () => ({ default: { launcher: 'launcher' } }));
afterEach(cleanup);
beforeEach(() => {
  fixture.open.mockReset();
  fixture.error.mockReset();
  fixture.available = true;
  fixture.location = {
    pathname: '/space/1/agent/1',
    search: '?conversationId=42',
  };
});

describe('WorkbenchLauncher', () => {
  it('opens the current conversation and supports app workspace routes', async () => {
    fixture.location = { pathname: '/space/1/app-pro/7/99', search: '' };
    fixture.open.mockResolvedValue({ ok: true });
    render(<WorkbenchLauncher />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(fixture.open).toHaveBeenCalledWith('99'));
  });
  it('reports workspace failures and allows the same user action to retry', async () => {
    fixture.open
      .mockResolvedValueOnce({ ok: false, error: 'Workspace is not ready' })
      .mockResolvedValueOnce({ ok: true });
    render(<WorkbenchLauncher />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(fixture.error).toHaveBeenCalledWith(
        expect.stringContaining('Workspace is not ready'),
      ),
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(fixture.open).toHaveBeenCalledTimes(2));
  });
  it('shows the entry only with a host capability and a conversation identity', () => {
    fixture.available = false;
    const { rerender } = render(<WorkbenchLauncher />);
    expect(screen.queryByRole('button')).toBeNull();
    fixture.available = true;
    fixture.location.search = '';
    rerender(<WorkbenchLauncher />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
