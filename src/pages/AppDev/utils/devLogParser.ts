/**
 * 开发服务器日志解析工具
 * 用于解析、识别和格式化开发服务器日志
 */

import { LogLevel, type DevLogEntry } from '@/types/interfaces/appDev';
import dayjs from 'dayjs';

/**
 * 解析单行日志，识别日志级别和错误状态
 * @param line 日志行内容
 * @returns 解析结果
 */
export const parseLogLine = (
  line: string,
): { level: LogLevel; isError: boolean } => {
  // 错误关键词匹配模式
  const errorPatterns = [
    /ERROR/i,
    /FATAL/i,
    /Exception/i,
    /Failed/i,
    /Internal server error/i,
    /Module not found/i,
    /Can't resolve/i,
    /ELIFECYCLE/i,
    /npm ERR!/i,
    /PostCSS Error/i,
    /SyntaxError/i,
    /ReferenceError/i,
    /TypeError/i,
  ];

  const isError = errorPatterns.some((pattern) => pattern.test(line));

  if (isError) {
    return { level: LogLevel.ERROR, isError: true };
  }

  // 警告关键词匹配
  if (/WARN/i.test(line) || /Warning/i.test(line)) {
    return { level: LogLevel.WARN, isError: false };
  }

  // 信息关键词匹配
  if (/ready in|Network:|Local:|VITE|➜/i.test(line)) {
    return { level: LogLevel.INFO, isError: false };
  }

  // 默认为普通日志
  return { level: LogLevel.NORMAL, isError: false };
};

/**
 * 提取日志中的时间戳
 * @param line 日志行内容
 * @returns 时间戳字符串或undefined
 */
