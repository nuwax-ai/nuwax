import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { UnifiedSessionMessage } from '@/types/interfaces/appDev';
import { createSSEConnection } from '@/utils/fetchEventSource';
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
    async (config: AppDevSSEManagerConfig) => {
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
        const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

        // 创建 AbortController 用于控制连接
        const abortController = new AbortController();

        // 构建 SSE URL
        const sseUrl = `${process.env.BASE_URL}/api/custom-page/ai-session-sse?session_id=${config.sessionId}`;
        console.log(`🔌 [AppDev SSE Model] 连接到: ${sseUrl}`);

        // 使用 createSSEConnection 建立连接
        const abortFunction = await createSSEConnection({
          url: sseUrl,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json, text/plain, */* ',
          },
          abortController,
          onOpen: () => {
            console.log('✅ [AppDev SSE Model] AppDev 连接已建立');
            setAppDevConnectionState(SSEConnectionState.CONNECTED);
            setAppDevConnectionError(null);
            config.onOpen?.();
          },
          onMessage: (data: UnifiedSessionMessage) => {
            console.log('📨 [AppDev SSE Model] 收到 AppDev 消息:', data);
            config.onMessage?.(data);
          },
          onError: (error) => {
            console.error('❌ [AppDev SSE Model] AppDev 连接错误:', error);
            setAppDevConnectionState(SSEConnectionState.ERROR);
            setAppDevConnectionError('AppDev SSE 连接错误');
            config.onError?.(error as any);
          },
          onClose: () => {
            console.log('🔌 [AppDev SSE Model] AppDev 连接已关闭');
            setAppDevConnectionState(SSEConnectionState.DISCONNECTED);
            config.onClose?.();
          },
        });

        // 保存 abort 函数供后续使用
        appDevSseManagerRef.current = abortFunction;
        setAppDevCurrentSessionId(config.sessionId);

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
    console.log('🔌 [AppDev SSE Model] 开始断开 AppDev SSE 连接');
    console.log('🔌 [AppDev SSE Model] 当前连接状态:', appDevConnectionState);
    console.log('🔌 [AppDev SSE Model] 当前会话ID:', appDevCurrentSessionId);

    if (appDevSseManagerRef.current) {
      console.log('🔌 [AppDev SSE Model] 调用 abort 函数断开连接');
      // 调用 abort 函数来断开连接
      if (typeof appDevSseManagerRef.current === 'function') {
        try {
          appDevSseManagerRef.current();
          console.log('✅ [AppDev SSE Model] abort 函数调用成功');
        } catch (error) {
          console.error('❌ [AppDev SSE Model] abort 函数调用失败:', error);
        }
      } else {
        console.warn(
          '⚠️ [AppDev SSE Model] appDevSseManagerRef.current 不是函数',
        );
      }
      appDevSseManagerRef.current = null;
    } else {
      console.log('ℹ️ [AppDev SSE Model] 没有活动的 SSE 连接需要断开');
    }

    setAppDevConnectionState(SSEConnectionState.DISCONNECTED);
    setAppDevCurrentSessionId('');
    setAppDevConnectionError(null);

    console.log('✅ [AppDev SSE Model] SSE 连接断开完成');
  }, [appDevConnectionState, appDevCurrentSessionId]);

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
    async (config: AppDevSSEManagerConfig) => {
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
    getAppDevConnectionState,
    isAppDevConnected,
    getAppDevCurrentSessionId,
    reconnectAppDev,
    cleanupAppDev,
  };
};
