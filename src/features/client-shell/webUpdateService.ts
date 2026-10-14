import { hasHostBridge, hostBridge } from '@/utils/hostBridge';
import {
  getPageBuildInfo,
  normalizeBuildAt,
  normalizeGitHash,
  type PageBuildInfo,
} from './pageBuildInfo';

const POLL_INTERVAL_MS = 5 * 60_000;
const REQUEST_TIMEOUT_MS = 10_000;
type Listener = (available: boolean) => void;
type CheckRun = { owners: number; dispose: () => void };

let updateAvailable = false;
let latestWebBuildInfo: PageBuildInfo | undefined;
let activeRun: CheckRun | null = null;
const listeners = new Set<Listener>();

function publish(available: boolean, latestInfo?: PageBuildInfo): void {
  const infoChanged =
    latestWebBuildInfo?.gitHash !== latestInfo?.gitHash ||
    latestWebBuildInfo?.appVersion !== latestInfo?.appVersion ||
    latestWebBuildInfo?.buildAt !== latestInfo?.buildAt;
  latestWebBuildInfo = latestInfo;
  if (updateAvailable === available && (!available || !infoChanged)) return;
  updateAvailable = available;
  listeners.forEach((listener) => listener(available));
}

export function subscribeWebUpdate(listener: Listener): () => void {
  listeners.add(listener);
  listener(updateAvailable);
  return () => {
    listeners.delete(listener);
  };
}

export function getWebUpdateAvailable(): boolean {
  return updateAvailable;
}

export function getLatestWebBuildInfo(): PageBuildInfo | undefined {
  return latestWebBuildInfo;
}

/** 浏览器与 direct 商业宿主检查；与客户端安装包 updater 桥无关。 */
export function initWebUpdateCheck(): () => void {
  const currentHash = getPageBuildInfo().gitHash;
  const hosted = hasHostBridge();
  if (!currentHash || (hosted && hostBridge.host.getProduct() !== 'nuwax')) {
    return () => {};
  }

  if (!activeRun) {
    let disposed = false;
    let enabled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let requestTimeout: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let inFlight: Promise<void> | undefined;

    const clearTimer = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const isVisible = () => document.visibilityState === 'visible';
    const refresh = (): Promise<void> => {
      if (inFlight) return inFlight;
      if (disposed || !enabled || !isVisible()) return Promise.resolve();
      clearTimer();
      const requestController = new AbortController();
      controller = requestController;
      let rejectAborted: () => void = () => {};
      const aborted = new Promise<never>((_, reject) => {
        rejectAborted = () => reject(new Error('Version request aborted'));
        requestController.signal.addEventListener('abort', rejectAborted, {
          once: true,
        });
      });
      const timeout = setTimeout(
        () => requestController.abort(),
        REQUEST_TIMEOUT_MS,
      );
      requestTimeout = timeout;
      const request = Promise.resolve()
        .then(() => {
          if (requestController.signal.aborted) {
            throw new Error('Version request aborted');
          }
          return fetch('/version.json', {
            cache: 'no-store',
            signal: requestController.signal,
          });
        })
        .then(async (response) => {
          if (
            !response.ok ||
            response.headers.get('content-type')?.includes('text/html')
          ) {
            return undefined;
          }
          const info: unknown = await response.json();
          if (!info || typeof info !== 'object' || Array.isArray(info)) {
            return undefined;
          }
          const payload = info as {
            gitHash?: unknown;
            version?: unknown;
            buildAt?: unknown;
          };
          const gitHash = normalizeGitHash(payload.gitHash);
          if (!gitHash) return undefined;
          return Object.freeze({
            gitHash,
            appVersion:
              typeof payload.version === 'string'
                ? payload.version.trim() || undefined
                : undefined,
            buildAt: normalizeBuildAt(payload.buildAt),
          });
        });
      inFlight = Promise.race([request, aborted])
        .then((latestInfo) => {
          if (!disposed && latestInfo) {
            publish(latestInfo.gitHash !== currentHash, latestInfo);
          }
        })
        .catch(() => {
          // 离线、旧服务端或非法响应不误报；已有更新提示可以保留。
        })
        .finally(() => {
          clearTimeout(timeout);
          if (requestTimeout === timeout) requestTimeout = undefined;
          requestController.signal.removeEventListener('abort', rejectAborted);
          if (controller === requestController) controller = undefined;
          inFlight = undefined;
          clearTimer();
          if (!disposed && enabled && isVisible()) {
            timer = setTimeout(() => void refresh(), POLL_INTERVAL_MS);
          }
        });
      return inFlight;
    };
    const onVisibilityChange = () => {
      if (isVisible()) void refresh();
      else clearTimer();
    };

    const run: CheckRun = {
      owners: 0,
      dispose: () => {
        disposed = true;
        clearTimer();
        if (requestTimeout !== undefined) clearTimeout(requestTimeout);
        requestTimeout = undefined;
        controller?.abort();
        document.removeEventListener('visibilitychange', onVisibilityChange);
        publish(false);
      },
    };
    activeRun = run;
    const enable = () => {
      if (disposed) return;
      enabled = true;
      document.addEventListener('visibilitychange', onVisibilityChange);
      void refresh();
    };
    if (!hosted) {
      enable();
    } else {
      // 旧宿主没有 auth.getContext 时安全隐藏；迟到响应不得重建已清理的轮询。
      void hostBridge.auth
        .getContext()
        .then((context) => {
          if (context?.loadMode === 'direct') enable();
        })
        .catch(() => {});
    }
  }

  const run = activeRun;
  run.owners += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    run.owners -= 1;
    if (run.owners === 0) {
      if (activeRun === run) activeRun = null;
      run.dispose();
    }
  };
}

/** 保留当前地址、登录态和存储，仅由用户点击触发。 */
export function reloadWebPage(): void {
  window.location.reload();
}
