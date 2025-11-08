/**
 * 开发模式日志工具
 * 仅在开发模式下输出日志，生产环境自动禁用
 */

/**
 * 判断是否为开发模式
 */
const isDevelopment = () => process.env.NODE_ENV === 'development';

/**
 * 开发模式日志输出接口
 */
interface DevLogger {
  /**
   * 输出信息日志
   * @param message 日志消息
   * @param args 额外参数
   */
  info: (message: string, ...args: any[]) => void;

  /**
   * 输出警告日志
   * @param message 日志消息
   * @param args 额外参数
   */
  warn: (message: string, ...args: any[]) => void;

  /**
   * 输出错误日志
   * @param message 日志消息
   * @param args 额外参数
   */
  error: (message: string, ...args: any[]) => void;

  /**
   * 创建性能标记
   * @param markName 标记名称
   */
  mark: (markName: string) => void;

  /**
   * 创建性能测量
   * @param measureName 测量名称
   * @param startMark 开始标记名称
   * @param endMark 结束标记名称
   */
  measure: (measureName: string, startMark: string, endMark: string) => void;

  /**
   * 获取性能测量结果
   * @param measureName 测量名称
   * @returns 测量结果（秒）
   */
  getMeasureDuration: (measureName: string) => number | null;

  /**
   * 清除所有性能标记和测量
   */
  clearPerformance: () => void;
}

/**
 * 创建开发模式日志工具实例
 * @param prefix 日志前缀（可选）
 * @returns 日志工具实例
 */
export const createDevLogger = (prefix?: string): DevLogger => {
  const formatMessage = (message: string): string => {
    return prefix ? `[${prefix}] ${message}` : message;
  };

  return {
    info: (message: string, ...args: any[]) => {
      if (isDevelopment()) {
        // eslint-disable-next-line no-console
        console.info(formatMessage(message), ...args);
      }
    },

    warn: (message: string, ...args: any[]) => {
      if (isDevelopment()) {
        // eslint-disable-next-line no-console
        console.warn(formatMessage(message), ...args);
      }
    },

    error: (message: string, ...args: any[]) => {
      if (isDevelopment()) {
        // eslint-disable-next-line no-console
        console.error(formatMessage(message), ...args);
      }
    },

    mark: (markName: string) => {
      if (isDevelopment()) {
        performance.mark(formatMessage(markName));
      }
    },

    measure: (measureName: string, startMark: string, endMark: string) => {
      if (isDevelopment()) {
        try {
          performance.measure(
            formatMessage(measureName),
            formatMessage(startMark),
            formatMessage(endMark),
          );
        } catch (error) {
          // 如果标记不存在，忽略错误
        }
      }
    },

    getMeasureDuration: (measureName: string): number | null => {
      if (!isDevelopment()) {
        return null;
      }

      try {
        const measures = performance.getEntriesByType('measure');
        const measure = measures.find(
          (entry) => entry.name === formatMessage(measureName),
        );
        return measure ? measure.duration / 1000 : null;
      } catch {
        return null;
      }
    },

    clearPerformance: () => {
      if (isDevelopment()) {
        performance.clearMarks();
        performance.clearMeasures();
      }
    },
  };
};

/**
 * 默认开发模式日志工具（无前缀）
 */
export const devLogger = createDevLogger();
