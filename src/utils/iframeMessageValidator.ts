/**
 * iframe postMessage 消息验证工具
 */

/**
 * 验证消息是否来自指定的 iframe
 * @param event MessageEvent 对象
 * @param iframe 目标 iframe 元素
 * @returns 是否为有效消息
 */
export const isValidIframeMessage = (
  event: MessageEvent,
  iframe: HTMLIFrameElement | null,
): boolean => {
  if (!iframe) return false;

  // 检查消息来源是否匹配 iframe 的 contentWindow
  const sourceMatched = !!(
    iframe.contentWindow && event.source === iframe.contentWindow
  );

  // 检查消息 origin 是否匹配 iframe 的 src origin
  const originMatched = (() => {
    try {
      if (!iframe.src) return false;
      return new URL(iframe.src).origin === event.origin;
    } catch {
      return false;
    }
  })();

  return sourceMatched || originMatched;
};

/**
 * 获取 iframe 的 target origin，用于安全的 postMessage
 * @param iframe 目标 iframe 元素
 * @returns target origin 或 '*' (fallback)
 */
export const getIframeTargetOrigin = (
  iframe: HTMLIFrameElement | null,
): string => {
  if (!iframe?.src) return '*';

  try {
    return new URL(iframe.src).origin;
  } catch {
    return '*';
  }
};

/**
 * 设计模式消息类型定义
 */
export interface DesignModeChangedMessage {
  type: 'DESIGN_MODE_CHANGED';
  enabled: boolean;
  requestId?: string;
  timestamp?: number;
}

export interface ToggleDesignModeMessage {
  type: 'TOGGLE_DESIGN_MODE';
  enabled: boolean;
  requestId: string;
  timestamp: number;
}

/**
 * 类型守卫：检查是否为 DESIGN_MODE_CHANGED 消息
 */
export const isDesignModeChangedMessage = (
  data: any,
): data is DesignModeChangedMessage => {
  return (
    data &&
    data.type === 'DESIGN_MODE_CHANGED' &&
    typeof data.enabled === 'boolean'
  );
};
