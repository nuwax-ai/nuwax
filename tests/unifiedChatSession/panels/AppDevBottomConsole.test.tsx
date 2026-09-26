import ConversationBottomConsole from '@/components/business-component/ConversationBottomConsole';
import AppDevBottomConsole from '@/pages/AppDevPro/components/AppDevBottomConsole';
import { UserAppDbEnvEnum } from '@/pages/AppDevPro/services/appDb';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ensure: vi.fn(),
  keepalive: vi.fn(),
  mounts: new Map<string, number>(),
  terminals: new Map<string, any>(),
  run: vi.fn(),
  cancel: vi.fn(),
}));
vi.mock('@/components/base', () => ({ SvgIcon: () => <span /> }));
vi.mock('@/components/custom/TooltipIcon', () => ({
  default: ({ onClick, title }: any) => (
    <button onClick={onClick}>{title}</button>
  ),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/vncDesktop', () => ({
  apiEnsurePod: mocks.ensure,
  apiKeepalivePod: mocks.keepalive,
  isEnsurePodThrottledError: () => false,
}));
vi.mock('ahooks', () => ({
  useRequest: () => ({ run: mocks.run, cancel: mocks.cancel }),
}));
vi.mock(
  '@/components/business-component/ConversationBottomConsole/index.less',
  () => ({
    default: new Proxy({}, { get: (_, key) => String(key) }),
  }),
);
vi.mock(
  '@/components/business-component/ConversationBottomConsole/DevLogPanel',
  () => ({
    default: ({ logs }: any) => <div data-testid="dev-logs">{logs.length}</div>,
  }),
);
vi.mock(
  '@/components/business-component/Terminal/EmbeddedConsoleTerminal',
  async () => {
    const React = await import('react');
    return {
      default: React.forwardRef((props: any, ref) => {
        React.useEffect(() => {
          mocks.mounts.set(
            props.wsUrl,
            (mocks.mounts.get(props.wsUrl) || 0) + 1,
          );
        }, []);
        mocks.terminals.set(props.wsUrl, props);
        React.useImperativeHandle(ref, () => ({
          restoreAfterVisibilityChange() {},
          disconnect() {},
          reconnect() {},
          writeln() {},
          getTerminal: () => ({ write() {} }),
          focus() {},
        }));
        return (
          <div
            data-testid={props.wsUrl}
            data-connect={String(props.autoConnect)}
          />
        );
      }),
    };
  },
);

beforeEach(() => {
  mocks.ensure.mockReset().mockResolvedValue({ code: '0000' });
  mocks.keepalive.mockReset();
  mocks.mounts.clear();
  mocks.terminals.clear();
  mocks.run.mockClear();
  mocks.cancel.mockClear();
});
afterEach(cleanup);

