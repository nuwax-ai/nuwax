import { apiAgentConversation } from '@/services/agentConfig';
import { request } from 'umi';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({
  request: vi.fn().mockResolvedValue({ code: '0000' }),
}));

/**
 * 会话详情接口在途单飞（bug 2477）：
 * 同一会话并发详情请求只发一发，共享同一响应；完成后（在途结束）恢复独立请求。
 */
describe('apiAgentConversation 在途单飞', () => {
  beforeEach(() => {
    vi.mocked(request).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('并发调用同一会话合并为同一请求并共享响应', async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    vi.mocked(request).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const first = apiAgentConversation(1694187);
    const second = apiAgentConversation(1694187);
    const third = apiAgentConversation(1694187);
    expect(request).toHaveBeenCalledTimes(1);

    resolveRequest({ code: '0000', data: { id: 1694187 } });
    const [a, b, c] = await Promise.all([first, second, third]);
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('在途结束后恢复独立请求（顺序调用语义不变）', async () => {
    vi.mocked(request).mockResolvedValue({
      code: '0000',
      data: { id: 1694187 },
    });

    await apiAgentConversation(1694187);
    await apiAgentConversation(1694187);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('不同会话的并发请求互不合并', async () => {
    vi.mocked(request).mockResolvedValue({ code: '0000' });

    await Promise.all([apiAgentConversation(1), apiAgentConversation(2)]);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
