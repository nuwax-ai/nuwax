/**
 * V2 图形工具函数
 *
 * 包含节点创建、边创建、端口生成等工具函数
 * 完全独立，不依赖 v1 任何代码
 */

import {
  DEFAULT_NODE_SIZE_MAP_V2,
  EXCEPTION_NODES_TYPE_V2,
  PORT_GROUPS_V2,
} from '../constants';
import type {
  ChildNodeV2,
  EdgeV2,
  GraphRectV2,
  NodeMetadataV2,
  OutputOrInputPortConfigV2,
  PortsConfigV2,
} from '../types';
import {
  AnswerTypeEnumV2,
  NodeShapeEnumV2,
  NodeTypeEnumV2,
  PortGroupEnumV2,
} from '../types';

// ==================== 节点尺寸计算 ====================

/**
 * 获取节点默认尺寸
 */
export function getNodeDefaultSize(type: NodeTypeEnumV2): {
  width: number;
  height: number;
} {
  const config =
    DEFAULT_NODE_SIZE_MAP_V2[type as keyof typeof DEFAULT_NODE_SIZE_MAP_V2] ||
    DEFAULT_NODE_SIZE_MAP_V2.default;
  return {
    width: config.defaultWidth,
    height: config.defaultHeight,
  };
}

/**
 * 计算节点实际尺寸
 */
export function calculateNodeSize(node: ChildNodeV2): {
  width: number;
  height: number;
} {
  const defaultSize = getNodeDefaultSize(node.type);
  const extension = node.nodeConfig?.extension;

  // 如果有保存的尺寸，使用保存的
  if (extension?.width && extension?.height) {
    return {
      width: extension.width,
      height: extension.height,
    };
  }

  // 特殊节点需要根据内容计算高度
  if (node.type === NodeTypeEnumV2.Condition) {
    const branches = node.nodeConfig?.conditionBranchConfigs || [];
    const height = Math.max(defaultSize.height, 40 + branches.length * 32);
    return { width: defaultSize.width, height };
  }

  if (
    node.type === NodeTypeEnumV2.QA &&
    node.nodeConfig?.answerType === AnswerTypeEnumV2.SELECT
  ) {
    const options = node.nodeConfig?.options || [];
    const height = Math.max(defaultSize.height, 40 + options.length * 32);
    return { width: defaultSize.width, height };
  }

  if (node.type === NodeTypeEnumV2.IntentRecognition) {
    const intents = node.nodeConfig?.intentConfigs || [];
    const height = Math.max(defaultSize.height, 40 + intents.length * 32);
    return { width: defaultSize.width, height };
  }

  // 检查是否需要异常处理端口的额外高度
  if (EXCEPTION_NODES_TYPE_V2.includes(node.type)) {
    return {
      width: defaultSize.width,
      height: defaultSize.height + 32, // 异常端口额外高度
    };
  }

  return defaultSize;
}

// ==================== 端口生成 ====================

/**
 * 生成基础端口配置
 */
function createPort(
  id: string,
  group: PortGroupEnumV2,
  position: { x: number; y: number },
  color: string = '#5147FF',
): OutputOrInputPortConfigV2 {
  return {
    id,
    group,
    zIndex: 10,
    magnet: true,
    args: {
      x: position.x,
      y: position.y,
      offsetX: 0,
      offsetY: 0,
    },
    attrs: {
      circle: {
        r: 3,
        stroke: color,
        fill: '#fff',
        strokeWidth: 1,
      },
    },
  };
}

/**
 * 生成节点的端口配置
 */
