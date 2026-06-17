import { useCallback, useEffect, useRef, useState } from 'react';

interface UseScrollSyncOptions {
  /** 分类列表 */
  categories: Array<{ type: string; name: string }>;
  /** 当前激活的标签 */
  activeTab?: string;
  /** 标签切换回调 */
  onTabClick: (type: string) => void;
  /** Intersection Observer 配置 */
  observerOptions?: {
    /** 可见度阈值 */
    threshold?: number;
    /** 根边距 */
    rootMargin?: string;
    /** 根元素 */
    root?: Element | null;
  };
  /** 滚动完成延迟时间（毫秒） */
  scrollDelay?: number;
}

interface UseScrollSyncReturn {
  /** 区域引用映射 */
  sectionRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  /** 内容容器引用 */
  contentContainerRef: React.RefObject<HTMLDivElement>;
  /** 当前可见的区域集合 */
  visibleSections: Set<string>;
  /** 是否为程序化滚动 */
  isProgrammaticScroll: boolean;
  /** 处理标签点击的方法 */
  handleTabClick: (type: string) => void;
}

/**
 * 滚动同步自定义 Hook
 * 实现内容区域与导航标签的双向同步功能
 *
 * 功能特性：
 * 1. 点击导航标签自动滚动到对应内容区域
 * 2. 滚动内容时自动切换导航标签
 * 3. 防止循环触发机制
 * 4. 智能的可见区域检测
 *
 * @param options 配置选项
 * @returns 滚动同步相关的状态和方法
 */
export const useScrollSync = ({
  categories,
  activeTab,
  onTabClick,
  observerOptions = {},
  scrollDelay = 1000,
}: UseScrollSyncOptions): UseScrollSyncReturn => {
  // 引用管理
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // 滚动同步相关状态
  const [isProgrammaticScroll, setIsProgrammaticScroll] =
    useState<boolean>(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set(),
  );

  // 合并默认配置
  const {
    threshold = 0.3,
    rootMargin = '-20% 0px -60% 0px',
    root = null,
  } = observerOptions;

  /**
   * 处理标签点击事件
   * 实现点击导航标签滚动到对应内容区域的功能
   */
  const handleTabClick = useCallback(
    (type: string) => {
      console.log(`🎯 Tab click: navigating to ${type}`);

      // 标记为程序化滚动，避免在滚动过程中触发tab切换
      setIsProgrammaticScroll(true);

      // 调用外部的标签切换回调
      onTabClick(type);

      // 滚动到对应的section
      const section = sectionRefs.current[type];
      if (section) {
        section.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        // 滚动完成后重置标记（延迟重置，确保滚动动画完成）
        setTimeout(() => {
          setIsProgrammaticScroll(false);
        }, scrollDelay);
      }
    },
    [onTabClick, scrollDelay],
  );

  /**
   * 滚动同步：监听内容区域滚动，自动切换激活的导航标签
   */
  useEffect(() => {
    if (!categories || categories.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // 如果是程序化滚动，不处理自动切换
        if (isProgrammaticScroll) {
          return;
        }

        const currentVisible = new Set<string>();

        // 收集所有可见的区域
        entries.forEach((entry) => {
          const target = entry.target as HTMLDivElement;
          const categoryType = target.dataset.category;

          if (categoryType && entry.isIntersecting) {
            currentVisible.add(categoryType);
          }
        });

        // 更新可见区域状态
        setVisibleSections(currentVisible);

        // 如果有可见的section，选择最合适的一个作为活跃标签
        if (currentVisible.size > 0) {
          // 获取所有可见section的顺序，选择第一个（最靠上的）
          const categoryOrder = categories.map((cat) => cat.type);
          const visibleInOrder = categoryOrder.filter((type) =>
            currentVisible.has(type),
          );
          const targetActive = visibleInOrder[0];

          // 只有当需要切换时才调用onTabClick，避免不必要的更新
          if (targetActive && targetActive !== activeTab) {
            console.log(
              `🔄 Scroll sync: auto switching to tab ${targetActive}`,
            );
            onTabClick(targetActive);
          }
        }
      },
      {
        // 使用传入的配置或默认配置
        root,
        threshold,
        rootMargin,
      },
    );

    // 观察所有的section
    Object.values(sectionRefs.current).forEach((sectionEl) => {
      if (sectionEl) {
        observer.observe(sectionEl);
      }
    });

    // 清理函数
    return () => {
      observer.disconnect();
    };
  }, [
    categories,
    isProgrammaticScroll,
    activeTab,
    onTabClick,
    threshold,
    rootMargin,
    root,
  ]);

  return {
    sectionRefs,
    contentContainerRef,
    visibleSections,
    isProgrammaticScroll,
    handleTabClick,
  };
};

export default useScrollSync;
