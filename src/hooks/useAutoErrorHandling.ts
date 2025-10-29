/**
 * 自动错误处理 Hook
 * 实现自动检测错误并发送到 AI 进行处理
 */

import { filterErrorLogs } from '@/pages/AppDev/utils/devLogParser';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import { Modal } from 'antd';
import { useCallback, useRef, useState } from 'react';

interface UseAutoErrorHandlingProps {
  /** 开发日志管理对象 */
  devLogs: {
    logs: DevLogEntry[];
    hasErrorInLatestBlock: boolean;
  };
  /** 添加日志到聊天框的回调 */
  onAddToChat: (content: string, isAuto?: boolean) => void;
  /** 聊天加载状态 */
  isChatLoading: boolean;
  /** 是否启用自动错误处理 */
  enabled?: boolean;
}

interface UseAutoErrorHandlingReturn {
  /** 当前自动重试次数 */
  autoRetryCount: number;
  /** 是否启用自动处理 */
  isAutoHandlingEnabled: boolean;
  /** 自动处理错误（从日志中提取） */
  handleAutoError: () => void;
  /** 处理自定义错误内容（支持多种场景） */
  handleCustomError: (
    errorContent: string,
    errorType?: 'whiteScreen' | 'log' | 'iframe',
    isAuto?: boolean,
  ) => void;
  /** 重置自动重试计数 */
  resetAutoRetryCount: () => void;
  /** 用户确认继续自动处理 */
  handleUserConfirmContinue: () => void;
  /** 用户取消自动处理 */
  handleUserCancelAuto: () => void;
}

/**
 * 自动错误处理 Hook
 * @param props Hook 参数
 * @returns 自动错误处理相关状态和方法
 */