export function generatePorts(node: ChildNodeV2): PortsConfigV2 {
  const size = calculateNodeSize(node);
  const items: OutputOrInputPortConfigV2[] = [];

  // 基础输入端口（左侧）
  if (
    node.type !== NodeTypeEnumV2.Start &&
    node.type !== NodeTypeEnumV2.LoopStart
  ) {
    items.push(
      createPort(`${node.id}-in`, PortGroupEnumV2.in, {
        x: 0,
        y: size.height / 2,
      }),
    );
  }

  // 基础输出端口（右侧）
  if (
    node.type !== NodeTypeEnumV2.End &&
    node.type !== NodeTypeEnumV2.LoopEnd
  ) {
    // 特殊节点有多个输出端口
    if (node.type === NodeTypeEnumV2.Condition) {
      const branches = node.nodeConfig?.conditionBranchConfigs || [];
      branches.forEach((branch, index) => {
        items.push(
          createPort(`${branch.uuid}-out`, PortGroupEnumV2.special, {
            x: size.width,
            y: 40 + index * 32 + 16,
          }),
        );
      });
    } else if (
      node.type === NodeTypeEnumV2.QA &&
      node.nodeConfig?.answerType === AnswerTypeEnumV2.SELECT
    ) {
      const options = node.nodeConfig?.options || [];
      options.forEach((option, index) => {
        items.push(
          createPort(`${option.uuid}-out`, PortGroupEnumV2.special, {
            x: size.width,
            y: 40 + index * 32 + 16,
          }),
        );
      });
    } else if (node.type === NodeTypeEnumV2.IntentRecognition) {
      const intents = node.nodeConfig?.intentConfigs || [];
      intents.forEach((intent, index) => {
        items.push(
          createPort(`${intent.uuid}-out`, PortGroupEnumV2.special, {
            x: size.width,
            y: 40 + index * 32 + 16,
          }),
        );
      });
    } else {
      // 普通输出端口
      items.push(
        createPort(`${node.id}-out`, PortGroupEnumV2.out, {
          x: size.width,
          y: size.height / 2,
        }),
      );
    }
  }

  // 异常处理端口（底部）
  if (EXCEPTION_NODES_TYPE_V2.includes(node.type)) {
    items.push(
      createPort(
        `${node.id}-exception`,
        PortGroupEnumV2.exception,
        { x: size.width / 2, y: size.height },
        '#FF4D4F',
      ),
    );
  }

  return {
    groups: PORT_GROUPS_V2,
    items,
  };
}

// ==================== 节点创建 ====================

/**
 * 获取节点形状
 */
export function getNodeShape(type: NodeTypeEnumV2): NodeShapeEnumV2 {
  if (type === NodeTypeEnumV2.Loop) {
    return NodeShapeEnumV2.Loop;
  }
  return NodeShapeEnumV2.General;
}

/**
 * 创建基础节点数据
 */
export function createBaseNodeData(node: ChildNodeV2): NodeMetadataV2 {
  const size = calculateNodeSize(node);
  const position = node.nodeConfig?.extension || { x: 0, y: 0 };

  return {
    id: node.id.toString(),
    shape: getNodeShape(node.type),
    x: position.x || 0,
    y: position.y || 0,
    width: size.width,
    height: size.height,
    data: {
      ...node,
      nodeConfig: node.nodeConfig,
      parentId: node.loopNodeId?.toString() || null,
    },
    ports: generatePorts(node),
    zIndex: node.type === NodeTypeEnumV2.Loop ? 5 : 4,
  };
}

/**
 * 创建循环子节点数据
 */
export function createLoopChildNodeData(
  parentId: number,
  childNode: ChildNodeV2,
): NodeMetadataV2 {
  const baseData = createBaseNodeData(childNode);
  return {
    ...baseData,
    data: {
      ...baseData.data,
      parentId: parentId.toString(),
      loopNodeId: parentId,
    },
    zIndex: 8,
  };
}

// ==================== 边创建 ====================

/**
 * 创建边数据
 *
 * 注意：X6 中边的 source/target 需要指定 cell (节点ID) 和 port (端口ID)
 * 对于特殊节点（条件、意图、问答选项），source 是 "{nodeId}" + sourcePort 是 "{uuid}-out"
 */
export function createEdgeData(edge: EdgeV2): any {
  const edgeConfig: any = {
    zIndex: edge.zIndex || 1,
    attrs: {
      line: {
        stroke: '#5147FF',
        strokeWidth: 1,
        targetMarker: {
          name: 'classic',
          size: 6,
        },
      },
    },
    router: 'manhattan',
  };

  // 处理 source - 可能是 nodeId 或 { cell, port }
  if (edge.sourcePort) {
    edgeConfig.source = { cell: edge.source, port: edge.sourcePort };
  } else {
    edgeConfig.source = edge.source;
  }

  // 处理 target - 可能是 nodeId 或 { cell, port }
  if (edge.targetPort) {
    edgeConfig.target = { cell: edge.target, port: edge.targetPort };
  } else {
    edgeConfig.target = edge.target;
  }

  return edgeConfig;
}

/**
 * 从节点列表提取边
 *
 * 注意：对于特殊节点（条件分支、意图识别、问答选项），
 * 边的 source 应该是节点ID，sourcePort 应该是端口ID（uuid-out）
 */
