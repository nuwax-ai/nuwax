/**
 * ConversationAgent 沙盒日志轮询 Hook
 * 打开日志 Tab 时轮询 /api/computer/logs，渲染逻辑对齐 AppDev useDevLogs
 */

import {
  filterErrorLogs,
  generateErrorFingerprint,
  getNewErrors,
  groupLogsByTimestamp,
} from '@/pages/AppDev/utils/devLogParser';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiGetAgentDevLog,
  GetAgentDevLogResponse,
  normalizeAgentDevLogEntries,
} from '../services/agent-dev';

/**
 * 沙盒日志 Hook 的配置选项
 */
interface UseConversationAgentDevLogsOptions {
  /** 轮询间隔（毫秒），默认 5000ms */
  pollInterval?: number;
  /** 每次拉取尾部行数，默认 1000 */
  tailLines?: number;
  /** 是否启用轮询，默认 false（由页面在日志 Tab 激活时设为 true） */
  enabled?: boolean;
}

/**
 * 沙盒日志 Hook 的返回值
 */
interface UseConversationAgentDevLogsReturn {
  /** 日志数组 */
  logs: DevLogEntry[];
  /** 最新日志块是否包含错误（控制一键修复按钮与错误徽标） */
  hasErrorInLatestBlock: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在轮询 */
  isPolling: boolean;
  /** 最后加载的行号 */
  lastLine: number;
  /** 最新一组错误日志的纯文本（用于一键修复 / 加入对话） */
  latestErrorLogs: string;
  /** 清空本地日志缓存 */
  clearLogs: () => void;
  /** 手动刷新日志（清空后重新拉取） */
  refreshLogs: () => Promise<void>;
  /** 停止轮询 */
  stopPolling: () => void;
  /** 开始轮询 */
  startPolling: () => void;
  /** 获取相对上次快照新增的错误日志 */
  getNewErrorLogs: () => DevLogEntry[];
  /** 标记某条错误已发送，避免重复处理 */
  markErrorAsSent: (errorFingerprint: string) => void;
  /** 检查是否存在未发送的新错误 */
  hasNewErrors: () => boolean;
}

/**
 * 从日志列表中提取最后一组含错误的日志块，拼接为纯文本
 * @param logs 完整日志列表
 * @returns 最新错误块内容，无错误时返回空字符串
 */
const getLatestErrorLogs = (logs: DevLogEntry[]): string => {
  if (!logs.length) {
    return '';
  }

  const groups = groupLogsByTimestamp(logs);
  const theErrorLogs =
    groups
      .filter((group) => filterErrorLogs(group.logs || []).length > 0)
      .at(-1)?.logs || [];

  if (!theErrorLogs.length) {
    return '';
  }

  return theErrorLogs
    .map((log) => log.content)
    .join('\n')
    .trim();
};

/**
 * ConversationAgent 沙盒日志管理 Hook
 * @param conversationId 会话 ID（对应接口 cId）
 * @param options 轮询与拉取配置
 * @returns 日志状态与操作方法
 */
