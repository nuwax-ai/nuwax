import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { UnifiedSessionMessage } from '@/types/interfaces/appDev';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { useCallback } from 'react';

/**
 * SSE 连接状态枚举
 */
export enum SSEConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * AppDev SSE 管理器配置
 */
export interface AppDevSSEManagerConfig {
  baseUrl: string;
  sessionId: string;
  onMessage?: (message: UnifiedSessionMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * AppDev SSE 连接管理 Model
 * 简化实现：直接管理 abort 句柄
 */
export default () => {
  /**
   * 初始化 AppDev SSE 连接
   */
  const initializeAppDevSSEConnection = useCallback(
    (config: AppDevSSEManagerConfig) => {
      // 初始化 AppDev SSE 连接

      const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
      const sseUrl = `${process.env.BASE_URL}/api/custom-page/ai-session-sse?session_id=${config.sessionId}`;
      // 连接到 SSE 服务

      // 直接获取 abort 句柄
      return createSSEConnection({
        url: sseUrl,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json, text/plain, */* ',
        },
        onOpen: () => {
          // SSE 连接已建立
          config.onOpen?.();
        },
        onMessage: (data: UnifiedSessionMessage) => {
          // 收到消息
          config.onMessage?.(data);
        },
        onError: (error) => {
          // SSE 连接错误
          config.onError?.(error as any);
        },
        onClose: () => {
          // SSE 连接已关闭
          config.onClose?.();
        },
      });
    },
    [],
  );

  return {
    // AppDev 方法
    initializeAppDevSSEConnection,
  };
};
