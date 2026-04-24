import { useRef } from 'react';
import { useRequest } from 'umi';

interface PendingPromiseResolver<TData = any> {
  resolve: (value: TData) => void;
  reject: (error?: any) => void;
}

interface UseRequestPromiseBridgeOptions {
  /**
   * 是否将非 Error 类型的异常统一包装成 Error。
   * 默认 false，保持历史行为，避免影响既有调用方。
   */
  normalizeUnknownError?: boolean;
  [key: string]: any;
}

/**
 * useRequest Promise 桥接 Hook
 *
 * 设计目的：
 * 1. 兼容当前 useRequest 仅提供 run（不提供 runAsync）的场景；
 * 2. 对外暴露 runWithPromise，让调用方可以 await 请求结束；
 * 3. 封装 pending Promise 的 resolve/reject 管理，减少业务页侵入。
 *
 * @param service - useRequest 对应的请求方法
 * @param options - useRequest 配置项
 * @returns 原 useRequest 返回值 + runWithPromise
 */
const useRequestPromiseBridge = (
  service: any,
  options: UseRequestPromiseBridgeOptions = {},
) => {
  const pendingRef = useRef<PendingPromiseResolver | null>(null);
  const {
    onSuccess,
    onError,
    normalizeUnknownError = false,
    ...restOptions
  } = options;

  /**
   * 规范化请求错误对象，避免调用方只拿到 undefined。
   *
   * 场景：
   * - 全局错误处理链路异常中断；
   * - 第三方库在某些分支没有抛出标准 Error。
   *
   * @param rawError - 原始错误对象
   * @returns 统一的 Error 实例（附带 info 便于日志排查）
   */
  const normalizeRequestError = (rawError: any): Error => {
    if (rawError instanceof Error) {
      return rawError;
    }

    const fallbackError = new Error(
      rawError ? String(rawError) : 'API request failed with unknown error',
    );
    (fallbackError as any).name = 'UnknownRequestError';
    (fallbackError as any).info = {
      message: rawError ? String(rawError) : 'Unknown error from request layer',
      serviceName: service?.name || 'anonymousService',
    };
    return fallbackError;
  };

  const requestResult = useRequest(service, {
    ...restOptions,
    onSuccess: async (...args: any[]) => {
      const pending = pendingRef.current;
      pendingRef.current = null;
      try {
        /**
         * 先执行业务 onSuccess，再 resolve Promise：
         * 这样外层 await 才能覆盖完整的成功回调生命周期，
         * 避免出现“验证码提前 refresh、业务 onSuccess 还未执行完”的时序问题。
         */
        await onSuccess?.(...args);
        pending?.resolve(args?.[0]);
      } catch (callbackError) {
        pending?.reject(callbackError);
      }
    },
    onError: async (error: any, ...args: any[]) => {
      const pending = pendingRef.current;
      pendingRef.current = null;
      const normalizedError = normalizeUnknownError
        ? normalizeRequestError(error)
        : error;
      try {
        await onError?.(normalizedError, ...args);
        pending?.reject(normalizedError);
      } catch (callbackError) {
        pending?.reject(callbackError);
      }
    },
  });

  /**
   * 以 Promise 形式触发请求，便于外部 await。
   * 当上一条请求尚未完成且再次触发时，会主动 reject 上一个 Promise，
   * 防止悬挂 Promise 长时间占用状态。
   */
  const runWithPromise = (...params: any[]) =>
    new Promise<any>((resolve, reject) => {
      if (pendingRef.current) {
        pendingRef.current.reject(
          new Error('Previous request replaced by a newer request.'),
        );
      }
      pendingRef.current = { resolve, reject };
      try {
        requestResult.run(...params);
      } catch (runError) {
        pendingRef.current = null;
        reject(runError);
      }
    });

  return {
    ...requestResult,
    runWithPromise,
  };
};

export default useRequestPromiseBridge;
