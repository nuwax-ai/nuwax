/** 单次 cors 探测超时（毫秒） */
const CHECK_TIMEOUT_MS = 8000;

/** 启动成功后域名检查的最多尝试次数 */
const PREVIEW_HEALTH_POLL_MAX_ATTEMPTS = 5;

/** 两次域名检查之间的间隔（毫秒） */
const PREVIEW_HEALTH_POLL_INTERVAL_MS = 2000;

/** iframe onLoad 后等待 Performance 写入的轮询间隔（毫秒） */
const TIMING_POLL_INTERVAL_MS = 300;

/** iframe onLoad 后等待 Performance 写入的最长时间（毫秒） */
const TIMING_POLL_MAX_MS = 2000;

export interface PreviewHealthResult {
  ok: boolean;
  status?: number;
  opaque?: boolean;
}

export interface PreviewHealthCheckOptions {
  signal?: AbortSignal;
  /** 仅统计该时间点（performance.now）之后写入的 Resource Timing，避免误读历史 5xx */
  sinceStartTime?: number;
  /** 轮询过程中返回 true 则不再继续（例如用户已停止） */
  shouldStop?: () => boolean;
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

const normalizePathname = (pathname: string): string =>
  pathname.replace(/\/+$/, '') || '/';

/** 根路径与常见 index 文档视为同一预览入口（重定向场景）。 */
const isIndexPathEquivalent = (a: string, b: string): boolean => {
  const paths = [normalizePathname(a), normalizePathname(b)];
  const indexPaths = new Set(['/', '/index.html', '/index.htm']);
  return paths.every((path) => indexPaths.has(path));
};

/**
 * 判断 Performance 条目是否对应预览文档 URL（iframe 导航 / 同源 cors 探测）。
 * 不按 origin 整域匹配，避免同域其它资源（API、静态文件）的历史 5xx 误判。
 */
export const urlsMatchForPreviewTiming = (
  entryName: string,
  previewUrl: string,
): boolean => {
  const entryNorm = normalizePreviewEntryUrl(entryName);
  const previewNorm = normalizePreviewEntryUrl(previewUrl);
  if (entryNorm === previewNorm) {
    return true;
  }
  try {
    const entry = new URL(entryName);
    const preview = new URL(previewUrl);
    if (entry.origin !== preview.origin) {
      return false;
    }
    return isIndexPathEquivalent(entry.pathname, preview.pathname);
  } catch {
    return false;
  }
};

/**
 * 从 Performance Resource Timing 读取预览 URL 的 HTTP 状态。
 * 同时匹配 iframe 导航与页面发起的 cors fetch 条目。
 */
export const readPreviewResponseStatusFromTiming = (
  previewUrl: string,
  sinceStartTime?: number,
): number | undefined => {
  const trimmed = previewUrl?.trim();
  if (!trimmed || typeof performance === 'undefined') {
    return undefined;
  }

  const entries = performance.getEntriesByType(
    'resource',
  ) as PerformanceResourceTiming[];

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (sinceStartTime !== undefined && entry.startTime < sinceStartTime) {
      continue;
    }
    if (!urlsMatchForPreviewTiming(entry.name, trimmed)) {
      continue;
    }
    const status = entry.responseStatus;
    if (!status || status <= 0) {
      continue;
    }
    return status;
  }

  return undefined;
};

/**
 * cors 请求预览 URL；跨域无 CORS 头时 catch，并尝试从 Performance 读取 5xx。
 */
export const fetchPreviewUrlHealthOnce = async (
  previewUrl: string,
  options?: Pick<PreviewHealthCheckOptions, 'signal' | 'sinceStartTime'>,
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
      signal: options?.signal ?? AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    return {
      ok: response.ok,
      status: response.status,
    };
  } catch {
    const timingStatus = readPreviewResponseStatusFromTiming(
      url,
      options?.sinceStartTime,
    );
    if (
      timingStatus !== undefined &&
      timingStatus >= 200 &&
      timingStatus < 300
    ) {
      return { ok: true, status: timingStatus };
    }
    if (timingStatus !== undefined && timingStatus >= 400) {
      return { ok: false, status: timingStatus };
    }
    return { ok: false, opaque: true };
  }
};

