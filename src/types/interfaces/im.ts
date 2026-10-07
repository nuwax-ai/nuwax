/** window.__im 的宿主消费协议；来源为消息前端 DEV-327 监听桥。 */
export interface ImCustomEvent {
  eventId: string;
  eventType: string;
  payload?: Record<string, unknown> | null;
  ts?: number | null;
}

export type ImConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'closed'
  | 'rejected';

export interface ImMessageEvent {
  convId: string;
  convType: number | null;
  convName: string | null;
  msgId: string;
  seq: number | null;
  senderId: string | null;
  senderType: number | null;
  senderName: string | null;
  senderAvatar: string | null;
  msgType: string | null;
  digest: string | null;
  sendTime: number | null;
  selfSent: boolean;
  mentionedMe: boolean;
}

export interface ImUnreadEvent {
  total: number;
}

/** 商业壳独立接收器的展示快照，不含会话内容或凭据。 */
export interface HostImUnreadSnapshot {
  sessionGeneration: number;
  revision: number;
  total: number;
  dndTotal: number;
}

export interface ImBridgeSnapshot {
  connState: ImConnectionState;
  connected: boolean;
  unreadTotal: number;
  userId: string | null;
}

/** 老版本或未初始化时可能缺少接口，消费方按方法是否存在接入。 */
export interface ImWindowBridge {
  onCustomEvent?: (callback: (event: ImCustomEvent) => void) => () => void;
  offCustomEvent?: (callback: (event: ImCustomEvent) => void) => void;
  customEventSubscriberCount?: () => number;
  onMessage?: (callback: (event: ImMessageEvent) => void) => () => void;
  offMessage?: (callback: (event: ImMessageEvent) => void) => void;
  onUnreadChange?: (callback: (event: ImUnreadEvent) => void) => () => void;
  offUnreadChange?: (callback: (event: ImUnreadEvent) => void) => void;
  onConnectionChange?: (
    callback: (state: ImConnectionState) => void,
  ) => () => void;
  offConnectionChange?: (callback: (state: ImConnectionState) => void) => void;
  getSnapshot?: () => ImBridgeSnapshot;
  subscriberCounts?: () => {
    message: number;
    unread: number;
    connection: number;
  };
  [key: string]: unknown;
}
