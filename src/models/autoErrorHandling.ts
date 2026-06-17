import { useCallback, useState } from 'react';

/**
 * 自动错误处理记录接口
 */
export interface AutoErrorHandleRecord {
  /** 记录ID */
  id: string;
  /** AI Chat 请求ID，用于区分不同的 AI chat 请求 */
  requestId: string;
  /** 错误类型 */
  errorType: 'whiteScreen' | 'log' | 'iframe';
  /** 错误内容摘要 */
  errorSummary: string;
  /** 处理时间戳 */
  timestamp: number;
  /** 是否成功 */
  success?: boolean;
}

/**
 * 自动错误处理状态接口
 */
export interface AutoErrorHandlingState {
  /** 当前自动处理问题总次数 */
  totalCount: number;
  /** 当前会话的自动处理次数 */
  sessionCount: number;
  /** 历史处理记录 */
  records: AutoErrorHandleRecord[];
  /** 是否启用自动处理 */
  isEnabled: boolean;
  /** 是否启用自动处理功能（用户可控制） */
  isAutoHandlingEnabled: boolean;
  /** 当前自动重试次数 */
  autoRetryCount: number;
  /** 上次错误时间戳 */
  lastErrorTimestamp: string | null;
  /** 上次自定义错误哈希值 */
  lastCustomErrorHash: string | null;
  /** 是否已显示确认弹窗 */
  hasShownConfirmModal: boolean;
}

/**
 * 初始状态
 */
const initialState: AutoErrorHandlingState = {
  totalCount: 0,
  sessionCount: 0,
  records: [],
  isEnabled: true,
  isAutoHandlingEnabled: true,
  autoRetryCount: 0,
  lastErrorTimestamp: null,
  lastCustomErrorHash: null,
  hasShownConfirmModal: false,
};

/**
 * 自动错误处理 Model
 * 管理自动处理问题的次数记录和历史
 *
 * 使用方式：
 * const autoErrorHandling = useModel('autoErrorHandling');
 */
