/** 单次 cors 探测超时（毫秒） */
const CHECK_TIMEOUT_MS = 8000;

export interface PreviewHealthResult {
  ok: boolean;
  status?: number;
  opaque?: boolean;
}

/**
 * cors 请求预览 URL；跨域无 CORS 头时 catch，标记 opaque。
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
    return { ok: false, opaque: true };
  }
};

const normalizePreviewEntryUrl = (raw: string): string =>
  raw.split('#')[0].split('?')[0].replace(/\/+$/, '');

/**
 * 从 Performance Resource Timing 读取 iframe 导航 HTTP 状态。
 * 优先 initiatorType 为 iframe 的条目（与 document 200 对应）。
 */
export const readPreviewResponseStatusFromTiming = (
  previewUrl: string,
): number | undefined => {
  const trimmed = previewUrl?.trim();
  if (!trimmed || typeof performance === 'undefined') {
    return undefined;
  }

  const base = normalizePreviewEntryUrl(trimmed);
  const entries = performance.getEntriesByType(
    'resource',
  ) as PerformanceResourceTiming[];

  let fallbackStatus: number | undefined;

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    const name = normalizePreviewEntryUrl(entry.name);
    if (name !== base && !entry.name.startsWith(trimmed)) {
      continue;
    }
    if (!entry.responseStatus || entry.responseStatus <= 0) {
      continue;
    }
    if (entry.initiatorType === 'iframe') {
      return entry.responseStatus;
    }
    fallbackStatus = entry.responseStatus;
  }

  return fallbackStatus;
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
 * iframe onLoad 后校验预览是否就绪（单次检查，不轮询）。
 *
 * - Timing 2xx → 立即成功
 * - Timing / cors 明确 4xx/5xx → 立即失败，展示错误 UI
 * - cors 跨域拦截（opaque）→ 信任 iframe onLoad，立即成功
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
  if (cors.opaque) {
    return { ok: true, opaque: true };
  }
  if (cors.status !== undefined && cors.status >= 400) {
    return cors;
  }

  return { ok: true, opaque: true };
};

/** 进页探测：可读 HTTP 状态时 502 视为不可达；不可读时回退 no-cors。 */
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
  if (!health.opaque) {
    return health.ok;
  }

  try {
    await fetch(trimmed, {
      mode: 'no-cors',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      cache: 'no-store',
    });
    return true;
  } catch {
    return false;
  }
};
