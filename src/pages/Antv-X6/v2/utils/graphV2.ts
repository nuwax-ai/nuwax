/**
 * V2 图形工具函数
 *
 * 包含节点创建、边创建、端口生成等工具函数
 * 完全独立，不依赖 v1 任何代码
 */

import PlusIcon from '@/assets/svg/plus_icon.svg';
import {
  DEFAULT_NODE_SIZE_MAP_V2,
  EXCEPTION_NODES_TYPE_V2,
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
  ExceptionHandleTypeEnumV2,
  NodeShapeEnumV2,
  NodeTypeEnumV2,
  PortGroupEnumV2,
} from '../types';

// ==================== 节点尺寸计算 ====================
const BASE_PORT_SIZE = 3;
const NODE_BOTTOM_PADDING = 10;
const NODE_BOTTOM_PADDING_AND_BORDER = NODE_BOTTOM_PADDING + 1;
const MAGNET_RADIUS = 30;
const DEFAULT_HEADER_HEIGHT = DEFAULT_NODE_SIZE_MAP_V2.default.defaultHeight;
const FIXED_PORT_NODES: NodeTypeEnumV2[] = [
  NodeTypeEnumV2.Loop,
  NodeTypeEnumV2.LoopStart,
  NodeTypeEnumV2.LoopEnd,
  NodeTypeEnumV2.Start,
  NodeTypeEnumV2.End,
];

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
 * 计算节点实际尺寸（参考 V1：高度由端口 offsetY 决定）
 */
export function calculateNodeSize(
  node: ChildNodeV2,
  ports?: OutputOrInputPortConfigV2[],
): {
  width: number;
  height: number;
} {
  const defaultSize = getNodeDefaultSize(node.type);
  const width = node.nodeConfig?.extension?.width ?? defaultSize.width;

  const portItems = ports ?? generatePorts(node).items;
  const lastOffsetY =
    portItems.length > 0
      ? Math.max(...portItems.map((p) => p.args?.offsetY ?? 0))
      : defaultSize.height - NODE_BOTTOM_PADDING_AND_BORDER;

  const baseHeight =
    node.nodeConfig?.extension?.height ?? defaultSize.height ?? 0;
  const contentHeight = lastOffsetY + NODE_BOTTOM_PADDING_AND_BORDER;
  const height = Math.max(baseHeight, contentHeight);

  return { width, height };
}

// ==================== 端口生成 ====================

const getNodeWidth = (node: ChildNodeV2): number => {
  const defaultSize = getNodeDefaultSize(node.type);
  return node.nodeConfig?.extension?.width ?? defaultSize.width;
};

const showExceptionHandle = (node: ChildNodeV2): boolean =>
  EXCEPTION_NODES_TYPE_V2.includes(node.type);

const showExceptionPort = (
  node: ChildNodeV2,
  group: PortGroupEnumV2,
): boolean => {
  return (
    showExceptionHandle(node) &&
    node.nodeConfig?.exceptionHandleConfig?.exceptionHandleType ===
      ExceptionHandleTypeEnumV2.EXECUTE_EXCEPTION_FLOW &&
    group === PortGroupEnumV2.exception
  );
};

const generatePortGroupConfig = (
  node: ChildNodeV2,
): PortsConfigV2['groups'] => {
  const isLoopNode = node.type === NodeTypeEnumV2.Loop;
  const isFixedPortNode = FIXED_PORT_NODES.includes(node.type);
  const baseCircle = {
    r: BASE_PORT_SIZE,
    magnet: true,
    magnetRadius: MAGNET_RADIUS,
    stroke: '#5147FF',
    strokeWidth: 1,
    fill: '#5147FF',
  };

  return {
    [PortGroupEnumV2.in]: {
      position: { name: 'left' },
      attrs: { circle: baseCircle },
      connectable: { source: isLoopNode, target: true },
    },
    [PortGroupEnumV2.out]: {
      position: { name: isFixedPortNode ? 'right' : 'absolute' },
      attrs: { circle: baseCircle },
      connectable: { source: true, target: isLoopNode },
    },
    [PortGroupEnumV2.special]: {
      position: { name: 'absolute' },
      attrs: { circle: baseCircle },
      connectable: { source: true, target: isLoopNode },
    },
    [PortGroupEnumV2.exception]: {
      position: { name: 'absolute' },
      attrs: {
        circle: {
          ...baseCircle,
          stroke: '#e67e22',
          fill: '#e67e22',
        },
      },
      connectable: { source: true, target: isLoopNode },
    },
  };
};

