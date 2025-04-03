// src/utils/sse.ts
import {
  EventSourceMessage,
  fetchEventSource,
} from '@microsoft/fetch-event-source';

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

export async function createSSEConnection<T = any>(
  options: SSEOptions<T>,
): Promise<() => void> {
  const controller = options.abortController || new AbortController();

  try {
    console.log('1231231', options.url);
    await fetchEventSource(options.url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body:
        typeof options.body === 'object'
          ? JSON.stringify(options.body)
          : options.body,
      signal: controller.signal,
      openWhenHidden: true, // 页面不可见时保持连接

      onopen: async (response) => {
        if (response.status >= 400) {
          throw new Error(`SSE连接失败: ${response.statusText}`);
        }
        options.onOpen?.(response);
      },

      onmessage: (event) => {
        try {
          const data = event.data ? JSON.parse(event.data) : null;
          options.onMessage(data, event);
        } catch (error) {
          const normalizedError =
            error instanceof Error ? error : new Error(String(error));
          options.onError?.(normalizedError);
        }
      },

      onclose: () => {
        options.onClose?.();
      },

      onerror: (error) => {
        options.onError?.(error);
        controller.abort();
        throw error; // 停止自动重试
      },
    });
  } catch (error) {
    const normalized =
      error instanceof Error ? error : new Error(String(error));
    options.onError?.(normalized);
  }

  return () => controller.abort();
}
