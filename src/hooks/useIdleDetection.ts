import { createLogger } from '@/utils/logger';
import { throttle } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

// 创建空闲检测专用 logger（统一前缀 [Idle:*] 方便筛选）
const idleLogger = createLogger('[Idle:Detection]');

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
  /**
   * 需要监听的 iframe 选择器
   * 用于监听同源 iframe 内的用户活动
   * 例如: 'iframe[title="VNC Preview"]' 或 '#vnc-iframe'
   * 注意: 仅支持同源 iframe，跨域 iframe 会被自动跳过
   */
  iframeSelector?: string;
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
 *     console.log('User is idle');
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
    iframeSelector,
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
    idleLogger.log('⏸️ 暂停空闲检测');
    setIsPaused(true);
    clearIdleTimer();
  }, [clearIdleTimer]);

  /**
   * 恢复空闲检测
   */
  const resume = useCallback(() => {
    idleLogger.log('▶️ 恢复空闲检测');
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
   * 尝试获取同源 iframe 的 contentDocument
   * 跨域 iframe 会抛出安全错误，返回 null
   */
  const getIframeDocument = useCallback(
    (iframe: HTMLIFrameElement): Document | null => {
      try {
        // 尝试访问 contentDocument（同源才能访问）
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          // 额外检查是否真的可以访问（有些情况下虽然不抛错但返回空）
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          doc.body; // 尝试访问 body 来确认权限
          return doc;
        }
      } catch (e) {
        // 跨域 iframe 会抛出 SecurityError
        idleLogger.log('⚠️ 无法访问 iframe（可能是跨域）', {
          src: iframe.src,
          error: (e as Error).message,
        });
      }
      return null;
    },
    [],
  );

  /**
   * 设置和清理事件监听器
   */
  useEffect(() => {
    // 如果未启用或没有目标元素，不设置监听器
    if (!enabled || !targetElement) {
      idleLogger.log('🚫 空闲检测未启用', {
        enabled,
        hasTarget: !!targetElement,
      });
      clearIdleTimer();
      return;
    }

    // 如果暂停中，不设置监听器
    if (isPaused) {
      idleLogger.log('⏸️ 空闲检测已暂停，跳过事件监听器设置');
      return;
    }

    idleLogger.log(
      '✅ 空闲检测已启用',
      `监听事件: ${ACTIVITY_EVENTS.join(', ')}`,
    );

    // 启动初始定时器
    startIdleTimer();

    // 事件处理函数
    const handleActivity = () => {
      throttledResetRef.current();
    };

    // 添加事件监听器到主文档
    ACTIVITY_EVENTS.forEach((event) => {
      targetElement.addEventListener(event, handleActivity, { passive: true });
    });

    // 清理函数
    return () => {
      idleLogger.log('🧹 清理空闲检测事件监听器');
      clearIdleTimer();
      throttledResetRef.current.cancel();
      ACTIVITY_EVENTS.forEach((event) => {
        targetElement.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, targetElement, isPaused, startIdleTimer, clearIdleTimer]);

  /**
   * 监听同源 iframe 内的用户活动
   * 使用单独的 useEffect 以便在 iframe 加载后动态绑定
   */
  useEffect(() => {
    if (!enabled || isPaused || !iframeSelector) {
      return;
    }

    // 存储已绑定的 iframe document，用于清理
    const boundIframeDocs: Document[] = [];

    // 事件处理函数
    const handleIframeActivity = () => {
      idleLogger.log('🖥️ 检测到 iframe 内用户活动');
      throttledResetRef.current();
    };

    /**
     * 为 iframe 绑定事件监听器
     */
    const bindIframeEvents = (iframe: HTMLIFrameElement) => {
      const iframeDoc = getIframeDocument(iframe);
      if (!iframeDoc) return;

      // 避免重复绑定
      if (boundIframeDocs.includes(iframeDoc)) return;

      idleLogger.log('🔗 绑定 iframe 事件监听器', { src: iframe.src });

      ACTIVITY_EVENTS.forEach((event) => {
        iframeDoc.addEventListener(event, handleIframeActivity, {
          passive: true,
        });
      });

      boundIframeDocs.push(iframeDoc);
    };

    /**
     * 扫描并绑定所有匹配的 iframe
     */
    const scanAndBindIframes = () => {
      const iframes =
        document.querySelectorAll<HTMLIFrameElement>(iframeSelector);
      idleLogger.log('🔍 扫描 iframe', {
        selector: iframeSelector,
        count: iframes.length,
      });

      iframes.forEach((iframe) => {
        // 如果 iframe 已加载，直接绑定
        if (iframe.contentDocument?.readyState === 'complete') {
          bindIframeEvents(iframe);
        } else {
          // 否则等待 load 事件
          iframe.addEventListener('load', () => bindIframeEvents(iframe), {
            once: true,
          });
        }
      });
    };

    // 初始扫描
    scanAndBindIframes();

    // 使用 MutationObserver 监听 DOM 变化，处理动态添加的 iframe
    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (
            node instanceof HTMLIFrameElement &&
            node.matches(iframeSelector)
          ) {
            shouldRescan = true;
          } else if (
            node instanceof Element &&
            node.querySelector(iframeSelector)
          ) {
            shouldRescan = true;
          }
        });
      });
      if (shouldRescan) {
        idleLogger.log('🔄 检测到新 iframe，重新扫描');
        scanAndBindIframes();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 清理函数
    return () => {
      observer.disconnect();
      boundIframeDocs.forEach((iframeDoc) => {
        ACTIVITY_EVENTS.forEach((event) => {
          try {
            iframeDoc.removeEventListener(event, handleIframeActivity);
          } catch {
            // iframe 可能已被移除，忽略错误
          }
        });
      });
      idleLogger.log('🧹 清理 iframe 事件监听器', {
        count: boundIframeDocs.length,
      });
    };
  }, [enabled, isPaused, iframeSelector, getIframeDocument]);

  /**
   * 监听页面可见性变化
   * 页面切出时暂停检测，切回时重置计时器
   */
  useEffect(() => {
    if (!enabled || isPaused) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面被切出，清除计时器（暂停检测）
        idleLogger.log('👁️ 页面切出，暂停空闲计时器');
        clearIdleTimer();
      } else {
        // 页面切回，重置计时器（重新开始计时）
        idleLogger.log('👁️ 页面切回，重置空闲计时器');
        resetIdleTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isPaused, clearIdleTimer, resetIdleTimer]);

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
