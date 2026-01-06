/**
 * 工作流日志管理器
 *
 * 仅在开发环境下输出调试日志，生产环境自动禁用
 *
 * 使用方式：
 * import { logger, createLogger } from '../utils/logger';
 * logger.log('消息');           // 默认 [V3] 前缀
 *
 * const myLogger = createLogger('[MyModule]');
 * myLogger.log('消息');         // 自定义前缀
 */

const isDev =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

// 可通过 localStorage 控制是否启用日志（即使在开发环境）
const isLogEnabled = (): boolean => {
  if (!isDev) return false;
  if (typeof window !== 'undefined') {
    const disabled = localStorage.getItem('disableLogger');
    if (disabled === 'true') return false;
  }
  return true;
};

/**
 * 创建带自定义前缀的 logger
 * @param prefix 日志前缀，如 '[V3]' 或 '[SaveService]'
 */
export const createLogger = (prefix: string) => ({
  /**
   * 普通日志（仅开发环境）
   */
  log: (...args: any[]): void => {
    if (isLogEnabled()) {
      console.log(prefix, ...args);
    }
  },

  /**
   * 警告日志（始终输出）
   */
  warn: (...args: any[]): void => {
    console.warn(prefix, ...args);
  },

  /**
   * 错误日志（始终输出）
   */
  error: (...args: any[]): void => {
    console.error(prefix, ...args);
  },

  /**
   * 信息日志（仅开发环境）
   */
  info: (...args: any[]): void => {
    if (isLogEnabled()) {
      console.info(prefix, ...args);
    }
  },

  /**
   * 调试日志（仅开发环境）
   */
  debug: (...args: any[]): void => {
    if (isLogEnabled()) {
      console.debug(prefix, ...args);
    }
  },
});

// 默认 logger（版本号前缀）
import { APP_VERSION } from '@/constants/version';
export const workflowLogger = createLogger(`[Workflow:V3:${APP_VERSION}]`);
export const logger = createLogger(`[${APP_VERSION}]`);

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