export function extractEdgesFromNodes(nodes: ChildNodeV2[]): EdgeV2[] {
  const edges: EdgeV2[] = [];

  nodes.forEach((node) => {
    // 普通节点的 nextNodeIds
    if (node.nextNodeIds && node.nextNodeIds.length > 0) {
      node.nextNodeIds.forEach((targetId) => {
        if (targetId !== node.id && targetId !== node.loopNodeId) {
          edges.push({
            source: node.id.toString(),
            target: targetId.toString(),
            sourcePort: `${node.id}-out`,
            targetPort: `${targetId}-in`,
            zIndex: node.loopNodeId ? 25 : 1,
          });
        }
      });
    }

    // 条件分支节点
    if (
      node.type === NodeTypeEnumV2.Condition &&
      node.nodeConfig?.conditionBranchConfigs
    ) {
      node.nodeConfig.conditionBranchConfigs.forEach((branch) => {
        if (branch.nextNodeIds) {
          branch.nextNodeIds.forEach((targetId) => {
            edges.push({
              source: node.id.toString(),
              target: targetId.toString(),
              sourcePort: `${branch.uuid}-out`,
              targetPort: `${targetId}-in`,
              zIndex: node.loopNodeId ? 25 : 1,
            });
          });
        }
      });
    }

    // 意图识别节点
    if (
      node.type === NodeTypeEnumV2.IntentRecognition &&
      node.nodeConfig?.intentConfigs
    ) {
      node.nodeConfig.intentConfigs.forEach((intent) => {
        if (intent.nextNodeIds) {
          intent.nextNodeIds.forEach((targetId) => {
            edges.push({
              source: node.id.toString(),
              target: targetId.toString(),
              sourcePort: `${intent.uuid}-out`,
              targetPort: `${targetId}-in`,
              zIndex: node.loopNodeId ? 25 : 1,
            });
          });
        }
      });
    }

    // 问答选项节点
    if (
      node.type === NodeTypeEnumV2.QA &&
      node.nodeConfig?.answerType === AnswerTypeEnumV2.SELECT &&
      node.nodeConfig?.options
    ) {
      node.nodeConfig.options.forEach((option) => {
        if (option.nextNodeIds) {
          option.nextNodeIds.forEach((targetId) => {
            edges.push({
              source: node.id.toString(),
              target: targetId.toString(),
              sourcePort: `${option.uuid}-out`,
              targetPort: `${targetId}-in`,
              zIndex: node.loopNodeId ? 25 : 1,
            });
          });
        }
      });
    }

    // 循环节点的内部边
    if (node.type === NodeTypeEnumV2.Loop && node.innerNodes) {
      const innerEdges = extractEdgesFromNodes(node.innerNodes);
      edges.push(...innerEdges.map((e) => ({ ...e, zIndex: 25 })));

      // 循环节点到内部开始节点的边
      if (node.innerStartNodeId && node.innerStartNodeId !== -1) {
        edges.push({
          source: node.id.toString(),
          target: node.innerStartNodeId.toString(),
          sourcePort: `${node.id}-out`,
          targetPort: `${node.innerStartNodeId}-in`,
          zIndex: 25,
        });
      }

      // 内部结束节点到循环节点的边（循环回来）
      // 注意：这里不应该连接到循环节点，而是循环节点的下一个节点由 nextNodeIds 决定
    }

    // 异常处理节点
    if (node.nodeConfig?.exceptionHandleConfig?.exceptionHandleNodeIds) {
      node.nodeConfig.exceptionHandleConfig.exceptionHandleNodeIds.forEach(
        (targetId) => {
          edges.push({
            source: node.id.toString(),
            target: targetId.toString(),
            sourcePort: `${node.id}-exception`,
            targetPort: `${targetId}-in`,
            zIndex: 1,
          });
        },
      );
    }
  });

  // 去重
  const uniqueEdges = new Map<string, EdgeV2>();
  edges.forEach((edge) => {
    const key = `${edge.source}-${edge.sourcePort || ''}-${edge.target}-${
      edge.targetPort || ''
    }`;
    if (!uniqueEdges.has(key)) {
      uniqueEdges.set(key, edge);
    }
  });

  return Array.from(uniqueEdges.values());
}

// ==================== 位置计算 ====================

/**
 * 计算新节点位置
 */
