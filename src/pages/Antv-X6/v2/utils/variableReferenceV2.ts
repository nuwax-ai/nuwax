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
import { DataTypeEnumV2, NodeTypeEnumV2 } from '../types';

const EXECUTE_EXCEPTION_FLOW = 'EXECUTE_EXCEPTION_FLOW';
const INDEX_SYSTEM_NAME = 'INDEX';
const SYSTEM_VARIABLES: InputAndOutConfigV2[] = [
  {
    name: 'SYS_USER_ID',
    dataType: DataTypeEnumV2.String,
    description: '系统用户ID',
    require: false,
    systemVariable: true,
    bindValueType: undefined,
    bindValue: '',
    key: 'SYS_USER_ID',
    subArgs: [],
  },
];

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
    const nextNodeIds =
      (node.nextNodeIds || []).filter((id) => id !== node.loopNodeId) || [];
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

    // 处理异常分支节点 (EXECUTE_EXCEPTION_FLOW)
    const exceptionHandleConfig = node.nodeConfig?.exceptionHandleConfig;
    if (
      exceptionHandleConfig?.exceptionHandleType === EXECUTE_EXCEPTION_FLOW &&
      exceptionHandleConfig.exceptionHandleNodeIds &&
      exceptionHandleConfig.exceptionHandleNodeIds.length > 0
    ) {
      exceptionHandleConfig.exceptionHandleNodeIds.forEach((nextId) => {
        const prevNodes = reverseGraph.get(nextId) || [];
        if (!prevNodes.includes(node.id)) {
          prevNodes.push(node.id);
          reverseGraph.set(nextId, prevNodes);
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
 * 获取节点的所有下游节点 ID（用于排序）
 */
function collectNextNodeIds(node: ChildNodeV2): number[] {
  const nextIds = new Set<number>();

  (node.nextNodeIds || []).forEach((id) => {
    if (id !== node.loopNodeId) {
      nextIds.add(id);
    }
  });

  if (
    node.type === NodeTypeEnumV2.Condition &&
    node.nodeConfig?.conditionBranchConfigs
  ) {
    node.nodeConfig.conditionBranchConfigs.forEach((branch) =>
      branch.nextNodeIds?.forEach((id) => nextIds.add(id)),
    );
  }

  if (
    node.type === NodeTypeEnumV2.IntentRecognition &&
    node.nodeConfig?.intentConfigs
  ) {
    node.nodeConfig.intentConfigs.forEach((intent) =>
      intent.nextNodeIds?.forEach((id) => nextIds.add(id)),
    );
  }

  if (node.type === NodeTypeEnumV2.QA && node.nodeConfig?.options) {
    node.nodeConfig.options.forEach((option) =>
      option.nextNodeIds?.forEach((id) => nextIds.add(id)),
    );
  }

  const exceptionHandleConfig = node.nodeConfig?.exceptionHandleConfig;
  if (
    exceptionHandleConfig?.exceptionHandleType === EXECUTE_EXCEPTION_FLOW &&
    exceptionHandleConfig.exceptionHandleNodeIds
  ) {
    exceptionHandleConfig.exceptionHandleNodeIds.forEach((id) =>
      nextIds.add(id),
    );
  }

  return Array.from(nextIds);
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
function cloneArg(arg: InputAndOutConfigV2): InputAndOutConfigV2 {
  return JSON.parse(JSON.stringify(arg)) as InputAndOutConfigV2;
}

function ensureVariableSuccessOutput(node: ChildNodeV2): InputAndOutConfigV2[] {
  const outputs = [...(node.nodeConfig.outputArgs || [])];
  const isSetVariable =
    node.type === NodeTypeEnumV2.Variable &&
    node.nodeConfig.configType === 'SET_VARIABLE';
  const exists = outputs.some((o) => o.name === 'isSuccess');
  if (isSetVariable && !exists) {
    outputs.push({
      name: 'isSuccess',
      dataType: DataTypeEnumV2.Boolean,
      description: '变量设置结果',
      require: false,
      systemVariable: false,
      bindValueType: undefined,
      bindValue: '',
      key: 'isSuccess',
      subArgs: [],
    });
  }
  return outputs;
}

function getNodeOutputArgs(node: ChildNodeV2): InputAndOutConfigV2[] {
  // Start 节点：将 inputArgs 视为可引用输出，并保留原输出
  if (node.type === NodeTypeEnumV2.Start) {
    const outputFromInput =
      node.nodeConfig.inputArgs?.map((arg) => ({
        ...cloneArg(arg),
        bindValueType: undefined,
        bindValue: '',
      })) || [];
    const outputs = node.nodeConfig.outputArgs || [];
    return [...outputFromInput, ...SYSTEM_VARIABLES, ...outputs];
  }

  // Variable 节点：补充 isSuccess
  return ensureVariableSuccessOutput(node);
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

    // 循环节点自身的输入数组与变量也可作为可引用输出
    if (loopNode) {
      const extraOutputs: InputAndOutConfigV2[] = [];
      const argMapSnapshot = { ...argMap };

      // 数组输入展开为 item
      loopNode.nodeConfig.inputArgs?.forEach((inputArg) => {
        if (inputArg.bindValueType === 'Reference') {
          const refArg = argMapSnapshot[inputArg.bindValue || ''];
          if (
            refArg &&
            typeof refArg.dataType === 'string' &&
            (refArg.dataType as string).startsWith('Array_')
          ) {
            const elementType =
              (refArg.dataType as string).replace('Array_', '') || 'Object';
            const elementTypeEnum =
              (DataTypeEnumV2 as any)[elementType] || DataTypeEnumV2.Object;
            const itemArg: InputAndOutConfigV2 = {
              ...cloneArg(inputArg),
              name: `${inputArg.name}_item`,
              dataType: elementTypeEnum,
              subArgs: refArg.subArgs
                ? (JSON.parse(
                    JSON.stringify(refArg.subArgs),
                  ) as InputAndOutConfigV2[])
                : refArg.subArgs,
            };
            extraOutputs.push(itemArg);
          }
        }
      });

      // 追加 INDEX 系统变量
      extraOutputs.push({
        name: INDEX_SYSTEM_NAME,
        dataType: DataTypeEnumV2.Integer,
        description: '数组索引',
        require: false,
        systemVariable: true,
        bindValueType: undefined,
        bindValue: '',
        key: INDEX_SYSTEM_NAME,
        subArgs: [],
      });

      // 循环变量 variableArgs 也暴露
      loopNode.nodeConfig.variableArgs?.forEach((variableArg) => {
        if (variableArg.bindValueType === 'Reference') {
          const refArg = argMapSnapshot[variableArg.bindValue || ''];
          if (refArg) {
            const outArg = cloneArg(variableArg);
            outArg.subArgs = refArg.subArgs
              ? (JSON.parse(
                  JSON.stringify(refArg.subArgs),
                ) as InputAndOutConfigV2[])
              : refArg.subArgs;
            extraOutputs.push(outArg);
          }
        } else {
          extraOutputs.push(cloneArg(variableArg));
        }
      });

      if (extraOutputs.length > 0) {
        previousNodes.push({
          id: loopNode.id,
          name: loopNode.name,
          type: loopNode.type,
          icon: loopNode.icon as string,
          outputArgs: extraOutputs,
        });
        const loopArgMap = flattenArgsToMap(loopNode.id, extraOutputs);
        Object.assign(argMap, loopArgMap);
      }
    }
  }

  // 如果当前节点是 Loop，补充内部结束节点输出（转为 Array_*）到 innerPreviousNodes
  if (currentNode.type === NodeTypeEnumV2.Loop && currentNode.innerNodes) {
    const endNode = currentNode.innerNodes.find(
      (n) => n.id === currentNode.innerEndNodeId,
    );
    if (endNode?.nodeConfig?.outputArgs) {
      const transformed = endNode.nodeConfig.outputArgs.map((arg) => {
        const newArg = cloneArg(arg);
        // 记录原类型到 description，避免类型缺失（前端类型定义无 originDataType）
        if (newArg.description) {
          newArg.description = `${newArg.description} (origin:${
            newArg.dataType || 'unknown'
          })`;
        } else {
          newArg.description = `(origin:${newArg.dataType || 'unknown'})`;
        }
        if (
          !newArg.dataType ||
          (typeof newArg.dataType === 'string' &&
            !(newArg.dataType as string).startsWith('Array_'))
        ) {
          const base =
            typeof newArg.dataType === 'string' && newArg.dataType
              ? newArg.dataType
              : 'Object';
          newArg.dataType = `Array_${base}` as DataTypeEnumV2;
        }
        return newArg;
      });

      const loopEndNodeEntry: PreviousListV2 = {
        id: endNode.id,
        name: endNode.name,
        type: endNode.type,
        icon: endNode.icon as string,
        outputArgs: transformed,
      };
      innerPreviousNodes.push(loopEndNodeEntry);
      Object.assign(argMap, flattenArgsToMap(endNode.id, transformed));
    }
  }

  // 按从 Start 出发的拓扑顺序排序（靠近 Start 的在前）
  const orderMap = new Map<number, number>();
  const startNode = nodeList.find((n) => n.type === NodeTypeEnumV2.Start);
  if (startNode) {
    const visited = new Set<number>();
    let order = 0;
    const dfs = (id: number) => {
      if (visited.has(id)) return;
      visited.add(id);
      if (!orderMap.has(id)) {
        orderMap.set(id, order++);
      }
      const nextIds = collectNextNodeIds(nodeMap.get(id)!);
      nextIds.forEach((nextId) => dfs(nextId));
    };
    dfs(startNode.id);
  }

  const sortByOrder = (a: PreviousListV2, b: PreviousListV2) => {
    const oa = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const ob = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (oa === ob) return a.id - b.id;
    return oa - ob;
  };

  previousNodes.sort(sortByOrder);

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
