import type { Graph } from '@antv/x6';

/** 画布「缩放到适配」参数（控制条 top 128 + 边距 18） */
export const CANVAS_ZOOM_TO_FIT_OPTIONS = {
  padding: { top: 128 + 18, left: 18, right: 18, bottom: 18 },
  maxScale: 1,
  minScale: 0.2,
  preserveAspectRatio: true,
  useCellGeometry: true,
};

/** 等待容器重排 + X6 autoResize 后再 zoomToFit */
export const CANVAS_ZOOM_TO_FIT_DELAY_MS = 200;

/**
 * 对 X6 Graph 执行缩放到适配画布。
 * 全屏/嵌入切换时先 resize 同步容器尺寸；react-shape 节点 bbox 为空时回退 stage 计算。
 */
export function zoomGraphToFit(graph: Graph | null | undefined): void {
  if (!graph) return;

  const el = graph.container as HTMLElement | undefined;
  if (el?.clientWidth && el?.clientHeight) {
    graph.resize(el.clientWidth, el.clientHeight);
  }

  const options = { ...CANVAS_ZOOM_TO_FIT_OPTIONS };
  graph.zoomToFit(options);

  const cells = graph.getCells?.() ?? [];
  if (!cells.length) return;

  const bbox = graph.getAllCellsBBox?.();
  if (bbox && (!bbox.width || !bbox.height)) {
    graph.zoomToFit({ ...options, useCellGeometry: false });
  }
}
