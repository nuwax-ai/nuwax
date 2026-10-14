import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hosted: true,
  product: 'nuwax' as string | null,
  buildInfo: { gitHash: 'aaaaaaa', appVersion: '1.2.0' } as {
    gitHash?: string;
    appVersion?: string;
    buildAt?: string;
  },
  getContext: vi.fn(),
}));

vi.mock('@/utils/hostBridge', () => ({
  hasHostBridge: () => mocks.hosted,
  hostBridge: {
    host: { getProduct: () => mocks.product },
    auth: { getContext: (...args: unknown[]) => mocks.getContext(...args) },
  },
}));
vi.mock('./pageBuildInfo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./pageBuildInfo')>()),
  getPageBuildInfo: () => mocks.buildInfo,
}));

import {
  getLatestWebBuildInfo,
  getWebUpdateAvailable,
  initWebUpdateCheck,
  subscribeWebUpdate,
} from './webUpdateService';

const fetchMock = vi.fn();
let visibility: DocumentVisibilityState = 'visible';
let cleanups: Array<() => void> = [];

function response(
  info: unknown,
  options: { ok?: boolean; type?: string } = {},
) {
  return {
    ok: options.ok ?? true,
    headers: new Headers({
      'content-type': options.type ?? 'application/json',
    }),
    json: vi.fn().mockResolvedValue(info),
  };
}

function start() {
  const cleanup = initWebUpdateCheck();
  cleanups.push(cleanup);
  return cleanup;
}