describe('shared terminal console', () => {
  it('does not restart keepalive when ensure resolves after unmount', async () => {
    let resolveEnsure!: (result: { code: string }) => void;
    mocks.ensure.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveEnsure = resolve;
        }),
    );
    const view = render(
      <ConversationBottomConsole
        wsUrl="single"
        conversationId={12}
        defaultLayoutMode="default"
      />,
    );
    await waitFor(() => expect(mocks.ensure).toHaveBeenCalled());
    view.unmount();
    await act(async () => {
      resolveEnsure({ code: '0000' });
    });
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it('keeps single-session ensure without introducing an app environment', async () => {
    render(
      <ConversationBottomConsole
        wsUrl="single"
        conversationId={12}
        defaultLayoutMode="default"
      />,
    );
    await waitFor(() =>
      expect(mocks.ensure).toHaveBeenCalledWith(12, undefined),
    );
    await waitFor(() =>
      expect(screen.getByTestId('single').dataset.connect).toBe('true'),
    );
    expect(mocks.mounts.size).toBe(1);
  });
  it('preserves two terminal instances and connects only the selected ready environment', async () => {
    const onActive = vi.fn();
    const props = {
      conversationId: 42,
      devWsUrl: 'dev-ws',
      prodWsUrl: 'prod-ws',
      externalContainerStatus: 'running' as const,
      prodExternalContainerStatus: 'running' as const,
      defaultLayoutMode: 'default' as const,
      enableKeepalivePolling: false,
      onActiveTerminalEnvChange: onActive,
    };
    const { rerender } = render(
      <AppDevBottomConsole {...props} env={UserAppDbEnvEnum.Dev} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('dev-ws').dataset.connect).toBe('true'),
    );
    expect(screen.getByTestId('prod-ws').dataset.connect).toBe('false');
    const devNode = screen.getByTestId('dev-ws');
    const prodNode = screen.getByTestId('prod-ws');
    rerender(<AppDevBottomConsole {...props} env={UserAppDbEnvEnum.Prod} />);
    await waitFor(() =>
      expect(screen.getByTestId('prod-ws').dataset.connect).toBe('true'),
    );
    expect(screen.getByTestId('dev-ws')).toBe(devNode);
    expect(screen.getByTestId('prod-ws')).toBe(prodNode);
    expect(mocks.mounts.get('dev-ws')).toBe(1);
    expect(mocks.mounts.get('prod-ws')).toBe(1);
    expect(onActive).toHaveBeenLastCalledWith(UserAppDbEnvEnum.Prod);
    expect(mocks.ensure).not.toHaveBeenCalled();
    await act(async () => {
      mocks.terminals.get('prod-ws').onReconnectFailed();
    });
    expect(screen.getByTestId('prod-ws').dataset.connect).toBe('false');
    await act(async () => {
      mocks.terminals.get('dev-ws').onConnect();
    });
    expect(screen.getByTestId('prod-ws').dataset.connect).toBe('false');
    await act(async () => {
      mocks.terminals.get('prod-ws').onDisconnect();
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(mocks.ensure).not.toHaveBeenCalled();
    rerender(
      <AppDevBottomConsole
        {...props}
        env={UserAppDbEnvEnum.Prod}
        visible={false}
      />,
    );
    expect(onActive).toHaveBeenLastCalledWith(null);
  });
  it('ignores an old environment ensure result while the new terminal is still starting', async () => {
    let finishDev!: (value: { code: string }) => void;
    let finishProd!: (value: { code: string }) => void;
    mocks.ensure.mockImplementation(
      (_id, stage) =>
        new Promise((resolve) => {
          if (stage === 'dev') finishDev = resolve;
          else finishProd = resolve;
        }),
    );
    const props = {
      conversationId: 42,
      devWsUrl: 'dev-ws',
      prodWsUrl: 'prod-ws',
      defaultLayoutMode: 'default' as const,
      enableKeepalivePolling: false,
    };
    const { rerender } = render(
      <AppDevBottomConsole {...props} env={UserAppDbEnvEnum.Dev} />,
    );
    await waitFor(() => expect(finishDev).toBeTypeOf('function'));
    rerender(<AppDevBottomConsole {...props} env={UserAppDbEnvEnum.Prod} />);
    await waitFor(() => expect(finishProd).toBeTypeOf('function'));
    await act(async () => {
      finishDev({ code: '0000' });
    });
    expect(screen.getByTestId('prod-ws').dataset.connect).toBe('false');
    await act(async () => {
      finishProd({ code: '0000' });
    });
    expect(screen.getByTestId('prod-ws').dataset.connect).toBe('true');
    expect(mocks.ensure).toHaveBeenCalledWith(42, 'dev');
    expect(mocks.ensure).toHaveBeenCalledWith(42, 'prod');
  });

  it('waits for parent container startup while retaining logs and both buffers', async () => {
    render(
      <AppDevBottomConsole
        conversationId={42}
        env={UserAppDbEnvEnum.Prod}
        devWsUrl="dev-ws"
        prodWsUrl="prod-ws"
        externalContainerStatus="running"
        prodExternalContainerStatus="starting"
        defaultLayoutMode="default"
        enableKeepalivePolling={false}
        devLog={{ logs: [] }}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('prod-ws').dataset.connect).toBe('false'),
    );
    expect(screen.getByTestId('dev-logs')).toBeTruthy();
    expect(mocks.mounts.size).toBe(2);
    expect(mocks.ensure).not.toHaveBeenCalled();
  });
});
