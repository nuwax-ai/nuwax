import { throttle } from 'lodash';
import { useCallback, useRef } from 'react';

/**
 * 使用 lodash throttle 的节流 Hook
 * 确保在节流期间的最后一次调用会被执行
 *
 * @param callback 要节流的回调函数
 * @param delay 节流延迟时间（毫秒）
 * @param options 配置选项
 * @returns 节流后的回调函数
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    /** 是否在开始时立即执行 */
    leading?: boolean;
    /** 是否在结束时执行最后一次调用 */
    trailing?: boolean;
  } = {},
): T {
  const { leading = true, trailing = true } = options;

  // 使用 useRef 来存储 throttle 函数，确保在组件重新渲染时不会重新创建
  const throttledRef = useRef<ReturnType<typeof throttle> | null>(null);

  // 创建节流函数
  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      // 如果还没有创建 throttle 函数，则创建一个
      if (!throttledRef.current) {
        throttledRef.current = throttle(
          (...throttleArgs: Parameters<T>) => {
            callback(...throttleArgs);
          },
          delay,
          {
            leading,
            trailing,
          },
        );
      }

      // 调用节流函数
      throttledRef.current(...args);
    },
    [callback, delay, leading, trailing],
  ) as T;

  return throttledCallback;
}
