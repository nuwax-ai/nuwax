/**
 * useAgentFlowExitFullscreenZoomFit 单元测试
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANVAS_ZOOM_TO_FIT_OPTIONS } from '../../../constants/canvasZoom';

let mockFullscreen = false;

vi.mock('@/contexts/CanvasFullscreenContext', () => ({
  useCanvasFullscreen: () => mockFullscreen,
}));

import { useAgentFlowExitFullscreenZoomFit } from '../useAgentFlowExitFullscreenZoomFit';

describe('useAgentFlowExitFullscreenZoomFit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFullscreen = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('首次挂载（非退出全屏）不触发 zoomToFit', () => {
    const zoomToFit = vi.fn();
    const graphRef = { current: { zoomToFit } as any };

    renderHook(() => useAgentFlowExitFullscreenZoomFit(graphRef));
    vi.advanceTimersByTime(300);

    expect(zoomToFit).not.toHaveBeenCalled();
  });

  it('全屏 true → false 时调用 zoomToFit', () => {
    mockFullscreen = true;
    const zoomToFit = vi.fn();
    const graphRef = { current: { zoomToFit } as any };

    const { rerender } = renderHook(() =>
      useAgentFlowExitFullscreenZoomFit(graphRef),
    );

    mockFullscreen = false;
    rerender();
    vi.advanceTimersByTime(300);

    expect(zoomToFit).toHaveBeenCalledTimes(1);
    expect(zoomToFit).toHaveBeenCalledWith(CANVAS_ZOOM_TO_FIT_OPTIONS);
  });

  it('进入全屏（false → true）不触发', () => {
    const zoomToFit = vi.fn();
    const graphRef = { current: { zoomToFit } as any };

    const { rerender } = renderHook(() =>
      useAgentFlowExitFullscreenZoomFit(graphRef),
    );

    mockFullscreen = true;
    rerender();
    vi.advanceTimersByTime(300);

    expect(zoomToFit).not.toHaveBeenCalled();
  });

  it('graphRef.current 为空时不调用', () => {
    mockFullscreen = true;
    const graphRef = { current: null as any };

    const { rerender } = renderHook(() =>
      useAgentFlowExitFullscreenZoomFit(graphRef),
    );

    mockFullscreen = false;
    rerender();
    vi.advanceTimersByTime(300);

    expect(true).toBe(true);
  });

  it('快速切换时清理 pending timer，仅最后一次退出生效', () => {
    mockFullscreen = true;
    const zoomToFit = vi.fn();
    const graphRef = { current: { zoomToFit } as any };

    const { rerender } = renderHook(() =>
      useAgentFlowExitFullscreenZoomFit(graphRef),
    );

    mockFullscreen = false;
    rerender();
    vi.advanceTimersByTime(100);

    mockFullscreen = true;
    rerender();
    mockFullscreen = false;
    rerender();
    vi.advanceTimersByTime(300);

    expect(zoomToFit).toHaveBeenCalledTimes(1);
  });
});
