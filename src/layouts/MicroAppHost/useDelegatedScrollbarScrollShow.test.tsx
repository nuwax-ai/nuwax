import useDelegatedScrollbarScrollShow from '@/layouts/MicroAppHost/useDelegatedScrollbarScrollShow';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** scroll 事件默认不冒泡，恰好检验 capture 委托链路 */
const fireScroll = (node: HTMLElement) => {
  act(() => {
    node.dispatchEvent(new Event('scroll'));
  });
};

const hasAttr = (node: HTMLElement) => node.hasAttribute('data-is-scrolling');

/** 模拟宿主真实层级：宿主锚点 + 两个子应用各自的滚动容器 */
const Probe = ({ hideDelay }: { hideDelay?: number }) => {
  const hostRef = useDelegatedScrollbarScrollShow(hideDelay);
  return (
    <div ref={hostRef} data-testid="host">
      <div data-testid="repo-list" />
      <div data-testid="im-messages" />
    </div>
  );
};

describe('useDelegatedScrollbarScrollShow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('后代滚动（不冒泡的 scroll）经 capture 截获，滚动元素加 data-is-scrolling，停止后移除', () => {
    const { unmount } = render(<Probe hideDelay={1000} />);
    const host = screen.getByTestId('host');
    const repoList = screen.getByTestId('repo-list');

    fireScroll(repoList);
    expect(hasAttr(repoList)).toBe(true);
    // 属性只落在实际滚动的元素上，宿主锚点与兄弟容器不受影响
    expect(hasAttr(host)).toBe(false);
    expect(hasAttr(screen.getByTestId('im-messages'))).toBe(false);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(hasAttr(repoList)).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(hasAttr(repoList)).toBe(false);

    unmount();
  });

  it('持续滚动时定时器不断重置，滑块保持显示', () => {
    const { unmount } = render(<Probe hideDelay={1000} />);
    const imMessages = screen.getByTestId('im-messages');

    fireScroll(imMessages);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    fireScroll(imMessages);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(hasAttr(imMessages)).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(hasAttr(imMessages)).toBe(false);

    unmount();
  });

  it('多个滚动容器各自独立计时，互不拖拽显隐', () => {
    const { unmount } = render(<Probe hideDelay={1000} />);
    const repoList = screen.getByTestId('repo-list');
    const imMessages = screen.getByTestId('im-messages');

    fireScroll(repoList);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireScroll(imMessages);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    // repoList 已静置 1100ms 淡出；imMessages 仅 600ms 仍在滚动中
    expect(hasAttr(repoList)).toBe(false);
    expect(hasAttr(imMessages)).toBe(true);

    unmount();
  });

  it('宿主锚点自身的 scroll 不计（宿主链不滚，属性必须落在后代上才能命中样式）', () => {
    const { unmount } = render(<Probe hideDelay={1000} />);
    const host = screen.getByTestId('host');

    fireScroll(host);
    expect(hasAttr(host)).toBe(false);

    unmount();
  });

  it('卸载时清掉所有在途定时器并移除属性', () => {
    const { unmount } = render(<Probe hideDelay={1000} />);
    const repoList = screen.getByTestId('repo-list');
    const imMessages = screen.getByTestId('im-messages');

    fireScroll(repoList);
    fireScroll(imMessages);
    expect(hasAttr(repoList)).toBe(true);
    expect(hasAttr(imMessages)).toBe(true);

    unmount();
    expect(hasAttr(repoList)).toBe(false);
    expect(hasAttr(imMessages)).toBe(false);
    // 卸载后定时器不再补删属性（已删），也不再响应旧节点滚动
    fireScroll(repoList);
    expect(hasAttr(repoList)).toBe(false);
  });

  it('节点更换（key 重挂）时摘除旧监听', () => {
    const { rerender, unmount } = render(<Probe key="a" hideDelay={1000} />);
    const first = screen.getByTestId('repo-list');

    fireScroll(first);
    expect(hasAttr(first)).toBe(true);

    rerender(<Probe key="b" hideDelay={1000} />);
    expect(hasAttr(first)).toBe(false);

    // 旧节点已脱离监听，新节点正常接手
    fireScroll(first);
    expect(hasAttr(first)).toBe(false);

    const second = screen.getByTestId('repo-list');
    fireScroll(second);
    expect(hasAttr(second)).toBe(true);

    unmount();
  });
});