export default () => {
  const [state, setState] = useState<AutoErrorHandlingState>(initialState);

  /**
   * 记录自动处理问题
   * @param errorType 错误类型
   * @param errorSummary 错误内容摘要
   * @param requestId AI Chat 请求ID，用于区分不同的 AI chat 请求
   */
  const recordAutoHandle = useCallback(
    (
      errorType: 'whiteScreen' | 'log' | 'iframe',
      errorSummary: string,
      requestId: string,
    ) => {
      const record: AutoErrorHandleRecord = {
        id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        errorType,
        errorSummary: errorSummary.substring(0, 200), // 限制摘要长度
        timestamp: Date.now(),
      };

      setState((prev) => {
        const newCount = prev.sessionCount + 1;
        const newTotalCount = prev.totalCount + 1;

        // 限制历史记录数量，只保留最近100条
        const newRecords = [record, ...prev.records].slice(0, 100);

        console.log(
          `[AutoErrorHandling] 📊 Recording auto-handling: session count=${newCount}, total count=${newTotalCount}`,
        );

        return {
          ...prev,
          sessionCount: newCount,
          totalCount: newTotalCount,
          records: newRecords,
        };
      });

      return record;
    },
    [],
  );

  /**
   * 标记处理结果
   * @param recordId 记录ID
   * @param success 是否成功
   */
  const markHandleResult = useCallback((recordId: string, success: boolean) => {
    setState((prev) => ({
      ...prev,
      records: prev.records.map((record) =>
        record.id === recordId ? { ...record, success } : record,
      ),
    }));
  }, []);

  /**
   * 重置会话计数
   */
  const resetSessionCount = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sessionCount: 0,
    }));
    console.log('[AutoErrorHandling] 🔄 Resetting session count');
  }, []);

  /**
   * 设置是否启用自动处理功能
   */
  const setAutoHandlingEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      isAutoHandlingEnabled: enabled,
    }));
    console.log(
      `[AutoErrorHandling] ${enabled ? '✅' : '❌'} Auto-handling feature ${
        enabled ? 'enabled' : 'disabled'
      }`,
    );
  }, []);

  /**
   * 设置自动重试次数
   */
  const setAutoRetryCount = useCallback((count: number) => {
    setState((prev) => ({
      ...prev,
      autoRetryCount: count,
    }));
  }, []);

  /**
   * 增加自动重试次数
   */
  const incrementAutoRetryCount = useCallback(() => {
    setState((prev) => {
      const newCount = prev.autoRetryCount + 1;
      console.info(`[AutoErrorHandling] 📊 自动重试次数: ${newCount}`);
      return {
        ...prev,
        autoRetryCount: newCount,
      };
    });
  }, []);

  /**
   * 重置自动重试计数
   */
  const resetAutoRetryCount = useCallback(() => {
    setState((prev) => ({
      ...prev,
      autoRetryCount: 0,
      lastErrorTimestamp: null,
      lastCustomErrorHash: null,
      hasShownConfirmModal: false,
    }));
    console.log('[AutoErrorHandling] 🔄 Resetting auto-retry count');
  }, []);

  /**
   * 设置上次错误时间戳
   */
  const setLastErrorTimestamp = useCallback((timestamp: string | null) => {
    setState((prev) => ({
      ...prev,
      lastErrorTimestamp: timestamp,
    }));
  }, []);

  /**
   * 设置上次自定义错误哈希值
   */
  const setLastCustomErrorHash = useCallback((hash: string | null) => {
    setState((prev) => ({
      ...prev,
      lastCustomErrorHash: hash,
    }));
  }, []);

  /**
   * 设置是否已显示确认弹窗
   */
  const setHasShownConfirmModal = useCallback((shown: boolean) => {
    setState((prev) => ({
      ...prev,
      hasShownConfirmModal: shown,
    }));
  }, []);

  /**
   * 重置并启用自动处理
   */
  const resetAndEnableAutoHandling = useCallback(() => {
    setState((prev) => ({
      ...prev,
      autoRetryCount: 0,
      lastErrorTimestamp: null,
      lastCustomErrorHash: null,
      hasShownConfirmModal: false,
      isAutoHandlingEnabled: true,
    }));
    console.log('[AutoErrorHandling] 🔄 Resetting and enabling auto-handling');
  }, []);

  /**
   * 用户取消自动处理
   */
  const cancelAutoHandling = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAutoHandlingEnabled: false,
    }));
    console.log('[AutoErrorHandling] ❌ User cancelled auto-handling');
  }, []);

  /**
   * 启用/禁用自动处理
   */
  const setEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      isEnabled: enabled,
    }));
    console.log(
      `[AutoErrorHandling] ${enabled ? '✅' : '❌'} Auto-handling ${
        enabled ? 'enabled' : 'disabled'
      }`,
    );
  }, []);

  /**
   * 重置所有状态（包括总次数）
   */
  const resetAll = useCallback(() => {
    setState(initialState);
    console.log('[AutoErrorHandling] 🔄 Resetting all states');
  }, []);

  /**
   * 获取统计数据
   */
  const getStatistics = useCallback(() => {
    const { totalCount, sessionCount, records } = state;
    const successCount = records.filter((r) => r.success === true).length;
    const failCount = records.filter((r) => r.success === false).length;
    const pendingCount = records.filter((r) => r.success === undefined).length;

    return {
      totalCount,
      sessionCount,
      successCount,
      failCount,
      pendingCount,
      recordsCount: records.length,
    };
  }, [state]);

  /**
   * 根据 requestId 获取相关记录
   * @param requestId AI Chat 请求ID
   */
  const getRecordsByRequestId = useCallback(
    (requestId: string): AutoErrorHandleRecord[] => {
      return state.records.filter((record) => record.requestId === requestId);
    },
    [state.records],
  );

  /**
   * 获取所有唯一的 requestId 列表
   */
  const getUniqueRequestIds = useCallback((): string[] => {
    const requestIdSet = new Set<string>();
    state.records.forEach((record) => {
      requestIdSet.add(record.requestId);
    });
    return Array.from(requestIdSet);
  }, [state.records]);

  /**
   * 按 requestId 分组的统计数据
   */
  const getStatisticsByRequestId = useCallback(() => {
    const requestIdMap = new Map<
      string,
      {
        requestId: string;
        count: number;
        successCount: number;
        failCount: number;
        pendingCount: number;
        records: AutoErrorHandleRecord[];
      }
    >();

    state.records.forEach((record) => {
      if (!requestIdMap.has(record.requestId)) {
        requestIdMap.set(record.requestId, {
          requestId: record.requestId,
          count: 0,
          successCount: 0,
          failCount: 0,
          pendingCount: 0,
          records: [],
        });
      }

      const stats = requestIdMap.get(record.requestId)!;
      stats.count += 1;
      stats.records.push(record);

      if (record.success === true) {
        stats.successCount += 1;
      } else if (record.success === false) {
        stats.failCount += 1;
      } else {
        stats.pendingCount += 1;
      }
    });

    return Array.from(requestIdMap.values());
  }, [state.records]);

  return {
    // 状态
    ...state,
    // 方法 - 记录管理
    recordAutoHandle,
    markHandleResult,
    resetSessionCount,
    // 方法 - 自动处理控制
    setEnabled,
    setAutoHandlingEnabled,
    setAutoRetryCount,
    incrementAutoRetryCount,
    resetAutoRetryCount,
    resetAndEnableAutoHandling,
    cancelAutoHandling,
    // 方法 - 错误追踪
    setLastErrorTimestamp,
    setLastCustomErrorHash,
    setHasShownConfirmModal,
    // 方法 - 数据查询
    getStatistics,
    getRecordsByRequestId,
    getUniqueRequestIds,
    getStatisticsByRequestId,
    // 方法 - 重置
    resetAll,
  };
};
