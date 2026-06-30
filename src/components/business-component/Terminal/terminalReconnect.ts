/** 终端 WebSocket 自动重连配置 */
export interface TerminalReconnectConfig {
  /** 是否启用自动重连 @default true */
  enabled?: boolean;
  /** 最大重连次数（不含首次连接） @default 5 */
  maxRetries?: number;
  /** 首次重连等待（ms），兼容旧字段 retryDelay */
  initialInterval?: number;
  retryDelay?: number;
  /** 重连间隔上限（ms） @default 30000 */
  maxInterval?: number;
  /** 指数退避乘数 @default 2 */
  multiplier?: number;
  /** 抖动比例 ±jitter，避免惊群 @default 0.2 */
  jitter?: number;
  /** 心跳检测间隔（ms），0 为禁用 @default 30000 */
  heartbeatInterval?: number;
  /** 心跳超时（ms） @default 90000 */
  heartbeatTimeout?: number;
}

export const DEFAULT_TERMINAL_RECONNECT: Required<
  Pick<
    TerminalReconnectConfig,
    | 'enabled'
    | 'maxRetries'
    | 'initialInterval'
    | 'maxInterval'
    | 'multiplier'
    | 'jitter'
    | 'heartbeatInterval'
    | 'heartbeatTimeout'
  >
> = {
  enabled: true,
  maxRetries: 5,
  initialInterval: 2000,
  maxInterval: 30000,
  multiplier: 2,
  jitter: 0.2,
  heartbeatInterval: 30000,
  heartbeatTimeout: 90000,
};

/**
 * 计算下一次重连间隔：指数退避 + 上限 + 抖动
 * @param attemptIndex 当前已失败次数（0 = 首次重连）
 */
export const getTerminalReconnectDelay = (
  attemptIndex: number,
  config?: TerminalReconnectConfig,
): number => {
  const initialInterval =
    config?.initialInterval ??
    config?.retryDelay ??
    DEFAULT_TERMINAL_RECONNECT.initialInterval;
  const maxInterval =
    config?.maxInterval ?? DEFAULT_TERMINAL_RECONNECT.maxInterval;
  const multiplier =
    config?.multiplier ?? DEFAULT_TERMINAL_RECONNECT.multiplier;
  const jitter = config?.jitter ?? DEFAULT_TERMINAL_RECONNECT.jitter;

  let delay = initialInterval * Math.pow(multiplier, attemptIndex);
  delay = Math.min(delay, maxInterval);

  const jitterAmount = delay * jitter;
  delay = delay + (Math.random() * 2 - 1) * jitterAmount;

  return Math.floor(Math.max(delay, initialInterval));
};

export const getTerminalMaxRetries = (
  config?: TerminalReconnectConfig,
): number => config?.maxRetries ?? DEFAULT_TERMINAL_RECONNECT.maxRetries;
