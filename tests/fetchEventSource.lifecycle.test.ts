import { createServer, type Server, type ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import { transferableAbortController } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/businessAuth', () => ({
  getBusinessRequestAuth: () => ({ credentials: 'same-origin', headers: {} }),
}));

import {
  clearSSESharedTimeout,
  createSSEConnection,
  type SSEConnection,
} from '@/utils/fetchEventSource';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('通用 SSE 真实 HTTP 生命周期', () => {
  let server: Server;
  let origin: string;
  let sockets: Set<Socket>;
  let responses: Map<string, ServerResponse>;
  let connections: SSEConnection[];
  let originalFetch: typeof window.fetch;

  beforeEach(async () => {
    sockets = new Set();
    responses = new Map();
    connections = [];
    originalFetch = window.fetch;
    window.fetch = globalThis.fetch;
    // jsdom 的 AbortSignal 与 Node HTTP fetch 属于不同 realm；传输仍使用真实 fetch。
    vi.stubGlobal(
      'AbortController',
      class {
        constructor() {
          return transferableAbortController();
        }
      },
    );
    server = createServer((request, response) => {
      responses.set(request.url!, response);
      if (request.url === '/error') {
        response.writeHead(503).end();
      } else if (request.url !== '/pending') {
        response.writeHead(200, { 'Content-Type': 'text/event-stream' });
        response.flushHeaders();
      }
    });
    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    origin = `http://127.0.0.1:${typeof address === 'object' && address!.port}`;
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    connections.forEach((connection) => connection.abort?.());
    sockets.forEach((socket) => socket.destroy());
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    window.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  const connect = (path: string, controller?: AbortController) => {
    const opened = deferred<void>();
    const received = deferred<void>();
    const onMessage = vi.fn((data: unknown) => {
      received.resolve();
      return data;
    });
    const onError = vi.fn();
    const onClose = vi.fn();
    const connection = createSSEConnection({
      url: `${origin}${path}`,
      abortController: controller,
      onOpen: () => opened.resolve(),
      onMessage,
      onError,
      onClose,
    });
    connections.push(connection);
    return { connection, opened, received, onMessage, onError, onClose };
  };

  const send = (path: string, data: object) =>
    responses.get(path)!.write(`data: ${JSON.stringify(data)}\n\n`);

  it('同步取消句柄可用，同时 await 仍等待正常 EOF 与完整消息', async () => {
    const stream = connect('/normal');
    expect(stream.connection.abort).toBeTypeOf('function');
    await stream.opened.promise;
    let settled = false;
    stream.connection.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    send('/normal', { text: 'first' });
    send('/normal', { text: 'last' });
    responses.get('/normal')!.end();
    const abort = await stream.connection;
    abort();
    expect(stream.onMessage.mock.calls.map(([data]) => data)).toEqual([
      { text: 'first' },
      { text: 'last' },
    ]);
    expect(stream.onClose).toHaveBeenCalledTimes(1);
    expect(stream.onError).not.toHaveBeenCalled();
  });

  it('end_turn 保留现有 500ms 尾部窗口，并实际关闭仍开放的流', async () => {
    const stream = connect('/tail');
    await stream.opened.promise;
    const disconnected = deferred<void>();
    responses.get('/tail')!.on('close', () => disconnected.resolve());
    send('/tail', { subType: 'end_turn' });
    await stream.received.promise;
    expect(stream.onClose).not.toHaveBeenCalled();
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
    send('/tail', { text: 'protocol tail' });
    send('/tail', { completed: true });
    await stream.connection;
    await disconnected.promise;
    expect(stream.onMessage.mock.calls.map(([data]) => data)).toEqual([
      { subType: 'end_turn' },
      { text: 'protocol tail' },
      { completed: true },
    ]);
    expect(stream.onClose).toHaveBeenCalledTimes(1);
  });

  it('用户显式取消立即 abort HTTP，迟到消息不再分发', async () => {
    const controller = new AbortController();
    const stream = connect('/cancel', controller);
    await stream.opened.promise;
    send('/cancel', { text: 'before cancel' });
    await stream.received.promise;
    const disconnected = deferred<void>();
    responses.get('/cancel')!.on('close', () => disconnected.resolve());
    stream.connection.abort();
    expect(controller.signal.aborted).toBe(true);
    expect(stream.onClose).toHaveBeenCalledTimes(1);
    await stream.connection;
    await disconnected.promise;
    stream.connection.abort();
    expect(stream.onMessage).toHaveBeenCalledTimes(1);
    expect(stream.onClose).toHaveBeenCalledTimes(1);
    expect(stream.onError).not.toHaveBeenCalled();
  });

  it('外部 controller abort 与预先已 abort 都能完成收尾', async () => {
    const controller = new AbortController();
    const stream = connect('/external', controller);
    await stream.opened.promise;
    controller.abort();
    await stream.connection;
    expect(stream.onClose).toHaveBeenCalledTimes(1);
    expect(stream.onError).not.toHaveBeenCalled();

    const alreadyAborted = new AbortController();
    alreadyAborted.abort();
    const pending = connect('/pending', alreadyAborted);
    await pending.connection;
    expect(pending.onClose).toHaveBeenCalledTimes(1);
    expect(responses.has('/pending')).toBe(false);
  });

  it('响应头未到达时也可取消，不必等待流结束才拿到句柄', async () => {
    const stream = connect('/pending');
    expect(stream.connection.abort).toBeTypeOf('function');
    stream.connection.abort();
    await stream.connection;
    expect(stream.onClose).toHaveBeenCalledTimes(1);
    expect(stream.onError).not.toHaveBeenCalled();
  });

  it('并发连接 watchdog 互不清除，组件旧共享清理不影响活跃流', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const first = connect('/first');
    const second = connect('/second');
    await Promise.all([first.opened.promise, second.opened.promise]);
    const baseTime = Date.now();
    vi.setSystemTime(baseTime + 60_000);
    clearSSESharedTimeout();
    await vi.advanceTimersByTimeAsync(5_000);
    vi.useRealTimers();
    await Promise.all([first.connection, second.connection]);
    expect(first.onClose).toHaveBeenCalledTimes(1);
    expect(second.onClose).toHaveBeenCalledTimes(1);
    expect(first.onError).not.toHaveBeenCalled();
    expect(second.onError).not.toHaveBeenCalled();
  });

  it('HTTP 错误只发一次 error/close，并且不会重连', async () => {
    const stream = connect('/error');
    await stream.connection;
    expect(stream.onError).toHaveBeenCalledTimes(1);
    expect(stream.onClose).toHaveBeenCalledTimes(1);
  });

  it('单条消息解析异常保持既有非终止语义，后续消息仍完整送达', async () => {
    const stream = connect('/parse-recovery');
    await stream.opened.promise;
    responses
      .get('/parse-recovery')!
      .write('data: invalid-json\n\ndata: also-invalid\n\n');
    send('/parse-recovery', { text: 'valid after invalid frame' });
    responses.get('/parse-recovery')!.end();
    await stream.connection;
    expect(stream.onError).toHaveBeenCalledTimes(1);
    expect(stream.onClose).toHaveBeenCalledTimes(1);
    expect(stream.onMessage.mock.calls.map(([data]) => data)).toEqual([
      { text: 'valid after invalid frame' },
    ]);
  });
});
