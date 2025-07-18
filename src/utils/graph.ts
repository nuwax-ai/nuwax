import {
  DEFAULT_NODE_CONFIG,
  DEFAULT_NODE_CONFIG_MAP,
  EXCEPTION_NODES_TYPE,
} from '@/constants/node.constants';
import {
  AnswerTypeEnum,
  ExceptionHandleTypeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { PortGroupEnum } from '@/types/enums/node';
import { ChildNode, GraphRect, ViewGraphProps } from '@/types/interfaces/graph';
import { ExceptionHandleConfig, NodeConfig } from '@/types/interfaces/node';
import { isEmptyObject } from '@/utils/index';
import { getWidthAndHeight } from '@/utils/updateNode';
import { Cell, Edge, Graph, Node } from '@antv/x6';
import { message } from 'antd';
import { isEqual, isPlainObject } from 'lodash';
// 边界检查并调整子节点位置
// 调整父节点尺寸以包含所有子节点

export const adjustParentSize = (parentNode: Node | Cell) => {
  const childrenNodes = parentNode.getChildren
    ? Array.from(parentNode.getChildren() || [])
    : [];
  if (childrenNodes.length === 0) return;

  // 统一使用全局坐标系计算子节点包围盒
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  const padding = 40; // 内边距

  childrenNodes.forEach((childNode) => {
    if (Node.isNode(childNode)) {
      // 假设 getBBox() 返回全局坐标
      const bbox = childNode.getBBox();
      const childMinX = bbox.x;
      const childMinY = bbox.y;
      const childMaxX = bbox.x + bbox.width;
      const childMaxY = bbox.y + bbox.height;

      minX = Math.min(minX, childMinX);
      minY = Math.min(minY, childMinY);
      maxX = Math.max(maxX, childMaxX);
      maxY = Math.max(maxY, childMaxY);
    }
  });

  if (!isFinite(minX)) return;

  // 扩展内边距后的包围盒
  const globalMinX = minX - padding;
  const globalMinY = minY - padding;
  const globalMaxX = maxX + padding;
  const globalMaxY = maxY + padding;

  // 计算基础尺寸
  let newWidth = globalMaxX - globalMinX;
  let newHeight = globalMaxY - globalMinY;

  // 应用最小尺寸限制
  const MIN_WIDTH = 600;
  const MIN_HEIGHT = 240;

  // 修改：直接应用新尺寸，不再与当前尺寸比较
  newWidth = Math.max(newWidth, MIN_WIDTH);
  newHeight = Math.max(newHeight, MIN_HEIGHT);

  // 计算最终位置（保持子节点居中于父节点）
  const centerX = (globalMinX + globalMaxX) / 2;
  const centerY = (globalMinY + globalMaxY) / 2;
  const newX = centerX - Math.max(newWidth, MIN_WIDTH) / 2; // [!code ++]
  const newY = centerY - Math.max(newHeight, MIN_HEIGHT) / 2; // [!code ++]
  console.log('loop:adjustParentSize', newX, newY, newWidth, newHeight);
  parentNode.prop(
    {
      position: { x: newX, y: newY },
      size: { width: newWidth, height: newHeight },
    },
    { skipParentHandler: true },
  );
};

// 辅助函数：设置边的属性
export function setEdgeAttributes(edge: Edge) {
  edge.attr({
    line: {
      strokeDasharray: '', // 移除虚线样式
      stroke: '#5147FF', // 设置边的颜色
      strokeWidth: 1, // 设置边的宽度
    },
  });
}

// 辅助函数：检查循环节点的连接是否有效
export function isValidLoopConnection(
  node: ChildNode,
  currentLoopNodeId: number,
) {
  if (node.type === 'Loop') {
    return node.id === currentLoopNodeId;
  } else {
    return node.loopNodeId === currentLoopNodeId;
  }
}

// 辅助函数：更新节点的 nextNodeIds
export function updateNextNodeIds(item: any, targetNodeId: number) {
  if (!item.nextNodeIds) {
    item.nextNodeIds = [targetNodeId];
  } else if (!item.nextNodeIds.includes(targetNodeId)) {
    item.nextNodeIds.push(targetNodeId);
  }
}
/**
 * 获取端口组
 * @param node 节点
 * @param portId 端口id
 * @returns 端口组
 */
export const getPortGroup = (
  node: Node | null,
  portId: string | undefined,
): PortGroupEnum | string => {
  if (portId === undefined || node === null) return '';
  const port = node?.getPort(portId);
  return port?.group || '';
};

// 辅助函数：处理循环节点的逻辑
export function handleLoopEdge(sourceNode: ChildNode, targetNode: ChildNode) {
  if (sourceNode.type === 'Loop') {
    // 源节点是循环节点
    if (targetNode.loopNodeId && targetNode.loopNodeId === sourceNode.id) {
      const _params = { ...sourceNode };
      _params.innerStartNodeId = targetNode.id;
      return _params;
    }
  }
  if (targetNode.type === 'Loop') {
    if (sourceNode.loopNodeId && sourceNode.loopNodeId === targetNode.id) {
      const _params = { ...targetNode };
      _params.innerEndNodeId = sourceNode.id;
      return _params;
    }
  }
  return false;
}

// 辅助函数：处理特殊节点类型（Condition、IntentRecognition、QA）
export function handleSpecialNodeTypes(
  sourceNode: ChildNode,
  targetNode: ChildNode,
  sourcePort: string,
) {
  const newNodeParams = JSON.parse(JSON.stringify(sourceNode));
  const targetNodeId = targetNode.id;

  if (sourceNode.type === NodeTypeEnum.Condition) {
    for (let item of newNodeParams.nodeConfig.conditionBranchConfigs) {
      if (sourcePort.includes(item.uuid)) {
        updateNextNodeIds(item, targetNodeId);
      }
    }
  } else if (sourceNode.type === NodeTypeEnum.IntentRecognition) {
    for (let item of newNodeParams.nodeConfig.intentConfigs) {
      if (sourcePort.includes(item.uuid)) {
        updateNextNodeIds(item, targetNodeId);
      }
    }
  } else if (
    sourceNode.type === NodeTypeEnum.QA &&
    sourceNode.nodeConfig.answerType === AnswerTypeEnum.SELECT
  ) {
    for (let item of newNodeParams.nodeConfig.options) {
      if (sourcePort.includes(item.uuid)) {
        updateNextNodeIds(item, targetNodeId);
      }
    }
  }

  return newNodeParams;
}

// 辅助函数：验证端口连接是否合法
export function validatePortConnection(sourcePort: string, targetPort: string) {
  if (sourcePort?.includes('left') || targetPort?.includes('right')) {
    message.warning('左侧连接桩只能作为接入点，右侧连接桩只能作为输出点');
    return false;
  }
  return true;
}

// 辅助函数：检查是否存在重复边
export function hasDuplicateEdge(
  edges: Edge[],
  sourceCellId: string,
  targetNodeId: string,
  sourcePortId: string, // [!code ++]
  targetPortId: string, // [!code ++]
  currentEdgeId?: string, // [!code ++]
) {
  return edges.some((e: Edge) => {
    // 排除当前正在处理的边
    if (currentEdgeId && e.id === currentEdgeId) return false;
    return (
      e.getSourceCellId() === sourceCellId.toString() &&
      e.getTargetCellId() === targetNodeId.toString() &&
      e.getSourcePortId() === sourcePortId && // [!code ++]
      e.getTargetPortId() === targetPortId // [!code ++]
    );
  });
}
const ARROW_CONFIG = {
  name: 'classic',
  size: 6,
  fill: '#5147FF',
  stroke: '#5147FF',
};

export const updateEdgeArrows = (graph: Graph) => {
  const portMap = new Map<string, Edge[]>();

  graph.getEdges().forEach((edge) => {
    const targetNode = edge.getTargetNode();
    const targetPort = edge.getTargetPortId();

    if (targetNode && targetPort) {
      const key = `${targetNode.id}-${targetPort}`;
      const edges = portMap.get(key) || [];
      edges.push(edge);
      portMap.set(key, edges);
    }
  });

  portMap.forEach((edges) => {
    const sortedEdges = edges.sort((a, b) => a.id.localeCompare(b.id));
    sortedEdges.forEach((edge, index) => {
      const isLast = index === sortedEdges.length - 1;
      // 这里处理一个场景 如果连线上一个节点是 LoopEnd节点 则不展示箭头 如果连线的下一个节点是 LoopStart节点 则不展示箭头
      const sourceNode = edge.getSourceNode();
      const targetNode = edge.getTargetNode();
      if (
        sourceNode?.getData?.()?.type === 'LoopEnd' ||
        targetNode?.getData?.()?.type === 'LoopStart'
      ) {
        return edge.attr('line/targetMarker', null);
      }

      edge.attr('line/targetMarker', isLast ? ARROW_CONFIG : null);
      // edge.setZIndex(isLast ? 3 : 1);
    });
  });
};
const _validateLoopInnerNode = (
  sourceNode: ChildNode,
  targetNode: ChildNode,
): string | boolean => {
  if (targetNode.type === 'Loop') {
    const isInvalidSource = ['IntentRecognition', 'Condition', 'QA'];
    if (isInvalidSource.includes(sourceNode.type) && sourceNode.loopNodeId) {
      return '条件分支，意图识别，问答不能作为循环的出口连接节点';
    }
    if (sourceNode.loopNodeId && sourceNode.loopNodeId === targetNode.id) {
      // 源节点是循环内部节点
      if (targetNode.innerEndNodeId && targetNode.innerEndNodeId !== -1) {
        return '当前已有对子节点连接循环的出口，请先删除该连线';
      }
    }
  }

  if (sourceNode.type === 'Loop') {
    // 源节点是循环节点
    if (targetNode.loopNodeId && targetNode.loopNodeId === sourceNode.id) {
      // 目标节点是循环内部节点
      if (sourceNode.innerStartNodeId && sourceNode.innerStartNodeId !== -1) {
        return '当前循环已有对子节点的连线，请先删除该连线';
      }
    }
  }

  return false;
};

// 把是否可以连线连接桩 规则抽成一个函数
export const validateConnect = (
  edge: Edge,
  allEdges: Edge[],
): string | boolean => {
  const sourceCellId = edge.getSourceCellId();
  const targetNodeId = edge.getTargetCellId();
  // 获取边的两个连接桩
  const sourcePort = edge.getSourcePortId() || '';
  const targetPort = edge.getTargetPortId() || '';
  const sourceNode = edge.getSourceNode()?.getData();
  const targetNode = edge.getTargetNode()?.getData();
  const edgeId = edge.id;

  const isLoopNode = sourceNode.type === 'Loop' || targetNode.type === 'Loop';
  // 检查是否存在具有相同source和target的边
  if (
    hasDuplicateEdge(
      allEdges,
      sourceCellId,
      targetNodeId,
      sourcePort,
      targetPort,
      edgeId,
    )
  ) {
    return '不能创建重复的边';
  }

  // Loop 节点逻辑
  if (isLoopNode) {
    if (
      (sourceNode.type === 'Loop' &&
        !targetNode.loopNodeId &&
        sourcePort.includes('in')) ||
      (targetNode.type === 'Loop' &&
        !sourceNode.loopNodeId &&
        targetPort.includes('out'))
    ) {
      return '不能连接外部的节点';
    }
    const result = _validateLoopInnerNode(sourceNode, targetNode);
    if (result !== false) {
      return result;
    }
  }
  // 如果当前节点不是循环节点，in 就不能拉连线
  if (sourceNode.type !== 'Loop' && sourcePort?.includes('in')) {
    return '';
  }

  // 校验是否从右侧连接桩连入，左侧连接桩连出 不展示错误消息
  if (sourcePort?.includes('left') || targetPort?.includes('right')) {
    return '';
  }
  // 如果是循环内部的节点被外部的节点连接或者内部的节点连接外部的节点，就告知不能连接
  const currentLoopNodeId = sourceNode.loopNodeId || targetNode.loopNodeId;
  if (currentLoopNodeId) {
    if (
      !isValidLoopConnection(sourceNode, currentLoopNodeId) ||
      !isValidLoopConnection(targetNode, currentLoopNodeId)
    ) {
      return '不能连接外部节点';
    }
  }

  // sourceNode 为 Loop 节点 为出，targetNode 为出 不能连线
  if (
    sourceNode.type === 'Loop' &&
    sourcePort?.includes('out') &&
    targetPort?.includes('out')
  ) {
    return '';
  }

  return false;
};

const getCellById = (nodeId: string, graph: Graph): Node | null => {
  if (!nodeId) return null;
  const cell = graph.getCellById(nodeId);
  return cell as Node;
};

const getLatestPeerNodeId = (
  edgeIds: string[],
  data: { [key: string | number]: string[] | undefined },
  graph: Graph,
): string => {
  if (!edgeIds.length || !data) return '';
  let hitNodeIds: string[] = [];
  Object.keys(data).forEach((key) => {
    const result = (data[key] || ['']).some((item: string) => {
      if (!item) return false;
      return edgeIds.includes(item);
    });
    if (result) {
      hitNodeIds.push(key);
    }
  });
  if (hitNodeIds.length === 1) {
    return hitNodeIds[0];
  }
  if (hitNodeIds.length > 1) {
    const hitNodesData = hitNodeIds.map((item) => {
      const cell = getCellById(item, graph);
      return cell?.getData() || {};
    });
    const validNodes = hitNodesData.filter((item) => {
      const { modified = '' } = item;
      return modified && !isNaN(new Date(modified).getTime());
    });
    if (validNodes.length === 1) {
      return validNodes[0]?.id || '';
    }
    if (validNodes.length > 1) {
      return (
        validNodes.sort((a, b) => {
          const timeA = new Date(a.modified || '').getTime();
          const timeB = new Date(b.modified || '').getTime();
          return timeB - timeA;
        })[0]?.id || ''
      );
    }
  }
  return '';
};

/**
 * 通过当前节点 获取上一个节点或者下一个节点
 * 如果有一个或者多个 取出最后一个节点 并取到对应位置与 节点Id
 * 如果没有命中就新增偏移，如果命中就通过上一个节点或者下一个节点 计算偏移位置
 * 返回计算后的新节点的位置
 */
export const getPeerNodePosition = (
  currentId: string,
  graph: Graph,
  type: 'previous' | 'next',
): { x: number; y: number } | null => {
  const currentNode = getCellById(currentId, graph);
  const { outgoings = {}, incomings = {} } = currentNode?.model as any;
  let edgeIds: string[] = [];
  let peerNodeId = '';
  let position = null;
  let peerNodePosition = null;
  if (type === 'previous') {
    edgeIds = incomings[currentId] || [];
    peerNodeId = getLatestPeerNodeId(edgeIds, outgoings, graph);
    peerNodePosition = getCellById(peerNodeId, graph)?.getPosition();
  } else if (type === 'next') {
    edgeIds = outgoings[currentId] || [];
    peerNodeId = getLatestPeerNodeId(edgeIds, incomings, graph);
    peerNodePosition = getCellById(peerNodeId, graph)?.getPosition();
  }
  if (peerNodePosition) {
    position = peerNodePosition;
  }
  return position;
};

export const generatePortGroupConfig = (
  basePortSize: number,
  data: ChildNode,
) => {
  const fixedPortNode = [
    NodeTypeEnum.Loop,
    NodeTypeEnum.LoopStart,
    NodeTypeEnum.LoopEnd,
    NodeTypeEnum.Start,
    NodeTypeEnum.End,
  ].includes(data.type); //需要固定位置的节点
  const magnetRadius = 50;
  const isLoopNode = data.type === NodeTypeEnum.Loop;
  return {
    // 通用端口组配置
    in: {
      position: 'left',
      attrs: {
        circle: { r: basePortSize, magnet: true, magnetRadius },
      },
      connectable: {
        source: isLoopNode, // Loop 节点的 in 端口允许作为 source
        target: true, // 非 Loop 节点的 in 端口只能作为 target
      },
    },
    out: {
      position: {
        name: fixedPortNode ? 'right' : 'absolute',
      },
      attrs: { circle: { r: basePortSize, magnet: true, magnetRadius } },
      connectable: {
        source: true, // 非 Loop 节点的 out 端口只能作为 source
        target: isLoopNode, // Loop 节点的 out 端口允许作为 target
      },
    },
    special: {
      position: {
        name: 'absolute',
      },
      attrs: { circle: { r: basePortSize, magnet: true, magnetRadius } },
      connectable: {
        source: true, // 非 Loop 节点的 out 端口只能作为 source
        target: isLoopNode, // Loop 节点的 out 端口允许作为 target
      },
    },
    exception: {
      position: {
        name: 'absolute',
      },
      attrs: { circle: { r: basePortSize, magnet: true, magnetRadius } },
      connectable: {
        source: true, // 非 Loop 节点的 out 端口只能作为 source
        target: isLoopNode, // Loop 节点的 out 端口允许作为 target
      },
    },
  };
};

/**
 * 判断连线是否允许删除
 * @param sourceNode - 源节点
 * @param targetNode - 目标节点
 * @returns boolean - 是否允许删除连线
 */
export const isEdgeDeletable = (sourceNode: any, targetNode: any): boolean => {
  // 当 sourceNode.type 是 Loop 节点时，targetNode.type 为 LoopStart 不能删除连线
  if (
    sourceNode.type === NodeTypeEnum.Loop &&
    targetNode.type === NodeTypeEnum.LoopStart
  ) {
    return false;
  }

  // 当 sourceNode.type 是 LoopEnd 节点时，targetNode.type 为 Loop 不能删除连线
  if (
    sourceNode.type === NodeTypeEnum.LoopEnd &&
    targetNode.type === NodeTypeEnum.Loop
  ) {
    return false;
  }

  return true;
};

export const showExceptionHandle = (node: ChildNode): boolean => {
  return EXCEPTION_NODES_TYPE.includes(node.type);
};

export const needUpdateNodes = (node: ChildNode): boolean => {
  return [...EXCEPTION_NODES_TYPE, NodeTypeEnum.Condition].includes(node.type); // 需要更新端口配置的节点 异常节点包括之前
};

export const showExceptionPort = (
  node: ChildNode,
  protGroup: PortGroupEnum | string,
): boolean => {
  return (
    (showExceptionHandle(node) &&
      node.nodeConfig?.exceptionHandleConfig?.exceptionHandleType ===
        ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW &&
      protGroup === PortGroupEnum.exception) ||
    false
  );
};

export const isEqualExceptionHandleConfig = (
  prev: ExceptionHandleConfig,
  next: ExceptionHandleConfig,
) => {
  return (
    prev.exceptionHandleType === next.exceptionHandleType &&
    prev.specificContent === next.specificContent &&
    prev.timeout === next.timeout &&
    prev.retryCount === next.retryCount &&
    isEqual(prev.exceptionHandleNodeIds, next.exceptionHandleNodeIds)
  );
};

export const convertValueToEditorValue = (
  value: string | undefined | object,
): string => {
  if (
    value === '' ||
    value === undefined ||
    value === null ||
    isEmptyObject(value)
  ) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (isPlainObject(value)) {
    return JSON.stringify(value, null, 2);
  }
  return '';
};

export const findElementClassName = (
  target: HTMLElement | null,
  className: string,
): HTMLElement | null => {
  if (!target) return null;
  if (target?.classList.contains(className)) {
    return target;
  }
  return findElementClassName(target?.parentElement || null, className);
};

export const isHighestNodeZIndex = (node: Node): boolean => {
  const data = node.getData();
  if (data.type === 'Loop') {
    return node.prop('zIndex') === 10;
  } else {
    return node.prop('zIndex') === 99;
  }
};

export const registerNodeClickAndDblclick = ({
  graph,
  changeZIndex,
}: {
  graph: Graph;
  changeZIndex: (node: Node) => void;
}) => {
  graph.on('node:click', ({ node }) => {
    setTimeout(() => {
      if (node.prop('__click_type__') === 'dblclick') {
        node.prop('__click_type__', null);
        return;
      }
      const value = isHighestNodeZIndex(node);
      if (value) {
        return;
      }
      changeZIndex(node);
    }, 0);
  });

  graph.on('node:dblclick', ({ node, e: { target } }) => {
    const value = isHighestNodeZIndex(node);

    const editableTitleEl = findElementClassName(
      target,
      'node-editable-title-text',
    ); //向上查找父节点 如果 包括 类名 node-editable-title-text 则不进行操作

    if (!editableTitleEl) {
      return;
    }

    if (!value) {
      node.prop('__click_type__', 'dblclick');
      changeZIndex(node);
      setTimeout(() => {
        if (node.prop('__click_flag__')) {
          return;
        }
        node.prop('__click_flag__', true);
        graph.trigger('node:dblclick', {
          node,
          e: {
            target: document.querySelector(
              `[data-id="${node.getData().id.toString()}"]`,
            ) as HTMLElement,
          },
        });
      }, 0);
    } else {
      node.prop('__click_type__', null);
      node.prop('__click_flag__', null);
      editableTitleEl.dispatchEvent(new Event('onEditTitle'));
    }
  });
};

export const calculateNodePosition = ({
  type,
  position,
  hasTargetNode,
  portId,
  sourceNodeId,
  graph,
}: {
  type: NodeTypeEnum;
  position: GraphRect;
  hasTargetNode: boolean;
  portId: string;
  sourceNodeId: string;
  graph: Graph;
}) => {
  if (hasTargetNode) {
    const { width, height } = getWidthAndHeight({
      type,
      nodeConfig: {} as NodeConfig,
    } as ChildNode);
    // 以节点的 中心来计算
    position.x = position.x - width / 2;
    position.y = position.y - height / 2;
    return position;
  }

  let newNodeWidth = DEFAULT_NODE_CONFIG_MAP.default.defaultWidth;
  if (type === NodeTypeEnum.Loop) {
    newNodeWidth =
      DEFAULT_NODE_CONFIG_MAP[NodeTypeEnum.Loop].defaultWidth + 260;
  } else if (
    type === NodeTypeEnum.Condition ||
    type === NodeTypeEnum.Interval ||
    type === NodeTypeEnum.QA
  ) {
    newNodeWidth = DEFAULT_NODE_CONFIG_MAP[NodeTypeEnum.Condition].defaultWidth;
  }

  const isOut = portId.endsWith('out');
  const peerPosition = getPeerNodePosition(
    sourceNodeId,
    graph,
    isOut ? 'next' : 'previous',
  );
  const theRange = 200;
  if (isOut) {
    // port 为 out 出边，需要向右偏移
    position.x = position.x + DEFAULT_NODE_CONFIG.newNodeOffsetX;
    if (peerPosition !== null && peerPosition.x <= position.x + theRange) {
      position.x = peerPosition.x + DEFAULT_NODE_CONFIG.offsetGapX;
      position.y = peerPosition.y + DEFAULT_NODE_CONFIG.offsetGapX;
    }
  } else {
    // port 为 in 入边，需要向左偏移
    position.x = position.x - newNodeWidth - DEFAULT_NODE_CONFIG.newNodeOffsetX;
    if (peerPosition !== null && peerPosition.x >= position.x - theRange) {
      position.x = peerPosition.x - DEFAULT_NODE_CONFIG.offsetGapX;
      position.y = peerPosition.y + DEFAULT_NODE_CONFIG.offsetGapX;
    }
  }

  return position;
};
// 获取当前画布可视区域中心点
const getViewportCenter = (
  viewGraph?: ViewGraphProps | undefined,
  continueDragCount?: number,
) => {
  if (viewGraph) {
    const _continueDragCount = continueDragCount || 0;
    return {
      x: viewGraph.x + viewGraph.width / 2 + _continueDragCount * 16,
      y: viewGraph.y + viewGraph.height / 2 + _continueDragCount * 16,
    };
  }
  return { x: 0, y: 0 };
};

// 获取坐标函数：优先使用拖拽事件坐标，否则生成随机坐标
export const getCoordinates = (
  position?: React.DragEvent<HTMLDivElement> | GraphRect,
  viewGraph?: ViewGraphProps | undefined,
  continueDragCount?: number,
): { x: number; y: number } => {
  if (!position) {
    return getViewportCenter(viewGraph, continueDragCount);
  }
  // 检查是否是{x,y}对象
  if ('x' in position && 'y' in position) {
    return { x: position.x, y: position.y };
  }
  // 处理React拖拽事件
  if (position.clientX && position.clientY) {
    return { x: position.clientX, y: position.clientY };
  }
  return getViewportCenter(viewGraph, continueDragCount);
};
