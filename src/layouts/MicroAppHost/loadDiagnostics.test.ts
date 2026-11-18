import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { watchMicroAppLoad } from './loadDiagnostics';

let records: (entries: Array<Partial<PerformanceResourceTiming>>) => void;
const disconnect = vi.fn();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('window', { location: new URL('https://test.example/repo') });
  vi.stubGlobal(
    'PerformanceObserver',
    class {
      static supportedEntryTypes = ['resource'];
      constructor(callback: PerformanceObserverCallback) {
        records = (entries) =>
          callback(
            { getEntries: () => entries } as PerformanceObserverEntryList,
            this as unknown as PerformanceObserver,
          );
      }
      observe() {}
      disconnect = disconnect;
    },
  );
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('micro app load diagnostics', () => {
  it('logs the current parcel phase once after 15 seconds, and correlates recovery', () => {
    const load = watchMicroAppLoad('repo');
    load.phase('entry-assets');
    let status = 'BOOTSTRAPPING';
    load.trackParcel(() => status);
    vi.advanceTimersByTime(14_999);
    expect(console.warn).not.toHaveBeenCalled();
    status = 'MOUNTING';
    vi.advanceTimersByTime(20_001);
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /app=repo attempt=\d+ event=slow phase=mount durationMs=15000/,
      ),
    );
    const attempt = vi
      .mocked(console.warn)
      .mock.calls[0][0].match(/attempt=\d+/)?.[0];
    status = 'MOUNTED';
    load.finish('ready');
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(`${attempt} event=ready phase=mount`),
    );
    load.dispose();
  });

  it('cancels the warning on failure, success or disposal', () => {
    watchMicroAppLoad('repo').finish('failed');
    watchMicroAppLoad('repo').finish('ready');
    watchMicroAppLoad('im').dispose();
    vi.advanceTimersByTime(20_000);
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('event=failed phase=previous-instance'),
    );
  });

  it('records silent IM probe status without logging the URL or its query', () => {
    const load = watchMicroAppLoad('im');
    records([
      {
        name: 'https://other.example/api/instant-message/users/me',
        initiatorType: 'fetch',
        startTime: 1,
        duration: 50,
        responseStatus: 401,
      },
      {
        name: 'https://test.example/api/instant-message/users/me?private=1',
        initiatorType: 'fetch',
        startTime: 1,
        duration: 32,
        responseStatus: 401,
      },
    ]);
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /event=auth-probe phase=im-auth durationMs=32 httpStatus=401 timeMs=\d+$/,
      ),
    );
    load.dispose();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