function setVisibility(next: DocumentVisibilityState) {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

async function settle() {
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  visibility = 'visible';
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
    () => visibility,
  );
  mocks.product = 'nuwax';
  mocks.hosted = true;
  mocks.buildInfo = { gitHash: 'aaaaaaa', appVersion: '1.2.0' };
  mocks.getContext.mockReset().mockResolvedValue({ loadMode: 'direct' });
  fetchMock.mockReset().mockResolvedValue(response({ gitHash: 'aaaaaaa' }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(async () => {
  cleanups.forEach((cleanup) => cleanup());
  cleanups = [];
  await settle();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('browser and direct web update check', () => {
  it('parses and freezes latest metadata while preserving the current page snapshot', async () => {
    mocks.buildInfo = {
      gitHash: 'aaaaaaa',
      appVersion: '1.1.0',
      buildAt: '2026-10-09T09:00:00.000Z',
    };
    fetchMock.mockResolvedValue(
      response({
        name: 'nuwax-frontend',
        version: ' 1.2.0 ',
        gitHash: ' BBBBBBB ',
        buildAt: '2026-10-09T10:00:00.000Z',
      }),
    );
    start();
    await settle();
    expect(getLatestWebBuildInfo()).toEqual({
      appVersion: '1.2.0',
      gitHash: 'bbbbbbb',
      buildAt: '2026-10-09T10:00:00.000Z',
    });
    expect(Object.isFrozen(getLatestWebBuildInfo())).toBe(true);
    expect(mocks.buildInfo).toEqual({
      gitHash: 'aaaaaaa',
      appVersion: '1.1.0',
      buildAt: '2026-10-09T09:00:00.000Z',
    });
    expect(getWebUpdateAvailable()).toBe(true);
  });

  it.each([
    { gitHash: 'ccccccc' },
    { version: '1.3.0' },
    { buildAt: '2026-10-09T11:00:00.000Z' },
  ])(
    'notifies an already available update when latest metadata changes: %s',
    async (changes) => {
      const original = {
        gitHash: 'bbbbbbb',
        version: '1.2.0',
        buildAt: '2026-10-09T10:00:00.000Z',
      };
      const seen: boolean[] = [];
      cleanups.push(subscribeWebUpdate((available) => seen.push(available)));
      fetchMock.mockResolvedValue(response(original));
      start();
      await settle();
      fetchMock.mockResolvedValue(response({ ...original, ...changes }));
      await vi.advanceTimersByTimeAsync(5 * 60_000);
      expect(seen).toEqual([false, true, true]);
      await vi.advanceTimersByTimeAsync(5 * 60_000);
      expect(seen).toEqual([false, true, true]);
    },
  );

  it('updates same-hash metadata without broadcasting a false update', async () => {
    const seen: boolean[] = [];
    cleanups.push(subscribeWebUpdate((available) => seen.push(available)));
    fetchMock.mockResolvedValue(
      response({
        gitHash: 'aaaaaaa',
        version: '1.2.0',
        buildAt: '2026-10-09T10:00:00.000Z',
      }),
    );
    start();
    await settle();
    expect(getLatestWebBuildInfo()?.appVersion).toBe('1.2.0');
    fetchMock.mockResolvedValue(
      response({
        gitHash: 'aaaaaaa',
        version: '1.3.0',
        buildAt: '2026-10-09T11:00:00.000Z',
      }),
    );
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(getLatestWebBuildInfo()).toEqual({
      gitHash: 'aaaaaaa',
      appVersion: '1.3.0',
      buildAt: '2026-10-09T11:00:00.000Z',
    });
    expect(seen).toEqual([false]);
  });

  it.each([
    { version: null, buildAt: null },
    { version: 123, buildAt: 123 },
    { version: '   ', buildAt: 'not-a-date' },
    { version: {}, buildAt: [] },
  ])(
    'ignores invalid additional metadata without reporting an update: %s',
    async (invalid) => {
      fetchMock.mockResolvedValue(response({ gitHash: 'aaaaaaa', ...invalid }));
      start();
      await settle();
      expect(getLatestWebBuildInfo()).toEqual({
        gitHash: 'aaaaaaa',
        appVersion: undefined,
        buildAt: undefined,
      });
      expect(getWebUpdateAvailable()).toBe(false);
      fetchMock.mockResolvedValue(response({ gitHash: 'bbbbbbb', ...invalid }));
      await vi.advanceTimersByTimeAsync(5 * 60_000);
      expect(getLatestWebBuildInfo()?.gitHash).toBe('bbbbbbb');
      expect(getWebUpdateAvailable()).toBe(true);
    },
  );

  it('retains a valid metadata snapshot across offline and illegal responses', async () => {
    fetchMock.mockResolvedValue(
      response({
        version: '1.2.0',
        gitHash: 'bbbbbbb',
        buildAt: '2026-10-09T10:00:00.000Z',
      }),
    );
    start();
    await settle();
    const knownLatest = getLatestWebBuildInfo();
    fetchMock.mockRejectedValue(new Error('offline'));
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(getLatestWebBuildInfo()).toBe(knownLatest);
    fetchMock.mockResolvedValue(
      response({ version: '1.3.0', gitHash: 'unknown' }),
    );
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(getLatestWebBuildInfo()).toBe(knownLatest);
    expect(getWebUpdateAvailable()).toBe(true);
  });

  it.each(['aaaaaaa', 'bbbbbbb'])(
    'clears latest metadata on disposal (latest hash %s)',
    async (gitHash) => {
      fetchMock.mockResolvedValue(response({ gitHash, version: '1.2.0' }));
      const dispose = start();
      await settle();
      expect(getLatestWebBuildInfo()?.gitHash).toBe(gitHash);
      dispose();
      expect(getLatestWebBuildInfo()).toBeUndefined();
      expect(getWebUpdateAvailable()).toBe(false);
    },
  );

  it('checks the current origin without cache, then detects a changed hash', async () => {
    const seen: boolean[] = [];
    cleanups.push(subscribeWebUpdate((available) => seen.push(available)));
    start();
    await settle();
    expect(seen).toEqual([false]);
    expect(fetchMock).toHaveBeenCalledWith('/version.json', {
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    });
    fetchMock.mockResolvedValue(response({ gitHash: 'BBBBBBB' }));
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(getWebUpdateAvailable()).toBe(true);
    expect(seen).toEqual([false, true]);
  });

  it('enables browsers without a bridge or auth context and checks without cache', async () => {
    mocks.hosted = false;
    mocks.product = null;
    mocks.getContext.mockRejectedValue(new Error('no browser auth bridge'));
    start();
    await settle();
    expect(mocks.getContext).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('/version.json', {
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    });
    fetchMock.mockResolvedValue(response({ gitHash: 'bbbbbbb' }));
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getWebUpdateAvailable()).toBe(true);
    expect(mocks.getContext).not.toHaveBeenCalled();
  });

  it.each([null, 'nuwaclaw', 'nuwawork', 'browser'])(
    'does not check unsupported host %s',
    async (product) => {
      mocks.product = product;
      start();
      await settle();
      expect(mocks.getContext).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it.each([true, false])(
    'does not check a document without its own build marker (hosted=%s)',
    async (hosted) => {
      mocks.hosted = hosted;
      mocks.buildInfo = {};
      start();
      await settle();
      expect(mocks.getContext).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it.each([{ loadMode: 'gateway' }, { loadMode: 'loopback' }, null])(
    'does not poll for non-direct context %s',
    async (context) => {
      mocks.getContext.mockResolvedValue(context);
      start();
      await settle();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(getWebUpdateAvailable()).toBe(false);
      expect(getLatestWebBuildInfo()).toBeUndefined();
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('handles auth context rejection without polling', async () => {
    mocks.getContext.mockRejectedValue(new Error('old bridge'));
    start();
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    response({ gitHash: 'bbbbbbb' }, { ok: false }),
    response({ gitHash: 'bbbbbbb' }, { type: 'text/html' }),
    response({}),
    response({ gitHash: 'unknown' }),
    response({ gitHash: 'bbbbbb' }),
    response({ gitHash: 1234567 }),
    response(null),
    response('bbbbbbb'),
    response([]),
    {
      ...response({}),
      json: vi.fn().mockRejectedValue(new Error('invalid JSON')),
    },
  ])('does not show an update from an invalid response %#', async (invalid) => {
    fetchMock.mockResolvedValue(invalid);
    start();
    await settle();
    expect(getWebUpdateAvailable()).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('retains a known update while offline, then clears it if the server matches', async () => {
    fetchMock.mockResolvedValue(response({ gitHash: 'bbbbbbb' }));
    start();
    await settle();
    expect(getWebUpdateAvailable()).toBe(true);
    fetchMock.mockRejectedValue(new Error('offline'));
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(getWebUpdateAvailable()).toBe(true);
    fetchMock.mockResolvedValue(response({ gitHash: 'aaaaaaa' }));
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(getWebUpdateAvailable()).toBe(false);
  });

  it('does not show an update when the initial request is offline', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    start();
    await settle();
    expect(getWebUpdateAvailable()).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
  });

  it.each([true, false])(
    'pauses while hidden and checks immediately on returning to the foreground (hosted=%s)',
    async (hosted) => {
      mocks.hosted = hosted;
      start();
      await settle();
      setVisibility('hidden');
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(15 * 60_000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      setVisibility('visible');
      await settle();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it.each([true, false])(
    'defers the first check when opened in the background (hosted=%s)',
    async (hosted) => {
      mocks.hosted = hosted;
      visibility = 'hidden';
      start();
      await settle();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      setVisibility('visible');
      await settle();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([true, false])(
    'coalesces repeated visibility checks while a request is pending (hosted=%s)',
    async (hosted) => {
      mocks.hosted = hosted;
      let resolve!: (value: ReturnType<typeof response>) => void;
      fetchMock.mockReturnValue(
        new Promise((done) => {
          resolve = done;
        }),
      );
      start();
      await settle();
      setVisibility('hidden');
      setVisibility('visible');
      setVisibility('visible');
      await settle();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      resolve(response({ gitHash: 'bbbbbbb' }));
      await settle();
      expect(getWebUpdateAvailable()).toBe(true);
      expect(vi.getTimerCount()).toBe(1);
    },
  );

  it('aborts a hung fetch after 10 seconds and permits a later check', async () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    start();
    await settle();
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(signal.aborted).toBe(true);
    expect(getWebUpdateAvailable()).toBe(false);
    fetchMock.mockResolvedValue(response({ gitHash: 'bbbbbbb' }));
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getWebUpdateAvailable()).toBe(true);
  });

  it.each([true, false])(
    'cleans listeners, timers and in-flight requests and ignores late responses (hosted=%s)',
    async (hosted) => {
      mocks.hosted = hosted;
      const removeListener = vi.spyOn(document, 'removeEventListener');
      let resolve!: (value: ReturnType<typeof response>) => void;
      fetchMock.mockReturnValue(
        new Promise((done) => {
          resolve = done;
        }),
      );
      const dispose = start();
      await settle();
      const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
      dispose();
      expect(vi.getTimerCount()).toBe(0);
      await settle();
      expect(signal.aborted).toBe(true);
      expect(removeListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function),
      );
      expect(vi.getTimerCount()).toBe(0);
      resolve(response({ gitHash: 'bbbbbbb' }));
      await settle();
      setVisibility('visible');
      await vi.advanceTimersByTimeAsync(5 * 60_000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getWebUpdateAvailable()).toBe(false);
    },
  );

  it('does not restart a disposed service after a late auth context response', async () => {
    let resolve!: (value: { loadMode: string }) => void;
    mocks.getContext.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const dispose = start();
    dispose();
    resolve({ loadMode: 'direct' });
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps a shared service active until its final owner releases it', async () => {
    const first = start();
    const second = start();
    await settle();
    expect(mocks.getContext).toHaveBeenCalledTimes(1);
    first();
    first();
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    second();
    await settle();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([true, false])(
    'supports StrictMode setup / cleanup / setup with pending initialization (hosted=%s)',
    async (hosted) => {
      mocks.hosted = hosted;
      const first = start();
      first();
      start();
      await settle();
      expect(mocks.getContext).toHaveBeenCalledTimes(hosted ? 2 : 0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(1);
    },
  );
});
