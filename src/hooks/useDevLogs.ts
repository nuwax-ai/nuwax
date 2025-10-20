/**
 * 开发服务器日志管理Hook
 * 负责日志轮询、缓存、错误记录和状态管理
 */

import { getDevLogs } from '@/services/appDev';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import {
  filterErrorLogs,
  generateErrorFingerprint,
  getNewErrors,
} from '@/utils/devLogParser';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 日志管理Hook的配置选项
 */
interface UseDevLogsOptions {
  /** 轮询间隔（毫秒），默认2000ms */
  pollInterval?: number;
  /** 最大缓存日志行数，默认1000 */
  maxLogLines?: number;
  /** 是否启用轮询，默认true */
  enabled?: boolean;
  /** 是否自动滚动到底部，默认true */
  autoScroll?: boolean;
}

/**
 * 日志管理Hook的返回值
 */
interface UseDevLogsReturn {
  /** 日志数组 */
  logs: DevLogEntry[];
  /** 错误计数 */
  errorCount: number;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在轮询 */
  isPolling: boolean;
  /** 最后加载的行号 */
  lastLine: number;
  /** 已发送错误的指纹集合 */
  sentErrors: Set<string>;
  /** 清空日志 */
  clearLogs: () => void;
  /** 手动刷新日志 */
  refreshLogs: () => Promise<void>;
  /** 停止轮询 */
  stopPolling: () => void;
  /** 开始轮询 */
  startPolling: () => void;
  /** 获取新的错误日志 */
  getNewErrorLogs: () => DevLogEntry[];
  /** 标记错误为已发送 */
  markErrorAsSent: (errorFingerprint: string) => void;
  /** 检查是否有新错误 */
  hasNewErrors: () => boolean;
}

/**
 * 开发服务器日志管理Hook
 * @param projectId 项目ID
 * @param options 配置选项
 * @returns 日志管理相关状态和方法
 */
export const useDevLogs = (
  projectId: string,
  options: UseDevLogsOptions = {},
): UseDevLogsReturn => {
  const {
    pollInterval = 2000,
    maxLogLines = 1000,
    enabled = true,
    autoScroll = true,
  } = options;

  // 状态管理
  const [logs, setLogs] = useState<DevLogEntry[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [lastLine, setLastLine] = useState(0);

  // 引用管理
  const sentErrorsRef = useRef<Set<string>>(new Set());
  const previousLogsRef = useRef<DevLogEntry[]>([]);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * 解析和添加新日志
   */
  const addNewLogs = useCallback(
    (newLogs: DevLogEntry[]) => {
      if (!isMountedRef.current || newLogs.length === 0) return;

      setLogs((prevLogs) => {
        const updatedLogs = [...prevLogs, ...newLogs];

        // 限制日志数量，保留最新的日志
        if (updatedLogs.length > maxLogLines) {
          return updatedLogs.slice(-maxLogLines);
        }

        return updatedLogs;
      });

      // 更新错误计数
      const newErrorLogs = filterErrorLogs(newLogs);
      if (newErrorLogs.length > 0) {
        setErrorCount((prev) => prev + newErrorLogs.length);
      }

      // 更新最后行号
      const maxLine = Math.max(...newLogs.map((log) => log.line));
      setLastLine(maxLine);
    },
    [maxLogLines],
  );

  /**
   * 轮询获取新日志
   */
  const pollLogs = useCallback(async () => {
    if (!isMountedRef.current || !projectId) return;

    try {
      setIsLoading(true);
      const response = await getDevLogs(projectId, lastLine);

      if (response.success && response.data.logs.length > 0) {
        addNewLogs(response.data.logs);
      }
    } catch (error) {
      console.error('获取日志失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, lastLine, addNewLogs]);

  /**
   * 开始轮询
   */
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    setIsPolling(true);
    pollTimerRef.current = setInterval(pollLogs, pollInterval);

    // 立即执行一次
    pollLogs();
  }, [pollLogs, pollInterval]);

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /**
   * 手动刷新日志
   */
  const refreshLogs = useCallback(async () => {
    await pollLogs();
  }, [pollLogs]);

  /**
   * 清空日志
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
    setErrorCount(0);
    setLastLine(0);
    sentErrorsRef.current.clear();
    previousLogsRef.current = [];
  }, []);

  /**
   * 获取新的错误日志
   */
  const getNewErrorLogs = useCallback((): DevLogEntry[] => {
    const newErrors = getNewErrors(logs, previousLogsRef.current);
    previousLogsRef.current = [...logs];
    return newErrors;
  }, [logs]);

  /**
   * 标记错误为已发送
   */
  const markErrorAsSent = useCallback((errorFingerprint: string) => {
    sentErrorsRef.current.add(errorFingerprint);
  }, []);

  /**
   * 检查是否有新错误
   */
  const hasNewErrors = useCallback((): boolean => {
    const newErrors = getNewErrors(logs, previousLogsRef.current);
    return newErrors.some((error) => {
      const fingerprint =
        error.errorFingerprint || generateErrorFingerprint(error);
      return !sentErrorsRef.current.has(fingerprint);
    });
  }, [logs]);

  // 自动启动/停止轮询
  useEffect(() => {
    if (enabled && projectId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, projectId, startPolling, stopPolling]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  // 更新previousLogsRef
  useEffect(() => {
    previousLogsRef.current = [...logs];
  }, [logs]);

  return {
    logs,
    errorCount,
    isLoading,
    isPolling,
    lastLine,
    sentErrors: sentErrorsRef.current,
    clearLogs,
    refreshLogs,
    stopPolling,
    startPolling,
    getNewErrorLogs,
    markErrorAsSent,
    hasNewErrors,
  };
};

/**
 * 简化的日志管理Hook（仅用于基本日志显示）
 * @param projectId 项目ID
 * @param enabled 是否启用
 * @returns 简化的日志管理状态
 */
export const useSimpleDevLogs = (
  projectId: string,
  enabled: boolean = true,
) => {
  return useDevLogs(projectId, {
    enabled,
    pollInterval: 3000,
    maxLogLines: 500,
  });
};

/**
 * 错误监控Hook（专门用于错误检测和自动处理）
 * @param projectId 项目ID
 * @param enabled 是否启用
 * @returns 错误监控相关状态和方法
 */
export const useErrorMonitoring = (
  projectId: string,
  enabled: boolean = true,
) => {
  const {
    logs,
    errorCount,
    sentErrors,
    getNewErrorLogs,
    markErrorAsSent,
    hasNewErrors,
  } = useDevLogs(projectId, {
    enabled,
    pollInterval: 2000,
    maxLogLines: 1000,
  });

  /**
   * 获取未发送的错误日志
   */
  const getUnsentErrors = useCallback((): DevLogEntry[] => {
    const errorLogs = filterErrorLogs(logs);
    return errorLogs.filter((error) => {
      const fingerprint =
        error.errorFingerprint || generateErrorFingerprint(error);
      return !sentErrors.has(fingerprint);
    });
  }, [logs, sentErrors]);

  /**
   * 获取最新的错误日志（用于自动发送）
   */
  const getLatestErrorForAgent = useCallback((): DevLogEntry | null => {
    const unsentErrors = getUnsentErrors();
    if (unsentErrors.length === 0) return null;

    // 返回最新的错误
    return unsentErrors[unsentErrors.length - 1];
  }, [getUnsentErrors]);

  return {
    logs,
    errorCount,
    hasNewErrors,
    getUnsentErrors,
    getLatestErrorForAgent,
    markErrorAsSent,
  };
};
