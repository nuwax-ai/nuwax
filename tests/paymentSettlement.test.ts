import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const html = readFileSync(
  resolve(process.cwd(), 'public/static/payment-settlement.html'),
  'utf8',
);
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .find((value) => value.includes('function fetchStatus'))!;

function startSettlement(
  options: {
    origin?: string;
    token?: string | null;
    query?: string;
    hash?: string;
    response?: { status: number; json: () => Promise<unknown> };
    fetch?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const origin = options.origin ?? 'http://127.0.0.1:46801';
  const nodes = new Map<string, any>();
  const intervals = new Map<number, () => void>();
  const timeouts: Array<() => void> = [];
  const fetch =
    options.fetch ??
    vi.fn().mockResolvedValue(
      options.response ?? {
        status: 200,
        json: async () => ({ code: '0000', data: { settled: false } }),
      },
    );
  const location = {
    origin,
    search: `?orderId=order-1&returnUrl=${encodeURIComponent(
      `${origin}/orders`,
    )}${options.query ?? ''}`,
    hash: options.hash ?? '',
    replace: vi.fn(),
  };
  runInNewContext(script, {
    URL,
    URLSearchParams,
    navigator: { userAgent: 'test' },
    window: {
      location,
      setTimeout: (callback: () => void) => timeouts.push(callback),
    },
    localStorage: { getItem: () => options.token ?? null },
    document: {
      getElementById(id: string) {
        if (!nodes.has(id))
          nodes.set(id, {
            textContent: '',
            href: '',
            className: '',
            classList: { add: vi.fn(), remove: vi.fn() },
          });
        return nodes.get(id);
      },
    },
    fetch,
    setInterval: (callback: () => void) => {
      intervals.set(1, callback);
      return 1;
    },
    clearInterval: (id: number) => intervals.delete(id),
  });
  return { fetch, nodes, intervals, timeouts, location };
}

async function flushRequests() {
  for (let count = 0; count < 12; count++) await Promise.resolve();
}

describe('支付结算静态页面', () => {
  it.each(['http://127.0.0.1:46801', 'https://tenant.example:8443'])(
    '%s 同源轮询且存在本地 token 时附 Bearer',
    async (origin) => {
      const page = startSettlement({ origin, token: 'test-token' });
      await flushRequests();
      expect(page.fetch).toHaveBeenCalledWith(
        '/api/bill/order/settlement-status?orderId=order-1',
        expect.objectContaining({
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer test-token',
          },
        }),
      );
    },
  );

  it.each([
    { query: '&isMp=1&token=query-token', hash: '', expected: 'query-token' },
    {
      query: '&isMp=1',
      hash: '#/return?token=hash%2Dtoken',
      expected: 'hash-token',
    },
  ])(
    '保留小程序 query/hash token 回退：%j',
    async ({ query, hash, expected }) => {
      const page = startSettlement({ query, hash });
      await flushRequests();
      expect(page.fetch.mock.calls[0][1].headers.Authorization).toBe(
        `Bearer ${expected}`,
      );
    },
  );

  it('本地 token 优先于小程序 URL，普通网页不使用 URL token', async () => {
    const mp = startSettlement({ token: 'local', query: '&isMp=1&token=old' });
    const web = startSettlement({ query: '&token=query-token' });
    await flushRequests();
    expect(mp.fetch.mock.calls[0][1].headers.Authorization).toBe(
      'Bearer local',
    );
    expect(web.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it.each([
    { status: 401, code: undefined },
    { status: 200, code: '4010' },
    { status: 200, code: '4011' },
  ])('鉴权失效立即停轮询，不声称支付失败：%j', async ({ status, code }) => {
    const json = vi.fn().mockResolvedValue({ code, message: 'expired' });
    const page = startSettlement({ response: { status, json } });
    await flushRequests();
    expect(page.intervals.size).toBe(0);
    expect(page.nodes.get('title').textContent).toBe('登录已失效');
    expect(page.nodes.get('subtitle').textContent).toContain('重新登录');
    expect(
      new URL(page.nodes.get('btnReturn').href).searchParams.get('payResult'),
    ).toBe('pending');
    expect(page.location.replace).not.toHaveBeenCalled();
    expect(page.fetch).toHaveBeenCalledTimes(1);
    if (status === 401) expect(json).not.toHaveBeenCalled();
  });

  it('慢请求不产生重叠轮询，结算成功后停止并正常返回', async () => {
    let finish!: (response: unknown) => void;
    const fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const page = startSettlement({ fetch });
    page.intervals.get(1)!();
    page.intervals.get(1)!();
    expect(fetch).toHaveBeenCalledTimes(1);
    finish({
      status: 200,
      json: async () => ({ code: '0000', data: { settled: true } }),
    });
    await flushRequests();
    expect(page.intervals.size).toBe(0);
    expect(page.nodes.get('title').textContent).toBe('支付成功');
    page.timeouts[0]();
    expect(page.location.replace).toHaveBeenCalledWith(
      'http://127.0.0.1:46801/orders?payResult=success',
    );
  });

  it('订单仍处理中继续轮询，业务终态失败仍显示原支付失败 UI', async () => {
    const page = startSettlement();
    await flushRequests();
    expect(page.intervals.size).toBe(1);
    page.fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        code: '0000',
        data: { terminalFailed: true, message: '订单已关闭' },
      }),
    });
    page.intervals.get(1)!();
    await flushRequests();
    expect(page.intervals.size).toBe(0);
    expect(page.nodes.get('title').textContent).toBe('支付未完成');
    expect(
      new URL(page.nodes.get('btnReturn').href).searchParams.get('payResult'),
    ).toBe('failed');
  });
});
