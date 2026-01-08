import { throttle } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 空闲检测 Hook 配置选项
 */
export interface UseIdleDetectionOptions {
  /**
   * 空闲超时时间（毫秒）
   * @default 3600000 (60分钟)
   */
  idleTimeoutMs?: number;
  /**
   * 是否启用空闲检测
   * @default true
   */
  enabled?: boolean;
  /**
   * 监听目标元素，默认监听 document
   * 用于在特定区域内检测用户活动
   */
  targetElement?: HTMLElement | Document | null;
  /**
   * 空闲超时回调
   * 当用户空闲时间达到 idleTimeoutMs 时触发
   */
  onIdle?: () => void;
  /**
   * 用户活动回调
   * 当检测到用户活动时触发（节流后）
   */
  onActivity?: () => void;
  /**
   * 事件节流间隔（毫秒）
   * 用于优化高频事件的性能
   * @default 1000
   */
  throttleMs?: number;
}

/**
 * 空闲检测 Hook 返回值
 */
export interface UseIdleDetectionReturn {
  /**
   * 当前是否处于空闲状态
   */
  isIdle: boolean;
  /**
   * 手动重置空闲计时器
   * 调用后会重新开始计时
   */
  resetIdleTimer: () => void;
  /**
   * 最后一次用户活动的时间戳
   */
  lastActivityTime: number;
  /**
   * 暂停空闲检测
   */
  pause: () => void;
  /**
   * 恢复空闲检测
   */
  resume: () => void;
  /**
   * 检测是否暂停中
   */
  isPaused: boolean;
}

/**
 * 需要监听的用户活动事件列表
 * 包括鼠标、键盘、触摸等交互事件
 */
const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'mouseup',
  'click',
  'keydown',
  'keyup',
  'touchstart',
  'touchmove',
  'touchend',
  'scroll',
  'wheel',
] as const;

/**
 * 用户空闲检测 Hook
 *
 * 用于检测用户是否在指定时间内没有进行任何操作。
 * 适用于自动登出、节能模式、资源释放等场景。
 *
 * @param options - 配置选项
 * @returns 空闲状态和控制方法
 *
 * @example
 * ```tsx
 * const { isIdle, resetIdleTimer } = useIdleDetection({
 *   idleTimeoutMs: 60 * 60 * 1000, // 60分钟
 *   enabled: true,
 *   onIdle: () => {
 *     console.log('用户已空闲');
 *   },
 * });
 * ```
 */
export function useIdleDetection(
  options: UseIdleDetectionOptions = {},
): UseIdleDetectionReturn {
  const {
    idleTimeoutMs = 60 * 60 * 1000, // 默认60分钟
    enabled = true,
    targetElement = typeof document !== 'undefined' ? document : null,
    onIdle,
    onActivity,
    throttleMs = 1000, // 默认1秒节流
  } = options;

  // 空闲状态
  const [isIdle, setIsIdle] = useState(false);
  // 最后活动时间
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  // 是否暂停
  const [isPaused, setIsPaused] = useState(false);

  // 使用 ref 存储定时器，避免闭包问题
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 使用 ref 存储回调函数，确保始终使用最新的回调
  const onIdleRef = useRef(onIdle);
  const onActivityRef = useRef(onActivity);
  // 使用 ref 存储 enabled 状态，用于节流函数内部判断
  const enabledRef = useRef(enabled);
  const isPausedRef = useRef(isPaused);

  // 更新 ref 值
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  /**
   * 清除空闲定时器
   */
  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  /**
   * 启动空闲定时器
   */
  const startIdleTimer = useCallback(() => {
    clearIdleTimer();

    idleTimerRef.current = setTimeout(() => {
      // 检查是否仍然启用且未暂停
      if (enabledRef.current && !isPausedRef.current) {
        setIsIdle(true);
        onIdleRef.current?.();
      }
    }, idleTimeoutMs);
  }, [clearIdleTimer, idleTimeoutMs]);

  /**
   * 重置空闲计时器
   * 当检测到用户活动时调用
   */
  const resetIdleTimer = useCallback(() => {
    const now = Date.now();
    setLastActivityTime(now);
    setIsIdle(false);
    startIdleTimer();
    onActivityRef.current?.();
  }, [startIdleTimer]);

  /**
   * 暂停空闲检测
   */
  const pause = useCallback(() => {
    setIsPaused(true);
    clearIdleTimer();
  }, [clearIdleTimer]);

  /**
   * 恢复空闲检测
   */
  const resume = useCallback(() => {
    setIsPaused(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

  /**
   * 处理用户活动事件（节流版本）
   * 使用 useRef 存储节流函数，避免重复创建
   */
  const throttledResetRef = useRef(
    throttle(() => {
      // 只有在启用且未暂停时才重置计时器
      if (enabledRef.current && !isPausedRef.current) {
        resetIdleTimer();
      }
    }, throttleMs),
  );

  // 当 throttleMs 或 resetIdleTimer 变化时更新节流函数
  useEffect(() => {
    throttledResetRef.current = throttle(() => {
      if (enabledRef.current && !isPausedRef.current) {
        resetIdleTimer();
      }
    }, throttleMs);

    return () => {
      throttledResetRef.current.cancel();
    };
  }, [throttleMs, resetIdleTimer]);

  /**
   * 设置和清理事件监听器
   */
  useEffect(() => {
    // 如果未启用或没有目标元素，不设置监听器
    if (!enabled || !targetElement) {
      clearIdleTimer();
      return;
    }

    // 如果暂停中，不设置监听器
    if (isPaused) {
      return;
    }

    // 启动初始定时器
    startIdleTimer();

    // 事件处理函数
    const handleActivity = () => {
      throttledResetRef.current();
    };

    // 添加事件监听器
    ACTIVITY_EVENTS.forEach((event) => {
      targetElement.addEventListener(event, handleActivity, { passive: true });
    });

    // 清理函数
    return () => {
      clearIdleTimer();
      throttledResetRef.current.cancel();
      ACTIVITY_EVENTS.forEach((event) => {
        targetElement.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, targetElement, isPaused, startIdleTimer, clearIdleTimer]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearIdleTimer();
      throttledResetRef.current.cancel();
    };
  }, [clearIdleTimer]);

  return {
    isIdle,
    resetIdleTimer,
    lastActivityTime,
    pause,
    resume,
    isPaused,
  };
}

export default useIdleDetection;
