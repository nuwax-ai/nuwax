import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGetSpaceInviteQr } from './spaceInvite';
const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('umi', () => ({ request: mocks.request }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));

afterEach(() => {
  vi.unstubAllGlobals();
  mocks.request.mockReset();
});

describe('邀请二维码响应', () => {
  it('兼容后端缺失 Content-Type 的 PNG，并为下载补全类型', async () => {
    vi.stubGlobal('Blob', NodeBlob);
    mocks.request.mockResolvedValue(
      new NodeBlob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0])]),
    );
    const result = await apiGetSpaceInviteQr(
      'https://example.com/invite/space/abc',
    );
    expect(result.type).toBe('image/png');
    expect(mocks.request).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/qr\//),
      expect.objectContaining({ responseType: 'blob' }),
    );
  });

  it('HTTP 200 的业务错误不能被当成二维码展示', async () => {
    mocks.request.mockResolvedValue(
      new NodeBlob([JSON.stringify({ code: '4011', message: '请先登录' })]),
    );
    await expect(apiGetSpaceInviteQr('https://example.com')).rejects.toThrow(
      '请先登录',
    );
  });
});
