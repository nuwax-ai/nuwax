import { RefObject, useEffect } from 'react';

/**
 * Hook 用于检测点击目标元素外部的事件
 * @param ref 目标元素的 ref
 * @param handler 点击外部时触发的回调函数
 * @param excludeRefs 需要排除的其他元素 refs
 * @param excludeClassNames 需要排除的 class 名称列表（支持检查元素或其父元素）
 */
const useClickOutside = (
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void,
  excludeRefs: RefObject<HTMLElement>[] = [],
  excludeClassNames: string[] = [],
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

      // 检查是否点击在排除的 class 元素上（检查元素本身及其所有父元素）
      if (excludeClassNames.length > 0 && target instanceof HTMLElement) {
        let current: HTMLElement | null = target;
        while (current) {
          const element = current; // 保存当前元素引用，避免循环中的闭包问题
          if (
            excludeClassNames.some((className) =>
              element.classList.contains(className),
            )
          ) {
            return;
          }
          current = current.parentElement;
        }
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
  }, [ref, handler, excludeRefs, excludeClassNames]);
};

export default useClickOutside;
