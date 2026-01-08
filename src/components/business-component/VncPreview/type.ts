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
