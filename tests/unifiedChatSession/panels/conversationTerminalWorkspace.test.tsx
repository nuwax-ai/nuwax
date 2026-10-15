import ConversationTerminalWorkspace, {
  ConversationTerminalHost,
} from '@/components/business-component/ConversationTerminalWorkspace';
import { conversationTerminalStore } from '@/components/business-component/ConversationTerminalWorkspace/store';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ terminals: [] as any[] }));
vi.mock('@/components/base', () => ({ SvgIcon: () => <span /> }));
vi.mock('@/components/custom/TooltipIcon', () => ({
  default: ({ title, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {title}
    </button>
  ),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, n?: number) => (n ? `${key} ${n}` : key),
}));
vi.mock('@/services/vncDesktop', () => ({
  apiEnsurePod: vi.fn().mockResolvedValue({ code: '0000' }),
  apiKeepalivePod: vi.fn(),
  isEnsurePodThrottledError: () => false,
}));
vi.mock('ahooks', () => ({
  useRequest: () => ({ run: vi.fn(), cancel: vi.fn() }),
}));
vi.mock(
  '@/components/business-component/ConversationTerminalWorkspace/index.less',
  () => ({ default: new Proxy({}, { get: (_, key) => String(key) }) }),
);
vi.mock(
  '@/components/business-component/ConversationBottomConsole/index.less',
  () => ({ default: new Proxy({}, { get: (_, key) => String(key) }) }),
);
vi.mock(
  '@/components/business-component/ConversationBottomConsole/DevLogPanel',
  () => ({ default: () => null }),
);
vi.mock('@/components/business-component/Terminal/xtermBundle', () => ({
  Terminal: class {
    cols = 80;
    rows = 24;
    options = {};
    input?: (value: string) => void;
    constructor() {
      mocks.terminals.push(this);
    }
    write = vi.fn((_data: string, done?: () => void) => done?.());
    writeln = vi.fn();
    loadAddon() {}
    open() {}
    onResize() {}
    resize() {}
    refresh() {}
    focus() {}
    onData(fn: (value: string) => void) {
      this.input = fn;
    }
    dispose = vi.fn();
  },
  FitAddon: class {
    fit() {}
    dispose() {}
  },
}));

class Socket {
  static OPEN = 1;
  static CONNECTING = 0;
  static all: Socket[] = [];
  readyState = 0;
  onopen?: () => void;
  onclose?: (event: CloseEvent) => void;
  onmessage?: (event: MessageEvent) => void;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.({ code: 1000 } as CloseEvent);
  });
  constructor(public url: string) {
    Socket.all.push(this);
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  output(text: string) {
    this.onmessage?.({ data: `0${text}` } as MessageEvent);
  }
}
const key = 'PC.Components.ConversationTerminalWorkspace.';
const props = {
  workspaceConversationId: 12,
  sandboxId: '-1',
  wsUrl: 'ws://terminal.invalid/12',
  wireProtocol: 'ttyd' as const,
  defaultLayoutMode: 'default' as const,
  showLogsTab: false,
};

