import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { ChildNode } from '@/types/interfaces/graph';
import { Edge, Graph, Node } from '@antv/x6';
import { message } from 'antd';
// 边界检查并调整子节点位置
// 调整父节点尺寸以包含所有子节点

export const adjustParentSize = (parentNode: Node) => {
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
export const getPortGroup = (node: Node | null, portId: string) => {
  const port = node?.getPort(portId);
  return port?.group;
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
  isLoopNode: boolean,
) => {
  return {
    // 通用端口组配置
    in: {
      position: 'left',
      attrs: {
        circle: { r: basePortSize, magnet: true, magnetRadius: 50 },
      },
      connectable: {
        source: isLoopNode, // Loop 节点的 in 端口允许作为 source
        target: true, // 非 Loop 节点的 in 端口只能作为 target
      },
    },
    out: {
      position: 'right',
      attrs: { circle: { r: basePortSize, magnet: true, magnetRadius: 50 } },
      connectable: {
        source: true, // 非 Loop 节点的 out 端口只能作为 source
        target: isLoopNode, // Loop 节点的 out 端口允许作为 target
      },
    },
    special: {
      position: {
        name: 'absolute',
      },
      attrs: { circle: { r: basePortSize, magnet: true, magnetRadius: 50 } },
      connectable: {
        source: true, // 非 Loop 节点的 out 端口只能作为 source
        target: isLoopNode, // Loop 节点的 out 端口允许作为 target
      },
    },
    exception: {
      position: {
        name: 'absolute',
      },
      attrs: { circle: { r: basePortSize, magnet: true, magnetRadius: 50 } },
      connectable: {
        source: true, // 非 Loop 节点的 out 端口只能作为 source
        target: isLoopNode, // Loop 节点的 out 端口允许作为 target
      },
    },
  };
};
