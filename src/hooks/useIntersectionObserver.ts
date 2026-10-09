import { useCallback, useEffect, useState } from 'react';

export const useIntersectionObserver = (
  options: IntersectionObserverInit = {
    threshold: 0,
    rootMargin: '100px 0px 0px 0px', // 提前 100px 触发
  },
) => {
  const [inView, setInView] = useState(false);
  // 观察目标用回调 ref 收进 state：ref.current 写进依赖数组无法感知
  // 「卸载→重挂载」（渲染期求值时 ref 尚未挂上新节点，null→null 恒不变），
  // 会导致哨兵重挂后永远不被 observe（切会话回来上滑加载失效的根因）
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const ref = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) {
      setInView(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        root: options.root,
        rootMargin: options.rootMargin,
        threshold: options.threshold,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options.root, options.rootMargin, options.threshold]);

  return { ref, inView };
};
