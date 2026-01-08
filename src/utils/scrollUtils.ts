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

  // 使用MutationObserver监听DOM变化，确保所有消息元素都渲染完成
  const observer = new MutationObserver((mutations, obs) => {
    // 检查是否有新增的消息元素
    const hasNewMessages = mutations.some((mutation) => {
      return Array.from(mutation.addedNodes).some((node) => {
        return (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).hasAttribute('data-message-id')
        );
      });
    });

    // 如果没有检测到新消息元素，可能是因为消息内容更新
    // 我们也检查一下是否有文本节点的变化
    const hasContentChanges = mutations.some((mutation) => {
      return (
        mutation.type === 'characterData' ||
        Array.from(mutation.addedNodes).some(
          (node) =>
            node.nodeType === Node.TEXT_NODE || node.nodeName === '#text',
        )
      );
    });

    // 如果有新消息或内容变化，并且有带data-message-id的元素，则调整滚动位置
    if (
      (hasNewMessages || hasContentChanges) &&
      container.querySelectorAll('[data-message-id]').length > 0
    ) {
      obs.disconnect(); // 停止观察

      // 使用requestAnimationFrame确保DOM渲染完成
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - oldScrollHeight;

        // 尝试获取第一条可见消息的元素
        const firstVisibleElement = findFirstVisibleMessageElement(container);

        if (firstVisibleElement) {
          // 计算新的滚动位置，保持这条消息仍在相同视口位置
          // 新的滚动位置 = 原始滚动位置 + 新增的高度差
          const newScrollTop = oldScrollTop + scrollDiff;

          // 使用平滑滚动效果
          container.scrollTo({
            top: newScrollTop,
            behavior: 'smooth',
          });
        } else {
          // 回退到原有的计算方式，也使用平滑滚动
          container.scrollTo({
            top: oldScrollTop + scrollDiff,
            behavior: 'smooth',
          });
        }
      });
    }
  });

  // 配置观察选项
  const config = {
    childList: true, // 观察子节点的添加或删除
    subtree: true, // 观察所有后代节点
    characterData: true, // 观察文本节点的变化
  };

  // 开始观察
  observer.observe(container, config);

  // 设置超时，以防MutationObserver没有触发（例如，如果DOM已经在观察前完成更新）
  setTimeout(() => {
    observer.disconnect();
    // 如果观察器被超时断开，仍然尝试调整滚动位置，也使用平滑滚动
    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - oldScrollHeight;
    container.scrollTo({
      top: oldScrollTop + scrollDiff,
      behavior: 'smooth',
    });
  }, 500);
};
