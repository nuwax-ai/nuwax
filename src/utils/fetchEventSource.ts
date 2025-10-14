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
  let isAborted = false;

  const abortFunction = () => {
    if (!isAborted) {
      console.log('🔌 [SSE Utils] 手动中止 SSE 连接');
      isAborted = true;
      controller.abort();
    }
  };

  try {
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
        console.log('✅ [SSE Utils] SSE 连接已建立');
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
        console.log('🔌 [SSE Utils] SSE 连接已关闭');
        options.onClose?.();
      },

      onerror: (error) => {
        console.error('❌ [SSE Utils] SSE 连接错误:', error);
        options.onError?.(error);
        if (!isAborted) {
          controller.abort();
        }
        throw error; // 停止自动重试
      },
    });
  } catch (error) {
    const normalized =
      error instanceof Error ? error : new Error(String(error));
    console.error('❌ [SSE Utils] SSE 连接异常:', normalized);
    options.onError?.(normalized);
  }

  return abortFunction;
}
