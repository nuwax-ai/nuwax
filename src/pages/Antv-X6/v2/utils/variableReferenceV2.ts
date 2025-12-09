/**
 * V2 变量引用计算
 *
 * 实现前端变量引用计算逻辑：
 * 1. 根据节点间的连线关系，计算每个节点可用的上级节点输出参数
 * 2. 支持嵌套对象和数组的子属性访问
 * 3. 支持从 nextNodeIds 和 edgeList 两种方式获取连线关系
 *
 * 完全独立，不依赖 v1 任何代码
 */

import type {
  ArgMapV2,
  ChildNodeV2,
  EdgeV2,
  InputAndOutConfigV2,
  NodePreviousAndArgMapV2,
  PreviousListV2,
  WorkflowDataV2,
} from '../types';
import { NodeTypeEnumV2 } from '../types';

// ==================== 工具函数 ====================

/**
 * 构建节点 ID 到节点的映射
 */
function buildNodeMap(nodes: ChildNodeV2[]): Map<number, ChildNodeV2> {
  const map = new Map<number, ChildNodeV2>();
  nodes.forEach((node) => map.set(node.id, node));
  return map;
}

/**
 * 构建反向邻接表（找到每个节点的前驱节点）
 * 同时支持从 nextNodeIds 和 edgeList 获取连线关系
 */
function buildReverseGraph(
  nodes: ChildNodeV2[],
  edgeList?: EdgeV2[],
): Map<number, number[]> {
  const reverseGraph = new Map<number, number[]>();

  // 初始化
  nodes.forEach((node) => {
    reverseGraph.set(node.id, []);
  });

  // 方式1: 从节点的 nextNodeIds 构建反向边
  nodes.forEach((node) => {
    const nextNodeIds = node.nextNodeIds || [];
    nextNodeIds.forEach((nextId) => {
      const prevNodes = reverseGraph.get(nextId) || [];
      if (!prevNodes.includes(node.id)) {
        prevNodes.push(node.id);
        reverseGraph.set(nextId, prevNodes);
      }
    });

    // 处理条件分支节点的特殊连线
    if (
      node.type === NodeTypeEnumV2.Condition &&
      node.nodeConfig?.conditionBranchConfigs
    ) {
      node.nodeConfig.conditionBranchConfigs.forEach((branch) => {
        if (branch.nextNodeIds) {
          branch.nextNodeIds.forEach((nextId) => {
            const prevNodes = reverseGraph.get(nextId) || [];
            if (!prevNodes.includes(node.id)) {
              prevNodes.push(node.id);
              reverseGraph.set(nextId, prevNodes);
            }
          });
        }
      });
    }

    // 处理意图识别节点的特殊连线
    if (
      node.type === NodeTypeEnumV2.IntentRecognition &&
      node.nodeConfig?.intentConfigs
    ) {
      node.nodeConfig.intentConfigs.forEach((intent) => {
        if (intent.nextNodeIds) {
          intent.nextNodeIds.forEach((nextId) => {
            const prevNodes = reverseGraph.get(nextId) || [];
            if (!prevNodes.includes(node.id)) {
              prevNodes.push(node.id);
              reverseGraph.set(nextId, prevNodes);
            }
          });
        }
      });
    }

    // 处理问答节点的选项连线
    if (node.type === NodeTypeEnumV2.QA && node.nodeConfig?.options) {
      node.nodeConfig.options.forEach((option) => {
        if (option.nextNodeIds) {
          option.nextNodeIds.forEach((nextId) => {
            const prevNodes = reverseGraph.get(nextId) || [];
            if (!prevNodes.includes(node.id)) {
              prevNodes.push(node.id);
              reverseGraph.set(nextId, prevNodes);
            }
          });
        }
      });
    }
  });

  // 方式2: 从 edgeList 补充（以防 nextNodeIds 不完整）
  if (edgeList && edgeList.length > 0) {
    edgeList.forEach((edge) => {
      const sourceId = parseInt(edge.source, 10);
      const targetId = parseInt(edge.target, 10);

      if (!isNaN(sourceId) && !isNaN(targetId)) {
        const prevNodes = reverseGraph.get(targetId) || [];
        if (!prevNodes.includes(sourceId)) {
          prevNodes.push(sourceId);
          reverseGraph.set(targetId, prevNodes);
        }
      }
    });
  }

  return reverseGraph;
}

/**
 * 使用 BFS 找到所有前驱节点（可达的上级节点）
 */
