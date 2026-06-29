/**
 * X6 画布坐标转换工具
 *
 * X6 命名易误导，实际语义：
 * - local：节点 model 坐标（node.position/getPosition、连线锚点计算用的就是它）
 * - graph：经平移/缩放后相对 SVG 的屏幕坐标（localToGraph 加变换、graphToLocal 去变换）
 * - client：浏览器视口坐标（getBoundingClientRect、Modal fixed 定位）
 *
 * 关键：client ↔ 节点位置 必须用 clientToLocal/localToClient；
 * 误用 clientToGraph 会在画布平移/缩放后产生偏移。
 */

import type { Graph, Node } from '@antv/x6';

export interface Point2D {
  x: number;
  y: number;
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
 * magnet DOM 在动态自定义端口上不可靠（getBoundingClientRect 可能返回 0,0），
 * 故以「节点模型位置 + 端口 args 绝对坐标」为可靠来源，getPortsPosition 作兜底。
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

  const nodePos = node.getPosition();
  const portMeta = node.getPort(portId) as { args?: any; group?: string };

  // 优先：端口创建时的绝对坐标 args.x/args.y（与端口圆点渲染位置一致，最可靠）
  const args = portMeta?.args;
  if (args && Number.isFinite(args.x) && Number.isFinite(args.y)) {
    return localPointToClient(graph, {
      x: nodePos.x + args.x,
      y: nodePos.y + args.y,
    });
  }

  // 兜底：getPortsPosition（按 group 布局计算）
  const group = portMeta?.group;
  if (group) {
    const layouts = node.getPortsPosition(group);
    const layout = layouts[portId];
    if (layout?.position) {
      return localPointToClient(graph, {
        x: nodePos.x + layout.position.x,
        y: nodePos.y + layout.position.y,
      });
    }
  }
  return null;
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
 * 鸭子类型判断是否为可取中心的 DOM 元素（有 getBoundingClientRect）。
 * 不用 `instanceof Element`：X6 magnet 元素（SVG/跨 realm）在某些构建下 instanceof 会判 false。
 */
function isDomEl(el: unknown): el is Element {
  return (
    !!el &&
    typeof (el as { getBoundingClientRect?: unknown }).getBoundingClientRect ===
      'function'
  );
}

/** 校验坐标非 (0,0)：零尺寸/detached 元素的 getBoundingClientRect 会返回 0,0，不能当锚点 */
function isNonZero(p: Point2D): boolean {
  return (
    Number.isFinite(p.x) && Number.isFinite(p.y) && (p.x !== 0 || p.y !== 0)
  );
}

/**
 * 快捷添加节点选择框锚点（client 坐标）。
 * 优先级：magnet DOM（校验非零）> event.target DOM（非零）> clientX/Y > 端口位置计算（最可靠兜底）
 */
export function resolveQuickAddAnchorClient(
  options: QuickAddAnchorOptions,
): Point2D {
  const { graph, nodeId, portId, event, magnetEl } = options;

  // 1) magnet DOM：点击的端口圆点，最精确；但需校验非零（动态端口上偶发返回 0,0）
  if (isDomEl(magnetEl)) {
    const c = elementClientCenter(magnetEl);
    if (isNonZero(c)) return c;
  }

  // 2) event.target DOM
  const target = (event as { target?: unknown })?.target;
  if (isDomEl(target)) {
    const c = elementClientCenter(target);
    if (isNonZero(c)) return c;
  }

  // 3) clientX/Y
  const { clientX, clientY } = (event || {}) as MouseEvent;
  if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
    return { x: clientX as number, y: clientY as number };
  }

  // 4) 节点位置 + 端口偏移（最可靠的兜底）
  const portCenter = getPortClientCenter(graph, nodeId, portId);
  if (portCenter) {
    return portCenter;
  }

  return { x: 0, y: 0 };
}