export const useConversationAgentDevLogs = (
  conversationId?: number,
  options: UseConversationAgentDevLogsOptions = {},
): UseConversationAgentDevLogsReturn => {
  const { pollInterval = 5000, tailLines = 1000, enabled = false } = options;

  // ==================== 状态 ====================
  const [logs, setLogs] = useState<DevLogEntry[]>([]);
  const [hasErrorInLatestBlock, setHasErrorInLatestBlock] = useState(false);
  const [lastLine, setLastLine] = useState<number>(0);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [latestErrorLogs, setLatestErrorLogs] = useState('');

  // ==================== Refs ====================
  /** 已发送错误的指纹集合，用于去重 */
  const sentErrorsRef = useRef<Set<string>>(new Set());
  /** 上一轮日志快照，供 getNewErrors 对比增量 */
  const previousLogsRef = useRef<DevLogEntry[]>([]);
  /** 当前会话 ID，避免轮询闭包读取过期值 */
  const conversationIdRef = useRef(conversationId);
  /** 当前 tailLines，避免 useRequest 因依赖变化重建 */
  const tailLinesRef = useRef(tailLines);

  // 每次渲染都同步最新参数，避免 useEffect 异步更新导致「点击刷新时偶发读到旧值」。
  conversationIdRef.current = conversationId;
  tailLinesRef.current = tailLines;

  /**
   * 用接口返回的尾部日志快照整体更新本地状态
   * 沙盒接口按 tailLines 返回最新片段，每次轮询直接替换而非增量追加
   */
  const updateLogsSnapshot = useCallback((nextLogs: DevLogEntry[]) => {
    setLogs(nextLogs);
    setHasErrorInLatestBlock(!!getLatestErrorLogs(nextLogs));
    setLatestErrorLogs(getLatestErrorLogs(nextLogs));

    if (nextLogs.length > 0) {
      const maxLine = Math.max(...nextLogs.map((log) => log.line));
      setLastLine(maxLine);
    } else {
      setLastLine(0);
    }
  }, []);

  /**
   * 使用 umi useRequest 轮询 /api/computer/logs
   * manual: true，由 enabled 变化时显式 start/stop
   */
  const devLogsPolling = useRequest(
    () => {
      const currentConversationId = conversationIdRef.current;
      if (!currentConversationId) {
        return Promise.resolve([]);
      }

      return apiGetAgentDevLog({
        cId: currentConversationId,
        tailLines: tailLinesRef.current,
      });
    },
    {
      manual: true,
      loading: false,
      pollingInterval: pollInterval,
      pollingWhenHidden: false,
      pollingErrorRetryCount: -1,
      throwOnError: false,
      onSuccess: (data: GetAgentDevLogResponse) => {
        const newLogs = normalizeAgentDevLogEntries(data);
        updateLogsSnapshot(newLogs || []);
      },
      onError: () => {
        // 静默失败，common.ts 已配置为静默请求
      },
    },
  );

  const devLogsPollingRef = useRef(devLogsPolling);
  devLogsPollingRef.current = devLogsPolling;
  /** 轮询是否至少执行过一次，cancel 前需判断避免 umi 警告 */
  const hasExecutedRef = useRef<boolean>(false);

  /** 停止轮询并取消 useRequest 定时任务 */
  const stopPolling = useCallback(() => {
    if (devLogsPollingRef.current && hasExecutedRef.current) {
      try {
        devLogsPollingRef.current.cancel();
      } catch (error) {
        console.debug('Failed to cancel polling:', error);
      }
    }
    setIsPolling(false);
  }, []);

  /** 启动轮询（立即执行一次并进入定时循环） */
  const startPolling = useCallback(() => {
    devLogsPollingRef.current.run();
    hasExecutedRef.current = true;
    setIsPolling(true);
  }, []);

  /** 清空本地日志与错误追踪状态 */
  const clearLogs = useCallback(() => {
    setLogs([]);
    setHasErrorInLatestBlock(false);
    setLatestErrorLogs('');
    setLastLine(0);
    sentErrorsRef.current.clear();
    previousLogsRef.current = [];
  }, []);

  /** 清空后手动触发一次拉取 */
  const refreshLogs = useCallback(async () => {
    // conversationId 缺失时直接返回，避免出现“点击刷新但没有实际请求”的错觉。
    if (!conversationIdRef.current) {
      return;
    }

    clearLogs();
    // 手动刷新同样算一次执行，便于后续 stopPolling 可以正确 cancel。
    hasExecutedRef.current = true;
    devLogsPollingRef.current.run();
  }, [clearLogs]);

  /** 对比 previousLogsRef，返回本轮新增的错误日志 */
  const getNewErrorLogs = useCallback((): DevLogEntry[] => {
    const newErrors = getNewErrors(logs, previousLogsRef.current);
    previousLogsRef.current = [...logs];
    return newErrors;
  }, [logs]);

  /** 将错误指纹加入已发送集合 */
  const markErrorAsSent = useCallback((errorFingerprint: string) => {
    sentErrorsRef.current.add(errorFingerprint);
  }, []);

  /** 是否存在尚未发送过的新错误 */
  const hasNewErrors = useCallback((): boolean => {
    const newErrors = getNewErrors(logs, previousLogsRef.current);
    return newErrors.some((error) => {
      const fingerprint =
        error.errorFingerprint || generateErrorFingerprint(error);
      return !sentErrorsRef.current.has(fingerprint);
    });
  }, [logs]);

  /** enabled 或 conversationId 变化时自动启停轮询 */
  useEffect(() => {
    if (enabled && conversationId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, conversationId, startPolling, stopPolling]);

  /** 组件卸载时标记并停止轮询 */
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  /** logs 变化时同步 previousLogsRef，供增量错误检测使用 */
  useEffect(() => {
    previousLogsRef.current = [...logs];
  }, [logs]);

  return {
    logs,
    hasErrorInLatestBlock,
    isLoading: devLogsPolling.loading,
    isPolling,
    lastLine,
    latestErrorLogs,
    clearLogs,
    refreshLogs,
    stopPolling,
    startPolling,
    getNewErrorLogs,
    markErrorAsSent,
    hasNewErrors,
  };
};
