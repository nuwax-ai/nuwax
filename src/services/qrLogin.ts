import type { QrLoginCode, QrLoginResult } from '@/types/interfaces/qrLogin';
import type { RequestResponse } from '@/types/interfaces/request';
import { hostBridge } from '@/utils/hostBridge';
import { request } from 'umi';

export async function apiCreateQrLoginCode(
  signal?: AbortSignal,
): Promise<RequestResponse<QrLoginCode>> {
  await hostBridge.auth.beginLogin();
  signal?.throwIfAborted();
  return request('/api/user/qrcode/create', {
    method: 'POST',
    signal,
    // 错误由扫码面板展示，避免被动轮询触发全局认证跳转。
    silentPolling: true,
    skipErrorHandler: true,
  });
}

export async function apiGetQrLoginStatus(
  params: Pick<QrLoginCode, 'sceneId' | 'pollToken'>,
  signal?: AbortSignal,
): Promise<RequestResponse<QrLoginResult>> {
  const product = hostBridge.host.getProduct();
  const localDevBrowser =
    process.env.NODE_ENV === 'development' &&
    product !== 'nuwax' &&
    product !== 'nuwawork';
  return request('/api/user/qrcode/status', {
    method: 'GET',
    params,
    signal,
    // 普通浏览器本地开发跨域使用 Bearer，须显式取回 Token；线上和商业壳仍走 Cookie。
    headers: localDevBrowser ? { 'X-Client-Type': 'web' } : undefined,
    silentPolling: true,
    skipErrorHandler: true,
  });
}
