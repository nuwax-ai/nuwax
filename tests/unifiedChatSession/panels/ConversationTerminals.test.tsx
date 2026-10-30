import ConversationBottomConsole from '@/components/business-component/ConversationBottomConsole';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  terminals: [] as any[],
  ensure: vi.fn(),
  runKeepalive: vi.fn(),
  stopKeepalive: vi.fn(),
}));
vi.mock('@/components/base', () => ({ SvgIcon: () => null }));
vi.mock('@/components/custom/TooltipIcon', () => ({ default: () => null }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/vncDesktop', () => ({
  apiEnsurePod: mocks.ensure,
  apiKeepalivePod: vi.fn(),
  isEnsurePodThrottledError: () => false,
}));
vi.mock('ahooks', () => ({
  useRequest: () => ({ run: mocks.runKeepalive, cancel: mocks.stopKeepalive }),
}));
vi.mock(
  '@/components/business-component/ConversationBottomConsole/DevLogPanel',
  () => ({ default: () => null }),
);
vi.mock('@/components/business-component/Terminal/xtermBundle', () => ({
  Terminal: class {
    cols = 80;
    rows = 24;
    options = {};
    write = vi.fn((_data: string, cb?: () => void) => cb?.());
    writeln = vi.fn();
    focus = vi.fn();
    dispose = vi.fn();
    constructor() {
      mocks.terminals.push(this);
    }
    loadAddon() {}
    open() {}
    onResize() {}
    resize() {}
    refresh() {}
    onData(callback: (data: string) => void) {
      this.input = callback;
    }
    input(_data: string) {}
  },
  FitAddon: class {
    fit() {}
    dispose() {}
  },
}));
vi.mock(
  '@/components/business-component/ConversationBottomConsole/index.less',
  () => ({ default: new Proxy({}, { get: (_, key) => String(key) }) }),
);
class Socket {
  static OPEN = 1;
  static CONNECTING = 0;
  static all: Socket[] = [];
  readyState = Socket.CONNECTING;
  onopen?: () => void;
  onmessage?: (event: MessageEvent) => void;
  onclose?: (event: CloseEvent) => void;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.({ code: 1000, reason: '' } as CloseEvent);
  });
  constructor(public url: string) {
    Socket.all.push(this);
  }
  open() {
    this.readyState = Socket.OPEN;
    this.onopen?.();
  }
  output(data: string) {
    this.onmessage?.({ data: `0${data}` } as MessageEvent);
  }
}
const prefix = 'PC.Components.ConversationBottomConsole.';
const openAnother = () =>
  fireEvent.click(screen.getByRole('button', { name: `${prefix}newTerminal` }));
const select = (id: number) =>
  fireEvent.click(
    screen.getByRole('button', { name: `${prefix}tabTerminal ${id}` }),
  );
const close = (id: number) =>
  fireEvent.click(
    screen.getByRole('button', { name: `${prefix}closeTerminal ${id}` }),
  );
const props = {
  wsUrl: 'ws://fixture/100',
  enableMultipleTerminals: true,
  preserveTerminalConnections: true,
  defaultLayoutMode: 'default' as const,
};

