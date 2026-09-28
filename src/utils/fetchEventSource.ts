import {
  EventSourceMessage,
  fetchEventSource,
} from '@microsoft/fetch-event-source';
import { getBusinessRequestAuth } from './businessAuth';

export interface SSEOptions<T = any> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: BodyInit | object;
  onMessage: (data: T, event: EventSourceMessage) => void;
  onError?: (error: Error) => void;
  onOpen?: (response: Response) => void;
  onClose?: () => void;
  abortController?: AbortController;
}

/** await 保持等待流结束；取消/正常完成句柄在发起请求时即可使用。 */
export interface SSEConnection extends Promise<() => void> {
  abort: () => void;
  /** 正常业务完成保留现有 500ms 协议尾部窗口。 */
  finish: () => void;
}

/**
 * @deprecated 计时器已归属各连接。旧组件清理不能移除其他活跃流的 watchdog；
 * 请取消该组件自己的连接。
 */
export const clearSSESharedTimeout = () => {};

export function createSSEConnection<T = any>(
  options: SSEOptions<T>,
): SSEConnection {
  const controller = options.abortController || new AbortController();
  let closed = false;
  let errorNotified = false;
  let lastMessageTimestamp = 0;
  let timeoutCheckInterval: ReturnType<typeof setInterval> | null = null;
  let finishTimeout: ReturnType<typeof setTimeout> | null = null;
  let abortHandler: (() => void) | null = null;

  const notifyError = (error: Error) => {
    if (errorNotified) return;
    errorNotified = true;
    options.onError?.(error);
  };

  const cleanup = () => {
    if (timeoutCheckInterval !== null) {
      clearInterval(timeoutCheckInterval);
      timeoutCheckInterval = null;
    }
    if (finishTimeout !== null) {
      clearTimeout(finishTimeout);
      finishTimeout = null;
    }
    if (abortHandler)
      controller.signal.removeEventListener('abort', abortHandler);
  };

  const close = (error?: Error) => {
    if (closed) return;
    closed = true;
    cleanup();
    // 先中断网络，防止 close/error 回调触发新请求时旧连接仍继续分发。
    controller.abort();
    try {
      if (error) notifyError(error);
    } finally {
      options.onClose?.();
    }
  };

  const abort = () => close();
  const finish = () => {
    if (closed || finishTimeout !== null) return;
    // end_turn/completed 后仍可能有状态消息；显式取消走 abort，不进入此窗口。
    finishTimeout = setTimeout(abort, 500);
  };

  abortHandler = abort;
  controller.signal.addEventListener('abort', abort, { once: true });

  const completion = (async () => {
    if (controller.signal.aborted) {
      close();
      return;
    }
    try {
      const auth = getBusinessRequestAuth(options.url);
      await fetchEventSource(options.url, {
        method: options.method || 'GET',
        credentials: auth.credentials,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          ...auth.headers,
        },
        body:
          typeof options.body === 'object'
            ? JSON.stringify(options.body)
            : options.body,
        signal: controller.signal,
        openWhenHidden: true,
        onopen: async (response) => {
          if (closed) return;
          if (response.status >= 400) {
            throw new Error(`SSE connection failed: ${response.statusText}`);
          }
          lastMessageTimestamp = Date.now();
          if (timeoutCheckInterval !== null)
            clearInterval(timeoutCheckInterval);
          timeoutCheckInterval = setInterval(() => {
            if (Date.now() - lastMessageTimestamp >= 60_000) abort();
          }, 5_000);
          options.onOpen?.(response);
        },
        onmessage: (event) => {
          if (closed) return;
          try {
            lastMessageTimestamp = Date.now();
            const data = event.data ? JSON.parse(event.data) : null;
            options.onMessage(data, event);
            const { completed, subType } =
              (data as { completed?: boolean; subType?: string }) ?? {};
            if (subType === 'end_turn' || completed === true) finish();
          } catch (error) {
            // 保持既有消息异常契约：单条解析/回调异常不截断后续协议消息。
            notifyError(
              error instanceof Error ? error : new Error(String(error)),
            );
          }
        },
        onclose: abort,
        onerror: (error) => {
          if (closed) return;
          const normalized =
            error instanceof Error ? error : new Error(String(error));
          close(normalized);
          throw normalized; // 终止自动重连，与现有错误契约一致。
        },
      });
      close();
    } catch (error) {
      if (!closed) {
        close(error instanceof Error ? error : new Error(String(error)));
      }
    }
  })();

  return Object.assign(
    completion.then(() => abort),
    { abort, finish },
  );
}
