import { useCallback, useRef } from 'react';

/** URL 检测结果 */
interface CheckResult {
  ok: boolean;
  status?: number;
}

interface UrlRetryOptions {
  /** 重试间隔（毫秒），默认 5000 */
  retryInterval?: number;
  /** 最大重试时长（毫秒），默认 60000 */
  maxRetryDuration?: number;
  /** 需要重试的状态码列表，默认 [404] */
  retryStatusCodes?: number[];
  /**
   * 自定义 URL 检测函数，可用于后端 API 代理绕过 CORS
   * 如果不提供，则使用 fetch HEAD 请求（可能受 CORS 限制）
   */
  checkFn?: (url: string) => Promise<CheckResult>;
}

interface UrlCheckResult {
  ok: boolean;
  status?: number;
  shouldRetry: boolean;
  isTimeout: boolean;
  elapsedTime: number;
}

interface UseUrlRetryReturn {
  /** 检测 URL 是否可用，并处理重试逻辑 */
  checkWithRetry: (url: string, onRetry: () => void) => Promise<UrlCheckResult>;
  /** 清除当前的重试定时器 */
  clearRetry: () => void;
  /** 重置重试状态（清除定时器和开始时间） */
  resetRetry: () => void;
}

/**
 * URL 重试 Hook
 * 用于处理 URL 请求的重试逻辑，支持自定义重试间隔、最大时长和触发重试的状态码
 */
export function useUrlRetry(options: UrlRetryOptions = {}): UseUrlRetryReturn {
  const {
    retryInterval = 5000,
    maxRetryDuration = 60000,
    retryStatusCodes = [404],
    checkFn,
  } = options;

  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryStartTimeRef = useRef<number | null>(null);

  // 清除重试定时器
  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // 重置重试状态
  const resetRetry = useCallback(() => {
    clearRetry();
    retryStartTimeRef.current = null;
  }, [clearRetry]);

  // 检测 URL 是否可用
  const checkUrl = useCallback(
    async (url: string): Promise<{ ok: boolean; status?: number }> => {
      console.log('[useUrlRetry] Start URL availability check:', url);

      // 如果提供了自定义检测函数，优先使用（用于后端 API 代理绕过 CORS）
      if (checkFn) {
        try {
          const result = await checkFn(url);
          console.log('[useUrlRetry] Check result (via API):', result);
          return result;
        } catch (error) {
          console.log('[useUrlRetry] API check failed:', error);
          return { ok: false, status: 500 };
        }
      }

      // 回退到直接 fetch（可能受 CORS 限制）
      try {
        const response = await fetch(url, { method: 'HEAD' });
        console.log('[useUrlRetry] Check result (via fetch):', {
          ok: response.ok,
          status: response.status,
        });
        return { ok: response.ok, status: response.status };
      } catch (error) {
        console.log(
          '[useUrlRetry] Check failed (network error or CORS restriction):',
          error,
        );
        // 网络错误或 CORS 阻止，返回 ok 让调用者决定如何处理
        return { ok: true };
      }
    },
    [checkFn],
  );

  // 带重试逻辑的 URL 检测
  const checkWithRetry = useCallback(
    async (url: string, onRetry: () => void): Promise<UrlCheckResult> => {
      const result = await checkUrl(url);
      const elapsed = retryStartTimeRef.current
        ? Date.now() - retryStartTimeRef.current
        : 0;

      // 判断是否需要重试
      const shouldRetryStatus =
        result.status !== undefined && retryStatusCodes.includes(result.status);

      if (shouldRetryStatus) {
        // 初始化重试开始时间
        console.log('[useUrlRetry] Retryable status detected:', result.status);
        if (!retryStartTimeRef.current) {
          retryStartTimeRef.current = Date.now();
          console.log('[useUrlRetry] Retry timer started.');
        }

        const currentElapsed = Date.now() - retryStartTimeRef.current;

        if (currentElapsed >= maxRetryDuration) {
          // 超时，停止重试
          console.log(
            '[useUrlRetry] Retry timeout exceeded. elapsed:',
            currentElapsed,
            'ms, max:',
            maxRetryDuration,
            'ms',
          );
          resetRetry();
          return {
            ok: false,
            status: result.status,
            shouldRetry: false,
            isTimeout: true,
            elapsedTime: currentElapsed,
          };
        }

        // 设置下一次重试
        console.log(
          `[useUrlRetry] Retry in ${retryInterval}ms. status: ${
            result.status
          }, elapsed: ${Math.round(currentElapsed / 1000)}s`,
        );
        retryTimerRef.current = setTimeout(onRetry, retryInterval);

        return {
          ok: false,
          status: result.status,
          shouldRetry: true,
          isTimeout: false,
          elapsedTime: currentElapsed,
        };
      }

      // 不需要重试
      console.log('[useUrlRetry] Validation passed. status:', result.status);
      resetRetry();
      return {
        ok: result.ok,
        status: result.status,
        shouldRetry: false,
        isTimeout: false,
        elapsedTime: elapsed,
      };
    },
    [checkUrl, retryStatusCodes, maxRetryDuration, retryInterval, resetRetry],
  );

  return {
    checkWithRetry,
    clearRetry,
    resetRetry,
  };
}
