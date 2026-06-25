import { isHitlOptionsBranchMode } from '@/pages/Antv-X6/v3/agentFlow/adapters/qaConfigAdapter';
import { isAgentFlowType } from '@/pages/Antv-X6/v3/agentFlow/types';
import {
  DEFAULT_NODE_CONFIG,
  DEFAULT_NODE_CONFIG_MAP,
  EXCEPTION_NODES_TYPE,
} from '@/pages/Antv-X6/v3/constants/node.constants';
import {
  AnswerTypeEnum,
  ExceptionHandleTypeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { PortGroupEnum } from '@/types/enums/node';
import {
  ChildNode,
  Edge as EdgeConfig,
  GraphRect,
  ViewGraphProps,
} from '@/types/interfaces/graph';
import { ExceptionHandleConfig, NodeConfig } from '@/types/interfaces/node';
import { isEmptyObject } from '@/utils/index';
// import { getWidthAndHeight } from '@/utils/updateNode';
import { workflowLogger } from '@/utils/logger';
import { Cell, Edge, Graph, Node } from '@antv/x6';
import { message } from 'antd';
import { isEqual, isPlainObject } from 'lodash';
import { getWidthAndHeight } from './workflowV3';
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

  // 应用最小尺寸限制 - Loop 节点使用更大的最小宽度
  const parentData = (parentNode as Node).getData?.();
  const isLoopNode = parentData?.type === NodeTypeEnum.Loop;
  const MIN_WIDTH = isLoopNode ? 860 : 220; // Loop 节点使用 LOOP_NODE_DEFAULT_WIDTH，其他节点使用 220
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

/** AgentFlow 分支端口边色 + label 集中配置 */
const BRANCH_PALETTE = {
  route: { stroke: '#fa8c16', label: '' }, // label 由 intent 动态填
} as const;

/**
 * 解析 source port 对应的分支样式。
 * - `route-{uuid}-out` 需要从 source node 的 `nodeConfig.intentConfigs` 拿 intent 作 label
 * - `route-default-out` 显式返回 null（落默认紫色）
 */
function parseEdgeBranch(
  sourcePort: string | undefined,
  edge?: Edge,
): {
  stroke: string;
  label: string;
} | null {
  if (!sourcePort) return null;
  // 路由决策的 route-{uuid} 端口（排除 default 兜底）
  if (
    sourcePort.includes('-route-') &&
    !sourcePort.includes('-route-default-')
  ) {
    if (!edge) {
      return { stroke: BRANCH_PALETTE.route.stroke, label: '' };
    }
    // 从 portId 末尾提取 uuid：<nodeId>-route-<uuid>-out
    const m = sourcePort.match(/-route-([^-]+(?:-[^-]+)*)-out$/);
    const uuid = m?.[1] || '';
    if (!uuid) return null; // 端口 id 形如异常, 走默认色
    const sourceData = edge.getSourceNode()?.getData() || {};
    const routes: any[] = (sourceData as any)?.nodeConfig?.intentConfigs || [];
    const found = routes.find((r) => r.uuid === uuid);
    const label = found?.intent || found?.name || `Route ${uuid.slice(0, 4)}`;
    return { stroke: BRANCH_PALETTE.route.stroke, label };
  }
  return null;
}

export function setEdgeAttributes(edge: Edge) {
  const sourcePort = edge.getSourcePortId();
  const branch = parseEdgeBranch(sourcePort, edge);

  edge.attr({
    line: {
      strokeDasharray: '',
      stroke: branch?.stroke || '#5147FF',
      strokeWidth: 1,
      targetMarker: {
        name: 'classic',
        size: 6,
        fill: branch?.stroke || '#5147FF',
        stroke: branch?.stroke || '#5147FF',
      },
    },
  });

  if (branch && branch.label) {
    // AgentFlow 分支连线不显示文字标签，仅保留颜色区分
    const sourceNode = edge.getSourceNode();
    const sourceData = sourceNode?.getData();
    if (sourceData && isAgentFlowType(sourceData.type)) {
      // 不设置 label，仅颜色已在上面 attr 中设置
    } else {
      edge.setLabels([
        {
          attrs: {
            label: {
              text: branch.label,
              fill: branch.stroke,
              fontSize: 11,
              fontWeight: 600,
              textAnchor: 'middle',
              textVerticalAnchor: 'middle',
            },
            rect: {
              fill: '#ffffff',
              stroke: branch.stroke,
              strokeWidth: 1,
              rx: 4,
              ry: 4,
            },
          },
          position: {
            distance: 0.5,
          },
        },
      ]);
    }
  }
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
    message.warning(
      'Left ports can only be used as input, and right ports can only be used as output',
    );
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

      const branch = parseEdgeBranch(edge.getSourcePortId(), edge);
      const arrowCfg = branch
        ? {
            name: 'classic' as const,
            size: 6,
            fill: branch.stroke,
            stroke: branch.stroke,
          }
        : ARROW_CONFIG;
      edge.attr('line/targetMarker', isLast ? arrowCfg : null);
      // edge.setZIndex(isLast ? 3 : 1);
    });
  });
};
const _validateLoopInnerNode = (
  sourceNode: ChildNode,
  targetNode: ChildNode,
): string | boolean => {
  if (targetNode.type === NodeTypeEnum.Loop) {
    const isInvalidSource = [
      NodeTypeEnum.IntentRecognition,
      NodeTypeEnum.Condition,
      NodeTypeEnum.QA,
    ];
    if (isInvalidSource.includes(sourceNode.type) && sourceNode.loopNodeId) {
      return 'Condition, intent recognition, and QA nodes cannot be loop exit nodes';
    }
    if (sourceNode.loopNodeId && sourceNode.loopNodeId === targetNode.id) {
      // 源节点是循环内部节点
      if (targetNode.innerEndNodeId && targetNode.innerEndNodeId !== -1) {
        return 'This loop already has an exit edge from a child node. Delete it first';
      }
    }
  }

  if (sourceNode.type === NodeTypeEnum.Loop) {
    // 源节点是循环节点
    if (targetNode.loopNodeId && targetNode.loopNodeId === sourceNode.id) {
      // 目标节点是循环内部节点
      if (sourceNode.innerStartNodeId && sourceNode.innerStartNodeId !== -1) {
        return 'This loop already has an edge to a child node. Delete it first';
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

  const isLoopNode =
    sourceNode.type === NodeTypeEnum.Loop ||
    targetNode.type === NodeTypeEnum.Loop;
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
    return 'Cannot create duplicate edges';
  }

  // Loop 节点逻辑
  if (isLoopNode) {
    if (
      (sourceNode.type === NodeTypeEnum.Loop &&
        !targetNode.loopNodeId &&
        sourcePort.includes('in')) ||
      (targetNode.type === NodeTypeEnum.Loop &&
        !sourceNode.loopNodeId &&
        targetPort.includes('out'))
    ) {
      return 'Cannot connect external nodes';
    }
    const result = _validateLoopInnerNode(sourceNode, targetNode);
    if (result !== false) {
      return result;
    }
  }
  // 如果当前节点不是循环节点，in 就不能拉连线
  if (sourceNode.type !== NodeTypeEnum.Loop && sourcePort?.includes('in')) {
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
      return 'Cannot connect external nodes';
    }
  }

  // sourceNode 为 Loop 节点 为出，targetNode 为出 不能连线
  if (
    sourceNode.type === NodeTypeEnum.Loop &&
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
  const isHitlWithOptions =
    node.type === NodeTypeEnum.HumanInteraction &&
    isHitlOptionsBranchMode(node.nodeConfig as Record<string, any>);
  return (
    [...EXCEPTION_NODES_TYPE, NodeTypeEnum.Condition].includes(node.type) ||
    // HITL-Ask options 模式端口数可能变化
    isHitlWithOptions
  ); // 需要更新端口配置的节点：异常节点（含路由决策）+ 条件 + HITL 询问选项
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
  changeDrawer,
}: {
  graph: Graph;
  changeZIndex: (node: Node) => void;
  // 打开右侧属性面板。仅在「真正的点击」时调用（区别于拖拽 / 双击）。
  changeDrawer?: (data: any) => void;
}) => {
  graph.on('node:click', ({ node }) => {
    setTimeout(() => {
      // 双击的第二次 click 由 dblclick 守卫跳过，避免双击编辑标题时误开面板
      if (node.prop('__click_type__') === 'dblclick') {
        node.prop('__click_type__', null);
        return;
      }
      if (!isHighestNodeZIndex(node)) {
        changeZIndex(node);
      }
      // 真正的点击才打开属性面板：X6 在拖拽时不会触发 node:click，
      // 因此拖拽节点不会再误弹面板（面板打开已从 node:selected 迁移至此）。
      const data = node.getData();
      if (!data?.isFocus) {
        changeDrawer?.({ ...data, id: node.id });
      }
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

// 处理 Condition 和 IntentRecognition 节点的边
const handleSpecialNodes = (
  node: ChildNode,
  isLoopNode: boolean,
): EdgeConfig[] => {
  if (!node.nodeConfig) return [];
  // 是否是循环内的节点

  let configs;
  switch (node.type) {
    case NodeTypeEnum.Condition:
      configs = node.nodeConfig.conditionBranchConfigs;
      break;
    case NodeTypeEnum.IntentRecognition:
      configs = node.nodeConfig.intentConfigs;
      break;
    default:
      configs = node.nodeConfig.options;
      break;
  }

  return (
    configs?.flatMap((config) => {
      if (!config.nextNodeIds) config.nextNodeIds = [];
      return config.nextNodeIds.map((nextNodeId) => ({
        source: `${node.id}-${config.uuid}`,
        target: nextNodeId.toString(),
        zIndex: isLoopNode ? 5 : 1,
      }));
    }) || []
  );
};

const handleAgentFlowEdges = (
  node: ChildNode,
  isLoopNode: boolean,
): EdgeConfig[] => {
  const edges: EdgeConfig[] = [];
  const nc = node.nodeConfig as any;
  if (!nc) return edges;
  const z = isLoopNode ? 5 : 1;

  if (node.type === NodeTypeEnum.RouteDecision) {
    const routes: any[] = nc.intentConfigs || [];
    // default 兜底端口（注意：source 须带 -out 后缀，因为 "route"
    // 包含 "out" 子串，parseEndpoint 会误判 isLoop=true 导致不加 -out）
    const defaultIds: number[] = nc.defaultNextNodeIds || [];
    defaultIds.forEach((id) => {
      edges.push({
        source: `${node.id}-route-default-out`,
        target: id.toString(),
        zIndex: z,
      });
    });
    // 各路由端口
    routes.forEach((route) => {
      const routeIds: number[] = route.nextNodeIds || [];
      routeIds.forEach((id) => {
        edges.push({
          source: `${node.id}-route-${route.uuid}-out`,
          target: id.toString(),
          zIndex: z,
        });
      });
    });
  }

  return edges;
};

// 处理 Loop 节点的边
const handleLoopEdges = (node: ChildNode): EdgeConfig[] => {
  const edges: EdgeConfig[] = [];

  if (node.innerStartNodeId && node.innerStartNodeId !== -1) {
    edges.push({
      source: `${node.id}-in`, // Loop 节点的 in 端口连接到内部起始节点
      target: node.innerStartNodeId.toString(),
      zIndex: 5, // 新增层级设置
    });
  }

  if (node.innerEndNodeId && node.innerEndNodeId !== -1) {
    edges.push({
      source: node.innerEndNodeId.toString(),
      target: `${node.id}-out`, // 内部结束节点连接到 Loop 节点的 out 端口
      zIndex: 5, // 新增层级设置
    });
  }

  const _edge = (node.nextNodeIds || [])
    .filter((item) => {
      // 过滤掉内部节点，防止出现 Loop-Out -> LoopStart-In 的错误连线
      return item !== node.innerStartNodeId && item !== node.innerEndNodeId;
    })
    .map((item) => ({
      source: Number(node.id).toString(),
      target: Number(item).toString(),
      zIndex: 5,
    }));
  edges.push(..._edge);
  return edges;
};

// 处理所有节点异常项目上的 port edge 连线
const handleAllNodesExceptionItem = (
  nodes: ChildNode[],
  edges: EdgeConfig[],
): EdgeConfig[] => {
  let resultEdges = [...edges]; // 创建一个新数组，避免修改原参数
  nodes.forEach((node) => {
    const { exceptionHandleNodeIds = [] } =
      node.nodeConfig?.exceptionHandleConfig || {};
    if (
      showExceptionPort(node, PortGroupEnum.exception) &&
      exceptionHandleNodeIds.length > 0
    ) {
      const isLoopNode = node.loopNodeId ? true : false;
      resultEdges = resultEdges.concat([
        ...exceptionHandleNodeIds.map((item) => {
          return {
            source: `${node.id}-exception-out`,
            target: `${item}`,
            zIndex: isLoopNode ? 5 : 1,
          };
        }),
      ]);
    }
  });
  return resultEdges;
};
// 递归获取节点的边
export const getEdges = (
  nodes: ChildNode[],
  needValidate: boolean = true,
): EdgeConfig[] => {
  const allEdges: EdgeConfig[] = handleAllNodesExceptionItem(
    nodes,
    nodes.flatMap((node) => {
      let isLoopNode: boolean = false;
      if (node.loopNodeId) {
        isLoopNode = true;
      }
      if (
        node.type === NodeTypeEnum.Condition ||
        node.type === NodeTypeEnum.IntentRecognition ||
        (node.type === NodeTypeEnum.QA &&
          node.nodeConfig.answerType === AnswerTypeEnum.SELECT)
      ) {
        return handleSpecialNodes(node, isLoopNode);
      } else if (node.type === NodeTypeEnum.Loop) {
        return handleLoopEdges(node);
      } else if (node.type === NodeTypeEnum.RouteDecision) {
        return handleAgentFlowEdges(node, isLoopNode);
      } else if (node.nextNodeIds && node.nextNodeIds.length > 0) {
        const _arr = node.nextNodeIds.filter(
          (item) => item !== node.loopNodeId && item !== node.id,
        );
        return _arr.map((nextNodeId) => {
          return {
            source: Number(node.id).toString(),
            target: Number(nextNodeId).toString(),
            zIndex: isLoopNode ? 5 : 1,
          };
        });
      }

      return [];
    }),
  );

  // 过滤目标节点不存在的边（新增过滤逻辑）
  const validEdges = needValidate
    ? allEdges.filter((edge) => {
        // 检查目标节点是否存在于节点列表中
        return nodes.some((n) => {
          const targetId = edge.target.split('-')[0];
          return targetId === n.id.toString();
        });
      })
    : allEdges;
  // 使用 Set 来移除重复的边
  const uniqueEdges = new Set<string>();
  const resultEdges: EdgeConfig[] = [];

  validEdges.forEach((edge) => {
    const edgeKey = `${edge.source}-${edge.target}`;
    if (!uniqueEdges.has(edgeKey)) {
      uniqueEdges.add(edgeKey);
      resultEdges.push(edge);
    }
  });
  workflowLogger.log('[getEdges] resultEdges', resultEdges);
  return resultEdges;
};

const FLOW_DASH = '8 4';
const activeAnimations = new WeakMap<Edge, Animation>();

export const startEdgeFlowAnimation = (edge: Edge) => {
  if (activeAnimations.get(edge)) return;
  const branch = parseEdgeBranch(edge.getSourcePortId(), edge);
  const color = branch?.stroke || '#5147FF';
  edge.attr('line/strokeDasharray', FLOW_DASH);
  edge.attr('line/stroke', color);
  edge.attr('line/strokeWidth', 2);
  const pathEl = (edge as any).container?.querySelector?.('path.connection');
  if (!pathEl) {
    const len = 20;
    const anim = edge.animate(
      (t: number) => {
        edge.attr('line/strokeDashoffset', len * (1 - t));
      },
      { duration: 600, iterations: Infinity },
    );
    if (anim) activeAnimations.set(edge, anim);
    return;
  }
};

export const stopEdgeFlowAnimation = (edge: Edge) => {
  const anim = activeAnimations.get(edge);
  if (anim) {
    anim.cancel();
    activeAnimations.delete(edge);
  }
  const branch = parseEdgeBranch(edge.getSourcePortId(), edge);
  edge.attr({
    line: {
      strokeDasharray: '',
      stroke: branch?.stroke || '#5147FF',
      strokeWidth: 1,
    },
  });
};

export const animateRunningEdges = (graph: Graph, executingNodeId: string) => {
  graph.getEdges().forEach((edge) => {
    const targetId = edge.getTargetCellId();
    if (targetId === executingNodeId) {
      startEdgeFlowAnimation(edge);
    } else {
      stopEdgeFlowAnimation(edge);
    }
  });
};

export const resetAllEdgeAnimations = (graph: Graph) => {
  graph.getEdges().forEach((edge) => {
    stopEdgeFlowAnimation(edge);
    setEdgeAttributes(edge);
  });
  updateEdgeArrows(graph);
};
