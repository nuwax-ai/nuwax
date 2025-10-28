/**
 * 开发服务器日志管理Hook
 * 负责日志轮询、缓存、错误记录和状态管理
 */

import { getDevLogs } from '@/services/appDev';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  filterErrorLogs,
  generateErrorFingerprint,
  getNewErrors,
  groupLogsByTimestamp,
} from '../utils/devLogParser';

/**
 * 日志管理Hook的配置选项
 */
interface UseDevLogsOptions {
  /** 轮询间隔（毫秒），默认5000ms */
  pollInterval?: number;
  /** 最大缓存日志行数，默认1000 */
  maxLogLines?: number;
  /** 是否启用轮询，默认true */
  enabled?: boolean;
}

/**
 * 日志管理Hook的返回值
 */
interface UseDevLogsReturn {
  /** 日志数组 */
  logs: DevLogEntry[];
  /** 最新日志块是否包含错误 */
  hasErrorInLatestBlock: boolean;
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
  /** 重置日志起始行号 */
  resetStartLine: () => void;
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
    pollInterval = 5000, // 默认5秒轮询
    maxLogLines = 1000,
    enabled = true,
  } = options;

  // 状态管理
  const [logs, setLogs] = useState<DevLogEntry[]>([]);
  const [hasErrorInLatestBlock, setHasErrorInLatestBlock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [lastLine, setLastLine] = useState(0);

  // 引用管理
  const sentErrorsRef = useRef<Set<string>>(new Set());
  const previousLogsRef = useRef<DevLogEntry[]>([]);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const consecutiveErrorsRef = useRef(0); // 连续错误计数
  const maxConsecutiveErrors = 3; // 最大连续错误次数
  const retryDelayRef = useRef(5000); // 重试延迟，初始5秒

  /**
   * 解析和添加新日志
   */
  const addNewLogs = useCallback(
    (newLogs: DevLogEntry[]) => {
      if (!isMountedRef.current || newLogs.length === 0) return;

      setLogs((prevLogs) => {
        const updatedLogs = [...prevLogs, ...newLogs];
        let resultLogs = updatedLogs;
        // 限制日志数量，保留最新的日志
        if (updatedLogs.length > maxLogLines) {
          resultLogs = updatedLogs.slice(-maxLogLines);
        }
        const groups = groupLogsByTimestamp(resultLogs);
        // 检查最新日志块是否包含错误 仅检查最后一组
        const newErrorLogs = filterErrorLogs(groups.at(-1)?.logs || []);
        setHasErrorInLatestBlock(newErrorLogs.length > 0);
        return resultLogs;
      });

      // 更新最后行号
      const maxLine = Math.max(...newLogs.map((log) => log.line));
      setLastLine(maxLine);
    },
    [maxLogLines],
  );

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
   * 轮询获取新日志
   */
  const pollLogs = useCallback(async () => {
    if (!isMountedRef.current || !projectId) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await getDevLogs(projectId, lastLine + 1);

      if (response.success && response.data.logs.length > 0) {
        addNewLogs(response.data.logs);
        // 成功时重置错误计数
        consecutiveErrorsRef.current = 0;
        retryDelayRef.current = 5000; // 重置重试延迟
      } else {
        // 即使没有新日志，也算作成功
        consecutiveErrorsRef.current = 0;
      }
    } catch (error) {
      consecutiveErrorsRef.current += 1;
      console.error('获取日志失败:', error);

      // 如果连续错误次数超过阈值，停止轮询并安排重试
      if (consecutiveErrorsRef.current >= maxConsecutiveErrors) {
        // 停止当前轮询
        stopPolling();

        // 安排重试 - 使用 ref 来避免循环依赖
        setTimeout(() => {
          if (isMountedRef.current && projectId) {
            // 重新设置定时器
            pollTimerRef.current = setInterval(pollLogs, pollInterval);
            setIsPolling(true);
          }
        }, retryDelayRef.current);

        // 增加重试延迟（最大30秒）
        retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, 30000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId, lastLine, addNewLogs, stopPolling, pollInterval]);

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
   * 清空日志
   */
  const clearLogs = useCallback(() => {
    // 保存当前最后一行号作为新的起点
    const currentLastLine =
      logs.length > 0 ? Math.max(...logs.map((log) => log.line)) : lastLine;

    setLogs([]);
    setHasErrorInLatestBlock(false);
    setLastLine(currentLastLine); // ✅ 保留最后一行号，后续从这里继续
    sentErrorsRef.current.clear();
    previousLogsRef.current = [];
  }, [logs, lastLine]);

  /**
   * 手动刷新日志
   */
  const refreshLogs = useCallback(async () => {
    clearLogs();
    setLastLine(0); // 设置为0，这样下次请求时从第1行开始
    await pollLogs();
  }, [clearLogs, pollLogs]);

  /**
   * 重置日志起始行号
   */
  const resetStartLine = useCallback(() => {
    clearLogs();
    setLastLine(0); // 设置为0，这样下次请求时从第1行开始
    startPolling();
  }, [clearLogs, startPolling]);

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
    hasErrorInLatestBlock,
    isLoading,
    isPolling,
    lastLine,
    sentErrors: sentErrorsRef.current,
    clearLogs,
    refreshLogs,
    stopPolling,
    startPolling,
    resetStartLine,
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
    pollInterval: 5000, // 调整为5秒
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
    hasErrorInLatestBlock,
    sentErrors,
    // getNewErrorLogs, // 暂时注释掉，后续可能需要
    markErrorAsSent,
    hasNewErrors,
  } = useDevLogs(projectId, {
    enabled,
    pollInterval: 5000, // 调整为5秒
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
    hasErrorInLatestBlock,
    hasNewErrors,
    getUnsentErrors,
    getLatestErrorForAgent,
    markErrorAsSent,
  };
};
