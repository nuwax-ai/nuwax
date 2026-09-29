import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

/** 直接运行正式 patch 后的 HTTP 真源，保留错误信封与全局事件实现。 */
const adapterDir = path.resolve('micro-frontends/message');
const workspace = path.resolve(adapterDir, '../..');
let fixture: string;
let client: any;
let upload: any;
let runtime: any;
const fetchMock = vi.fn();
const onExpired = vi.fn();
const failure = {
  code: 'IM_10402',
  message: 'https://sso.example/login',
  tid: 'request-401',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

function response401(
  text: () => Promise<string> = async () => JSON.stringify(failure),
) {
  return { status: 401, text };
}

beforeAll(async () => {
  mkdirSync(path.join(workspace, '.cache'), { recursive: true });
  fixture = mkdtempSync(path.join(workspace, '.cache/message-http-test-'));
  const archive = execFileSync(
    'git',
    [
      '-C',
      path.join(workspace, 'submodules/nuwax-im'),
      'archive',
      'f7fd703688aba50573621f9ee8e32ecf0ef9f75c',
      'nuwax-im-web/src',
      'nuwax-im-web/vite.config.ts',
      'nuwax-im-web/tsconfig.node.json',
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  execFileSync('tar', ['-x', '-C', fixture], { input: archive });
  execFileSync('git', ['init', '-q'], { cwd: fixture });
  execFileSync('git', ['apply', path.join(adapterDir, 'adapter.patch')], {
    cwd: fixture,
  });
  const source = path.join(fixture, 'nuwax-im-web/src');
  cpSync(
    path.join(adapterDir, 'overlay/src/hostRuntime.ts'),
    path.join(source, 'hostRuntime.ts'),
  );
  vi.doMock(path.join(source, 'authMode.ts'), () => ({ isPlatformMode: true }));
  // 信封仅包含字符串；雪花号解析留给源仓独立合同，不影响这里的请求生命周期。
  vi.doMock(path.join(source, 'api/json.ts'), () => ({
    parseServerJson: JSON.parse,
  }));
  client = await import(/* @vite-ignore */ path.join(source, 'api/client.ts'));
  upload = await import(/* @vite-ignore */ path.join(source, 'api/upload.ts'));
  runtime = await import(
    /* @vite-ignore */ path.join(source, 'hostRuntime.ts')
  );
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.stubGlobal('fetch', fetchMock);
  window.addEventListener('im:auth-expired', onExpired);
  runtime.beginMessageRuntime(document.createElement('div'), {}, true);
});

afterEach(() => {
  window.removeEventListener('im:auth-expired', onExpired);
  runtime.endMessageRuntime();
  vi.unstubAllGlobals();
  localStorage.clear();
});

afterAll(() => rmSync(fixture, { recursive: true, force: true }));

describe('消息 HTTP 401 与挂载代次', () => {
  it('旧请求卸载重挂后晚到401仍抛原错误，不清新凭据或广播到新App', async () => {
    const request = deferred<ReturnType<typeof response401>>();
    fetchMock.mockReturnValueOnce(request.promise);
    const pending = client.api('/api/instant-message/conversations');
    const result = expect(pending).rejects.toMatchObject({
      ...failure,
      httpStatus: 401,
    });
    runtime.endMessageRuntime();
    runtime.beginMessageRuntime(document.createElement('div'), {}, true);
    localStorage.setItem('im.auth.token', 'new-session');
    localStorage.setItem('im.auth.userId', '202');
    request.resolve(response401());
    await result;
    expect(onExpired).not.toHaveBeenCalled();
    expect(localStorage.getItem('im.auth.token')).toBe('new-session');
    expect(localStorage.getItem('im.auth.userId')).toBe('202');
  });

  it('401状态先到，信封body读取晚到也不能跨代广播', async () => {
    const body = deferred<string>();
    const text = vi.fn(() => body.promise);
    fetchMock.mockResolvedValueOnce(response401(text));
    const pending = client.api('/api/instant-message/conversations');
    const result = expect(pending).rejects.toMatchObject({
      ...failure,
      httpStatus: 401,
    });
    await Promise.resolve();
    expect(text).toHaveBeenCalledOnce();
    runtime.endMessageRuntime();
    runtime.beginMessageRuntime(document.createElement('div'), {}, true);
    localStorage.setItem('im.auth.token', 'new-session');
    body.resolve(JSON.stringify(failure));
    await result;
    expect(onExpired).not.toHaveBeenCalled();
    expect(localStorage.getItem('im.auth.token')).toBe('new-session');
  });

  it('卸载入口立即使请求失效，无需等待React/Query清理完成', async () => {
    const request = deferred<ReturnType<typeof response401>>();
    fetchMock.mockReturnValueOnce(request.promise);
    const pending = client.api('/api/instant-message/conversations');
    const result = expect(pending).rejects.toMatchObject({ httpStatus: 401 });
    runtime.invalidateMessageRequests();
    localStorage.setItem('im.auth.token', 'retained');
    request.resolve(response401());
    await result;
    expect(onExpired).not.toHaveBeenCalled();
    expect(localStorage.getItem('im.auth.token')).toBe('retained');
  });

  it('当前代401仍清凭据并广播完整因由，隐藏保活不换代', async () => {
    runtime.updateMessageRuntime({ active: false });
    localStorage.setItem('im.auth.token', 'obsolete');
    fetchMock.mockResolvedValueOnce(response401());
    await expect(
      client.api('/api/instant-message/conversations'),
    ).rejects.toMatchObject({ ...failure, httpStatus: 401 });
    expect(localStorage.getItem('im.auth.token')).toBeNull();
    expect(onExpired).toHaveBeenCalledOnce();
    expect(onExpired.mock.calls[0][0].detail).toEqual({
      code: failure.code,
      message: failure.message,
    });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      credentials: 'same-origin',
      headers: {},
    });
  });

  it('当前代silent探测401继续只抛错误，不清凭据或广播', async () => {
    localStorage.setItem('im.auth.token', 'retained');
    fetchMock.mockResolvedValueOnce(response401());
    await expect(
      client.api('/api/instant-message/me', { silentAuthFailure: true }),
    ).rejects.toMatchObject({ ...failure, httpStatus: 401 });
    expect(localStorage.getItem('im.auth.token')).toBe('retained');
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('旧上传401不影响新App；当前代上传401保持原无detail广播', async () => {
    const request = deferred<ReturnType<typeof response401>>();
    const file = new File(['content'], 'text.txt');
    fetchMock.mockReturnValueOnce(request.promise);
    const pending = upload.uploadFile(file);
    const result = expect(pending).rejects.toMatchObject({
      code: 'IM_10401',
      httpStatus: 401,
    });
    runtime.endMessageRuntime();
    runtime.beginMessageRuntime(document.createElement('div'), {}, true);
    localStorage.setItem('im.auth.token', 'new-session');
    request.resolve(response401());
    await result;
    expect(onExpired).not.toHaveBeenCalled();
    expect(localStorage.getItem('im.auth.token')).toBe('new-session');
    fetchMock.mockResolvedValueOnce(response401());
    await expect(upload.uploadFile(file)).rejects.toMatchObject({
      code: 'IM_10401',
      httpStatus: 401,
    });
    expect(localStorage.getItem('im.auth.token')).toBeNull();
    expect(onExpired).toHaveBeenCalledOnce();
    expect(onExpired.mock.calls[0][0].detail).toBeNull();
  });
});
