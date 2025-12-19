/**
 * 离线节点数据生成器
 *
 * 用于在离线模式下生成完整的节点数据
 */

import { AddNodeResponse } from '@/services/workflow';
import { NodeShapeEnum, NodeTypeEnum } from '@/types/enums/common';
import { ChildNode } from '@/types/interfaces/graph';
import { Extension } from '@/types/interfaces/node';

import {
  createDefaultNodeConfig,
  createLoopInnerNodes,
  NODE_DEFAULT_NAMES,
} from './nodeDefaultConfigFactory';
import { getShape } from './workflowV3';

/**
 * 创建离线模式下的普通节点数据
 */
export function createOfflineNodeData(
  nodeId: number,
  params: Partial<ChildNode>,
  workflowId: number,
): AddNodeResponse {
  const type = params.type || NodeTypeEnum.Code;
  const extension = (params.nodeConfig?.extension || {
    x: 0,
    y: 0,
  }) as Extension;

  const defaultConfig = createDefaultNodeConfig(type, extension);

  const nodeData: AddNodeResponse = {
    id: nodeId,
    name: params.name || NODE_DEFAULT_NAMES[type] || '新节点',
    description: params.description || '',
    workflowId,
    type,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    nextNodeIds: [],
    nextNodes: [],
    preNodes: [],
    unreachableNextNodeIds: [],
    innerEndNode: false,
    innerEndNodeId: null,
    innerStartNodeId: null,
    innerNodes: null,
    virtualExecute: false,
    icon: params.icon?.toString() || '',
    nodeConfig: {
      ...defaultConfig,
      ...params.nodeConfig,
      extension: {
        ...defaultConfig.extension,
        ...extension,
      },
    },
  };

  // 如果有 loopNodeId，添加到节点数据
  if (params.loopNodeId) {
    (nodeData as any).loopNodeId = params.loopNodeId;
  }

  return nodeData;
}

/**
 * 创建离线模式下的循环节点数据（包含内部节点）
 */
export function createOfflineLoopNodeData(
  nodeId: number,
  params: Partial<ChildNode>,
  workflowId: number,
): AddNodeResponse {
  const extension = (params.nodeConfig?.extension || {
    x: 0,
    y: 0,
  }) as Extension;

  const defaultConfig = createDefaultNodeConfig(NodeTypeEnum.Loop, extension);

  // 生成内部节点
  const { innerNodes, innerStartNodeId, innerEndNodeId } = createLoopInnerNodes(
    nodeId,
    workflowId,
    extension,
  );

  const nodeData: AddNodeResponse = {
    id: nodeId,
    name: params.name || NODE_DEFAULT_NAMES[NodeTypeEnum.Loop] || '循环',
    description: params.description || '',
    workflowId,
    type: NodeTypeEnum.Loop,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    nextNodeIds: [],
    nextNodes: [],
    preNodes: [],
    unreachableNextNodeIds: [],
    innerEndNode: false,
    innerEndNodeId,
    innerStartNodeId,
    innerNodes,
    virtualExecute: false,
    icon: params.icon?.toString() || '',
    nodeConfig: {
      ...defaultConfig,
      ...params.nodeConfig,
      extension: {
        ...defaultConfig.extension,
        ...extension,
      },
    },
  };

  return nodeData;
}

/**
 * 根据节点类型自动选择创建方法
 */
export function createOfflineNode(
  nodeId: number,
  params: Partial<ChildNode>,
  workflowId: number,
): AddNodeResponse {
  if (params.type === NodeTypeEnum.Loop) {
    return createOfflineLoopNodeData(nodeId, params, workflowId);
  }
  return createOfflineNodeData(nodeId, params, workflowId);
}

/**
 * 确保节点有正确的 shape
 */
export function ensureNodeShape(node: AddNodeResponse): AddNodeResponse {
  const nodeWithShape = node as AddNodeResponse & { shape?: NodeShapeEnum };
  if (!nodeWithShape.shape) {
    nodeWithShape.shape = getShape(node.type) || NodeShapeEnum.General;
  }
  return nodeWithShape;
}