function generatePortConfig(
  node: ChildNodeV2,
  {
    group,
    idSuffix,
    color = '#5147FF',
    yHeight = (DEFAULT_HEADER_HEIGHT - 1) / 2 + 1,
    xWidth = idSuffix === 'in' ? 0 : getNodeWidth(node),
    offsetY = DEFAULT_HEADER_HEIGHT - NODE_BOTTOM_PADDING_AND_BORDER,
    offsetX = xWidth,
  }: {
    group: PortGroupEnumV2;
    idSuffix: string;
    color?: string;
    yHeight?: number;
    xWidth?: number;
    offsetY?: number;
    offsetX?: number;
  },
): OutputOrInputPortConfigV2 {
  return {
    group,
    markup: [
      {
        tagName: 'circle',
        selector: 'circle',
        attrs: {
          // @ts-ignore
          magnet: true,
          pointerEvents: 'auto',
        },
      },
      {
        tagName: 'image',
        selector: 'icon',
        attrs: {
          // @ts-ignore
          magnet: false,
        },
      },
      {
        tagName: 'circle',
        selector: 'hoverCircle',
        attrs: {
          r: BASE_PORT_SIZE + 10,
          opacity: 0,
          pointerEvents: 'visiblePainted',
          zIndex: -1,
          // @ts-ignore
          magnet: false,
        },
      },
    ],
    id: `${node.id}-${idSuffix}`,
    zIndex: 99,
    magnet: true,
    attrs: {
      circle: {
        r: BASE_PORT_SIZE,
        magnet: true,
        stroke: color,
        fill: color,
        magnetRadius: MAGNET_RADIUS,
        zIndex: 2,
      },
      icon: {
        xlinkHref: PlusIcon,
        magnet: false,
        width: 0,
        height: 0,
        fill: '#fff',
        zIndex: -2,
        pointerEvents: 'none',
        opacity: 0,
      },
    },
    args: {
      x: xWidth,
      y: yHeight,
      offsetY,
      offsetX,
    },
  };
}

const handleExceptionOutputPort = (
  node: ChildNodeV2,
  outputPorts: OutputOrInputPortConfigV2[],
  generate: (config: {
    group: PortGroupEnumV2;
    idSuffix: string;
    color?: string;
    yHeight?: number;
    xWidth?: number;
    offsetY?: number;
    offsetX?: number;
  }) => OutputOrInputPortConfigV2,
): OutputOrInputPortConfigV2[] => {
  if (!outputPorts.length) return outputPorts;

  const baseY = outputPorts[outputPorts.length - 1]?.args?.offsetY ?? 0;
  const xWidth = getNodeWidth(node);
  const itemHeight = 24;

  if (showExceptionPort(node, PortGroupEnumV2.exception)) {
    return [
      ...outputPorts,
      generate({
        group: PortGroupEnumV2.exception,
        idSuffix: 'exception-out',
        yHeight: baseY + NODE_BOTTOM_PADDING + itemHeight / 2,
        offsetY: baseY + itemHeight + NODE_BOTTOM_PADDING_AND_BORDER,
        xWidth,
        color: '#e67e22',
      }),
    ];
  }

  if (showExceptionHandle(node)) {
    const updated = [...outputPorts];
    const last = updated[updated.length - 1];
    if (last) {
      if (updated.length === 1) {
        last.args = {
          ...last.args,
          y: (baseY + itemHeight + NODE_BOTTOM_PADDING_AND_BORDER + 1) / 2,
        };
      }
      last.args = {
        ...last.args,
        offsetY: baseY + itemHeight + NODE_BOTTOM_PADDING_AND_BORDER,
      };
    }
    return updated;
  }

  return outputPorts;
};

