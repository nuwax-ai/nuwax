/** 单次 cors 探测超时（毫秒） */
const CHECK_TIMEOUT_MS = 8000;

/** iframe onLoad 后等待 Performance 写入的轮询间隔（毫秒） */
const TIMING_POLL_INTERVAL_MS = 300;

/** iframe onLoad 后等待 Performance 写入的最长时间（毫秒） */
const TIMING_POLL_MAX_MS = 2000;

export interface PreviewHealthResult {
  ok: boolean;
  status?: number;
  opaque?: boolean;
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

const normalizePreviewEntryUrl = (raw: string): string => {
  const withoutHash = raw.split('#')[0].split('?')[0];
  try {
    const url = new URL(withoutHash);
    const path = url.pathname.replace(/\/+$/, '');
    return path ? `${url.origin}${path}` : url.origin;
  } catch {
    return withoutHash.replace(/\/+$/, '');
  }
};

/** 判断 Performance 条目是否对应预览 URL（含 iframe 导航与 cors fetch）。 */
const urlsMatchForPreviewTiming = (
  entryName: string,
  previewUrl: string,
): boolean => {
  const entryNorm = normalizePreviewEntryUrl(entryName);
  const previewNorm = normalizePreviewEntryUrl(previewUrl);
  if (entryNorm === previewNorm) {
    return true;
  }
  try {
    const preview = new URL(previewUrl);
    const entry = new URL(entryName);
    return entry.origin === preview.origin;
  } catch {
    return entryName.startsWith(previewUrl) || previewUrl.startsWith(entryName);
  }
};

/**
 * 从 Performance Resource Timing 读取预览 URL 的 HTTP 状态。
 * 同时匹配 iframe 导航与页面发起的 cors fetch 条目。
 */
export const readPreviewResponseStatusFromTiming = (
  previewUrl: string,
): number | undefined => {
  const trimmed = previewUrl?.trim();
  if (!trimmed || typeof performance === 'undefined') {
    return undefined;
  }

  const entries = performance.getEntriesByType(
    'resource',
  ) as PerformanceResourceTiming[];

  let latestOkStatus: number | undefined;

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (!urlsMatchForPreviewTiming(entry.name, trimmed)) {
      continue;
    }
    const status = entry.responseStatus;
    if (!status || status <= 0) {
      continue;
    }
    if (status >= 400) {
      return status;
    }
    latestOkStatus = status;
  }

  return latestOkStatus;
};

/**
 * cors 请求预览 URL；跨域无 CORS 头时 catch，并尝试从 Performance 读取 5xx。
 */
export const fetchPreviewUrlHealthOnce = async (
  previewUrl: string,
  signal?: AbortSignal,
): Promise<PreviewHealthResult> => {
  const url = previewUrl?.trim();
  if (!url) {
    return { ok: false, status: 0 };
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'follow',
      signal: signal ?? AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    return {
      ok: response.ok,
      status: response.status,
    };
  } catch {
    const timingStatus = readPreviewResponseStatusFromTiming(url);
    if (timingStatus !== undefined && timingStatus >= 400) {
      return { ok: false, status: timingStatus };
    }
    return { ok: false, opaque: true };
  }
};

/** iframe 文档是否为空；跨域时为 null。 */
export const getPreviewIframeDocumentEmptyState = (
  frame: HTMLIFrameElement | null,
): boolean | null => {
  if (!frame) {
    return null;
  }
  try {
    const doc = frame.contentDocument;
    if (!doc) {
      return null;
    }
    const body = doc.body;
    if (!body) {
      return true;
    }
    return body.childElementCount === 0 && !body.textContent?.trim();
  } catch {
    return null;
  }
};

/**
 * 同步信号：Timing / 空文档，不发起 fetch。
 */
