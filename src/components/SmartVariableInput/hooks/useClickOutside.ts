import { RefObject, useEffect } from 'react';

/**
 * Hook 用于检测点击目标元素外部的事件
 * @param ref 目标元素的 ref
 * @param handler 点击外部时触发的回调函数
 * @param excludeRefs 需要排除的其他元素 refs
 */
const useClickOutside = (
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void,
  excludeRefs: RefObject<HTMLElement>[] = [],
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // 检查点击事件是否发生在目标元素外部
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      // 检查是否点击在排除的元素上
      const clickedOnExcludedEl = excludeRefs.some(
        (excludeRef) =>
          excludeRef.current && excludeRef.current.contains(target),
      );

      if (clickedOnExcludedEl) {
        return;
      }

      handler(event);
    };

    // 添加点击和触摸事件监听器
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      // 清理事件监听器
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, excludeRefs]);
};

export default useClickOutside;
