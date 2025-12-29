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
   * 连接到 VNC 服务器
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
}
