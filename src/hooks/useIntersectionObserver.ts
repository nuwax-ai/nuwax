import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (
  options: IntersectionObserverInit = {
    threshold: 0,
    rootMargin: '100px 0px 0px 0px', // 提前 100px 触发
  },
) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 动态提取依赖以防变化
    const observerOptions = {
      root: options.root,
      rootMargin: options.rootMargin,
      threshold: options.threshold,
    };

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, observerOptions);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [options.root, options.rootMargin, options.threshold, ref.current]);

  return { ref, inView };
};