export const extractTimestamp = (line: string): string | undefined => {
  // 匹配格式: [2025/10/20 09:52:57]
  const timestampMatch = line.match(
    /\[(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\]/,
  );
  return timestampMatch?.[1];
};

/**
 * 判断是否为错误日志
 * @param log 日志条目
 * @returns 是否为错误
 */
export const isErrorLog = (log: DevLogEntry): boolean => {
  return log.isError === true || log.level === LogLevel.ERROR;
};

/**
 * 提取错误堆栈信息
 * @param logs 日志数组
 * @param errorIndex 错误日志的索引
 * @returns 错误堆栈相关的日志条目
 */
export const extractErrorStack = (
  logs: DevLogEntry[],
  errorIndex: number,
): DevLogEntry[] => {
  const errorStack: DevLogEntry[] = [];
  const errorLog = logs[errorIndex];

  if (!errorLog || !isErrorLog(errorLog)) {
    return errorStack;
  }

  // 添加错误日志本身
  errorStack.push(errorLog);

  // 查找后续的堆栈信息（通常以空格开头）
  for (let i = errorIndex + 1; i < logs.length; i++) {
    const log = logs[i];

    // 如果遇到新的时间戳行，说明堆栈结束
    if (log.timestamp && log.timestamp !== errorLog.timestamp) {
      break;
    }

    // 如果行内容以空格开头，通常是堆栈信息
    if (log.content.startsWith('    ') || log.content.startsWith('\t')) {
      errorStack.push(log);
    } else {
      // 如果不是堆栈格式，停止收集
      break;
    }
  }

  return errorStack;
};

/**
 * 格式化错误信息供Agent分析
 * @param logs 日志数组
 * @param errorIndex 错误日志的索引
 * @returns 格式化后的错误信息
 */
export const formatErrorForAgent = (
  logs: DevLogEntry[],
  errorIndex: number,
): string => {
  const errorLog = logs[errorIndex];

  if (!errorLog || !isErrorLog(errorLog)) {
    return '';
  }

  // 获取错误上下文（前后25行）
  const start = Math.max(0, errorIndex - 25);
  const end = Math.min(logs.length, errorIndex + 25);
  const context = logs.slice(start, end);

  // 提取错误堆栈
  const errorStack = extractErrorStack(logs, errorIndex);

  // 构建错误报告
  let errorReport = `🚨 检测到开发服务器错误，相关日志如下：\n\n`;

  // 添加错误摘要
  errorReport += `**错误摘要：**\n`;
  errorReport += `- 错误行号: ${errorLog.line}\n`;
  errorReport += `- 时间: ${errorLog.timestamp || '未知'}\n`;
  errorReport += `- 错误内容: ${errorLog.content}\n\n`;

  // 添加错误堆栈（如果有）
  if (errorStack.length > 1) {
    errorReport += `**错误堆栈：**\n`;
    errorStack.forEach((stackLog) => {
      errorReport += `${stackLog.line}| ${stackLog.content}\n`;
    });
    errorReport += `\n`;
  }

  // 添加上下文日志
  errorReport += `**上下文日志（最近50行）：**\n`;
  context.forEach((log) => {
    const prefix = isErrorLog(log)
      ? '❌'
      : log.level === LogLevel.WARN
      ? '⚠️'
      : 'ℹ️';
    errorReport += `${prefix} ${log.line}| ${log.content}\n`;
  });

  errorReport += `\n请分析上述错误并提供修复建议。`;

  return errorReport;
};

/**
 * 生成错误指纹（用于去重）
 * @param log 日志条目
 * @returns 错误指纹字符串
 */
export const generateErrorFingerprint = (log: DevLogEntry): string => {
  if (!isErrorLog(log)) {
    return '';
  }

  // 提取文件路径（如果有）
  const fileMatch = log.content.match(/File:\s+(.+?)(?:\s|$)/);
  const file = fileMatch?.[1] || '';

  // 提取错误类型
  const errorTypeMatch = log.content.match(
    /(ERROR|FATAL|Exception|Failed|Internal server error|Module not found|Can't resolve|ELIFECYCLE|PostCSS Error|SyntaxError|ReferenceError|TypeError)/i,
  );
  const errorType = errorTypeMatch?.[1] || 'UNKNOWN';

  // 提取关键错误信息（前100字符）
  const keyContent = log.content.substring(0, 100).replace(/\s+/g, ' ').trim();

  // 生成指纹：文件路径 + 错误类型 + 关键内容
  return `${file}-${errorType}-${keyContent}`;
};

/**
 * 解析日志内容，生成完整的日志条目
 * @param rawLine 原始日志行
 * @param lineNumber 行号
 * @returns 解析后的日志条目
 */
export const parseLogEntry = (
  rawLine: string,
  lineNumber: number,
): DevLogEntry => {
  const timestamp = extractTimestamp(rawLine);
  const { level, isError } = parseLogLine(rawLine);

  const logEntry: DevLogEntry = {
    line: lineNumber,
    timestamp,
    level,
    content: rawLine,
    isError,
  };

  // 如果是错误日志，生成错误指纹
  if (isError) {
    logEntry.errorFingerprint = generateErrorFingerprint(logEntry);
  }

  return logEntry;
};

/**
 * 过滤错误日志
 * @param logs 日志数组
 * @returns 错误日志数组
 */
export const filterErrorLogs = (logs: DevLogEntry[]): DevLogEntry[] => {
  return logs.filter(isErrorLog);
};

/**
 * 获取最近的错误日志
 * @param logs 日志数组
 * @param count 返回数量，默认10
 * @returns 最近的错误日志
 */
export const getRecentErrors = (
  logs: DevLogEntry[],
  count: number = 10,
): DevLogEntry[] => {
  const errorLogs = filterErrorLogs(logs);
  return errorLogs.slice(-count);
};

/**
 * 检查是否有新的错误
 * @param logs 当前日志数组
 * @param previousLogs 之前的日志数组
 * @returns 新的错误日志数组
 */
export const getNewErrors = (
  logs: DevLogEntry[],
  previousLogs: DevLogEntry[],
): DevLogEntry[] => {
  const currentErrors = filterErrorLogs(logs);
  const previousErrors = filterErrorLogs(previousLogs);

  // 找出新的错误（通过行号比较）
  const previousLineNumbers = new Set(previousErrors.map((log) => log.line));
  return currentErrors.filter((log) => !previousLineNumbers.has(log.line));
};

/**
 * 统计日志级别
 * @param logs 日志数组
 * @returns 各级别日志数量统计
 */
export const getLogStats = (logs: DevLogEntry[]): Record<LogLevel, number> => {
  const stats: Record<LogLevel, number> = {
    [LogLevel.NORMAL]: 0,
    [LogLevel.INFO]: 0,
    [LogLevel.WARN]: 0,
    [LogLevel.ERROR]: 0,
  };

  logs.forEach((log) => {
    stats[log.level]++;
  });

  return stats;
};

/**
 * 格式化日志显示文本
 * @param log 日志条目
 * @param showTimestamp 是否显示时间戳
 * @param showLineNumber 是否显示行号
 * @returns 格式化后的显示文本
 */
export const formatLogDisplay = (
  log: DevLogEntry,
  showTimestamp: boolean = true,
  showLineNumber: boolean = true,
): string => {
  let displayText = '';

  if (showLineNumber) {
    displayText += `${log.line}| `;
  }

  if (showTimestamp && log.timestamp) {
    displayText += `[${log.timestamp}] `;
  }

  displayText += log.content;

  return displayText;
};

/**
 * 日志分组接口
 */
export interface LogGroup {
  /** 时间戳 */
  timestamp: string;
  /** 该组内的日志条目 */
  logs: DevLogEntry[];
  /** 组内错误数量 */
  errorCount: number;
  /** 组内警告数量 */
  warnCount: number;
  /** 组内信息数量 */
  infoCount: number;
  /** 组内普通日志数量 */
  normalCount: number;
}

/**
 * 创建日志组
 * @param timestamp 时间戳
 * @param logs 日志数组
 * @returns 日志组
 */
const createLogGroup = (timestamp: string, logs: DevLogEntry[]): LogGroup => {
  const errorCount = logs.filter((log) => log.level === LogLevel.ERROR).length;
  const warnCount = logs.filter((log) => log.level === LogLevel.WARN).length;
  const infoCount = logs.filter((log) => log.level === LogLevel.INFO).length;
  const normalCount = logs.filter(
    (log) => log.level === LogLevel.NORMAL,
  ).length;

  return {
    timestamp: timestamp || '未知时间',
    logs,
    errorCount,
    warnCount,
    infoCount,
    normalCount,
  };
};

/**
 * 按时间戳标识符切分日志块
 * @param logs 日志数组
 * @returns 分组后的日志数组
 */
export const groupLogsByTimestamp = (logs: DevLogEntry[]): LogGroup[] => {
  const groups: LogGroup[] = [];
  let currentGroup: DevLogEntry[] = [];
  let currentTimestamp = '';

  // 遍历日志，按时间戳标识符切分
  logs.forEach((log) => {
    const timestamp = extractTimestamp(log.content);

    if (timestamp) {
      // 如果遇到新的时间戳标识符，保存当前组并开始新组
      if (currentGroup.length > 0) {
        groups.push(createLogGroup(currentTimestamp, currentGroup));
        currentGroup = [];
      }
      currentTimestamp = timestamp;
    }

    // 将当前日志添加到当前组
    currentGroup.push(log);
  });

  // 处理最后一个组（如果没有时间戳标识符，就是最后一个）
  if (currentGroup.length > 0) {
    groups.push(createLogGroup(currentTimestamp, currentGroup));
  }

  // 保持后端返回数据的原始顺序，不进行排序
  return groups;
};

/**
 * 格式化时间戳显示
 * @param timestamp 时间戳字符串
 * @returns 格式化后的时间戳
 */
export const formatTimestampDisplay = (timestamp: string): string => {
  // 如果已经是格式化好的时间戳，直接返回
  if (timestamp.includes('/') && timestamp.includes(':')) {
    return timestamp;
  }

  // 使用 dayjs 解析时间戳
  try {
    const date = dayjs(timestamp);
    if (date.isValid()) {
      return date.format('YYYY/MM/DD HH:mm:ss');
    }
  } catch (error) {
    console.warn('时间戳解析失败:', timestamp, error);
  }

  return timestamp;
};
