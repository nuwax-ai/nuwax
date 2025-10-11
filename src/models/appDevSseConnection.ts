import type {
  SSEEventType,
  UnifiedSessionMessage,
} from '@/types/interfaces/appDev';
import { createSSEManager } from '@/utils/sseManager';
import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';

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
 * SSE 管理器配置
 */
export interface SSEManagerConfig {
  baseUrl: string;
  sessionId: string;
  onMessage?: (message: UnifiedSessionMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * AppDev SSE 连接管理 Model
 * 参考 conversationInfo.ts 的模式，提供 AppDev SSE 连接管理功能
 */
export default () => {
  // AppDev SSE 管理器实例
  const appDevSseManagerRef = useRef<any>(null);

  // AppDev 连接状态
  const [appDevConnectionState, setAppDevConnectionState] =
    useState<SSEConnectionState>(SSEConnectionState.DISCONNECTED);

  // AppDev 当前会话 ID
  const [appDevCurrentSessionId, setAppDevCurrentSessionId] =
    useState<string>('');

  // AppDev 是否正在连接
  const [isAppDevConnecting, setIsAppDevConnecting] = useState<boolean>(false);

  // AppDev 连接错误信息
  const [appDevConnectionError, setAppDevConnectionError] = useState<
    string | null
  >(null);

  /**
   * 初始化 AppDev SSE 连接
   */
  const initializeAppDevSSEConnection = useCallback(
    async (config: SSEManagerConfig) => {
      console.log('🔧 [AppDev SSE Model] 初始化 AppDev SSE 连接:', config);

      // 如果已有连接，先断开
      if (appDevSseManagerRef.current) {
        console.log('🔄 [AppDev SSE Model] 断开现有 AppDev 连接');
        appDevSseManagerRef.current.destroy();
        appDevSseManagerRef.current = null;
      }

      try {
        setIsAppDevConnecting(true);
        setAppDevConnectionError(null);
        setAppDevConnectionState(SSEConnectionState.CONNECTING);

        // 创建新的 AppDev SSE 管理器
        const appDevSseManager = createSSEManager({
          baseUrl: config.baseUrl,
          sessionId: config.sessionId,
          onMessage: (message: UnifiedSessionMessage) => {
            console.log('📨 [AppDev SSE Model] 收到 AppDev 消息:', message);
            config.onMessage?.(message);
          },
          onError: (error: Event) => {
            console.error('❌ [AppDev SSE Model] AppDev 连接错误:', error);
            setAppDevConnectionState(SSEConnectionState.ERROR);
            setAppDevConnectionError('AppDev SSE 连接错误');
            config.onError?.(error);
          },
          onOpen: () => {
            console.log('✅ [AppDev SSE Model] AppDev 连接已建立');
            setAppDevConnectionState(SSEConnectionState.CONNECTED);
            setAppDevConnectionError(null);
            config.onOpen?.();
          },
          onClose: () => {
            console.log('🔌 [AppDev SSE Model] AppDev 连接已关闭');
            setAppDevConnectionState(SSEConnectionState.DISCONNECTED);
            config.onClose?.();
          },
        });

        appDevSseManagerRef.current = appDevSseManager;
        setAppDevCurrentSessionId(config.sessionId);

        // 建立连接
        await appDevSseManager.connect();

        console.log('✅ [AppDev SSE Model] AppDev SSE 连接初始化完成');
      } catch (error) {
        console.error('❌ [AppDev SSE Model] AppDev 初始化失败:', error);
        setAppDevConnectionState(SSEConnectionState.ERROR);
        setAppDevConnectionError(
          error instanceof Error ? error.message : 'AppDev 连接失败',
        );
        message.error('AppDev SSE 连接初始化失败');
      } finally {
        setIsAppDevConnecting(false);
      }
    },
    [],
  );

  /**
   * 断开 AppDev SSE 连接
   */
  const disconnectAppDevSSE = useCallback(() => {
    console.log('🔌 [AppDev SSE Model] 断开 AppDev SSE 连接');

    if (appDevSseManagerRef.current) {
      appDevSseManagerRef.current.destroy();
      appDevSseManagerRef.current = null;
    }

    setAppDevConnectionState(SSEConnectionState.DISCONNECTED);
    setAppDevCurrentSessionId('');
    setAppDevConnectionError(null);
  }, []);

  /**
   * 添加 AppDev SSE 事件监听器
   */
  const addAppDevSSEEventListener = useCallback(
    (
      eventType: SSEEventType,
      listener: (message: UnifiedSessionMessage) => void,
    ) => {
      if (appDevSseManagerRef.current) {
        appDevSseManagerRef.current.addEventListener(eventType, listener);
        console.log(
          `📝 [AppDev SSE Model] 添加 AppDev 事件监听器: ${eventType}`,
        );
      }
    },
    [],
  );

  /**
   * 移除 AppDev SSE 事件监听器
   */
  const removeAppDevSSEEventListener = useCallback(
    (
      eventType: SSEEventType,
      listener: (message: UnifiedSessionMessage) => void,
    ) => {
      if (appDevSseManagerRef.current) {
        appDevSseManagerRef.current.removeEventListener(eventType, listener);
        console.log(
          `🗑️ [AppDev SSE Model] 移除 AppDev 事件监听器: ${eventType}`,
        );
      }
    },
    [],
  );

  /**
   * 获取 AppDev 连接状态
   */
  const getAppDevConnectionState = useCallback(() => {
    return appDevConnectionState;
  }, [appDevConnectionState]);

  /**
   * 检查 AppDev 是否已连接
   */
  const isAppDevConnected = useCallback(() => {
    return appDevConnectionState === SSEConnectionState.CONNECTED;
  }, [appDevConnectionState]);

  /**
   * 获取 AppDev 当前会话 ID
   */
  const getAppDevCurrentSessionId = useCallback(() => {
    return appDevCurrentSessionId;
  }, [appDevCurrentSessionId]);

  /**
   * AppDev 重新连接
   */
  const reconnectAppDev = useCallback(
    async (config: SSEManagerConfig) => {
      console.log('🔄 [AppDev SSE Model] AppDev 重新连接');
      await initializeAppDevSSEConnection(config);
    },
    [initializeAppDevSSEConnection],
  );

  /**
   * 清理 AppDev 资源
   */
  const cleanupAppDev = useCallback(() => {
    console.log('🧹 [AppDev SSE Model] 清理 AppDev 资源');
    disconnectAppDevSSE();
  }, [disconnectAppDevSSE]);

  return {
    // AppDev 状态
    appDevConnectionState,
    isAppDevConnecting,
    appDevConnectionError,
    appDevCurrentSessionId,

    // AppDev 方法
    initializeAppDevSSEConnection,
    disconnectAppDevSSE,
    addAppDevSSEEventListener,
    removeAppDevSSEEventListener,
    getAppDevConnectionState,
    isAppDevConnected,
    getAppDevCurrentSessionId,
    reconnectAppDev,
    cleanupAppDev,
  };
};
