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

// 共享级别的定时器引用与所有者标记，防止上一请求残留的定时器影响新请求
let sharedTimeoutCheckInterval: NodeJS.Timeout | null = null;
let sharedTimeoutOwner: symbol | null = null;

const clearSharedTimeout = (owner?: symbol) => {
  if (sharedTimeoutCheckInterval && (!owner || owner === sharedTimeoutOwner)) {
    clearInterval(sharedTimeoutCheckInterval);
    sharedTimeoutCheckInterval = null;
    sharedTimeoutOwner = null;
  }
};

/**
 * 对外暴露的共享定时器清理函数，便于在组件层主动清除残留定时器
 */
export const clearSSESharedTimeout = () => {
  clearSharedTimeout();
};

export async function createSSEConnection<T = any>(
  options: SSEOptions<T>,
): Promise<() => void> {
  const controller = options.abortController || new AbortController();
  let isAborted = false;
  // 防止 onClose 被多处路径重复触发（abortFunction / onclose / timeout）
  let hasClosed = false;
  // 记录最后一次收到消息的时间戳
  let lastMessageTimestamp: number | null = null;
  // 超时检查定时器
  let timeoutCheckInterval: NodeJS.Timeout | null = null;

  // 为当前连接生成唯一标识，用于共享定时器管理
  const timerOwner = Symbol('sse-timeout-owner');

  const safeOnClose = () => {
    if (hasClosed) {
      return;
    }
    hasClosed = true;
    options.onClose?.();
  };

  // 清理定时器并标记中止
  const markAborted = () => {
    isAborted = true;
    if (timeoutCheckInterval) {
      clearInterval(timeoutCheckInterval);
      timeoutCheckInterval = null;
    }
    clearSharedTimeout(timerOwner);
  };

  const abortFunction = () => {
    if (!isAborted) {
      // 防止页面流式数据输出不全问题，延迟1秒关闭连接
      setTimeout(() => {
        // 延迟期间如果已经走了 onclose/onerror/timeout，则不再重复触发关闭逻辑
        if (isAborted) {
          return;
        }
        console.log('🔌 [SSE Utils] 手动中止 SSE 连接');
        // 清除共享定时器
        markAborted();
        safeOnClose();
        // 中止连接
        // controller.abort();
      }, 500);
    }
  };

  // 在真正发起新的 SSE 连接前，先清理可能残留的共享定时器，避免上一次请求影响本次
  clearSharedTimeout();

  // 超时检查函数：每5秒检查一次，超过60秒未收到消息则断开连接
  const startTimeoutCheck = () => {
    // 清除之前的定时器（如果存在），并清理潜在的上一请求残留
    if (timeoutCheckInterval) {
      clearInterval(timeoutCheckInterval);
    }
    clearSharedTimeout();

    timeoutCheckInterval = setInterval(() => {
      // 如果连接已中止，清除定时器
      if (isAborted) {
        if (timeoutCheckInterval) {
          clearInterval(timeoutCheckInterval);
          timeoutCheckInterval = null;
        }
        clearSharedTimeout(timerOwner);
        return;
      }

      // 如果还没有收到过消息，不进行超时检查
      if (lastMessageTimestamp === null) {
        return;
      }

      // 计算距离最后一次消息的时间间隔（毫秒）
      const timeSinceLastMessage = Date.now() - lastMessageTimestamp;
      const timeoutThreshold = 60 * 1000; // 60秒超时阈值
      console.log(
        `⏰ [SSE Utils] 未收到消息，距离上次消息时间: ${Math.round(
          timeSinceLastMessage / 1000,
        )}秒`,
      );

      // 如果超过60秒未收到消息，主动断开连接
      if (timeSinceLastMessage >= timeoutThreshold) {
        console.log(
          `⏰ [SSE Utils] 超过60秒未收到消息，主动断开连接 (${Math.round(
            timeSinceLastMessage / 1000,
          )}秒)`,
        );
        if (!isAborted) {
          markAborted();
          safeOnClose();
          controller.abort();
        }
      }
    }, 5 * 1000); // 每5秒检查一次

    // 记录共享定时器引用，避免旧连接遗留的定时器干扰新连接
    sharedTimeoutCheckInterval = timeoutCheckInterval;
    sharedTimeoutOwner = timerOwner;
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
          const { completed, subType } =
            (data as { completed?: boolean; subType?: string }) ?? {};

          options.onMessage(data, event);

          // 页面开发结束标志 subType   = 'end_turn'
          // 聊天对话结束标志 completed = true
          if (subType === 'end_turn' || completed === true) {
            console.log(
              `✅ [SSE Utils] 页面开发结束或聊天对话结束，主动断开连接 subType:${subType} completed:${completed}`,
            );
            abortFunction();
          }
        } catch (error) {
          const normalizedError =
            error instanceof Error ? error : new Error(String(error));
          options.onError?.(normalizedError);
        }
      },

      onclose: () => {
        console.log('🔌 [SSE Utils] SSE 连接已关闭');
        // 标记中止，防止重复处理
        if (!isAborted) {
          markAborted();
          lastMessageTimestamp = null;
        }
        // 无论是否已中止，都要触发 onClose 回调，确保前端状态被终止
        // 即使没有收到 finalresult，连接断开时也要终止状态
        // safeOnClose 内部有 hasClosed 保护，防止重复触发
        safeOnClose();
        // 阻止 fetchEventSource 继续自动重连
        if (!isAborted) {
          controller.abort();
        }
      },

      onerror: (error) => {
        if (isAborted) {
          return;
        }
        console.error('❌ [SSE Utils] SSE 连接错误:', error);
        markAborted();
        options.onError?.(error);
        controller.abort();
        throw error; // 停止自动重试
      },
    });
  } catch (error) {
    const normalized =
      error instanceof Error ? error : new Error(String(error));
    console.error('❌ [SSE Utils] SSE 连接异常:', normalized);
    markAborted();
    options.onError?.(normalized);
  }

  return abortFunction;
}
