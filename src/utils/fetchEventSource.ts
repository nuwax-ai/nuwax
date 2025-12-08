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
  // 记录最后一次收到消息的时间戳
  let lastMessageTimestamp: number | null = null;
  // 超时检查定时器
  let timeoutCheckInterval: NodeJS.Timeout | null = null;

  const abortFunction = () => {
    if (!isAborted) {
      console.log('🔌 [SSE Utils] 手动中止 SSE 连接');
      isAborted = true;
      // 清除超时检查定时器
      if (timeoutCheckInterval) {
        clearInterval(timeoutCheckInterval);
        timeoutCheckInterval = null;
      }
      controller.abort();
    }
  };

  // 超时检查函数：每20秒检查一次，超过60秒未收到消息则断开连接
  const startTimeoutCheck = () => {
    // 清除之前的定时器（如果存在）
    if (timeoutCheckInterval) {
      clearInterval(timeoutCheckInterval);
    }

    timeoutCheckInterval = setInterval(() => {
      // 如果连接已中止，清除定时器
      if (isAborted) {
        if (timeoutCheckInterval) {
          clearInterval(timeoutCheckInterval);
          timeoutCheckInterval = null;
        }
        return;
      }

      // 如果还没有收到过消息，不进行超时检查
      if (lastMessageTimestamp === null) {
        return;
      }

      // 计算距离最后一次消息的时间间隔（毫秒）
      const timeSinceLastMessage = Date.now() - lastMessageTimestamp;
      const timeoutThreshold = 60 * 1000; // 60秒超时阈值

      // 如果超过60秒未收到消息，主动断开连接
      if (timeSinceLastMessage >= timeoutThreshold) {
        console.log(
          `⏰ [SSE Utils] 超过60秒未收到消息，主动断开连接 (${Math.round(
            timeSinceLastMessage / 1000,
          )}秒)`,
        );
        if (!isAborted) {
          isAborted = true;
          if (timeoutCheckInterval) {
            clearInterval(timeoutCheckInterval);
            timeoutCheckInterval = null;
          }
          options.onClose?.();
          controller.abort();
        }
      }
    }, 20 * 1000); // 每20秒检查一次
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
        // 连接建立时初始化时间戳并启动超时检查
        lastMessageTimestamp = Date.now();
        startTimeoutCheck();
        options.onOpen?.(response);
      },

      onmessage: (event) => {
        try {
          // 更新最后一次收到消息的时间戳
          lastMessageTimestamp = Date.now();
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
        // 清除超时检查定时器
        if (timeoutCheckInterval) {
          clearInterval(timeoutCheckInterval);
          timeoutCheckInterval = null;
        }
        lastMessageTimestamp = null;
        options.onClose?.();
      },

      onerror: (error) => {
        console.error('❌ [SSE Utils] SSE 连接错误:', error);
        // 清除超时检查定时器
        if (timeoutCheckInterval) {
          clearInterval(timeoutCheckInterval);
          timeoutCheckInterval = null;
        }
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
    // 清除超时检查定时器
    if (timeoutCheckInterval) {
      clearInterval(timeoutCheckInterval);
      timeoutCheckInterval = null;
    }
    options.onError?.(normalized);
  }

  return abortFunction;
}
