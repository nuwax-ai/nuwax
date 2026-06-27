import { useCanvasFullscreen } from '@/contexts/CanvasFullscreenContext';
import type { Graph } from '@antv/x6';
import { MutableRefObject, useEffect, useRef } from 'react';
import {
  CANVAS_ZOOM_TO_FIT_DELAY_MS,
  zoomGraphToFit,
} from '../../constants/canvasZoom';

/**
 * AgentFlow 退出页面全屏时，容器从 100vh 缩回内嵌高度后自动缩放到适配画布。
 * 仅响应 fullscreen true → false 边沿；Workflow 模式 fullscreen 恒为 false，不触发。
 */
export function useAgentFlowExitFullscreenZoomFit(
  graphRef: MutableRefObject<Graph | null | undefined>,
) {
  const isCanvasFullscreen = useCanvasFullscreen();
  const prevFullscreenRef = useRef(isCanvasFullscreen);

  useEffect(() => {
    const wasFullscreen = prevFullscreenRef.current;
    prevFullscreenRef.current = isCanvasFullscreen;
    if (!wasFullscreen || isCanvasFullscreen || !graphRef.current) return;

    const timer = setTimeout(() => {
      zoomGraphToFit(graphRef.current);
    }, CANVAS_ZOOM_TO_FIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isCanvasFullscreen, graphRef]);
}
