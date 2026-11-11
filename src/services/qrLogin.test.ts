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
    const reason = new Error('登录已取消');
    controller.abort(reason);
    await expect(apiCreateQrLoginCode(controller.signal)).rejects.toBe(reason);
    expect(h.beginLogin).toHaveBeenCalledOnce();
    expect(h.request).not.toHaveBeenCalled();
    await apiCreateQrLoginCode();
    expect(h.request).toHaveBeenCalledWith(
      '/api/user/qrcode/create',
      expect.objectContaining({ method: 'POST', silentPolling: true }),
    );
  });

  it('旧浏览器缺少 throwIfAborted 和 reason 时仍能创建二维码', async () => {
    const controller = new AbortController();
    Object.defineProperties(controller.signal, {
      throwIfAborted: { value: undefined },
      reason: { value: undefined },
    });
    await apiCreateQrLoginCode(controller.signal);
    expect(h.request).toHaveBeenCalledWith('/api/user/qrcode/create', {
      method: 'POST',
      signal: controller.signal,
      silentPolling: true,
      skipErrorHandler: true,
    });
  });

  it('旧浏览器在等待宿主期间取消登录，不再创建二维码', async () => {
    const controller = new AbortController();
    Object.defineProperties(controller.signal, {
      throwIfAborted: { value: undefined },
      reason: { value: undefined },
    });
    let finishLogin!: () => void;
    h.beginLogin.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishLogin = resolve;
      }),
    );
    const pending = apiCreateQrLoginCode(controller.signal);
    controller.abort();
    finishLogin();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(h.request).not.toHaveBeenCalled();
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
