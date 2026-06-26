import type { Graph } from '@antv/x6';

/** 画布「缩放到适配」参数（控制条 top 128 + 边距 18） */
export const CANVAS_ZOOM_TO_FIT_OPTIONS = {
  padding: { top: 128 + 18, left: 18, right: 18, bottom: 18 },
  maxScale: 1,
  minScale: 0.2,
  preserveAspectRatio: true,
  useCellGeometry: true,
} as const;

/** 等待容器重排 + X6 autoResize 后再 zoomToFit */
export const CANVAS_ZOOM_TO_FIT_DELAY_MS = 200;

/** 对 X6 Graph 实例执行缩放到适配画布 */
export function zoomGraphToFit(graph: Graph | null | undefined): void {
  graph?.zoomToFit(CANVAS_ZOOM_TO_FIT_OPTIONS);
}
