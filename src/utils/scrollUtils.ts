/**
 * 查找第一条可见的消息元素
 * @param container 滚动容器元素
 * @returns 第一条可见的消息元素，如果没有找到则返回null
 */
export const findFirstVisibleMessageElement = (
  container: HTMLElement,
): HTMLElement | null => {
  // 获取所有消息元素
  const messageElements = container.querySelectorAll('[data-message-id]');

  if (messageElements.length === 0) return null;

  const containerTop = container.scrollTop;
  const containerBottom = containerTop + container.clientHeight;

  // 遍历消息元素，找到第一个在视口中部分或完全可见的元素
  for (let i = 0; i < messageElements.length; i++) {
    const element = messageElements[i] as HTMLElement;
    const elementTop = element.offsetTop;
    const elementBottom = elementTop + element.offsetHeight;

    // 检查元素是否在容器的视口中可见
    // 元素底部在容器顶部之下，且元素顶部在容器底部之上
    if (elementBottom > containerTop && elementTop < containerBottom) {
      return element;
    }
  }

  return null;
};

/**
 * DOM更新后调整滚动位置
 * 使 ResizeObserver 在历史数据流式渲染（约 100 - 500 ms）的窗口期内，
 * 持续补偿不断膨胀的高度，防止内容下坠然后跳回的闪烁现象。
 * @param container 滚动容器元素
 * @param oldScrollTop 原始滚动位置
 * @param oldScrollHeight 原始滚动高度
 */
export const adjustScrollPositionAfterDOMUpdate = (
  container: HTMLElement | null,
  oldScrollTop: number,
  oldScrollHeight: number,
): void => {
  if (!container) return;

  // 使用一个活动窗口来记录从加载开始时总共增高了多少
  let currentBaseScrollHeight = oldScrollHeight;
  let currentBaseScrollTop = oldScrollTop;

  // ResizeObserver 在 500ms 窗口期内不会被断开，以此来抗衡异步 markdown 的动画撑开高度
  const resizeObserver = new ResizeObserver(() => {
    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - currentBaseScrollHeight;

    if (scrollDiff > 0) {
      // 通过每次将差量补进当前的 scrollTop 中，使得视口像被钉子钉住一样不管上方插了多少内容都不会变化
      const newScrollTop = currentBaseScrollTop + scrollDiff;

      // 使用瞬间滚动
      (container as any).__isProgrammaticScroll = true;
      container.scrollTo({
        top: newScrollTop,
        behavior: 'instant',
      });
      (container as any).__isProgrammaticScroll = false;

      // 叠加基线
      currentBaseScrollHeight = newScrollHeight;
      currentBaseScrollTop = newScrollTop;
    }
  });

  const firstChild = container.firstElementChild;
  if (firstChild) {
    resizeObserver.observe(firstChild);
  } else {
    resizeObserver.observe(container);
  }

  // 给定 600ms 余量让所有被 setTimeout 打断的 markdown 渲染完毕，然后才断开追踪
  setTimeout(() => {
    resizeObserver.disconnect();

    // 最终的兜底检查
    const finalScrollHeight = container.scrollHeight;
    if (finalScrollHeight > currentBaseScrollHeight) {
      const scrollDiff = finalScrollHeight - currentBaseScrollHeight;
      (container as any).__isProgrammaticScroll = true;
      container.scrollTo({
        top: currentBaseScrollTop + scrollDiff,
        behavior: 'instant',
      });
      (container as any).__isProgrammaticScroll = false;
    }
  }, 600);
};
