/**
 * 空闲检测配置
 */
export interface IdleDetectionConfig {
  /**
   * 是否启用空闲检测
   * @default false
   */
  enabled?: boolean;
  /**
   * 空闲超时时间（毫秒）
   * @default 3600000 (60分钟)
   */
  idleTimeoutMs?: number;
  /**
   * 警告弹窗倒计时秒数
   * @default 15
   */
  countdownSeconds?: number;
  /**
   * 空闲超时后的回调（关闭连接前触发）
   */
  onIdleTimeout?: () => void;
  /**
   * 用户取消空闲警告后的回调
   */
  onIdleCancel?: () => void;
}

export interface VncPreviewProps {
  /**
   * RCoder service base URL
   * e.g., "http://rcoder-service.example.com"
   */
  serviceUrl?: string;
  /**
   * Container ID or Session ID
   */
  cId: string;
  /**
   * Whether to enable view-only mode
   * @default false
   */
  readOnly?: boolean;
  /**
   * Whether to auto-connect on mount
   * @default false
   */
  autoConnect?: boolean;
  /**
   * Custom styles for the container
   */
  style?: React.CSSProperties;
  /**
   * Custom class name for the container
   */
  className?: string;
  /**
   * @deprecated User ID is no longer needed for the URL
   */
  userId?: string;
  /**
   * 空闲检测配置
   * 用于在用户长时间无操作时自动断开连接
   */
  idleDetection?: IdleDetectionConfig;
  /**
   * 重连前回调（由父级注入）
   * 应在真正建立 VNC 连接前，确保容器已启动、保活轮询已恢复。
   * 典型实现：调用 openDesktopView（内部会 apiEnsurePod + runKeepalivePodPolling）。
   * 未传入时，重试按钮仅执行本地 connect（兼容旧用法）。
   */
  onReconnect?: () => Promise<void> | void;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

/**
 * VncPreview 组件暴露的方法接口
 */
export interface VncPreviewRef {
  /**
   * 连接到智能体电脑
   */
  connect: () => void;
  /**
   * 完整重连：先触发 onReconnect（恢复容器与保活），再 connect
   * 无 onReconnect 时等同于 connect
   */
  reconnect: () => Promise<void>;
  /**
   * 断开 VNC 连接
   */
  disconnect: () => void;
  /**
   * 渲染状态标签
   * @returns React.ReactElement | null
   */
  renderStatusTag: () => React.ReactElement | null;
  /**
   * 获取当前连接状态
   */
  getStatus: () => ConnectionStatus;
  /**
   * 重置空闲计时器（手动触发）
   */
  resetIdleTimer?: () => void;
}
