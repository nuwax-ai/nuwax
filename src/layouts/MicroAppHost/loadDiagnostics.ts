type LoadPhase =
  | 'previous-instance'
  | 'session-sync'
  | 'qiankun-import'
  | 'entry-assets'
  | 'bootstrap'
  | 'mount';

const SLOW_LOAD_MS = 15_000;
let nextAttempt = 0;

export function watchMicroAppLoad(app: 'repo' | 'im') {
  const attempt = ++nextAttempt;
  const startedAt = performance.now();
  let phase: LoadPhase = 'previous-instance';
  let getParcelStatus: (() => string) | undefined;
  const currentPhase = (): LoadPhase => {
    // qiankun can reuse lifecycles on retry. Read this attempt's parcel, not cached hooks.
    const status = getParcelStatus?.();
    if (status === 'BOOTSTRAPPING') return 'bootstrap';
    if (status === 'MOUNTING' || status === 'MOUNTED') return 'mount';
    return phase;
  };
  const record = (
    event:
      | 'slow'
      | 'ready'
      | 'failed'
      | 'auth-expired'
      | 'auth-probe'
      | 'first-api',
    step: LoadPhase | 'im-auth' | 'repo-api' = currentPhase(),
    elapsedMs = performance.now() - startedAt,
    httpStatus = 0,
  ) => {
    const line = `[MicroAppLoad] app=${app} attempt=${attempt} event=${event} phase=${step} durationMs=${Math.round(
      elapsedMs,
    )} httpStatus=${httpStatus} timeMs=${Date.now()}`;
    if (
      event === 'slow' ||
      event === 'failed' ||
      event === 'auth-expired' ||
      httpStatus >= 400
    ) {
      console.warn(line);
    } else {
      console.info(line);
    }
  };
  const timer = setTimeout(() => record('slow'), SLOW_LOAD_MS);

  // IM 首次静默探测遇到 401 可能直接显示登录提示，宿主不会收到失效回调。
  // 只读同源请求的时序和 HTTP 状态，不接触响应正文或登录信息。
  let observer: PerformanceObserver | undefined;
  if (
    typeof PerformanceObserver !== 'undefined' &&
    PerformanceObserver.supportedEntryTypes?.includes('resource')
  ) {
    observer = new PerformanceObserver((list) => {
      for (const resource of list.getEntries() as PerformanceResourceTiming[]) {
        if (
          resource.startTime < startedAt ||
          resource.initiatorType !== 'fetch'
        )
          continue;
        const url = new URL(resource.name, window.location.href);
        if (url.origin !== window.location.origin) continue;
        const status = resource.responseStatus || 0;
        if (app === 'im' && url.pathname === '/api/instant-message/users/me') {
          record('auth-probe', 'im-auth', resource.duration, status);
        } else if (app === 'repo' && url.pathname.startsWith('/api/repo/')) {
          record('first-api', 'repo-api', resource.duration, status);
          observer?.disconnect();
          break;
        }
      }
    });
    try {
      observer.observe({ type: 'resource' });
    } catch {
      observer.disconnect();
    }
  }

  return {
    phase(next: LoadPhase) {
      phase = next;
    },
    trackParcel(getStatus: () => string) {
      getParcelStatus = getStatus;
    },
    finish(result: 'ready' | 'failed') {
      clearTimeout(timer);
      record(result);
      if (result === 'failed') observer?.disconnect();
    },
    authExpired() {
      record('auth-expired', app === 'im' ? 'im-auth' : 'repo-api');
    },
    dispose() {
      clearTimeout(timer);
      observer?.disconnect();
    },
  };
}
