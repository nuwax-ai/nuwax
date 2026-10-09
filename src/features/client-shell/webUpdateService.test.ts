import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  product: 'nuwax' as string | null,
  buildInfo: { gitHash: 'aaaaaaa', appVersion: '1.2.0' } as {
    gitHash?: string;
    appVersion?: string;
  },
  getContext: vi.fn(),
}));

vi.mock('@/utils/hostBridge', () => ({
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

describe('direct web update check', () => {
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

  it('does not check a document without its own build marker', async () => {
    mocks.buildInfo = {};
    start();
    await settle();
    expect(mocks.getContext).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([{ loadMode: 'gateway' }, null])(
    'does not poll for non-direct context %s',
    async (context) => {
      mocks.getContext.mockResolvedValue(context);
      start();
      await settle();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(getWebUpdateAvailable()).toBe(false);
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

  it('pauses while hidden and checks immediately on returning to the foreground', async () => {
    start();
    await settle();
    setVisibility('hidden');
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    setVisibility('visible');
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('defers the first check when opened in the background', async () => {
    visibility = 'hidden';
    start();
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    setVisibility('visible');
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('coalesces repeated visibility checks while a request is pending', async () => {
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
  });

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

  it('cleans listeners, timers and in-flight requests and ignores late responses', async () => {
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
  });

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

  it('supports StrictMode setup / cleanup / setup with pending auth initialization', async () => {
    const first = start();
    first();
    start();
    await settle();
    expect(mocks.getContext).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
  });
});
