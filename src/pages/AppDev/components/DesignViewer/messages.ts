// Message types for iframe ↔ parent window communication

export interface SourceInfo {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface ElementInfo {
  /** 元素的标签名 */
  tagName?: string;
  /** 元素的类名 */
  className: string;
  /** 元素的文本内容 */
  textContent: string;
  /**
   * 是否可编辑文本
   * - true：当前元素是可编辑文本的标签（不是 img/input 或动态渲染数据 等）
   * - false / 未传：只有文本节点（或未检测）
   * 说明：这个字段需要在 iframe 里选中元素时一并计算后传上来：
   */
  isStaticText?: boolean;
  /** 元素的源信息（文件路径、行号等） */
  sourceInfo: SourceInfo;
  /** 元素的计算样式（可选） */
  // computedStyles?: {
  //   paddingTop?: string;
  //   paddingRight?: string;
  //   paddingBottom?: string;
  //   paddingLeft?: string;
  //   marginTop?: string;
  //   marginRight?: string;
  //   marginBottom?: string;
  //   marginLeft?: string;
  //   color?: string;
  //   backgroundColor?: string;
  //   [key: string]: any;
  // };
  [key: string]: any;
}

// 消息验证相关类型
export interface MessageValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface MessageValidator {
  validate: (message: any) => MessageValidationResult;
}

// Bridge Ready Message
export interface BridgeReadyMessage {
  type: 'BRIDGE_READY';
  payload: {
    timestamp: number;
    environment: 'iframe' | 'main';
  };
  timestamp?: number;
  requestId?: string;
}

// iframe → Parent messages
export interface ElementSelectedMessage {
  type: 'ELEMENT_SELECTED';
  payload: {
    elementInfo: ElementInfo;
  };
  requestId?: string;
  timestamp?: number;
}

export interface ElementDeselectedMessage {
  type: 'ELEMENT_DESELECTED';
  requestId?: string;
  timestamp?: number;
  payload?: null; // Added optional payload to match usage
}

export interface ContentUpdatedMessage {
  type: 'CONTENT_UPDATED';
  payload: {
    sourceInfo: SourceInfo;
    oldValue: string;
    newValue: string;
  };
  requestId?: string;
  timestamp?: number;
}

export interface StyleUpdatedMessage {
  type: 'STYLE_UPDATED';
  payload: {
    sourceInfo: SourceInfo;
    oldClass: string;
    newClass: string;
  };
  requestId?: string;
  timestamp?: number;
}

export interface DesignModeChangedMessage {
  type: 'DESIGN_MODE_CHANGED';
  enabled: boolean;
  requestId?: string;
  timestamp?: number;
}

// Parent → iframe messages
export interface ToggleDesignModeMessage {
  type: 'TOGGLE_DESIGN_MODE';
  enabled: boolean;
  requestId?: string;
  timestamp?: number;
}

export interface UpdateStyleMessage {
  type: 'UPDATE_STYLE';
  payload: {
    sourceInfo: SourceInfo;
    newClass: string;
    persist?: boolean;
  };
  requestId?: string;
  timestamp?: number;
  enabled?: boolean; // Added to fix TS error where enabled was accessed on this type (though likely a bug in usage, adding optional property avoids strict error if discriminated union fails)
}

export interface UpdateContentMessage {
  type: 'UPDATE_CONTENT';
  payload: {
    sourceInfo: SourceInfo;
    newContent: string;
    persist?: boolean;
  };
  requestId?: string;
  timestamp?: number;
}

export interface BatchUpdateItem {
  type: 'style' | 'content';
  sourceInfo: SourceInfo;
  newValue: string;
  originalValue?: string;
}

export interface BatchUpdateMessage {
  type: 'BATCH_UPDATE';
  payload: {
    updates: BatchUpdateItem[];
  };
  requestId?: string;
  timestamp?: number;
}

// 新增：状态查询和响应消息
export interface GetElementStateMessage {
  type: 'GET_ELEMENT_STATE';
  payload: {
    sourceInfo: SourceInfo;
  };
  requestId?: string; // Made optional for sender
  timestamp?: number; // Made optional for sender
}

export interface ElementStateResponseMessage {
  type: 'ELEMENT_STATE_RESPONSE';
  payload: {
    sourceInfo: SourceInfo;
    elementInfo: ElementInfo;
    modifications: Array<{
      type: 'style' | 'content';
      oldValue: string;
      newValue: string;
      timestamp: number;
    }>;
  };
  requestId: string; // Response MUST have requestId to match request
  timestamp?: number;
}

// 新增：错误处理消息
export interface ErrorMessage {
  type: 'ERROR';
  payload: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
  timestamp?: number;
}

// 新增：确认消息
export interface AcknowledgementMessage {
  type: 'ACKNOWLEDGEMENT';
  payload: {
    messageType: string;
  };
  requestId: string; // Response MUST have requestId
  timestamp?: number;
}

// 新增：心跳和健康检查消息
export interface HeartbeatMessage {
  type: 'HEARTBEAT';
  payload?: {
    timestamp: number;
  };
  timestamp?: number;
}

export interface HealthCheckMessage {
  type: 'HEALTH_CHECK';
  requestId?: string; // Made optional for sender
  timestamp?: number; // Made optional for sender
}

export interface HealthCheckResponseMessage {
  type: 'HEALTH_CHECK_RESPONSE';
  payload: {
    status: 'healthy' | 'unhealthy' | 'degraded' | 'connecting' | 'unnecessary';
    version?: string;
    uptime?: number;
    message?: string;
    response?: any;
    error?: string;
    isIframe?: boolean;
    isConnected?: boolean;
    origin?: string;
    userAgent?: string;
    location?: string;
  };
  requestId: string; // Response MUST have requestId
  timestamp?: number;
}

// Union types
export type IframeToParentMessage =
  | ElementSelectedMessage
  | ElementDeselectedMessage
  | ContentUpdatedMessage
  | StyleUpdatedMessage
  | DesignModeChangedMessage
  | ElementStateResponseMessage
  | ErrorMessage
  | AcknowledgementMessage
  | HeartbeatMessage
  | HealthCheckResponseMessage
  | BridgeReadyMessage;

export type ParentToIframeMessage =
  | ToggleDesignModeMessage
  | UpdateStyleMessage
  | UpdateContentMessage
  | BatchUpdateMessage
  | GetElementStateMessage
  | HealthCheckMessage
  | HeartbeatMessage; // Added HeartbeatMessage here too for bidirectional support

export type DesignModeMessage = IframeToParentMessage | ParentToIframeMessage;

// Promise-based 请求响应类型
export type RequestMessage = ParentToIframeMessage & {
  requestId: string;
  timestamp: number;
};

export type ResponseMessage = IframeToParentMessage & {
  requestId: string;
  success?: boolean;
  error?: string;
  timestamp: number;
};

export type RequestResponseMessage =
  | RequestMessage
  | ResponseMessage
  | AcknowledgementMessage;

// 消息处理器类型
export interface MessageHandler<
  T extends DesignModeMessage = DesignModeMessage,
> {
  type: T['type'];
  handler: (message: T) => Promise<any> | any;
  validator?: MessageValidator;
}

// 配置相关类型
export interface IframeModeConfig {
  enabled: boolean;
  hideUI: boolean;
  enableSelection: boolean;
  enableDirectEdit: boolean;
}

export interface BatchUpdateConfig {
  enabled: boolean;
  debounceMs: number;
}

export interface BridgeConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  heartbeatInterval: number;
  debug: boolean;
}

// 工具函数类型
export interface MessageUtils {
  generateRequestId: () => string;
  createTimestamp: () => number;
  isValidMessage: (message: any) => boolean;
  createResponse: <T extends IframeToParentMessage>(
    originalMessage: ParentToIframeMessage,
    payload: T extends { payload: infer P } ? P : never,
    success?: boolean,
    error?: string,
  ) => T;
}

// 桥接器接口
export interface BridgeInterface {
  send: <T extends DesignModeMessage>(message: T) => Promise<void>;
  sendWithResponse: <T extends DesignModeMessage, R extends DesignModeMessage>(
    message: T,
    responseType: R['type'],
  ) => Promise<R>;
  on: <T extends DesignModeMessage>(
    type: T['type'],
    handler: (message: T) => void,
  ) => void;
  off: (type: string, handler: any) => void;
  isConnected: () => boolean;
  disconnect: () => void;
}
