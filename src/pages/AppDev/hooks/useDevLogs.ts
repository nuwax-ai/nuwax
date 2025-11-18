/**
 * 开发服务器日志管理Hook
 * 负责日志轮询、缓存、错误记录和状态管理
 */

import { getDevLogs } from '@/services/appDev';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
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
    enabled = true,
  } = options;

  // 状态管理
  const [logs, setLogs] = useState<DevLogEntry[]>([]);
  const [hasErrorInLatestBlock, setHasErrorInLatestBlock] = useState(false);
  const [lastLine, setLastLine] = useState(0);
  const [isPolling, setIsPolling] = useState(false); // 轮询状态

  // 引用管理
  const sentErrorsRef = useRef<Set<string>>(new Set());
  const previousLogsRef = useRef<DevLogEntry[]>([]);
  const isMountedRef = useRef(true);
  const lastLineRef = useRef(0); // 使用 ref 存储 lastLine，供轮询函数使用

  // 使用 ref 存储 projectId，避免依赖项变化导致 useRequest 重新创建
  const projectIdRef = useRef(projectId);
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  /**
   * 解析和添加新日志
   * 使用稳定的回调，避免依赖项变化
   */
  const addNewLogs = useCallback((newLogs: DevLogEntry[]) => {
    if (!newLogs || !isMountedRef.current || newLogs.length === 0) return;

    setLogs((prevLogs) => {
      if (prevLogs[0]?.timestamp !== newLogs[0]?.timestamp) {
        return newLogs;
      }

      if (prevLogs.length === newLogs.length) {
        return prevLogs;
      }

      const updatedLogs = [
        ...prevLogs,
        ...newLogs.slice(prevLogs.length, newLogs.length),
      ];
      let resultLogs = updatedLogs;
      // 限制日志数量，保留最新的日志
      // if (updatedLogs.length > maxLogLines) {
      //   resultLogs = updatedLogs.slice(-maxLogLines);
      // }
      const groups = groupLogsByTimestamp(resultLogs);
      // 检查最新日志块是否包含错误 仅检查最后一组
      const newErrorLogs = filterErrorLogs(groups.at(-1)?.logs || []);
      setHasErrorInLatestBlock(newErrorLogs.length > 0);
      return resultLogs;
    });

    // 更新最后行号
    const maxLine = Math.max(...newLogs.map((log) => log.line));
    setLastLine(maxLine);
    lastLineRef.current = maxLine;
  }, []); // 空依赖数组，避免依赖项变化

  /**
   * 使用 umi useRequest 实现 get-dev-log 轮询
   * 与 useEventPolling.ts 的 batch 接入方案一致
   */
  const devLogsPolling = useRequest(
    () => {
      const currentProjectId = projectIdRef.current;
      if (!currentProjectId || !isMountedRef.current) {
        return Promise.resolve({
          success: false,
          data: { logs: [] },
        });
      }
      // 使用 ref 中的 lastLine，从第1行开始获取
      return getDevLogs(currentProjectId, 1);
    },
    {
      manual: true, // 手动控制，不自动执行
      loading: false, // 不显示 loading 状态
      pollingInterval: pollInterval, // 轮询间隔
      pollingWhenHidden: false, // 在屏幕不可见时，暂时暂停定时任务
      pollingErrorRetryCount: -1, // 轮询错误重试次数，-1 表示无限次
      throwOnError: false, // 不抛出错误，在 onError 中处理
      onSuccess: (data: any, params: any, response: any) => {
        // useRequest 的 onSuccess 回调参数：
        // - data: response.data (即 GetDevLogResponse)
        // - params: 请求参数
        // - response: 完整的响应对象 (RequestResponse<GetDevLogResponse>)
        // 需要判断传入的是完整的 response 还是 data
        const isFullResponse =
          response?.code !== undefined || response?.success !== undefined;
        const fullResponse = isFullResponse
          ? response
          : { data, code: '0000', success: true };
        const responseData = isFullResponse ? response?.data : data;

        // 兼容不同的返回数据格式：code === '0000' 或 success === true
        const isSuccess =
          fullResponse?.code === '0000' || fullResponse?.success === true;
        if (isSuccess && responseData?.logs?.length > 0) {
          addNewLogs(responseData.logs);
        }
      },
      onError: () => {
        // 错误处理，不显示错误提示（已在 common.ts 中配置为静默请求）
        // console.error('获取日志失败');
      },
    },
  );

  // 使用 ref 存储 devLogsPolling，避免依赖项变化
  const devLogsPollingRef = useRef(devLogsPolling);
  devLogsPollingRef.current = devLogsPolling;

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    // 取消 umi useRequest 的轮询
    devLogsPollingRef.current.cancel();
    setIsPolling(false);
  }, []); // 空依赖数组，使用 ref 访问最新值

  /**
   * 开始轮询
   */
  const startPolling = useCallback(() => {
    // 启动 umi useRequest 轮询
    devLogsPollingRef.current.run();
    setIsPolling(true);
  }, []); // 空依赖数组，使用 ref 访问最新值

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
    lastLineRef.current = 0;
    // 手动触发一次轮询
    devLogsPollingRef.current.run();
  }, [clearLogs]);

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
    // console.log('[error] getNewErrorLogs', newErrors);
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
    isLoading: devLogsPolling.loading, // 使用 useRequest 的 loading 状态
    isPolling, // 使用本地状态管理轮询状态
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