function findAllPredecessors(
  nodeId: number,
  reverseGraph: Map<number, number[]>,
  visited: Set<number> = new Set(),
): number[] {
  const predecessors: number[] = [];
  const queue: number[] = [...(reverseGraph.get(nodeId) || [])];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    predecessors.push(current);

    const prevNodes = reverseGraph.get(current) || [];
    prevNodes.forEach((prev) => {
      if (!visited.has(prev)) {
        queue.push(prev);
      }
    });
  }

  return predecessors;
}

/**
 * 获取节点的输出参数
 */
function getNodeOutputArgs(node: ChildNodeV2): InputAndOutConfigV2[] {
  return node.nodeConfig.outputArgs || [];
}

/**
 * 生成参数的完整路径键
 * TODO: 待后续使用
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateArgKey(
  nodeId: number,
  argName: string,
  path: string[] = [],
): string {
  const fullPath = [argName, ...path].join('.');
  return `${nodeId}.${fullPath}`;
}

/**
 * 递归展开参数的子属性，生成 argMap
 */
function flattenArgsToMap(
  nodeId: number,
  args: InputAndOutConfigV2[],
  parentPath: string[] = [],
): ArgMapV2 {
  const argMap: ArgMapV2 = {};

  args.forEach((arg) => {
    const currentPath = [...parentPath, arg.name];
    const key = `${nodeId}.${currentPath.join('.')}`;

    argMap[key] = arg;

    // 如果有子参数，递归展开
    const subArgs = arg.subArgs || arg.children;
    if (subArgs && subArgs.length > 0) {
      const subMap = flattenArgsToMap(nodeId, subArgs, currentPath);
      Object.assign(argMap, subMap);
    }
  });

  return argMap;
}

// ==================== 主要函数 ====================

/**
 * 计算节点的上级节点参数
 *
 * @param nodeId 目标节点 ID
 * @param workflowData 工作流数据
 * @returns 上级节点列表和参数映射
 */
export function calculateNodePreviousArgs(
  nodeId: number,
  workflowData: WorkflowDataV2,
): NodePreviousAndArgMapV2 {
  const { nodeList, edgeList } = workflowData;

  // 构建节点映射
  const nodeMap = buildNodeMap(nodeList);

  // 获取当前节点
  const currentNode = nodeMap.get(nodeId);
  if (!currentNode) {
    return {
      previousNodes: [],
      innerPreviousNodes: [],
      argMap: {},
    };
  }

  // 构建反向图（同时使用 nextNodeIds 和 edgeList）
  const reverseGraph = buildReverseGraph(nodeList, edgeList);

  // 找到所有前驱节点
  const predecessorIds = findAllPredecessors(nodeId, reverseGraph);

  // 构建上级节点列表
  const previousNodes: PreviousListV2[] = [];
  const argMap: ArgMapV2 = {};

  predecessorIds.forEach((predId) => {
    const predNode = nodeMap.get(predId);
    if (!predNode) return;

    // 跳过循环相关的内部节点（LoopStart, LoopEnd）
    if (
      predNode.type === NodeTypeEnumV2.LoopStart ||
      predNode.type === NodeTypeEnumV2.LoopEnd
    ) {
      return;
    }

    const outputArgs = getNodeOutputArgs(predNode);

    // 添加到上级节点列表
    previousNodes.push({
      id: predNode.id,
      name: predNode.name,
      type: predNode.type,
      icon: predNode.icon as string,
      outputArgs,
    });

    // 展开参数到 argMap
    const nodeArgMap = flattenArgsToMap(predNode.id, outputArgs);
    Object.assign(argMap, nodeArgMap);
  });

  // 处理循环内部节点的特殊情况
  let innerPreviousNodes: PreviousListV2[] = [];

  if (currentNode.loopNodeId) {
    // 当前节点在循环内部，需要添加循环内部的上级节点
    const loopNode = nodeMap.get(currentNode.loopNodeId);

    if (loopNode && loopNode.innerNodes) {
      // 构建循环内部节点的反向图
      const innerReverseGraph = buildReverseGraph(loopNode.innerNodes);
      const innerPredecessorIds = findAllPredecessors(
        nodeId,
        innerReverseGraph,
      );

      innerPredecessorIds.forEach((predId) => {
        const predNode = loopNode.innerNodes?.find((n) => n.id === predId);
        if (!predNode) return;

        const outputArgs = getNodeOutputArgs(predNode);

        innerPreviousNodes.push({
          id: predNode.id,
          name: predNode.name,
          type: predNode.type,
          icon: predNode.icon as string,
          outputArgs,
        });

        // 展开参数到 argMap
        const nodeArgMap = flattenArgsToMap(predNode.id, outputArgs);
        Object.assign(argMap, nodeArgMap);
      });
    }
  }

  return {
    previousNodes,
    innerPreviousNodes,
    argMap,
  };
}