/**
 * 生成节点的端口配置（对齐 V1 逻辑）
 */
export function generatePorts(node: ChildNodeV2): PortsConfigV2 {
  const nodeWidth = getNodeWidth(node);
  const generate = (config: {
    group: PortGroupEnumV2;
    idSuffix: string;
    color?: string;
    yHeight?: number;
    xWidth?: number;
    offsetY?: number;
    offsetX?: number;
  }) => generatePortConfig(node, config);

  let inputPorts: OutputOrInputPortConfigV2[] = [
    generate({ group: PortGroupEnumV2.in, idSuffix: 'in' }),
  ];
  let outputPorts: OutputOrInputPortConfigV2[] = [];

  switch (node.type) {
    case NodeTypeEnumV2.Start:
      inputPorts = [];
      outputPorts = [generate({ group: PortGroupEnumV2.out, idSuffix: 'out' })];
      break;
    case NodeTypeEnumV2.End:
      inputPorts = [
        generate({
          group: PortGroupEnumV2.in,
          idSuffix: 'in',
        }),
      ];
      outputPorts = [];
      break;
    case NodeTypeEnumV2.Condition:
    case NodeTypeEnumV2.IntentRecognition: {
      const configs =
        node.nodeConfig?.conditionBranchConfigs ||
        node.nodeConfig?.intentConfigs ||
        [];
      const baseY = DEFAULT_HEADER_HEIGHT;
      const itemHeight = node.type === NodeTypeEnumV2.Condition ? 32 : 24;
      const step = node.type === NodeTypeEnumV2.Condition ? 16 : 12;

      inputPorts = [
        generate({
          group: PortGroupEnumV2.in,
          idSuffix: 'in',
        }),
      ];

      outputPorts = configs.map((item, index) =>
        generate({
          group: PortGroupEnumV2.special,
          idSuffix: `${item.uuid || index}-out`,
          yHeight: baseY + (index + 1) * itemHeight - step,
          xWidth: nodeWidth,
          offsetY: baseY + (index + 1) * itemHeight,
        }),
      );
      break;
    }
    case NodeTypeEnumV2.QA: {
      const type = node.nodeConfig?.answerType;
      const configs = node.nodeConfig?.options;
      const itemHeight = 24;
      const step = 12;
      let baseY = DEFAULT_HEADER_HEIGHT;

      if (type === AnswerTypeEnumV2.SELECT) {
        baseY += itemHeight * 3;
        outputPorts = (configs || []).map((item, index) =>
          generate({
            group: PortGroupEnumV2.special,
            idSuffix: `${item.uuid || index}-out`,
            yHeight: baseY + (index + 1) * itemHeight - step,
            xWidth: nodeWidth,
            offsetY: baseY + (index + 1) * itemHeight,
          }),
        );
      } else {
        baseY += itemHeight * 2;
        outputPorts = [
          generate({
            group: PortGroupEnumV2.out,
            idSuffix: 'out',
            yHeight: baseY + itemHeight - step,
            xWidth: nodeWidth,
            offsetY: baseY + itemHeight,
          }),
        ];
      }
      break;
    }
    default:
      inputPorts = [
        generate({
          group: PortGroupEnumV2.in,
          idSuffix: 'in',
        }),
      ];
      outputPorts = [generate({ group: PortGroupEnumV2.out, idSuffix: 'out' })];
      break;
  }

  outputPorts = handleExceptionOutputPort(node, outputPorts, generate);

  return {
    groups: generatePortGroupConfig(node),
    items: [...inputPorts, ...outputPorts],
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
  const ports = generatePorts(node);
  const size = calculateNodeSize(node, ports.items);
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
    ports,
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