const readPreviewSyncSignals = (
  previewUrl: string,
  frame: HTMLIFrameElement | null,
): PreviewHealthResult | null => {
  const emptyState = getPreviewIframeDocumentEmptyState(frame);
  if (emptyState === true) {
    return { ok: false };
  }

  const timingStatus = readPreviewResponseStatusFromTiming(previewUrl);
  if (timingStatus !== undefined && timingStatus >= 200 && timingStatus < 300) {
    return { ok: true, status: timingStatus };
  }
  if (timingStatus !== undefined && timingStatus >= 400) {
    return { ok: false, status: timingStatus };
  }

  return null;
};

/**
 * iframe onLoad 后短暂轮询 Performance，等待 iframe / fetch 条目写入。
 */
const pollPreviewTimingStatus = async (
  previewUrl: string,
  signal?: AbortSignal,
): Promise<PreviewHealthResult | null> => {
  const deadline = Date.now() + TIMING_POLL_MAX_MS;

  while (Date.now() < deadline) {
    if (signal?.aborted) {
      return null;
    }

    const timingStatus = readPreviewResponseStatusFromTiming(previewUrl);
    if (timingStatus !== undefined && timingStatus >= 400) {
      return { ok: false, status: timingStatus };
    }
    if (timingStatus !== undefined && timingStatus >= 200 && timingStatus < 300) {
      return { ok: true, status: timingStatus };
    }

    try {
      await sleep(TIMING_POLL_INTERVAL_MS, signal);
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * iframe onLoad 后校验预览是否就绪（单次 cors + 短轮询 Timing，不长时间轮询）。
 *
 * - Timing / cors 明确 2xx → 成功
 * - Timing / cors 明确 4xx/5xx → 立即失败，展示错误 UI
 * - cors 跨域拦截且无法确认 2xx → 失败（避免 502 白屏）
 */
export const waitUntilPreviewUrlReady = async (
  previewUrl: string,
  frame: HTMLIFrameElement | null,
  options?: { signal?: AbortSignal },
): Promise<PreviewHealthResult> => {
  const url = previewUrl?.trim();
  if (!url) {
    return { ok: false, status: 0 };
  }

  const sync = readPreviewSyncSignals(url, frame);
  if (sync) {
    return sync;
  }

  const cors = await fetchPreviewUrlHealthOnce(url, options?.signal);
  if (cors.ok) {
    return cors;
  }
  if (cors.status !== undefined && cors.status >= 400) {
    return cors;
  }

  const polled = await pollPreviewTimingStatus(url, options?.signal);
  if (polled) {
    return polled;
  }

  const timingAfterFetch = readPreviewResponseStatusFromTiming(url);
  if (
    timingAfterFetch !== undefined &&
    timingAfterFetch >= 200 &&
    timingAfterFetch < 300
  ) {
    return { ok: true, status: timingAfterFetch };
  }
  if (timingAfterFetch !== undefined && timingAfterFetch >= 400) {
    return { ok: false, status: timingAfterFetch };
  }

  if (cors.opaque) {
    return { ok: false, opaque: true };
  }

  return { ok: false };
};

/** 进页探测：可读 HTTP 状态时 502 视为不可达；不可读时不再把 no-cors 当成可达。 */
export const probePreviewReachable = async (
  previewUrl: string,
): Promise<boolean> => {
  const trimmed = previewUrl?.trim();
  if (!trimmed) {
    return false;
  }

  const timingStatus = readPreviewResponseStatusFromTiming(trimmed);
  if (timingStatus !== undefined) {
    return timingStatus >= 200 && timingStatus < 300;
  }

  const health = await fetchPreviewUrlHealthOnce(trimmed);
  if (health.ok) {
    return true;
  }
  if (health.status !== undefined && health.status >= 400) {
    return false;
  }

  const timingAfterFetch = readPreviewResponseStatusFromTiming(trimmed);
  if (timingAfterFetch !== undefined) {
    return timingAfterFetch >= 200 && timingAfterFetch < 300;
  }

  return false;
};
