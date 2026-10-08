import { SUCCESS_CODE } from '@/constants/codes.constants';
import type { LicenseProvider } from '@/types/interfaces/license';
import type { RequestResponse } from '@/types/interfaces/request';
import { LicenseRequestError } from '@/utils/license';
import { request } from 'umi';

export const MAX_LICENSE_FILE_BYTES = 1024 * 1024;

/** 未有真实 API 契约时明确不可用，不猜测生产 URL 或静默返回有效授权。 */
export const unavailableLicenseProvider: LicenseProvider = {
  available: false,
  read: async () => {
    throw new LicenseRequestError('unavailable');
  },
};

async function mockRequest(
  path: string,
  signal?: AbortSignal,
  data?: { fileName: string; licenseContent: string },
): Promise<unknown> {
  try {
    const response: RequestResponse<unknown> = await request(path, {
      method: data ? 'POST' : 'GET',
      ...(data ? { data } : {}),
      signal,
      skipErrorHandler: true,
    });
    if (!response || typeof response !== 'object')
      throw new LicenseRequestError('invalid-response');
    if (response.code === SUCCESS_CODE) return response.data;
    if (['4010', '4011'].includes(String(response.code)))
      throw new LicenseRequestError('unauthenticated');
    if (['4030', '4033'].includes(String(response.code)))
      throw new LicenseRequestError('forbidden');
    throw new LicenseRequestError('invalid-response');
  } catch (error) {
    if (error instanceof LicenseRequestError) throw error;
    const value = error as {
      info?: { code?: string };
      response?: { status?: number };
    };
    if (
      value?.response?.status === 401 ||
      ['4010', '4011'].includes(String(value?.info?.code))
    )
      throw new LicenseRequestError('unauthenticated');
    if (
      value?.response?.status === 403 ||
      ['4030', '4033'].includes(String(value?.info?.code))
    )
      throw new LicenseRequestError('forbidden');
    throw new LicenseRequestError('network');
  }
}

/** 只有显式编译的开发模式可请求本地 fixture；Cookie/URL 无法启用它。 */
export const licenseProvider: LicenseProvider =
  process.env.NODE_ENV !== 'production' &&
  process.env.RELEASE0930_LICENSE_MOCK === '1'
    ? {
        available: true,
        read: (signal) =>
          mockRequest('/api/mock/release0930/license/info', signal),
        importLicense: async (file, signal) => {
          if (!file.size || file.size > MAX_LICENSE_FILE_BYTES)
            throw new LicenseRequestError('invalid-response');
          // 本地验收 provider 将 fixture 文件交给假服务判定；真实 adapter 后续独立实现。
          const licenseContent = await file.text();
          if (signal?.aborted) throw new LicenseRequestError('network');
          return mockRequest('/api/mock/release0930/license/import', signal, {
            fileName: file.name,
            licenseContent,
          });
        },
      }
    : unavailableLicenseProvider;
