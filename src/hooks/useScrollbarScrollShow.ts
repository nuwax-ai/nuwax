import { useCallback, useEffect, useRef } from 'react';

interface ScrollShowState {
  node: HTMLElement | null;
  unbind: (() => void) | null;
  hideTimer: ReturnType<typeof setTimeout> | undefined;
}

/**
 * 滚动条「滚动时才显示」统一接入 Hook（配合 src/styles/scrollbar.less 的 .scrollbar-scroll-show()）
 *
 * 滚动期间给容器加 data-is-scrolling 属性（滑块浮现），只有滚动停止（无 scroll/wheel/touchmove
 * 活动）hideDelay 毫秒后才移除（滑块淡出）。直接操作属性，不触发 React 重渲染。
 * 用 data-* 属性而非 class：mixin 会被 css-modules 文件引入，类名会被哈希而 JS 写入的是
 * 字面量，属性选择器不被哈希、两种上下文通用。
 *
 * 返回 ref 回调，直接挂到滚动容器即可：
 *   const scrollShowRef = useScrollbarScrollShow();
 *   <div ref={scrollShowRef} />
 *
 * 容器已有业务 ref 时传入 mirrorRef 同步写入，既有逻辑零改动：
 *   const scrollShowRef = useScrollbarScrollShow(1000, scrollContainerRef);
 *
 * 组件卸载或节点更换（布局模式切换导致容器重挂）时自动摘监听、清定时器、移除属性。
 *
 * @param hideDelay 滚动停止后移除 data-is-scrolling 的延时，默认 1000ms
 * @param mirrorRef 需要同步写入的既有容器 ref（可选）
 */
const useScrollbarScrollShow = <T extends HTMLElement>(
  hideDelay = 1000,
  mirrorRef?: { current: T | null },
) => {
  const stateRef = useRef<ScrollShowState>({
    node: null,
    unbind: null,
    hideTimer: undefined,
  });

  // 组件卸载兜底清理定时器（节点监听由 ref 回调收到 null 时摘除）
  useEffect(
    () => () => {
      const { hideTimer } = stateRef.current;
      if (hideTimer) clearTimeout(hideTimer);
    },
    [],
  );

  return useCallback(
    (node: T | null) => {
      const state = stateRef.current;

      // 先摘除旧节点的监听/定时器/属性（unmount 置 null 或节点更换时触发）
      if (state.unbind) {
        state.unbind();
        state.unbind = null;
      }
      if (state.node) {
        if (state.hideTimer) clearTimeout(state.hideTimer);
        state.node.removeAttribute('data-is-scrolling');
      }
      state.hideTimer = undefined;
      state.node = node;

      if (mirrorRef) {
        mirrorRef.current = node;
      }
      if (!node) return;

      const show = () => {
        if (!node.hasAttribute('data-is-scrolling')) {
          node.setAttribute('data-is-scrolling', '');
        }
        if (state.hideTimer) clearTimeout(state.hideTimer);
        state.hideTimer = setTimeout(() => {
          node.removeAttribute('data-is-scrolling');
          state.hideTimer = undefined;
        }, hideDelay);
      };

      // scroll 覆盖位置变化；wheel/touchmove 覆盖惯性滚动与顶/底部回弹
      // （此刻位置未变、scroll 不触发），保证滚动活动持续时滑块不消失
      const bindEvent = (type: string, options: AddEventListenerOptions) => {
        node.addEventListener(type, show, options);
        return () => node.removeEventListener(type, show);
      };
      const unbindScroll = bindEvent('scroll', { passive: true });
      const unbindWheel = bindEvent('wheel', { passive: true });
      const unbindTouchMove = bindEvent('touchmove', { passive: true });
      state.unbind = () => {
        unbindScroll();
        unbindWheel();
        unbindTouchMove();
      };
    },
    [hideDelay, mirrorRef],
  );
};

export default useScrollbarScrollShow;
