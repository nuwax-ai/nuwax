import {
  IDLE_DETECTION_TIMEOUT_MS,
  IDLE_WARNING_COUNTDOWN_SECONDS,
} from '@/constants/common.constants';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { AgentTypeEnum } from '@/types/enums/space';
import { createLogger } from '@/utils/logger';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

// 创建远程桌面空闲警告专用 logger（统一前缀 [Idle:*] 方便筛选）
const desktopIdleLogger = createLogger('[Idle:DesktopWarning]');

/**
 * 远程桌面空闲警告 Hook 配置选项
 */
export interface UseDesktopIdleWarningOptions {
  /**
   * 智能体类型
   */
  agentType?: AgentTypeEnum;
  /**
   * 视图模式：'preview' | 'desktop'
   */
  viewMode: 'preview' | 'desktop';
  /**
   * 文件树/远程桌面面板是否可见
   */
  isFileTreeVisible: boolean;
  /**
   * 会话 ID
   */
  conversationId?: number;
  /**
   * 打开预览视图的函数（用于关闭远程桌面）
   */
  openPreviewView: (cId: number) => void;
  /**
   * 空闲超时时间（毫秒），默认使用常量配置
   */
  idleTimeoutMs?: number;
  /**
   * 倒计时秒数，默认使用常量配置
   */
  countdownSeconds?: number;
}

/**
 * 远程桌面空闲警告 Hook 返回值
 */
export interface UseDesktopIdleWarningReturn {
  /**
   * 是否显示空闲警告弹窗
   */
  showIdleWarning: boolean;
  /**
   * 处理用户取消空闲警告（点击按钮或有操作）
   */
  handleIdleWarningCancel: () => void;
  /**
   * 处理空闲警告倒计时结束：关闭远程桌面，停止 keepAlive 轮询
   */
  handleIdleWarningTimeout: () => void;
  /**
   * 倒计时秒数
   */
  countdownSeconds: number;
  /**
   * 是否启用空闲检测
   */
  isEnabled: boolean;
}

/**
 * 远程桌面空闲警告 Hook
 *
 * 用于检测用户在远程桌面模式下的空闲状态，并在空闲超时后显示警告弹窗。
 * 仅在以下条件满足时启用：
 * 1. 是任务型智能体
 * 2. 智能体电脑 tab 是激活状态（viewMode === 'desktop' 且 isFileTreeVisible === true）
 *
 * @param options - 配置选项
 * @returns 空闲警告状态和处理函数
 *
 * @example
 * ```tsx
 * const {
 *   showIdleWarning,
 *   handleIdleWarningCancel,
 *   handleIdleWarningTimeout,
 *   countdownSeconds,
 * } = useDesktopIdleWarning({
 *   agentType: agentDetail?.type,
 *   viewMode,
 *   isFileTreeVisible,
 *   conversationId: id,
 *   openPreviewView,
 * });
 *
 * // 在组件中使用
 * <IdleWarningModal
 *   open={showIdleWarning}
 *   countdownSeconds={countdownSeconds}
 *   onCancel={handleIdleWarningCancel}
 *   onTimeout={handleIdleWarningTimeout}
 * />
 * ```
 */
export function useDesktopIdleWarning(
  options: UseDesktopIdleWarningOptions,
): UseDesktopIdleWarningReturn {
  const {
    agentType,
    viewMode,
    isFileTreeVisible,
    conversationId,
    openPreviewView,
    idleTimeoutMs = IDLE_DETECTION_TIMEOUT_MS,
    countdownSeconds = IDLE_WARNING_COUNTDOWN_SECONDS,
  } = options;

  // 空闲警告弹窗状态
  const [showIdleWarning, setShowIdleWarning] = useState<boolean>(false);

  /**
   * 空闲检测启用条件：
   * 1. 是任务型智能体
   * 2. 智能体电脑 tab 是激活状态（viewMode === 'desktop' 且 isFileTreeVisible === true）
   */
  const shouldEnableIdleDetection = useMemo(() => {
    const isTaskAgent = agentType === AgentTypeEnum.TaskAgent;
    const isDesktopMode = viewMode === 'desktop';
    const result = isTaskAgent && isDesktopMode && isFileTreeVisible;

    desktopIdleLogger.log('检查启用条件', {
      isTaskAgent,
      isDesktopMode,
      isFileTreeVisible,
      shouldEnable: result,
    });

    return result;
  }, [agentType, viewMode, isFileTreeVisible]);

  // 日志记录启用状态变化
  useEffect(() => {
    if (shouldEnableIdleDetection) {
      desktopIdleLogger.log(
        '✅ 远程桌面空闲检测已启用',
        `超时时间: ${Math.round(idleTimeoutMs / 1000 / 60)}分钟`,
      );
    } else {
      desktopIdleLogger.log('🚫 远程桌面空闲检测未启用');
    }
  }, [shouldEnableIdleDetection, idleTimeoutMs]);

  /**
   * 处理空闲超时：显示警告弹窗
   */
  const handleIdleTimeout = useCallback(() => {
    desktopIdleLogger.log('⏰ 空闲超时，显示警告弹窗', {
      countdownSeconds,
      conversationId,
    });
    setShowIdleWarning(true);
  }, [countdownSeconds, conversationId]);

  // 使用空闲检测 Hook
  // 同时监听主文档和 VNC iframe 内的用户活动（同源情况下）
  const { resetIdleTimer } = useIdleDetection({
    idleTimeoutMs,
    enabled: shouldEnableIdleDetection,
    onIdle: handleIdleTimeout,
    throttleMs: 2000, // 2秒节流，避免高频事件
    // VNC iframe 选择器，用于监听远程桌面内的键鼠操作
    iframeSelector: `iframe[data-vnc-id="${conversationId}"]`,
  });

  /**
   * 处理用户取消空闲警告（点击按钮或有操作）
   */
  const handleIdleWarningCancel = useCallback(() => {
    desktopIdleLogger.log('✅ 用户取消空闲警告', '重置空闲计时器');
    setShowIdleWarning(false);
    // 重置空闲计时器
    resetIdleTimer();
    message.success('已取消自动关闭');
  }, [resetIdleTimer]);

  /**
   * 处理空闲警告倒计时结束：关闭远程桌面，停止 keepAlive 轮询
   */
  const handleIdleWarningTimeout = useCallback(() => {
    desktopIdleLogger.log('⏱️ 空闲警告倒计时结束', {
      action: '关闭远程桌面连接',
      conversationId,
    });
    setShowIdleWarning(false);
    // 关闭远程桌面视图，切换到文件预览模式
    // 调用 openPreviewView 会停止 keepAlive 并切换视图模式
    if (conversationId) {
      openPreviewView(conversationId);
    }
    message.info('由于长时间未操作，已自动关闭智能体电脑连接');
  }, [conversationId, openPreviewView]);

  return {
    showIdleWarning,
    handleIdleWarningCancel,
    handleIdleWarningTimeout,
    countdownSeconds,
    isEnabled: shouldEnableIdleDetection,
  };
}

export default useDesktopIdleWarning;
