import { ChildNode } from '@/types/interfaces/graph';
import { Edge, Node } from '@antv/x6';
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
      stroke: '#C2C8D5', // 设置边的颜色
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

// 辅助函数：处理循环节点的逻辑
export function handleLoopEdge(sourceNode: ChildNode, targetNode: ChildNode) {
  if (sourceNode.type === 'Loop') {
    // 源节点是循环节点
    if (targetNode.loopNodeId && targetNode.loopNodeId === sourceNode.id) {
      // 目标节点是循环内部节点
      if (sourceNode.innerStartNodeId && sourceNode.innerStartNodeId !== -1) {
        message.warning('当前循环已有对子节点的连线，请先删除该连线');

        return 'error';
      }
      const _params = { ...sourceNode };
      _params.innerStartNodeId = targetNode.id;
      return _params;
    }
  }
  if (targetNode.type === 'Loop') {
    if (
      sourceNode.type === 'IntentRecognition' ||
      sourceNode.type === 'Condition' ||
      sourceNode.type === 'QA'
    ) {
      message.warning('条件分支，意图识别，问答不能作为循环的出口连接节点');
      return 'error';
    }
    if (sourceNode.loopNodeId && sourceNode.loopNodeId === targetNode.id) {
      // 源节点是循环内部节点
      if (targetNode.innerEndNodeId && targetNode.innerEndNodeId !== -1) {
        message.warning('当前已有对子节点连接循环的出口，请先删除该连线');
        return 'error';
      }
      const _params = { ...targetNode };
      _params.innerEndNodeId = sourceNode.id;
      return _params;
    }
  }
}

// 辅助函数：处理特殊节点类型（Condition、IntentRecognition、QA）
export function handleSpecialNodeTypes(
  sourceNode: ChildNode,
  targetNode: ChildNode,
  sourcePort: string,
) {
  const newNodeParams = JSON.parse(JSON.stringify(sourceNode));
  const targetNodeId = targetNode.id;

  if (sourceNode.type === 'Condition') {
    for (let item of newNodeParams.nodeConfig.conditionBranchConfigs) {
      if (sourcePort.includes(item.uuid)) {
        updateNextNodeIds(item, targetNodeId);
      }
    }
  } else if (sourceNode.type === 'IntentRecognition') {
    for (let item of newNodeParams.nodeConfig.intentConfigs) {
      if (sourcePort.includes(item.uuid)) {
        updateNextNodeIds(item, targetNodeId);
      }
    }
  } else if (
    sourceNode.type === 'QA' &&
    sourceNode.nodeConfig.answerType === 'SELECT'
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
) {
  return edges.some((e: Edge) => {
    return (
      e.getSourceCellId() === sourceCellId.toString() &&
      e.getTargetCellId() === targetNodeId.toString()
    );
  });
}