export function calculateNewNodePosition(
  sourceNode: ChildNodeV2,
  portId: string,
  nodeType: NodeTypeEnumV2,
): GraphRectV2 {
  const sourceSize = calculateNodeSize(sourceNode);
  const targetSize = getNodeDefaultSize(nodeType);
  const extension = sourceNode.nodeConfig?.extension || { x: 0, y: 0 };

  const offsetX = 100; // 水平间距
  const offsetY = 0; // 垂直偏移

  // 根据端口位置确定新节点位置
  if (portId.endsWith('-out') || portId.includes('-out')) {
    // 输出端口，新节点在右侧
    return {
      x: (extension.x || 0) + sourceSize.width + offsetX,
      y: (extension.y || 0) + offsetY,
    };
  } else if (portId.endsWith('-in')) {
    // 输入端口，新节点在左侧
    return {
      x: (extension.x || 0) - targetSize.width - offsetX,
      y: (extension.y || 0) + offsetY,
    };
  } else if (portId.endsWith('-exception')) {
    // 异常端口，新节点在下方
    return {
      x: extension.x || 0,
      y: (extension.y || 0) + sourceSize.height + 50,
    };
  }

  // 默认在右侧
  return {
    x: (extension.x || 0) + sourceSize.width + offsetX,
    y: extension.y || 0,
  };
}

/**
 * 调整父节点（循环节点）尺寸
 */
export function adjustLoopNodeSize(
  loopNode: ChildNodeV2,
  childNodes: ChildNodeV2[],
): { width: number; height: number; x: number; y: number } {
  if (childNodes.length === 0) {
    const defaultSize = getNodeDefaultSize(NodeTypeEnumV2.Loop);
    const extension = loopNode.nodeConfig?.extension || { x: 0, y: 0 };
    return {
      ...defaultSize,
      x: extension.x || 0,
      y: extension.y || 0,
    };
  }

  const padding = { top: 60, right: 40, bottom: 40, left: 40 };

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  childNodes.forEach((child) => {
    const ext = child.nodeConfig?.extension || { x: 0, y: 0 };
    const size = calculateNodeSize(child);

    minX = Math.min(minX, ext.x || 0);
    minY = Math.min(minY, ext.y || 0);
    maxX = Math.max(maxX, (ext.x || 0) + size.width);
    maxY = Math.max(maxY, (ext.y || 0) + size.height);
  });

  return {
    x: minX - padding.left,
    y: minY - padding.top,
    width: maxX - minX + padding.left + padding.right,
    height: maxY - minY + padding.top + padding.bottom,
  };
}

// ==================== 验证工具 ====================

/**
 * 检查是否可以创建边
 */
export function canCreateEdge(
  sourceNode: ChildNodeV2,
  targetNode: ChildNodeV2,
  sourcePortId: string,
  targetPortId: string,
): { canCreate: boolean; message?: string } {
  // 不能自己连自己
  if (sourceNode.id === targetNode.id) {
    return { canCreate: false, message: '不能自己连接自己' };
  }

  // 循环节点内外不能互连（除了循环节点本身）
  if (sourceNode.loopNodeId !== targetNode.loopNodeId) {
    if (
      sourceNode.type !== NodeTypeEnumV2.Loop &&
      targetNode.type !== NodeTypeEnumV2.Loop
    ) {
      return { canCreate: false, message: '不能连接循环内外的节点' };
    }
  }

  // LoopBreak 只能连接到 LoopEnd
  if (
    sourceNode.type === NodeTypeEnumV2.LoopBreak &&
    targetNode.type !== NodeTypeEnumV2.LoopEnd
  ) {
    return { canCreate: false, message: '终止循环节点只能连接到循环结束节点' };
  }

  return { canCreate: true };
}

/**
 * 检查边是否可删除
 */
export function canDeleteEdge(
  sourceNode: ChildNodeV2,
  targetNode: ChildNodeV2,
): boolean {
  // 循环节点与其内部开始/结束节点的连线不能删除
  if (sourceNode.type === NodeTypeEnumV2.Loop) {
    if (
      targetNode.loopNodeId === sourceNode.id &&
      targetNode.id === sourceNode.innerStartNodeId
    ) {
      return false;
    }
  }

  if (targetNode.type === NodeTypeEnumV2.Loop) {
    if (
      sourceNode.loopNodeId === targetNode.id &&
      sourceNode.id === targetNode.innerEndNodeId
    ) {
      return false;
    }
  }

  return true;
}

export default {
  // 尺寸计算
  getNodeDefaultSize,
  calculateNodeSize,

  // 端口生成
  generatePorts,

  // 节点创建
  getNodeShape,
  createBaseNodeData,
  createLoopChildNodeData,

  // 边创建
  createEdgeData,
  extractEdgesFromNodes,

  // 位置计算
  calculateNewNodePosition,
  adjustLoopNodeSize,

  // 验证
  canCreateEdge,
  canDeleteEdge,
};