export const useAutoErrorHandling = ({
  devLogs,
  onAddToChat,
  isChatLoading,
  enabled = true,
}: UseAutoErrorHandlingProps): UseAutoErrorHandlingReturn => {
  // 状态管理
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [isAutoHandlingEnabled, setIsAutoHandlingEnabled] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasShownConfirmModal, setHasShownConfirmModal] = useState(false);

  // 使用 ref 避免闭包问题
  const lastErrorTimestampRef = useRef<string | null>(null);
  const lastCustomErrorHashRef = useRef<string | null>(null); // 自定义错误的哈希值
  const autoRetryCountRef = useRef(0);
  const hasShownConfirmModalRef = useRef(false);
  const previousErrorLineNumbersRef = useRef<Set<number>>(new Set());

  /**
   * 重置自动重试计数
   */
  const resetAutoRetryCount = useCallback(() => {
    setAutoRetryCount(0);
    autoRetryCountRef.current = 0;
    lastErrorTimestampRef.current = null;
    lastCustomErrorHashRef.current = null;
    setHasShownConfirmModal(false);
    hasShownConfirmModalRef.current = false;
  }, []);

  /**
   * 用户确认继续自动处理
   */
  const handleUserConfirmContinue = useCallback(() => {
    resetAutoRetryCount();
    setIsAutoHandlingEnabled(true);
  }, [resetAutoRetryCount]);

  /**
   * 用户取消自动处理
   */
  const handleUserCancelAuto = useCallback(() => {
    setIsAutoHandlingEnabled(false);
  }, []);

  /**
   * 显示确认弹窗
   */
  const showConfirmModal = useCallback(() => {
    if (hasShownConfirmModalRef.current) {
      return; // 已经显示过弹窗，避免重复显示
    }

    hasShownConfirmModalRef.current = true;
    setHasShownConfirmModal(true);

    Modal.confirm({
      title: '自动错误处理已达上限',
      content: '已自动处理3次错误，是否继续自动处理？',
      okText: '继续',
      cancelText: '取消',
      onOk: () => {
        handleUserConfirmContinue();
        hasShownConfirmModalRef.current = false;
      },
      onCancel: () => {
        handleUserCancelAuto();
        hasShownConfirmModalRef.current = false;
      },
    });
  }, [handleUserConfirmContinue, handleUserCancelAuto]);

  /**
   * 格式化错误内容（根据场景类型）
   */
  const formatErrorContent = useCallback(
    (errorContent: string, errorType?: 'whiteScreen' | 'log' | 'iframe') => {
      const trimmedContent = errorContent.trim();
      if (!trimmedContent) {
        return '';
      }

      // 根据错误类型选择不同的格式
      switch (errorType) {
        case 'whiteScreen':
          // 白屏错误格式
          return `检测到预览页面白屏，捕获到以下错误，请分析并修复：\n\n\`\`\`\n${trimmedContent}\n\`\`\``;

        case 'log':
          // 日志错误格式
          return `分析以下日志并修复错误：\n\n\`\`\`\n${trimmedContent}\n\`\`\``;

        case 'iframe':
          // iframe 加载错误格式
          return `预览页面加载失败，请分析并修复：\n\n\`\`\`\n${trimmedContent}\n\`\`\``;

        default:
          // 默认格式（保持原有逻辑）
          return trimmedContent;
      }
    },
    [],
  );

  /**
   * 处理自定义错误内容（支持多种场景）
   * 统一由 autoErrorHandling 管理，包括重试次数限制和用户确认
   */
  const handleCustomError = useCallback(
    (
      errorContent: string,
      errorType: 'whiteScreen' | 'log' | 'iframe' = 'whiteScreen',
      isAuto?: boolean,
    ) => {
      // 检查是否启用
      if (!enabled || !isAutoHandlingEnabled) {
        console.warn(
          '[AutoErrorHandling] 自动错误处理未启用，跳过自定义错误处理',
        );
        return;
      }

      // 检查聊天是否正在加载
      if (isChatLoading) {
        console.warn('[AutoErrorHandling] AI 正在处理中，跳过自定义错误处理');
        return;
      }

      if (!errorContent.trim()) {
        return;
      }

      // 根据场景格式化错误内容
      const formattedContent = formatErrorContent(errorContent, errorType);

      // 使用格式化后的内容哈希来判断是否为新错误（避免重复）
      const errorHash = formattedContent.trim();
      const isDuplicate = errorHash === lastCustomErrorHashRef.current;
      if (isDuplicate) {
        console.debug('[AutoErrorHandling] 跳过重复的自定义错误');
        return;
      }

      if (!isAuto) {
        // 手动发送时，直接发送
        onAddToChat(formattedContent, false);
        return;
      }

      // 更新错误哈希
      lastCustomErrorHashRef.current = errorHash;

      // 检查重试次数
      autoRetryCountRef.current += 1;
      setAutoRetryCount(autoRetryCountRef.current);

      // 如果重试次数 <= 3，直接发送
      if (autoRetryCountRef.current <= 3) {
        // 使用格式化后的内容自动发送到聊天框
        onAddToChat(formattedContent, true);
      } else {
        // 第4次及以上，显示确认弹窗
        if (!hasShownConfirmModalRef.current) {
          showConfirmModal();
        }
      }
    },
    [
      enabled,
      isAutoHandlingEnabled,
      isChatLoading,
      formatErrorContent,
      onAddToChat,
      showConfirmModal,
    ],
  );

  /**
   * 自动处理错误（从日志中提取）
   */
  const handleAutoError = useCallback(() => {
    // 检查是否启用
    if (!enabled || !isAutoHandlingEnabled) {
      return;
    }

    // 检查聊天是否正在加载
    if (isChatLoading) {
      return;
    }

    // 从当前日志中过滤出错误日志
    const errorLogs = filterErrorLogs(devLogs.logs);

    if (errorLogs.length === 0) {
      return; // 没有错误
    }

    // 找出新的错误（通过行号比较）
    const newErrorLogs = errorLogs.filter(
      (log) => !previousErrorLineNumbersRef.current.has(log.line),
    );

    if (newErrorLogs.length === 0) {
      return; // 没有新错误
    }

    // 更新已处理的行号
    newErrorLogs.forEach((log) => {
      previousErrorLineNumbersRef.current.add(log.line);
    });

    // 获取最新的错误日志
    const latestError = newErrorLogs[newErrorLogs.length - 1];

    // 使用时间戳来判断是否为新错误
    const currentErrorTimestamp = latestError.timestamp || null;

    // 检查是否和上次错误时间戳相同
    if (
      lastErrorTimestampRef.current &&
      currentErrorTimestamp &&
      currentErrorTimestamp === lastErrorTimestampRef.current
    ) {
      return; // 跳过重复错误（同一时间戳）
    }

    // 更新错误时间戳
    lastErrorTimestampRef.current = currentErrorTimestamp;

    // 检查重试次数
    autoRetryCountRef.current += 1;
    setAutoRetryCount(autoRetryCountRef.current);

    // 如果重试次数 <= 3，直接发送
    if (autoRetryCountRef.current <= 3) {
      // 格式化错误日志
      const errorContent = newErrorLogs
        .map((log) => log.content)
        .join('\n')
        .trim();

      // 使用统一的格式化逻辑（日志错误类型）
      const formattedContent = formatErrorContent(errorContent, 'log');

      // 自动发送到聊天框
      onAddToChat(formattedContent, true);
    } else {
      // 第4次及以上，显示确认弹窗
      if (!hasShownConfirmModalRef.current) {
        showConfirmModal();
      }
    }
  }, [
    enabled,
    isAutoHandlingEnabled,
    isChatLoading,
    devLogs.logs,
    formatErrorContent,
    onAddToChat,
    showConfirmModal,
  ]);

  return {
    autoRetryCount,
    isAutoHandlingEnabled,
    handleAutoError,
    handleCustomError,
    resetAutoRetryCount,
    handleUserConfirmContinue,
    handleUserCancelAuto,
  };
};
