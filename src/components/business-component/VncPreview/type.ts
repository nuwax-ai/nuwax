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
   * 用户ID（用于音频/输入法WebSocket连接）
   */
  userId?: string;

  /**
   * 项目ID（用于音频/输入法WebSocket连接，默认使用cId）
   */
  projectId?: string;

  // ============ 音频和输入法功能 ============

  /**
   * 是否启用音频流功能
   * 启用后会自动连接音频WebSocket并播放远程桌面的声音
   * @default true
   */
  enableAudio?: boolean;

  /**
   * 是否启用输入法透传功能
   * 启用后可在本地使用中文输入法，文本会自动发送到远程桌面
   * @default true
   */
  enableIme?: boolean;

  /**
   * 初始音量 (0-1)
   * @default 0.8
   */
  initialVolume?: number;
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
}
