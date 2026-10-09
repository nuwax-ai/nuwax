import useScrollbarScrollShow from '@/hooks/useScrollbarScrollShow';
import { act, render, screen } from '@testing-library/react';
import type { RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fireScroll = (node: HTMLElement) => {
  act(() => {
    node.dispatchEvent(new Event('scroll'));
  });
};

const hasAttr = (node: HTMLElement) => node.hasAttribute('data-is-scrolling');

/** 真实挂载滚动容器，走 React 的 ref 挂载/卸载链路 */
const Probe = ({
  hideDelay,
  mirrorRef,
}: {
  hideDelay?: number;
  mirrorRef?: RefObject<HTMLDivElement | null>;
}) => {
  const scrollShowRef = useScrollbarScrollShow(hideDelay, mirrorRef);
  return <div ref={scrollShowRef} data-testid="probe" />;
};

describe('useScrollbarScrollShow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('滚动时加 data-is-scrolling，停止 hideDelay 后移除', () => {
    const { unmount } = render(<Probe hideDelay={1000} />);
    const container = screen.getByTestId('probe');

    fireScroll(container);
    expect(hasAttr(container)).toBe(true);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(hasAttr(container)).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(hasAttr(container)).toBe(false);

    unmount();
  });

  it('持续滚动时定时器不断重置，滑块保持显示', () => {
    const { unmount } = render(<Probe hideDelay={1000} />);
    const container = screen.getByTestId('probe');

    fireScroll(container);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    fireScroll(container);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(hasAttr(container)).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(hasAttr(container)).toBe(false);

    unmount();
  });

  it('wheel/touchmove 也算滚动中，位置未变时不隐藏', () => {
    const { unmount } = render(<Probe hideDelay={1000} />);
    const container = screen.getByTestId('probe');

    // 顶部回弹/惯性阶段：位置不变、scroll 不触发，仅 wheel 仍算滚动中
    act(() => {
      container.dispatchEvent(new Event('wheel'));
    });
    expect(hasAttr(container)).toBe(true);

    act(() => {
      container.dispatchEvent(new Event('touchmove'));
    });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(hasAttr(container)).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(hasAttr(container)).toBe(false);

    unmount();
  });

  it('节点更换（key 重挂）时摘除旧监听并清理旧节点属性', () => {
    const { rerender, unmount } = render(<Probe key="a" hideDelay={1000} />);
    const first = screen.getByTestId('probe');

    fireScroll(first);
    expect(hasAttr(first)).toBe(true);

    // 模拟布局模式切换：容器重挂，React 先以 null 摘旧节点再挂新节点
    rerender(<Probe key="b" hideDelay={1000} />);
    expect(hasAttr(first)).toBe(false);

    fireScroll(first);
    expect(hasAttr(first)).toBe(false);

    const second = screen.getByTestId('probe');
    fireScroll(second);
    expect(hasAttr(second)).toBe(true);

    unmount();
  });

  it('mirrorRef 同步写入与清空节点', () => {
    const mirror = { current: null as HTMLDivElement | null };
    const { rerender, unmount } = render(
      <Probe hideDelay={1000} mirrorRef={mirror} />,
    );

    expect(mirror.current).toBe(screen.getByTestId('probe'));

    rerender(<Probe hideDelay={1000} mirrorRef={mirror} key="next" />);
    expect(mirror.current).toBe(screen.getByTestId('probe'));

    unmount();
    expect(mirror.current).toBe(null);
  });
});