beforeEach(() => {
  Socket.all = [];
  mocks.terminals.length = 0;
  vi.stubGlobal('WebSocket', Socket);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    fn(0);
    return 1;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 600,
    height: 300,
  } as DOMRect);
});
afterEach(() => {
  act(() => conversationTerminalStore.clear());
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function openFirst() {
  await waitFor(() => expect(Socket.all.length).toBe(1), { timeout: 10000 });
  act(() => Socket.all[0].open());
  return Socket.all[0];
}

describe('会话终端工作区', () => {
  it('折叠时点击终端标签恢复面板并连接', async () => {
    render(
      <>
        <ConversationTerminalHost />
        <ConversationTerminalWorkspace
          {...props}
          defaultLayoutMode="collapsed"
        />
      </>,
    );
    await screen.findByRole(
      'tab',
      { name: `${key}terminalName 1` },
      { timeout: 10000 },
    );
    expect(Socket.all.length).toBe(0);
    fireEvent.click(screen.getByRole('tab', { name: `${key}terminalName 1` }));
    await waitFor(() => expect(Socket.all.length).toBe(1));
  }, 15000);
  it('切换会话、预览卸载及长于页面缓存宽限期后仍使用原连接和输出缓冲', async () => {
    const view = render(
      <>
        <ConversationTerminalHost />
        <ConversationTerminalWorkspace {...props} />
      </>,
    );
    const a = await openFirst();
    const term = mocks.terminals[0];
    view.rerender(
      <>
        <ConversationTerminalHost />
        <ConversationTerminalWorkspace
          {...props}
          workspaceConversationId={13}
          wsUrl="ws://terminal.invalid/13"
        />
      </>,
    );
    await waitFor(() => expect(Socket.all.length).toBe(2));
    expect(a.close).not.toHaveBeenCalled();
    view.rerender(<ConversationTerminalHost />);
    vi.useFakeTimers();
    act(() => vi.advanceTimersByTime(65_000));
    vi.useRealTimers();
    act(() => a.output('still-running-after-preview'));
    expect(term.write).toHaveBeenCalledWith(
      'still-running-after-preview',
      expect.any(Function),
    );
    view.rerender(
      <>
        <ConversationTerminalHost />
        <ConversationTerminalWorkspace {...props} />
      </>,
    );
    await waitFor(() =>
      expect(screen.getByRole('tab', { selected: true })).toBeTruthy(),
    );
    expect(Socket.all.length).toBe(2);
    expect(a.close).not.toHaveBeenCalled();
    expect(term.dispose).not.toHaveBeenCalled();
  });

  it('同一会话多个终端输入输出独立，切换和隐藏不重连，关闭仅影响目标终端', async () => {
    render(
      <>
        <ConversationTerminalHost />
        <ConversationTerminalWorkspace {...props} />
      </>,
    );
    const first = await openFirst();
    fireEvent.click(screen.getByRole('button', { name: `${key}addTerminal` }));
    await waitFor(() => expect(Socket.all.length).toBe(2));
    const second = Socket.all[1];
    act(() => second.open());
    act(() => {
      mocks.terminals[0].input('first\r');
      mocks.terminals[1].input('second\r');
      first.output('out-a');
      second.output('out-b');
    });
    expect(
      first.send.mock.calls.some(
        ([data]) =>
          data instanceof Uint8Array &&
          new TextDecoder().decode(data).endsWith('first\r'),
      ),
    ).toBe(true);
    expect(
      second.send.mock.calls.some(
        ([data]) =>
          data instanceof Uint8Array &&
          new TextDecoder().decode(data).endsWith('second\r'),
      ),
    ).toBe(true);
    expect(mocks.terminals[0].write).toHaveBeenCalledWith(
      'out-a',
      expect.any(Function),
    );
    expect(mocks.terminals[0].write).not.toHaveBeenCalledWith(
      'out-b',
      expect.anything(),
    );
    fireEvent.click(screen.getByRole('tab', { name: `${key}terminalName 1` }));
    expect(Socket.all.length).toBe(2);
    expect(first.close).not.toHaveBeenCalled();
    expect(second.close).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: `${key}closeTerminal 2` }),
    );
    fireEvent.click(await screen.findByText(`${key}confirmClose`));
    await waitFor(() => expect(second.close).toHaveBeenCalledOnce());
    expect(first.close).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: `${key}closeTerminal 1` }),
    );
    fireEvent.click(await screen.findByText(`${key}confirmClose`));
    await waitFor(() => expect(first.close).toHaveBeenCalledOnce());
    expect(Socket.all.length).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: `${key}addTerminal` }));
    await waitFor(() => expect(Socket.all.length).toBe(3));
  });

  it('换沙箱及退出登录释放连接，旧工作区不会在同 id 回访时复活', async () => {
    const view = render(
      <>
        <ConversationTerminalHost />
        <ConversationTerminalWorkspace {...props} />
      </>,
    );
    const old = await openFirst();
    view.rerender(
      <>
        <ConversationTerminalHost />
        <ConversationTerminalWorkspace {...props} sandboxId="computer-2" />
      </>,
    );
    await waitFor(() => expect(old.close).toHaveBeenCalledOnce());
    await waitFor(() => expect(Socket.all.length).toBe(2));
    act(() => {
      Socket.all[1].open();
      eventBus.emit(EVENT_NAMES.AUTH_SESSION_CLEARED);
    });
    await waitFor(() => expect(Socket.all[1].close).toHaveBeenCalledOnce());
    expect(conversationTerminalStore.getSnapshot()).toHaveLength(0);
  });

  it('删除会话仅释放该会话全部终端', async () => {
    const view = render(
      <>
        <ConversationTerminalHost />
        <ConversationTerminalWorkspace {...props} />
      </>,
    );
    const first = await openFirst();
    view.rerender(
      <>
        <ConversationTerminalHost />
        <ConversationTerminalWorkspace
          {...props}
          workspaceConversationId={13}
          wsUrl="ws://terminal.invalid/13"
        />
      </>,
    );
    await waitFor(() => expect(Socket.all.length).toBe(2));
    act(() => {
      Socket.all[1].open();
      window.dispatchEvent(
        new CustomEvent('conversation-deleted', { detail: { id: 12 } }),
      );
    });
    await waitFor(() => expect(first.close).toHaveBeenCalledOnce());
    expect(Socket.all[1].close).not.toHaveBeenCalled();
  });

  it('同会话挂载点交接后，旧页面迟到的卸载不能拆走新页面终端', async () => {
    render(<ConversationTerminalHost />);
    const firstView = render(<ConversationTerminalWorkspace {...props} />);
    const socket = await openFirst();
    const nextView = render(<ConversationTerminalWorkspace {...props} />);
    firstView.unmount();
    expect(nextView.container.querySelector('[role="tab"]')).toBeTruthy();
    expect(socket.close).not.toHaveBeenCalled();
    expect(Socket.all.length).toBe(1);
  });
});
