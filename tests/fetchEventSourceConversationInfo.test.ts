/**
 * createSSEConnection 错误路径回归测试
 *
 * 修复前：onerror / 外层 catch 只调 onError 不调 onClose，
 * 导致 sub 恢复（useConversationStreamResume）的「已订阅」标记永久卡死、轮询不再恢复；
 * 且 onerror throw 后经外层 catch 会二次触发 onError（双调）。
 * 修复后：onError 最多一次，onClose 必触发一次。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
import { createSSEConnection as createSSEConnectionInfo } from '@/utils/fetchEventSourceConversationInfo';

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
