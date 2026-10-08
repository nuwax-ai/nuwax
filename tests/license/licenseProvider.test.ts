import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('umi', () => ({ request }));
const mockFile = (content = 'local fixture') =>
  ({
    size: content.length,
    name: 'fixture.json',
    text: async () => content,
  } as File);
beforeEach(() => {
  vi.resetModules();
  request.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe('License provider 环境隔离与错误处理', () => {
  it.each([
    ['production', '1'],
    ['development', '0'],
    ['test', '0'],
  ])('NODE_ENV=%s 开关=%s 时不请求 fixture', async (mode, flag) => {
    vi.stubEnv('NODE_ENV', mode);
    vi.stubEnv('RELEASE0930_LICENSE_MOCK', flag);
    const { licenseProvider } = await import('../../src/services/license');
    expect(licenseProvider.available).toBe(false);
    await expect(licenseProvider.read()).rejects.toMatchObject({
      kind: 'unavailable',
    });
    expect(request).not.toHaveBeenCalled();
  });
  it('只有显式开发开关可用，原始文件内容只送本地 provider', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RELEASE0930_LICENSE_MOCK', '1');
    request.mockResolvedValue({ code: '0000', data: { state: 'VALID' } });
    const { licenseProvider } = await import('../../src/services/license');
    await licenseProvider.importLicense!(mockFile());
    expect(request).toHaveBeenCalledWith(
      '/api/mock/release0930/license/import',
      expect.objectContaining({
        method: 'POST',
        data: { fileName: 'fixture.json', licenseContent: 'local fixture' },
        skipErrorHandler: true,
      }),
    );
  });
  it.each([
    ['4010', 'unauthenticated'],
    ['4033', 'forbidden'],
    ['0001', 'invalid-response'],
  ])('业务错误 %s 映射 %s，不回退 fixture 成功值', async (code, kind) => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RELEASE0930_LICENSE_MOCK', '1');
    request.mockResolvedValue({
      code,
      data: null,
      message: 'raw contents must not escape',
    });
    const { licenseProvider } = await import('../../src/services/license');
    await expect(licenseProvider.read()).rejects.toMatchObject({ kind });
    expect(request).toHaveBeenCalledTimes(1);
  });
  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [500, 'network'],
  ])('HTTP错误 %s 映射 %s', async (status, kind) => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RELEASE0930_LICENSE_MOCK', '1');
    request.mockRejectedValue({
      response: { status },
      message: 'raw contents must not escape',
    });
    const { licenseProvider } = await import('../../src/services/license');
    await expect(licenseProvider.read()).rejects.toMatchObject({ kind });
  });
  it('非空文件大小边界和文件读取后取消均不发送请求', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RELEASE0930_LICENSE_MOCK', '1');
    const { licenseProvider, MAX_LICENSE_FILE_BYTES } = await import(
      '../../src/services/license'
    );
    for (const size of [0, MAX_LICENSE_FILE_BYTES + 1])
      await expect(
        licenseProvider.importLicense!({ ...mockFile(), size } as File),
      ).rejects.toMatchObject({ kind: 'invalid-response' });
    const abort = new AbortController();
    abort.abort();
    await expect(
      licenseProvider.importLicense!(mockFile(), abort.signal),
    ).rejects.toMatchObject({ kind: 'network' });
    expect(request).not.toHaveBeenCalled();
  });
});
