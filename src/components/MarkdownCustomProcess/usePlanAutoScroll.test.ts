import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePlanAutoScroll } from './usePlanAutoScroll';

const setDimensions = (
  element: HTMLDivElement,
  scrollHeight: number,
  clientHeight: number,
) => {
  Object.defineProperties(element, {
    scrollHeight: { configurable: true, value: scrollHeight },
    clientHeight: { configurable: true, value: clientHeight },
  });
};

describe('usePlanAutoScroll', () => {
  it('计划更新时默认滚动到列表底部', () => {
    const { result, rerender } = renderHook(
      ({ version }) => usePlanAutoScroll(version, true),
      { initialProps: { version: 0 } },
    );
    const container = document.createElement('div');
    setDimensions(container, 600, 200);
    result.current.containerRef.current = container;

    rerender({ version: 1 });

    expect(container.scrollTop).toBe(400);
  });

  it('用户向上滚动后暂停自动滚动', () => {
    const { result, rerender } = renderHook(
      ({ version }) => usePlanAutoScroll(version, true),
      { initialProps: { version: 0 } },
    );
    const container = document.createElement('div');
    setDimensions(container, 600, 200);
    result.current.containerRef.current = container;
    rerender({ version: 1 });

    act(() => {
      container.scrollTop = 200;
      result.current.handleScroll({ currentTarget: container } as any);
    });
    setDimensions(container, 800, 200);
    rerender({ version: 2 });

    expect(container.scrollTop).toBe(200);
  });

  it('用户回到底部后恢复自动滚动', () => {
    const { result, rerender } = renderHook(
      ({ version }) => usePlanAutoScroll(version, true),
      { initialProps: { version: 0 } },
    );
    const container = document.createElement('div');
    setDimensions(container, 600, 200);
    result.current.containerRef.current = container;
    rerender({ version: 1 });

    act(() => {
      container.scrollTop = 200;
      result.current.handleScroll({ currentTarget: container } as any);
      container.scrollTop = 400;
      result.current.handleScroll({ currentTarget: container } as any);
    });
    setDimensions(container, 800, 200);
    rerender({ version: 2 });

    expect(container.scrollTop).toBe(600);
  });
});
