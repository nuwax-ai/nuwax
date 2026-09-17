import type { RefObject } from 'react';
import { useEffect } from 'react';

interface InertedRecord {
  el: HTMLElement;
  /** 进入时是否已被他方置为 inert（还原时须保留，不得误摘） */
  prev: boolean;
}

/**
 * 干预模态的指针侧承诺（与 useInterventionDialogFocus 的键盘侧配对）：
 * 对话框激活期间，把「对话框祖先链之外的旁支」全部置为 inert——侧栏会话
 * 列表、导航轨、其余浮层不再可点、可滚（含滚动条拖拽）、可聚焦；
 * 关闭或对话框不可见时精确还原。
 *
 * 可见性门控用 IntersectionObserver：会话页缓存把后台会话以 display:none
 * 保活，后台会话收到 ask 时弹窗并未展示，此时不能锁可见页面；切回该会话
 * （display 恢复）时 IO 触发补挂，切走时拆挂。环境无 IO（jsdom/旧内核）
 * 时退化为立即挂拦截。
 */
export function useInterventionPageInert(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const inerted: InertedRecord[] = [];

    const arm = () => {
      if (inerted.length) {
        return;
      }
      let node: HTMLElement | null = container;
      while (node && node !== document.body) {
        const parent: HTMLElement | null = node.parentElement;
        if (!parent) {
          break;
        }
        for (const child of Array.from(parent.children)) {
          if (child !== node && child instanceof HTMLElement) {
            inerted.push({ el: child, prev: child.hasAttribute('inert') });
            child.setAttribute('inert', '');
          }
        }
        node = parent;
      }
    };

    const disarm = () => {
      for (const { el, prev } of inerted.reverse()) {
        if (!prev) {
          el.removeAttribute('inert');
        }
      }
      inerted.length = 0;
    };

    if (typeof IntersectionObserver === 'undefined') {
      arm();
      return disarm;
    }

    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        arm();
      } else {
        disarm();
      }
    });
    io.observe(container);

    return () => {
      io.disconnect();
      disarm();
    };
  }, [active, containerRef]);
}