beforeEach(() => {
  mocks.ensure.mockReset().mockResolvedValue({ code: '0000' });
  mocks.runKeepalive.mockClear();
  mocks.stopKeepalive.mockClear();
  mocks.terminals.length = 0;
  Socket.all = [];
  vi.useFakeTimers();
  vi.stubGlobal('WebSocket', Socket);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 400,
    height: 200,
  } as DOMRect);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('会话内多终端的连接所有权', () => {
  it('多开后输入和输出各归自身；切终端、日志或隐藏会话保留连接，关闭只释放目标', () => {
    const view = render(<ConversationBottomConsole {...props} />);
    const a = Socket.all[0];
    act(() => a.open());
    openAnother();
    const b = Socket.all[1];
    act(() => b.open());
    const [ta, tb] = mocks.terminals;
    act(() => {
      ta.input('a');
      tb.input('b');
      a.output('output-a');
      b.output('output-b');
    });
    expect(ta.write).toHaveBeenCalledWith('output-a', expect.any(Function));
    expect(tb.write).not.toHaveBeenCalledWith('output-a', expect.any(Function));
    expect(
      a.send.mock.calls.some(
        ([data]) => data instanceof Uint8Array && data[1] === 97,
      ),
    ).toBe(true);
    expect(
      b.send.mock.calls.some(
        ([data]) => data instanceof Uint8Array && data[1] === 97,
      ),
    ).toBe(false);
    select(1);
    fireEvent.click(screen.getByText(`${prefix}tabLogs`));
    view.rerender(<ConversationBottomConsole {...props} visible={false} />);
    act(() => a.output('hidden-output'));
    expect(a.close).not.toHaveBeenCalled();
    expect(b.close).not.toHaveBeenCalled();
    expect(ta.write).toHaveBeenCalledWith(
      'hidden-output',
      expect.any(Function),
    );
    view.rerender(<ConversationBottomConsole {...props} visible />);
    select(2);
    close(1);
    expect(a.close).toHaveBeenCalledOnce();
    expect(b.close).not.toHaveBeenCalled();
    expect(ta.dispose).toHaveBeenCalledOnce();
    expect(Socket.all).toHaveLength(2);
    view.unmount();
    expect(b.close).toHaveBeenCalledOnce();
    expect(tb.dispose).toHaveBeenCalledOnce();
  });

  it('关闭最后一个终端取消迟到的容器启动和保活，新建后才重新接入', async () => {
    let finishEnsure!: (value: unknown) => void;
    mocks.ensure.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishEnsure = resolve;
        }),
    );
    render(<ConversationBottomConsole {...props} conversationId={100} />);
    expect(mocks.ensure).toHaveBeenCalledOnce();
    close(1);
    await act(async () => finishEnsure({ code: '0000' }));
    expect(mocks.runKeepalive).not.toHaveBeenCalled();
    expect(Socket.all).toHaveLength(0);
    openAnother();
    await act(async () => {});
    expect(mocks.ensure).toHaveBeenCalledTimes(2);
    expect(Socket.all).toHaveLength(1);
    expect(mocks.runKeepalive).toHaveBeenCalledWith(100);
    close(2);
    expect(mocks.stopKeepalive).toHaveBeenCalled();
  });

  it('关闭断线重试中的终端会取消重连，换会话或沙箱释放全部旧连接', () => {
    const view = render(<ConversationBottomConsole {...props} />);
    act(() => Socket.all[0].open());
    openAnother();
    const b = Socket.all[1];
    act(() => {
      b.open();
      b.close();
    });
    close(2);
    act(() => vi.advanceTimersByTime(4000));
    expect(Socket.all).toHaveLength(2);
    const a = Socket.all[0];
    view.rerender(
      <ConversationBottomConsole {...props} wsUrl="ws://fixture/101" />,
    );
    expect(a.close).toHaveBeenCalledOnce();
    expect(Socket.all[2].url).toBe('ws://fixture/101');
    expect(
      screen.queryByRole('button', { name: `${prefix}tabTerminal 2` }),
    ).toBeNull();
  });

  it('隐藏终端断线仍能独立重连，全部关闭后只在用户新建时再连接', () => {
    render(<ConversationBottomConsole {...props} />);
    const a = Socket.all[0];
    act(() => a.open());
    openAnother();
    act(() => Socket.all[1].open());
    act(() => {
      a.close();
      vi.advanceTimersByTime(4000);
    });
    expect(Socket.all).toHaveLength(3);
    expect(Socket.all[2].url).toBe('ws://fixture/100');
    close(1);
    close(2);
    act(() => vi.advanceTimersByTime(4000));
    expect(Socket.all).toHaveLength(3);
    openAnother();
    expect(Socket.all).toHaveLength(4);
    expect(
      screen.getByRole('button', { name: `${prefix}tabTerminal 3` }),
    ).toBeTruthy();
  });
});
