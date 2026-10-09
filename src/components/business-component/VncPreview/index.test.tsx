import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VncPreview from './index';
const mocks = vi.hoisted(() => ({ check: vi.fn() }));
vi.mock('@/constants/common.constants', () => ({
  IDLE_DETECTION_TIMEOUT_MS: 60000,
  IDLE_WARNING_COUNTDOWN_SECONDS: 15,
  SANDBOX: 'allow-scripts',
}));
vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('@/services/vncDesktop', () => ({
  apiCheckVncStatus: mocks.check,
  isEnsurePodThrottledError: () => false,
}));
vi.mock('@/hooks/useIdleDetection', () => ({
  useIdleDetection: () => ({ resetIdleTimer() {} }),
}));
vi.mock('@/utils/logger', () => ({ createLogger: () => ({ log() {} }) }));
vi.mock('./components/IdleWarningModal', () => ({ default: () => null }));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
afterEach(() => {
  cleanup();
  mocks.check.mockReset();
});
describe('VNC configuration replacement', () => {
  it('discards a late previous session status and keeps the current document source', async () => {
    let finishOld!: (value: any) => void;
    let finishNew!: (value: any) => void;
    mocks.check.mockImplementation(
      (id: number) =>
        new Promise((resolve) => {
          if (id === 111) finishOld = resolve;
          else finishNew = resolve;
        }),
    );
    const { rerender } = render(
      <VncPreview
        cId="111"
        sourceUrl="/api/userapp/proxy/vnc/dev/9/"
        appStage="dev"
        autoConnect
      />,
    );
    await waitFor(() => expect(finishOld).toBeTypeOf('function'));
    rerender(
      <VncPreview
        cId="222"
        sourceUrl="/api/userapp/proxy/vnc/dev/10/"
        appStage="prod"
        autoConnect
      />,
    );
    await waitFor(() => expect(finishNew).toBeTypeOf('function'));
    await act(async () => {
      finishNew({ data: { novnc_ready: true } });
    });
    const frame = screen.getByTitle('VNC Preview');
    expect(frame.getAttribute('src')).toContain(
      '/api/userapp/proxy/vnc/dev/10/',
    );
    await act(async () => {
      finishOld({ data: { novnc_ready: true } });
    });
    expect(screen.getByTitle('VNC Preview')).toBe(frame);
    expect(frame.getAttribute('src')).toContain(
      '/api/userapp/proxy/vnc/dev/10/',
    );
    expect(mocks.check).toHaveBeenCalledWith(111, 'dev');
    expect(mocks.check).toHaveBeenCalledWith(222, 'prod');
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'vnc_connection_failed', msg: 'old frame' },
        source: window,
      }),
    );
    expect(screen.queryByText('old frame')).toBeNull();
  });
});
