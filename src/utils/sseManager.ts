/**
 * SSE连接管理器
 * 用于管理AI聊天服务的Server-Sent Events连接
 */

import type {
  SSEEventType,
  UnifiedSessionMessage,
} from '@/types/interfaces/appDev';

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
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * SSE连接管理器类
 */
export class SSEManager {
  private eventSource: EventSource | null = null;
  private config: SSEManagerConfig;
  private state: SSEConnectionState = SSEConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatTime = Date.now();

  // 事件监听器映射
  private listeners: Map<SSEEventType, SSEEventListener[]> = new Map();

  constructor(config: SSEManagerConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...config,
    };

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
   * 解析SSE消息数据
   */
  private parseMessageData(data: string): UnifiedSessionMessage {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('SSE消息解析失败:', error);
      throw new Error('Invalid SSE message format');
    }
  }

  /**
   * 处理SSE消息
   */
  private handleMessage = (event: MessageEvent): void => {
    try {
      const message = this.parseMessageData(event.data);
      console.log(`📨 [SSE] 收到消息 [${message.subType}]:`, message);

      // 更新心跳时间
      if (message.subType === 'heartbeat') {
        this.lastHeartbeatTime = Date.now();
      }

      // 触发对应的监听器
      this.triggerListeners(message.subType as SSEEventType, message);

      // 特殊处理某些事件类型
      this.handleSpecialEvents(message);
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
        // 心跳消息已经在handleMessage中处理
        break;
    }
  }

  /**
   * 处理连接打开
   */
  private handleOpen = (): void => {
    console.log('🔌 [SSE] 连接已建立');
    this.state = SSEConnectionState.CONNECTED;
    this.reconnectAttempts = 0;

    // 启动心跳检测
    this.startHeartbeatCheck();

    if (this.config.onOpen) {
      this.config.onOpen();
    }
  };

  /**
   * 处理连接错误
   */
  private handleError = (error: Event): void => {
    console.error('❌ [SSE] 连接错误:', error);
    this.state = SSEConnectionState.ERROR;

    if (this.config.onError) {
      this.config.onError(error);
    }

    // 尝试重连
    this.attemptReconnect();
  };

  /**
   * 处理连接关闭
   */
  private handleClose = (): void => {
    console.log('🔌 [SSE] 连接已关闭');
    this.state = SSEConnectionState.DISCONNECTED;

    // 清理心跳检测
    this.stopHeartbeatCheck();

    if (this.config.onClose) {
      this.config.onClose();
    }

    // 如果不是主动关闭，尝试重连
    if (this.reconnectAttempts < this.config.maxReconnectAttempts!) {
      this.attemptReconnect();
    }
  };

  /**
   * 启动心跳检测
   */
  private startHeartbeatCheck(): void {
    this.stopHeartbeatCheck();
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - this.lastHeartbeatTime;

      // 如果超过30秒没有收到心跳，认为连接断开
      if (timeSinceLastHeartbeat > 30000) {
        console.warn('💔 [SSE] 心跳超时，连接可能已断开');
        this.disconnect();
        this.attemptReconnect();
      }
    }, 10000); // 每10秒检查一次
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeatCheck(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('🔌 [SSE] 已达到最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 [SSE] 尝试重连 (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
    );

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * 连接SSE
   */
  public connect(): void {
    if (this.state === SSEConnectionState.CONNECTED) {
      console.log('🔌 [SSE] 连接已存在，跳过连接');
      return;
    }

    if (this.state === SSEConnectionState.CONNECTING) {
      console.log('🔌 [SSE] 正在连接中，跳过连接');
      return;
    }

    console.log(
      `🔌 [SSE] 连接到: ${this.config.baseUrl}/agent/progress/${this.config.sessionId}`,
    );
    this.state = SSEConnectionState.CONNECTING;

    try {
      this.eventSource = new EventSource(
        `${this.config.baseUrl}/agent/progress/${this.config.sessionId}`,
      );

      // 绑定事件处理器
      this.eventSource.onmessage = this.handleMessage;
      this.eventSource.onopen = this.handleOpen;
      this.eventSource.onerror = this.handleError;

      // 监听特定事件类型
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
        this.eventSource!.addEventListener(eventType, this.handleMessage);
      });
    } catch (error) {
      console.error('❌ [SSE] 连接创建失败:', error);
      this.state = SSEConnectionState.ERROR;
      this.attemptReconnect();
    }
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    console.log('🔌 [SSE] 主动断开连接');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeatCheck();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.state = SSEConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
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
