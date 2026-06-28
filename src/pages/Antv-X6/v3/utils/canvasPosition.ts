/**
 * X6 画布坐标转换工具
 *
 * X6 存在三套常用坐标系：
 * - graph：节点 model 坐标（node.position、连线锚点计算）
 * - local：画布视口内坐标（受平移/缩放影响）
 * - client：浏览器视口坐标（getBoundingClientRect、Modal fixed 定位）
 *
 * 快捷添加节点、弹窗锚点等场景必须显式转换，避免把 graph 坐标当成 client 二次转换。
 */

import type { Graph, Node } from '@antv/x6';

export interface Point2D {
  x: number;
  y: number;
}

/** graph 坐标 → client 坐标（用于弹窗 fixed 定位） */
export function graphPointToClient(graph: Graph, point: Point2D): Point2D {
  const local = graph.graphToLocal(point);
  return graph.localToClient(local);
}

/** client 坐标 → graph 坐标（用于落点计算） */
export function clientPointToGraph(graph: Graph, point: Point2D): Point2D {
  return graph.clientToGraph(point);
}

/** client 坐标 → local 坐标 */
export function clientPointToLocal(graph: Graph, point: Point2D): Point2D {
  return graph.clientToLocal(point);
}

/** local 坐标 → client 坐标 */
export function localPointToClient(graph: Graph, point: Point2D): Point2D {
  return graph.localToClient(point);
}

/**
 * 判断坐标是否为客户端坐标（相对浏览器视口）。
 * GraphContainer._doAddNode 用此区分视口中心（graph）与点击位置（client）。
 */
export function isClientCoordinate(
  point: Point2D,
  container: HTMLElement | null | undefined,
): boolean {
  if (!container) {
    return false;
  }
  const rect = container.getBoundingClientRect();
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

/** 取 DOM 元素在浏览器视口中的中心点（client 坐标） */
export function elementClientCenter(el: Element): Point2D {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * 解析节点指定 port 在浏览器中的中心点（client 坐标）。
 * 仅作 resolveQuickAddAnchorClient 兜底；弹窗锚点优先用 port 圆点 DOM 位置。
 */
export function getPortClientCenter(
  graph: Graph,
  nodeId: string,
  portId: string,
): Point2D | null {
  const cell = graph.getCellById(nodeId);
  if (!cell || !cell.isNode()) {
    return null;
  }
  const node = cell as Node;
  if (!node.hasPort(portId)) {
    return null;
  }

  const portMeta = node.getPort(portId);
  const group = portMeta?.group;
  if (!group) {
    return null;
  }

  const layouts = node.getPortsPosition(group);
  const layout = layouts[portId];
  if (!layout?.position) {
    return null;
  }

  const nodePos = node.getPosition();
  return graphPointToClient(graph, {
    x: nodePos.x + layout.position.x,
    y: nodePos.y + layout.position.y,
  });
}

export interface QuickAddAnchorOptions {
  graph: Graph;
  nodeId: string;
  portId: string;
  event?:
    | MouseEvent
    | { clientX?: number; clientY?: number; target?: EventTarget };
  magnetEl?: Element | null;
}

/**
 * 快捷添加节点选择框锚点（client 坐标）。
 * 优先级：magnet DOM > event.target DOM > clientX/Y > X6 端口中心（兜底）
 */
export function resolveQuickAddAnchorClient(
  options: QuickAddAnchorOptions,
): Point2D {
  const { graph, nodeId, portId, event, magnetEl } = options;

  if (magnetEl instanceof Element) {
    return elementClientCenter(magnetEl);
  }

  const target = event?.target;
  if (target instanceof Element) {
    return elementClientCenter(target);
  }

  const { clientX, clientY } = (event || {}) as MouseEvent;
  if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
    return { x: clientX as number, y: clientY as number };
  }

  const portCenter = getPortClientCenter(graph, nodeId, portId);
  if (portCenter) {
    return portCenter;
  }

  return { x: 0, y: 0 };
}
