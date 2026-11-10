import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiCreateQrLoginCode, apiGetQrLoginStatus } from './qrLogin';

const h = vi.hoisted(() => ({
  request: vi.fn(),
  beginLogin: vi.fn(),
  getProduct: vi.fn(),
}));
vi.mock('umi', () => ({ request: h.request }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: {
    auth: { beginLogin: h.beginLogin },
    host: { getProduct: h.getProduct },
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  h.beginLogin.mockResolvedValue(false);
  h.getProduct.mockReturnValue(null);
});
afterEach(() => vi.unstubAllEnvs());

describe('扫码登录接口认证边界', () => {
  it('创建前通知宿主开始登录，被取消后不再发起请求', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(apiCreateQrLoginCode(controller.signal)).rejects.toThrow();
    expect(h.beginLogin).toHaveBeenCalledOnce();
    expect(h.request).not.toHaveBeenCalled();
    await apiCreateQrLoginCode();
    expect(h.request).toHaveBeenCalledWith(
      '/api/user/qrcode/create',
      expect.objectContaining({ method: 'POST', silentPolling: true }),
    );
  });

  it.each([
    ['production', null, undefined],
    ['production', 'nuwax', undefined],
    ['development', 'nuwax', undefined],
    ['development', 'nuwawork', undefined],
    ['development', null, { 'X-Client-Type': 'web' }],
  ])(
    '%s / %s 只在本地普通浏览器显式索取 Token',
    async (env, product, headers) => {
      vi.stubEnv('NODE_ENV', env);
      h.getProduct.mockReturnValue(product);
      const signal = new AbortController().signal;
      const params = { sceneId: 'scene', pollToken: 'private-poll-token' };
      await apiGetQrLoginStatus(params, signal);
      expect(h.request).toHaveBeenCalledWith('/api/user/qrcode/status', {
        method: 'GET',
        params,
        signal,
        headers,
        silentPolling: true,
        skipErrorHandler: true,
      });
    },
  );
});
