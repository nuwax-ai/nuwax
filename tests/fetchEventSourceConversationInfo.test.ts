/**
 * createSSEConnection 错误路径回归测试
 *
 * 修复前：onerror / 外层 catch 只调 onError 不调 onClose，
 * 导致 sub 恢复（useConversationStreamResume）的「已订阅」标记永久卡死、轮询不再恢复；
 * 且 onerror throw 后经外层 catch 会二次触发 onError（双调）。
 * 修复后：onError 最多一次，onClose 必触发一次。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchEventSource } = vi.hoisted(() => ({
  mockFetchEventSource: vi.fn(),
}));

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: (...args: unknown[]) => mockFetchEventSource(...args),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

import { createSSEConnection as createSSEConnectionChat } from '@/utils/fetchEventSource';
import {
  clearSSESharedTimeout,
  createSSEConnection as createSSEConnectionInfo,
} from '@/utils/fetchEventSourceConversationInfo';

/** 等待被测函数内部 async IIFE 的 microtask 队列跑完 */
const flushAsync = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe('createSSEConnection（conversationInfo 版）错误路径', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('onerror 路径：onError 与 onClose 各触发一次（修复前 onClose 丢失、onError 双调）', async () => {
    // 模拟 fetch-event-source 行为：onerror 的 throw 会使其 promise reject
    mockFetchEventSource.mockImplementation(async (_url, opts) => {
      opts.onerror?.(new Error('boom'));
    });

    const onError = vi.fn();
    const onClose = vi.fn();
    createSSEConnectionInfo({
      url: '/api/agent/conversation/chat/sub/1',
      onMessage: vi.fn(),
      onError,
      onClose,
    });
    await flushAsync();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('连接直接 reject（网络错误，不经 onerror）：onError 与 onClose 各触发一次', async () => {
    mockFetchEventSource.mockRejectedValue(new Error('network fail'));

    const onError = vi.fn();
    const onClose = vi.fn();
    createSSEConnectionInfo({
      url: '/api/agent/conversation/chat/sub/1',
      onMessage: vi.fn(),
      onError,
      onClose,
    });
    await flushAsync();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('正常 onclose 路径：仅触发 onClose，不触发 onError', async () => {
    mockFetchEventSource.mockImplementation(async (_url, opts) => {
      opts.onclose?.();
    });

    const onError = vi.fn();
    const onClose = vi.fn();
    createSSEConnectionInfo({
      url: '/api/agent/conversation/chat/sub/1',
      onMessage: vi.fn(),
      onError,
      onClose,
    });
    await flushAsync();

    expect(onError).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('未传 onError（sub 恢复场景）：报错路径仍触发 onClose', async () => {
    mockFetchEventSource.mockRejectedValue(new Error('boom'));

    const onClose = vi.fn();
    createSSEConnectionInfo({
      url: '/api/agent/conversation/chat/sub/1',
      onMessage: vi.fn(),
      onClose,
    });
    await flushAsync();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('createSSEConnection（live chat 版）错误路径', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('onerror 路径：onError 与 onClose 各触发一次', async () => {
    mockFetchEventSource.mockImplementation(async (_url, opts) => {
      opts.onerror?.(new Error('boom'));
    });

    const onError = vi.fn();
    const onClose = vi.fn();
    await createSSEConnectionChat({
      url: '/api/agent/conversation/chat',
      onMessage: vi.fn(),
      onError,
      onClose,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('连接直接 reject（网络错误，不经 onerror）：onError 与 onClose 各触发一次', async () => {
    mockFetchEventSource.mockRejectedValue(new Error('network fail'));

    const onError = vi.fn();
    const onClose = vi.fn();
    await createSSEConnectionChat({
      url: '/api/agent/conversation/chat',
      onMessage: vi.fn(),
      onError,
      onClose,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('createSSEConnection（conversationInfo 版）连接级静默超时', () => {
  type Connection = {
    signal: AbortSignal;
    onopen: (response: Response) => Promise<void>;
    onmessage: (event: { data: string }) => void;
    onerror: (error: Error) => void;
    onclose: () => void;
  };
  let connections: Connection[];

  const connect = () => {
    const onClose = vi.fn();
    const onError = vi.fn();
    const abort = createSSEConnectionInfo({
      url: `/api/agent/conversation/chat/sub/${connections.length + 1}`,
      onMessage: vi.fn(),
      onClose,
      onError,
    });
    const transport = connections[connections.length - 1];
    return { transport, abort, onClose, onError };
  };
  const open = (connection: ReturnType<typeof connect>) =>
    connection.transport.onopen({ status: 200 } as Response);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.clearAllMocks();
    connections = [];
    mockFetchEventSource.mockImplementation((_url, options) => {
      connections.push(options);
      return new Promise<void>(() => {});
    });
  });

  afterEach(() => {
    clearSSESharedTimeout();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('双流并发时，每条流按自己的最后消息时间关闭', async () => {
    const first = connect();
    await open(first);
    const second = connect();
    await open(second);

    await vi.advanceTimersByTimeAsync(50_000);
    first.transport.onmessage({ data: '{"eventType":"MESSAGE"}' });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(second.onClose).toHaveBeenCalledTimes(1);
    expect(second.transport.signal.aborted).toBe(true);
    expect(first.onClose).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50_000);
    expect(first.onClose).toHaveBeenCalledTimes(1);
    expect(first.transport.signal.aborted).toBe(true);
    expect(first.onError).not.toHaveBeenCalled();
  });

  it('新连接尚未收到响应头，也不能取消已有流的超时检查', async () => {
    const first = connect();
    await open(first);
    const pending = connect();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(first.onClose).toHaveBeenCalledTimes(1);
    expect(first.transport.signal.aborted).toBe(true);
    expect(pending.onClose).not.toHaveBeenCalled();
  });

  it('旧连接迟到 onopen 后，两条流仍能分别超时', async () => {
    const old = connect();
    const current = connect();
    await open(current);
    await open(old);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(old.onClose).toHaveBeenCalledTimes(1);
    expect(current.onClose).toHaveBeenCalledTimes(1);
  });

  it('旧流 abort 与迟到 close 不影响当前流，close 仍恰好一次', async () => {
    const old = connect();
    await open(old);
    const current = connect();
    await open(current);
    old.abort();
    old.transport.onclose();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(old.onClose).toHaveBeenCalledTimes(1);
    expect(current.onClose).toHaveBeenCalledTimes(1);
    expect(current.transport.signal.aborted).toBe(true);
  });

  it('连续断线并重新连接后，新流仍保留超时退出与恢复轮询所需 close', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const connection = connect();
      await open(connection);
      const networkError = new Error('network offline');
      expect(() => connection.transport.onerror(networkError)).toThrow(
        networkError,
      );
      expect(connection.onError).toHaveBeenCalledTimes(1);
      expect(connection.onClose).toHaveBeenCalledTimes(1);
      expect(connection.transport.signal.aborted).toBe(true);
      await vi.advanceTimersByTimeAsync(1_000);
    }

    const recovered = connect();
    await open(recovered);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(recovered.onClose).toHaveBeenCalledTimes(1);
    expect(recovered.onError).not.toHaveBeenCalled();
    expect(recovered.transport.signal.aborted).toBe(true);
  });
});
