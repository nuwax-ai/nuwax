import { useRef } from 'react';
import { useRequest } from 'umi';

interface PendingPromiseResolver<TData = any> {
  resolve: (value: TData) => void;
  reject: (error?: any) => void;
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
const useRequestPromiseBridge = (service: any, options: any = {}) => {
  const pendingRef = useRef<PendingPromiseResolver | null>(null);
  const { onSuccess, onError, ...restOptions } = options;

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
      try {
        await onError?.(error, ...args);
        pending?.reject(error);
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
