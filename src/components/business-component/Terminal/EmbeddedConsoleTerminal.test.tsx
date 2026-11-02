import { act, cleanup, render } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EmbeddedConsoleTerminal, {
  type EmbeddedConsoleTerminalRef,
} from './EmbeddedConsoleTerminal';
import { TTYD_CMD_PAUSE, TTYD_CMD_RESUME } from './ttydWire';

const mocks = vi.hoisted(() => ({ terminals: [] as any[] }));
vi.mock('./xtermBundle', () => ({
  Terminal: class {
    cols = 80;
    rows = 24;
    options = {};
    writes: Array<{ data: string; callback?: () => void }> = [];
    constructor() {
      mocks.terminals.push(this);
    }
    write = vi.fn((data: string, callback?: () => void) => {
      this.writes.push({ data, callback });
    });
    writeln = vi.fn();
    loadAddon = vi.fn();
    open = vi.fn();
    onData = vi.fn();
    onResize = vi.fn();
    resize = vi.fn();
    refresh = vi.fn();
    focus = vi.fn();
    dispose = vi.fn();
  },
  FitAddon: class {
    fit = vi.fn();
    dispose = vi.fn();
  },
}));

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
  constructor() {
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

const controlCommands = (socket: Socket) =>
  socket.send.mock.calls
    .filter(([data]) => data instanceof Uint8Array && data.length === 1)
    .map(([data]) => data[0]);

beforeEach(() => {
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
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
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

const mount = (wireProtocol: 'ttyd' | 'plain' = 'ttyd') => {
  const ref = React.createRef<EmbeddedConsoleTerminalRef>();
  const rendered = render(
    <EmbeddedConsoleTerminal
      ref={ref}
      wsUrl="ws://terminal.invalid"
      wireProtocol={wireProtocol}
      reconnect={{ enabled: false, heartbeatInterval: 0 }}
    />,
  );
  const socket = Socket.all.at(-1)!;
  act(() => socket.open());
  return { ref, socket, term: mocks.terminals.at(-1), ...rendered };
};

describe('EmbeddedConsoleTerminal ttyd backpressure', () => {
  it('keeps ttyd init dimensions and normal output unchanged', () => {
    const { socket, term } = mount();
    expect(socket.send.mock.calls[0]).toEqual([
      JSON.stringify({ columns: 80, rows: 24 }),
    ]);
    act(() => {
      socket.output('first');
      socket.output('second');
    });
    const output = term.writes.filter(({ callback }: any) => callback);
    expect(output.map(({ data }: any) => data)).toEqual(['first', 'second']);
    act(() => output.forEach(({ callback }: any) => callback()));
    expect(controlCommands(socket)).toEqual([]);
  });

  it('retains ordered high-volume output and resumes after xterm parsing', () => {
    const { socket, term } = mount();
    const chunks = Array.from({ length: 12 }, (_, index) =>
      `${index}:`.padEnd(120_000, 'x'),
    );
    act(() => chunks.forEach((chunk) => socket.output(chunk)));
    const output = term.writes.filter(({ callback }: any) => callback);
    expect(output.length).toBe(chunks.length);
    expect(
      output.every(({ data }: any, index: number) => data === chunks[index]),
    ).toBe(true);
    expect(controlCommands(socket)).toEqual([TTYD_CMD_PAUSE]);
    act(() => output.forEach(({ callback }: any) => callback()));
    expect(controlCommands(socket)).toEqual([TTYD_CMD_PAUSE, TTYD_CMD_RESUME]);
  });

  it('preserves the plain wire protocol without sending ttyd controls', () => {
    const { socket, term } = mount('plain');
    const data = 'plain output';
    act(() => socket.onmessage?.({ data } as MessageEvent));
    expect(term.writes.at(-1)).toEqual({ data, callback: undefined });
    expect(controlCommands(socket)).toEqual([]);
    expect(
      socket.send.mock.calls.some(([payload]) => payload.includes?.('columns')),
    ).toBe(false);
  });

  it('resets on peer disconnect before processing output from a new connection', () => {
    const { ref, socket, term } = mount();
    act(() => socket.output('x'.repeat(1_100_000)));
    const oldCallback = term.writes.find(
      ({ callback }: any) => callback,
    ).callback;
    act(() => {
      socket.close();
      ref.current!.connect();
    });
    const next = Socket.all.at(-1)!;
    act(() => {
      next.open();
      next.output('y'.repeat(1_100_000));
      oldCallback();
    });
    expect(controlCommands(next)).toEqual([TTYD_CMD_PAUSE]);
    const nextCallback = term.writes.at(-1).callback;
    act(() => nextCallback());
    expect(controlCommands(next)).toEqual([TTYD_CMD_PAUSE, TTYD_CMD_RESUME]);
  });

  it('releases the old peer before closing and isolates late parse callbacks', () => {
    const { ref, socket, term, unmount } = mount();
    act(() => socket.output('x'.repeat(1_100_000)));
    const oldCallback = term.writes.find(
      ({ callback }: any) => callback,
    ).callback;
    act(() => ref.current!.disconnect());
    expect(controlCommands(socket)).toEqual([TTYD_CMD_PAUSE, TTYD_CMD_RESUME]);
    expect(socket.send.mock.invocationCallOrder.at(-1)).toBeLessThan(
      socket.close.mock.invocationCallOrder[0],
    );
    act(() => ref.current!.connect());
    const next = Socket.all.at(-1)!;
    act(() => {
      next.open();
      next.output('y'.repeat(1_100_000));
      oldCallback();
    });
    expect(controlCommands(next)).toEqual([TTYD_CMD_PAUSE]);
    unmount();
    expect(controlCommands(next)).toEqual([TTYD_CMD_PAUSE, TTYD_CMD_RESUME]);
    expect(term.dispose).toHaveBeenCalledOnce();
  });
});