/**
 * 启动成功后轮询预览域名。
 * 某一次返回 200 立刻结束；否则继续，直到达到尝试上限。
 * 每一次只读取该次请求之后写入的状态，不沿用更早的 502。
 *
 * @param previewUrl 预览地址
 * @param options 次数上限、间隔、取消信号
 * @returns 最后一次检查结果；中途 200 时即为该次成功结果
 */
export const pollPreviewUrlHealth = async (
  previewUrl: string,
  options?: PreviewHealthCheckOptions & {
    maxAttempts?: number;
    intervalMs?: number;
  },
): Promise<PreviewHealthResult> => {
  const url = previewUrl?.trim();
  const maxAttempts = Math.max(
    1,
    options?.maxAttempts ?? PREVIEW_HEALTH_POLL_MAX_ATTEMPTS,
  );
  const intervalMs = options?.intervalMs ?? PREVIEW_HEALTH_POLL_INTERVAL_MS;
  let last: PreviewHealthResult = { ok: false, status: 0 };

  if (!url) {
    return last;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (options?.signal?.aborted || options?.shouldStop?.()) {
      return last;
    }

    const sinceStartTime =
      typeof performance !== 'undefined' ? performance.now() : undefined;
    last = await fetchPreviewUrlHealthOnce(url, {
      signal: options?.signal,
      sinceStartTime,
    });
    if (last.status === 200) {
      return last;
    }
    if (attempt >= maxAttempts - 1) {
      break;
    }

    try {
      await sleep(intervalMs, options?.signal);
    } catch {
      return last;
    }
  }

  return last;
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
  sinceStartTime?: number,
): PreviewHealthResult | null => {
  const emptyState = getPreviewIframeDocumentEmptyState(frame);
  if (emptyState === true) {
    return { ok: false };
  }

  const timingStatus = readPreviewResponseStatusFromTiming(
    previewUrl,
    sinceStartTime,
  );
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
  options?: Pick<PreviewHealthCheckOptions, 'signal' | 'sinceStartTime'>,
): Promise<PreviewHealthResult | null> => {
  const deadline = Date.now() + TIMING_POLL_MAX_MS;

  while (Date.now() < deadline) {
    if (options?.signal?.aborted) {
      return null;
    }

    const timingStatus = readPreviewResponseStatusFromTiming(
      previewUrl,
      options?.sinceStartTime,
    );
    if (timingStatus !== undefined && timingStatus >= 400) {
      return { ok: false, status: timingStatus };
    }
    if (
      timingStatus !== undefined &&
      timingStatus >= 200 &&
      timingStatus < 300
    ) {
      return { ok: true, status: timingStatus };
    }

    try {
      await sleep(TIMING_POLL_INTERVAL_MS, options?.signal);
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
 * - Timing / cors 明确 4xx/5xx（且为本次加载写入的条目）→ 失败
 * - iframe 已 onLoad 且跨域无法 cors：视为成功（由浏览器导航结果为准）
 */
export const waitUntilPreviewUrlReady = async (
  previewUrl: string,
  frame: HTMLIFrameElement | null,
  options?: PreviewHealthCheckOptions,
): Promise<PreviewHealthResult> => {
  const url = previewUrl?.trim();
  if (!url) {
    return { ok: false, status: 0 };
  }

  const sync = readPreviewSyncSignals(url, frame, options?.sinceStartTime);
  if (sync) {
    return sync;
  }

  const cors = await fetchPreviewUrlHealthOnce(url, options);
  if (cors.ok) {
    return cors;
  }
  if (cors.status !== undefined && cors.status >= 400) {
    return cors;
  }

  const polled = await pollPreviewTimingStatus(url, options);
  if (polled) {
    return polled;
  }

  const timingAfterFetch = readPreviewResponseStatusFromTiming(
    url,
    options?.sinceStartTime,
  );
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
    const emptyState = getPreviewIframeDocumentEmptyState(frame);
    if (emptyState !== true) {
      return { ok: true, opaque: true };
    }
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