/**
 * 解析变量引用字符串
 *
 * @param bindValue 引用字符串，格式如 "123.output.field"
 * @returns 解析结果
 */
export function parseVariableReference(bindValue: string): {
  nodeId: number;
  path: string[];
  fullPath: string;
} | null {
  if (!bindValue || typeof bindValue !== 'string') {
    return null;
  }

  const parts = bindValue.split('.');
  if (parts.length < 2) {
    return null;
  }

  const nodeId = parseInt(parts[0], 10);
  if (isNaN(nodeId)) {
    return null;
  }

  return {
    nodeId,
    path: parts.slice(1),
    fullPath: parts.slice(1).join('.'),
  };
}

/**
 * 验证变量引用是否有效
 *
 * @param bindValue 引用字符串
 * @param argMap 参数映射
 * @returns 是否有效
 */
export function isValidReference(bindValue: string, argMap: ArgMapV2): boolean {
  if (!bindValue) return true; // 空值视为有效

  const parsed = parseVariableReference(bindValue);
  if (!parsed) return false;

  // 检查完整路径是否存在于 argMap 中
  return bindValue in argMap;
}

/**
 * 获取引用的参数定义
 *
 * @param bindValue 引用字符串
 * @param argMap 参数映射
 * @returns 参数定义
 */
export function getReferencedArg(
  bindValue: string,
  argMap: ArgMapV2,
): InputAndOutConfigV2 | null {
  if (!bindValue || !argMap[bindValue]) {
    return null;
  }

  return argMap[bindValue];
}

/**
 * 查找所有引用了指定节点的变量
 *
 * @param nodeId 被引用的节点 ID
 * @param targetNode 要检查的目标节点
 * @returns 引用列表
 */
export function findReferencesToNode(
  nodeId: number,
  targetNode: ChildNodeV2,
): { field: string; bindValue: string }[] {
  const references: { field: string; bindValue: string }[] = [];
  const nodeIdStr = nodeId.toString();

  // 检查输入参数
  const inputArgs = targetNode.nodeConfig.inputArgs || [];
  inputArgs.forEach((arg, index) => {
    if (arg.bindValue?.startsWith(nodeIdStr + '.')) {
      references.push({
        field: `inputArgs[${index}].${arg.name}`,
        bindValue: arg.bindValue,
      });
    }
  });

  // 检查其他可能包含引用的字段
  const fieldsToCheck = [
    'systemPrompt',
    'userPrompt',
    'question',
    'url',
    'text',
    'content',
  ];

  fieldsToCheck.forEach((field) => {
    const value = (targetNode.nodeConfig as any)[field];
    if (typeof value === 'string' && value.includes(`{{${nodeIdStr}.`)) {
      references.push({
        field,
        bindValue: value,
      });
    }
  });

  return references;
}

/**
 * 获取节点的所有可用变量（用于变量选择器）
 *
 * @param nodeId 目标节点 ID
 * @param workflowData 工作流数据
 * @returns 可用变量列表
 */
export function getAvailableVariables(
  nodeId: number,
  workflowData: WorkflowDataV2,
): {
  nodeId: number;
  nodeName: string;
  nodeType: NodeTypeEnumV2;
  variables: {
    key: string;
    name: string;
    dataType: string;
    path: string;
  }[];
}[] {
  const { previousNodes, argMap: _argMap } = calculateNodePreviousArgs(
    nodeId,
    workflowData,
  );

  return previousNodes.map((prevNode) => ({
    nodeId: prevNode.id,
    nodeName: prevNode.name,
    nodeType: prevNode.type,
    variables: prevNode.outputArgs.map((arg) => ({
      key: `${prevNode.id}.${arg.name}`,
      name: arg.name,
      dataType: arg.dataType || 'String',
      path: arg.name,
    })),
  }));
}

export default {
  calculateNodePreviousArgs,
  parseVariableReference,
  isValidReference,
  getReferencedArg,
  findReferencesToNode,
  getAvailableVariables,
};
