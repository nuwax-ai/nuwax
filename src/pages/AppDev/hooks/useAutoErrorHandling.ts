/**
 * 自动异常处理Hook
 * 负责检测错误、生成指纹、防重复发送等自动处理逻辑
 */

import type { Attachment, DevLogEntry } from '@/types/interfaces/appDev';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  formatErrorForAgent,
  generateErrorFingerprint,
  getRecentErrors,
} from '../utils/devLogParser';

/**
 * 自动异常处理Hook的配置选项
 */
interface UseAutoErrorHandlingOptions {
  /** 是否启用自动处理，默认true */
  enabled?: boolean;
  /** 错误检测延迟（毫秒），默认1000ms */
  errorDetectionDelay?: number;
  /** 最大错误发送频率（毫秒），默认30000ms */
  maxSendFrequency?: number;
  /** 是否显示通知，默认true */
  showNotification?: boolean;
}

/**
 * 自动异常处理Hook的返回值
 */
interface UseAutoErrorHandlingReturn {
  /** 是否启用自动处理 */
  autoHandleEnabled: boolean;
  /** 设置自动处理开关 */
  setAutoHandleEnabled: (enabled: boolean) => void;
  /** 检查并发送错误给Agent */
  checkAndSendError: (
    logs: DevLogEntry[],
    sendMessage: (attachments?: Attachment[]) => void,
  ) => Promise<boolean>;
  /** 处理文件操作完成后的错误检测 */
  handleFileOperationComplete: (
    logs: DevLogEntry[],
    sendMessage: (attachments?: Attachment[]) => void,
  ) => void;
  /** 处理预览白屏错误 */
  handlePreviewWhiteScreen: (
    logs: DevLogEntry[],
    sendMessage: (attachments?: Attachment[]) => void,
  ) => void;
  /** 处理Agent输出结束后的错误检测 */
  handleAgentPromptEnd: (
    logs: DevLogEntry[],
    sendMessage: (attachments?: Attachment[]) => void,
  ) => void;
  /** 获取错误统计信息 */
  getErrorStats: () => {
    totalErrors: number;
    sentErrors: number;
    unsentErrors: number;
  };
}

/**
 * 自动异常处理Hook
 * @param projectId 项目ID
 * @param options 配置选项
 * @returns 自动异常处理相关状态和方法
 */
