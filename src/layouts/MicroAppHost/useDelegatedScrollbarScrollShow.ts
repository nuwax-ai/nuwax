import { useCallback, useRef } from 'react';

interface DelegatedScrollShowState {
  node: HTMLElement | null;
  unbind: (() => void) | null;
  hideTimers: Map<Element, ReturnType<typeof setTimeout>>;
}

/**
 * 微应用宿主的滚动条「滚动时才显示」事件委托 Hook
 * （配合 src/styles/scrollbar.less 的 .scrollbar-scroll-show-delegate()）
 *
 * 滚动容器在 qiankun 子应用内部（本仓不可达），无法逐容器挂
 * useScrollbarScrollShow，改为挂在宿主锚点上委托：scroll 事件不冒泡，
 * 但 capture 阶段会经过祖先，宿主以 capture 监听即可截获全部后代滚动，
 * 给实际滚动的元素（e.target）加 data-is-scrolling 属性（滑块浮现），
 * 该元素停止滚动 hideDelay 毫秒后移除（滑块淡出）。
 *
 * 与组件级 hook 的取舍：不做 wheel/touchmove 补充信号——委托拿到的是
 * 深嵌目标，无法便宜地判定哪个滚动容器在尝试滚动，误亮比漏亮（仅
 * 顶/底回弹瞬间不显示）更伤统一观感，故只信位置真的变了的 scroll。
 *
 * 属性写子应用 DOM、定时器按元素各自计时，互不干扰；宿主卸载或节点
 * 更换时统一摘监听、清定时器、移除属性。
 *
 * @param hideDelay 滚动停止后移除 data-is-scrolling 的延时，默认 1000ms
 */
const useDelegatedScrollbarScrollShow = (hideDelay = 1000) => {
  const stateRef = useRef<DelegatedScrollShowState>({
    node: null,
    unbind: null,
    hideTimers: new Map(),
  });

  return useCallback(
    (node: HTMLElement | null) => {
      const state = stateRef.current;

      // 先摘除旧节点的监听，并清掉所有在途定时器/属性（unmount 置 null 或节点更换时触发）
      if (state.unbind) {
        state.unbind();
        state.unbind = null;
      }
      state.hideTimers.forEach((timer, element) => {
        clearTimeout(timer);
        element.removeAttribute('data-is-scrolling');
      });
      state.hideTimers.clear();
      state.node = node;

      if (!node) return;

      const onScroll = (event: Event) => {
        const target = event.target;
        // document 滚动（target 非 Element）与宿主自身不计：宿主链
        // overflow: hidden 不滚，且 data-is-scrolling 须落在锚点后代上才能命中样式
        if (!(target instanceof Element) || target === node) return;
        const previous = state.hideTimers.get(target);
        if (previous) clearTimeout(previous);
        target.setAttribute('data-is-scrolling', '');
        state.hideTimers.set(
          target,
          setTimeout(() => {
            target.removeAttribute('data-is-scrolling');
            state.hideTimers.delete(target);
          }, hideDelay),
        );
      };

      node.addEventListener('scroll', onScroll, {
        capture: true,
        passive: true,
      });
      state.unbind = () => {
        node.removeEventListener('scroll', onScroll, { capture: true });
      };
    },
    [hideDelay],
  );
};

export default useDelegatedScrollbarScrollShow;
