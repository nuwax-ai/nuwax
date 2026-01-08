/**
 * 全局日志管理器
 *
 * 仅在开发环境下输出调试日志，生产环境自动禁用
 *
 * 使用方式：
 * import { logger, createLogger } from '@/utils/logger';
 * logger.log('消息');           // 默认 [App] 前缀
 *
 * const myLogger = createLogger('[MyModule]');
 * myLogger.log('消息');         // 自定义前缀
 */

import { APP_VERSION } from '@/constants/version';

const isDev =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

// 可通过 localStorage 控制是否启用日志（即使在开发环境）
const isLogEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    const disabled = localStorage.getItem('disableLogger');
    if (disabled === 'true') return false;
  }
  if (!isDev) return false;
  return true;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
 * 创建带自定义前缀的 logger
 * @param prefix 日志前缀，如 '[V3]' 或 '[SaveService]'
 *
 * 使用 getter + bind 方式，确保浏览器控制台点击可以正确定位到调用位置
 */
export const createLogger = (prefix: string) => ({
  /**
   * 普通日志（仅开发环境）
   */
  get log() {
    return isLogEnabled() ? console.log.bind(console, prefix) : noop;
  },

  /**
   * 警告日志（始终输出）
   */
  get warn() {
    return console.warn.bind(console, prefix);
  },

  /**
   * 错误日志（始终输出）
   */
  get error() {
    return console.error.bind(console, prefix);
  },

  /**
   * 信息日志（仅开发环境）
   */
  get info() {
    return isLogEnabled() ? console.info.bind(console, prefix) : noop;
  },

  /**
   * 调试日志（仅开发环境）
   */
  get debug() {
    return isLogEnabled() ? console.debug.bind(console, prefix) : noop;
  },
});

// 默认 logger
export const logger = createLogger(`[App:${APP_VERSION}]`);

// V3 专属 logger
export const workflowLogger = createLogger(`[Workflow:V3:${APP_VERSION}]`);

// 开发环境下挂载到 window，方便调试
if (isDev && typeof window !== 'undefined') {
  (window as any).__xagi_logger = {
    enable: () => {
      localStorage.removeItem('disableLogger');
      console.log('日志已启用');
    },
    disable: () => {
      localStorage.setItem('disableLogger', 'true');
      console.log('日志已禁用');
    },
  };
}

export default logger;