export const useAutoErrorHandling = (
  projectId: string,
  options: UseAutoErrorHandlingOptions = {},
): UseAutoErrorHandlingReturn => {
  const {
    enabled: defaultEnabled = true,
    errorDetectionDelay = 1000,
    maxSendFrequency = 30000,
    showNotification = true,
  } = options;

  // 状态管理
  const [autoHandleEnabled, setAutoHandleEnabled] = useState(defaultEnabled);
  const [sentErrors, setSentErrors] = useState<Set<string>>(new Set());
  const [lastSendTime, setLastSendTime] = useState<number>(0);

  // 引用管理
  const isProcessingRef = useRef(false);
  const errorDetectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 从localStorage加载设置
   */
  useEffect(() => {
    const saved = localStorage.getItem('appdev_auto_handle_error');
    if (saved !== null) {
      setAutoHandleEnabled(JSON.parse(saved));
    }
  }, []);

  /**
   * 保存设置到localStorage
   */
  const saveSettings = useCallback((enabled: boolean) => {
    localStorage.setItem('appdev_auto_handle_error', JSON.stringify(enabled));
  }, []);

  /**
   * 设置自动处理开关
   */
  const handleSetAutoHandleEnabled = useCallback(
    (enabled: boolean) => {
      setAutoHandleEnabled(enabled);
      saveSettings(enabled);

      if (showNotification) {
        message.info(enabled ? '已开启自动错误处理' : '已关闭自动错误处理');
      }
    },
    [saveSettings, showNotification],
  );

  /**
   * 检查是否可以发送错误（频率限制）
   */
  const canSendError = useCallback((): boolean => {
    const now = Date.now();
    return now - lastSendTime >= maxSendFrequency;
  }, [lastSendTime, maxSendFrequency]);

  /**
   * 查找最新的未发送错误
   */
  const findLatestUnsentError = useCallback(
    (logs: DevLogEntry[]): DevLogEntry | null => {
      const recentErrors = getRecentErrors(logs, 10); // 最近10个错误

      for (let i = recentErrors.length - 1; i >= 0; i--) {
        const error = recentErrors[i];
        const fingerprint =
          error.errorFingerprint || generateErrorFingerprint(error);

        if (!sentErrors.has(fingerprint)) {
          return error;
        }
      }

      return null;
    },
    [sentErrors],
  );

  /**
   * 发送错误给Agent
   */
  const sendErrorToAgent = useCallback(
    async (
      error: DevLogEntry,
      logs: DevLogEntry[],
      sendMessage: (attachments?: Attachment[]) => void,
    ): Promise<boolean> => {
      try {
        const errorIndex = logs.findIndex((log) => log.line === error.line);
        if (errorIndex === -1) return false;

        const errorMessage = formatErrorForAgent(logs, errorIndex);

        // 创建文本附件发送给Agent
        const textAttachment: Attachment = {
          type: 'Text',
          content: {
            id: `error_${Date.now()}`,
            filename: 'error_log.txt',
            source: {
              source_type: 'Base64',
              data: {
                data: btoa(unescape(encodeURIComponent(errorMessage))),
                mime_type: 'text/plain',
              },
            },
          },
        };

        // 发送消息给Agent
        sendMessage([textAttachment]);

        // 标记为已发送
        const fingerprint =
          error.errorFingerprint || generateErrorFingerprint(error);
        setSentErrors((prev) => new Set(prev).add(fingerprint));
        setLastSendTime(Date.now());

        if (showNotification) {
          message.success('已自动发送错误信息给Agent处理');
        }

        return true;
      } catch (error) {
        console.error('发送错误给Agent失败:', error);
        if (showNotification) {
          message.error('发送错误信息失败');
        }
        return false;
      }
    },
    [showNotification],
  );

  /**
   * 检查并发送错误给Agent
   */
  const checkAndSendError = useCallback(
    async (
      logs: DevLogEntry[],
      sendMessage: (attachments?: Attachment[]) => void,
    ): Promise<boolean> => {
      if (!autoHandleEnabled || isProcessingRef.current || !canSendError()) {
        return false;
      }

      isProcessingRef.current = true;

      try {
        const latestError = findLatestUnsentError(logs);
        if (!latestError) {
          return false;
        }

        return await sendErrorToAgent(latestError, logs, sendMessage);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [autoHandleEnabled, canSendError, findLatestUnsentError, sendErrorToAgent],
  );

  /**
   * 处理文件操作完成后的错误检测
   */
  const handleFileOperationComplete = useCallback(
    (
      logs: DevLogEntry[],
      sendMessage: (attachments?: Attachment[]) => void,
    ) => {
      if (!autoHandleEnabled) return;

      // 清除之前的定时器
      if (errorDetectionTimerRef.current) {
        clearTimeout(errorDetectionTimerRef.current);
      }

      // 延迟检测错误，等待错误产生
      errorDetectionTimerRef.current = setTimeout(() => {
        checkAndSendError(logs, sendMessage);
      }, errorDetectionDelay);
    },
    [autoHandleEnabled, errorDetectionDelay, checkAndSendError],
  );

  /**
   * 处理预览白屏错误
   */
  const handlePreviewWhiteScreen = useCallback(
    (
      logs: DevLogEntry[],
      sendMessage: (attachments?: Attachment[]) => void,
    ) => {
      if (!autoHandleEnabled) return;

      // 立即检测错误
      checkAndSendError(logs, sendMessage);
    },
    [autoHandleEnabled, checkAndSendError],
  );

  /**
   * 处理Agent输出结束后的错误检测
   */
  const handleAgentPromptEnd = useCallback(
    (
      logs: DevLogEntry[],
      sendMessage: (attachments?: Attachment[]) => void,
    ) => {
      if (!autoHandleEnabled) return;

      // 延迟检测，给Agent一些时间完成操作
      setTimeout(() => {
        checkAndSendError(logs, sendMessage);
      }, 2000);
    },
    [autoHandleEnabled, checkAndSendError],
  );

  /**
   * 获取错误统计信息
   */
  const getErrorStats = useCallback(() => {
    const totalErrors = sentErrors.size;
    const unsentErrors = 0; // 这里需要传入当前日志来计算

    return {
      totalErrors,
      sentErrors: totalErrors,
      unsentErrors,
    };
  }, [sentErrors]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (errorDetectionTimerRef.current) {
        clearTimeout(errorDetectionTimerRef.current);
      }
    };
  }, []);

  return {
    autoHandleEnabled,
    setAutoHandleEnabled: handleSetAutoHandleEnabled,
    checkAndSendError,
    handleFileOperationComplete,
    handlePreviewWhiteScreen,
    handleAgentPromptEnd,
    getErrorStats,
  };
};

/**
 * 简化的自动错误处理Hook
 * @param projectId 项目ID
 * @returns 简化的自动错误处理状态和方法
 */
export const useSimpleAutoErrorHandling = (projectId: string) => {
  return useAutoErrorHandling(projectId, {
    enabled: true,
    errorDetectionDelay: 1000,
    maxSendFrequency: 30000,
    showNotification: true,
  });
};

/**
 * 错误处理状态管理Hook
 * @param projectId 项目ID
 * @returns 错误处理状态管理
 */
export const useErrorHandlingState = (projectId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedTime, setLastProcessedTime] = useState<number>(0);
  const [processedErrors, setProcessedErrors] = useState<Set<string>>(
    new Set(),
  );

  /**
   * 标记错误为正在处理
   */
  const markAsProcessing = useCallback((errorFingerprint: string) => {
    setIsProcessing(true);
    setLastProcessedTime(Date.now());
    setProcessedErrors((prev) => new Set(prev).add(errorFingerprint));
  }, []);

  /**
   * 标记错误处理完成
   */
  const markAsCompleted = useCallback(() => {
    setIsProcessing(false);
  }, []);

  /**
   * 重置处理状态
   */
  const resetProcessingState = useCallback(() => {
    setIsProcessing(false);
    setLastProcessedTime(0);
    setProcessedErrors(new Set());
  }, []);

  /**
   * 检查是否正在处理
   */
  const isCurrentlyProcessing = useCallback((): boolean => {
    return isProcessing;
  }, [isProcessing]);

  /**
   * 检查错误是否已处理
   */
  const isErrorProcessed = useCallback(
    (errorFingerprint: string): boolean => {
      return processedErrors.has(errorFingerprint);
    },
    [processedErrors],
  );

  return {
    isProcessing,
    lastProcessedTime,
    processedErrors,
    markAsProcessing,
    markAsCompleted,
    resetProcessingState,
    isCurrentlyProcessing,
    isErrorProcessed,
  };
};
