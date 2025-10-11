/**
 * SSE连接管理器
 * 用于管理AI聊天服务的Server-Sent Events连接
 * 基于 @microsoft/fetch-event-source 实现
 */

import type {
  SSEEventType,
  UnifiedSessionMessage,
} from '@/types/interfaces/appDev';
import { createSSEConnection } from '@/utils/fetchEventSource';

/**
 * SSE事件监听器类型
 */
export type SSEEventListener = (message: UnifiedSessionMessage) => void;

/**
 * SSE连接状态枚举
 */
export enum SSEConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * SSE管理器配置
 */
export interface SSEManagerConfig {
  baseUrl: string;
  sessionId: string;
  onMessage?: SSEEventListener;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * SSE连接管理器类
 */
export class SSEManager {
  private abortController: AbortController | null = null;
  private config: SSEManagerConfig;
  private state: SSEConnectionState = SSEConnectionState.DISCONNECTED;

  // 事件监听器映射
  private listeners: Map<SSEEventType, SSEEventListener[]> = new Map();

  constructor(config: SSEManagerConfig) {
    this.config = config;

    console.log('🏗️ [SSE] 创建 SSE 管理器，配置:', {
      baseUrl: this.config.baseUrl,
      sessionId: this.config.sessionId,
    });

    // 初始化事件监听器映射
    this.initializeListeners();
  }

  /**
   * 初始化事件监听器映射
   */
  private initializeListeners(): void {
    const eventTypes: SSEEventType[] = [
      'prompt_start',
      'prompt_end',
      'user_message_chunk',
      'agent_message_chunk',
      'agent_thought_chunk',
      'tool_call',
      'tool_call_update',
      'available_commands_update',
      'heartbeat',
    ];

    eventTypes.forEach((eventType) => {
      this.listeners.set(eventType, []);
    });
  }

  /**
   * 添加事件监听器
   */
  public addEventListener(
    eventType: SSEEventType,
    listener: SSEEventListener,
  ): void {
    const currentListeners = this.listeners.get(eventType) || [];
    currentListeners.push(listener);
    this.listeners.set(eventType, currentListeners);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(
    eventType: SSEEventType,
    listener: SSEEventListener,
  ): void {
    const currentListeners = this.listeners.get(eventType) || [];
    const index = currentListeners.indexOf(listener);
    if (index > -1) {
      currentListeners.splice(index, 1);
      this.listeners.set(eventType, currentListeners);
    }
  }

  /**
   * 触发事件监听器
   */
  private triggerListeners(
    eventType: SSEEventType,
    message: UnifiedSessionMessage,
  ): void {
    const listeners = this.listeners.get(eventType) || [];
    listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {
        console.error(`SSE事件监听器错误 [${eventType}]:`, error);
      }
    });

    // 同时触发通用监听器
    if (this.config.onMessage) {
      try {
        this.config.onMessage(message);
      } catch (error) {
        console.error('SSE通用事件监听器错误:', error);
      }
    }
  }

  /**
   * 处理SSE消息
   */
  private handleMessage = (data: UnifiedSessionMessage): void => {
    try {
      console.log(`📨 [SSE] 收到消息 [${data.subType}]:`, data);

      // 触发对应的监听器
      this.triggerListeners(data.subType as SSEEventType, data);

      // 特殊处理某些事件类型
      this.handleSpecialEvents(data);
    } catch (error) {
      console.error('SSE消息处理失败:', error);
    }
  };

  /**
   * 处理特殊事件
   */
  private handleSpecialEvents(message: UnifiedSessionMessage): void {
    switch (message.messageType) {
      case 'sessionPromptEnd':
        console.log('🏁 [SSE] 会话结束:', message.data);
        break;
      case 'heartbeat':
        console.log('💓 [SSE] 收到心跳消息');
        break;
    }
  }

  /**
   * 连接SSE - 基于 @microsoft/fetch-event-source
   */
  public async connect(): Promise<void> {
    if (this.state === SSEConnectionState.CONNECTED) {
      console.log('🔌 [SSE] 连接已存在，跳过连接');
      return;
    }

    if (this.state === SSEConnectionState.CONNECTING) {
      console.log('🔌 [SSE] 正在连接中，跳过连接');
      return;
    }

    const sseUrl = `${process.env.BASE_URL}/api/custom-page/ai-session-sse?session_id=${this.config.sessionId}`;
    console.log(`🔌 [SSE] 连接到: ${sseUrl}`);
    this.state = SSEConnectionState.CONNECTING;

    try {
      // 创建 AbortController 用于控制连接
      this.abortController = new AbortController();

      // 使用 createSSEConnection 建立连接
      const abortFunction = await createSSEConnection({
        url: sseUrl,
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        abortController: this.abortController,
        onOpen: () => {
          console.log('🔌 [SSE] 连接已建立');
          this.state = SSEConnectionState.CONNECTED;
          this.config.onOpen?.();
        },
        onMessage: (data: UnifiedSessionMessage) => {
          this.handleMessage(data);
        },
        onError: (error) => {
          console.error('❌ [SSE] 连接错误:', error);
          this.state = SSEConnectionState.ERROR;
          this.config.onError?.(error as any);
        },
        onClose: () => {
          console.log('🔌 [SSE] 连接已关闭');
          this.state = SSEConnectionState.DISCONNECTED;
          this.config.onClose?.();
        },
      });

      // 保存 abort 函数供后续使用
      this.abortController = {
        ...this.abortController,
        abort: abortFunction,
      } as any;
    } catch (error) {
      console.error('❌ [SSE] 连接创建失败:', error);
      this.state = SSEConnectionState.ERROR;
    }
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    console.log('🔌 [SSE] 主动断开连接');

    if (this.abortController) {
      // 调用 abort 函数来断开连接
      if (typeof this.abortController.abort === 'function') {
        this.abortController.abort();
      }
      this.abortController = null;
    }

    this.state = SSEConnectionState.DISCONNECTED;
  }

  /**
   * 获取连接状态
   */
  public getState(): SSEConnectionState {
    return this.state;
  }

  /**
   * 获取会话ID
   */
  public getSessionId(): string {
    return this.config.sessionId;
  }

  /**
   * 检查是否已连接
   */
  public isConnected(): boolean {
    return this.state === SSEConnectionState.CONNECTED;
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.disconnect();
    this.listeners.clear();
  }
}

/**
 * 创建SSE管理器的工厂函数
 */
export function createSSEManager(config: SSEManagerConfig): SSEManager {
  return new SSEManager(config);
}
