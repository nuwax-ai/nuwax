/**
 * V3 变量引用计算
 *
 * 从 V2 迁移而来，实现前端变量引用计算逻辑：
 * 1. 根据节点间的连线关系，计算每个节点可用的上级节点输出参数
 * 2. 支持嵌套对象和数组的子属性访问
 * 3. 支持从 nextNodeIds 和 edgeList 两种方式获取连线关系
 *
 * 替代后端 getOutputArgs 接口，解决 V1 前后端数据不同步问题
 *
 * 规则可以参考: ../../docs/VARIABLE_REFERENCE_RULES.md
 */

import { DataTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import type {
  ArgMap,
  ChildNode,
  EdgeV3,
  InputAndOutConfig,
  NodePreviousAndArgMap,
  PreviousList,
  WorkflowDataV3,
} from '../types';

const EXECUTE_EXCEPTION_FLOW = 'EXECUTE_EXCEPTION_FLOW';
const INDEX_SYSTEM_NAME = 'INDEX';

// ==================== 工具函数 ====================

/**
 * 获取节点的所有下游节点 ID（用于排序）
 */
function collectNextNodeIds(node: ChildNode): number[] {
  const nextIds = new Set<number>();

  (node.nextNodeIds || []).forEach((id) => {
    if (id !== node.loopNodeId) {
      nextIds.add(id);
    }
  });

  if (
    node.type === NodeTypeEnum.Condition &&
    node.nodeConfig?.conditionBranchConfigs
  ) {
    node.nodeConfig.conditionBranchConfigs.forEach((branch) =>
      branch.nextNodeIds?.forEach((id) => nextIds.add(id)),
    );
  }

  if (
    node.type === NodeTypeEnum.IntentRecognition &&
    node.nodeConfig?.intentConfigs
  ) {
    node.nodeConfig.intentConfigs.forEach((intent) =>
      intent.nextNodeIds?.forEach((id) => nextIds.add(id)),
    );
  }

  if (node.type === NodeTypeEnum.QA && node.nodeConfig?.options) {
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
 * 构建节点 ID 到节点的映射
 * 注意：node.id 可能是字符串或数字，统一转换为数字作为 key
 */
function buildNodeMap(nodes: ChildNode[]): Map<number, ChildNode> {
  const map = new Map<number, ChildNode>();
  nodes.forEach((node) => {
    const nodeId = Number(node.id);
    map.set(nodeId, node);
  });
  return map;
}

/**
 * 构建反向邻接表（找到每个节点的前驱节点）
 * 同时支持从 nextNodeIds、分支连线和异常处理流连线建立索引
 */
function buildReverseGraph(
  nodes: ChildNode[],
  edgeList?: EdgeV3[],
): Map<number, number[]> {
  const reverseGraph = new Map<number, number[]>();

  // 初始化
  nodes.forEach((node) => {
    reverseGraph.set(Number(node.id), []);
  });

  const addEdge = (from: number, to: number) => {
    const prevs = reverseGraph.get(to);
    if (prevs && !prevs.includes(from)) {
      prevs.push(from);
    }
  };

  nodes.forEach((node) => {
    const nodeId = Number(node.id);
    const nextIds = collectNextNodeIds(node);
    nextIds.forEach((nextId) => addEdge(nodeId, nextId));
  });

  // 方式2: 从 edgeList 补充（以防 nextNodeIds 不完整）
  if (edgeList && edgeList.length > 0) {
    edgeList.forEach((edge) => {
      const sourceId = parseInt(edge.source, 10);
      const targetId = parseInt(edge.target, 10);
      if (!isNaN(sourceId) && !isNaN(targetId)) {
        addEdge(sourceId, targetId);
      }
    });
  }

  return reverseGraph;
}

/**
 * 构建正向邻接表（找到每个节点的后继节点）
 * 同步 Java 的 nextNodeIds 处理逻辑
 */
function buildForwardGraph(nodes: ChildNode[]): Map<number, number[]> {
  const forwardGraph = new Map<number, number[]>();
  nodes.forEach((node) => {
    forwardGraph.set(Number(node.id), collectNextNodeIds(node));
  });
  return forwardGraph;
}

/**
 * 获取逻辑上的“未来节点”（从起始点正向可达的所有节点）
 */
function getForwardReachableNodes(
  startNodeId: number,
  forwardGraph: Map<number, number[]>,
): Set<number> {
  const reachable = new Set<number>();
  const stack = [startNodeId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const nexts = forwardGraph.get(current) || [];
    nexts.forEach((nextId) => {
      if (!reachable.has(nextId)) {
        reachable.add(nextId);
        stack.push(nextId);
      }
    });
  }
  return reachable;
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
function cloneArg(arg: InputAndOutConfig): InputAndOutConfig {
  return JSON.parse(JSON.stringify(arg)) as InputAndOutConfig;
}

function ensureVariableSuccessOutput(node: ChildNode): InputAndOutConfig[] {
  const outputs = [...(node.nodeConfig.outputArgs || [])];
  const isSetVariable =
    node.type === NodeTypeEnum.Variable &&
    node.nodeConfig.configType === 'SET_VARIABLE';
  const exists = outputs.some((o) => o.name === 'isSuccess');
  if (isSetVariable && !exists) {
    outputs.push({
      name: 'isSuccess',
      dataType: DataTypeEnum.Boolean,
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

function getNodeOutputArgs(
  node: ChildNode,
  systemVariables: InputAndOutConfig[] = [],
): InputAndOutConfig[] {
  // Start 节点：将 inputArgs 视为可引用输出，并保留原输出
  if (node.type === NodeTypeEnum.Start) {
    const outputFromInput =
      node.nodeConfig?.inputArgs?.map((arg) => ({
        ...cloneArg(arg),
        bindValueType: undefined,
        bindValue: '',
      })) || [];
    const outputs = node.nodeConfig?.outputArgs || [];
    return [...outputFromInput, ...systemVariables, ...outputs];
  }

  // Loop 节点：根据 JSON 示例，输出中包含带 -input 前缀的系统变量
  // 注意：这里仅处理暴露给下游的输出，内部引用的逻辑在 calculateNodePreviousArgs 中处理
  if (node.type === NodeTypeEnum.Loop) {
    const outputs = [...(node.nodeConfig.outputArgs || [])];
    // 如果没有 INDEX，根据后端示例补充
    if (!outputs.some((o) => o.name === 'INDEX')) {
      outputs.push({
        name: 'INDEX',
        dataType: DataTypeEnum.Integer,
        description: '数组索引',
        require: false,
        systemVariable: true,
        bindValueType: undefined,
        bindValue: '',
        key: 'INDEX', // 这里暂时用简名，外部 prefixOutputArgsKeys 会处理
        subArgs: [],
      });
    }
    return outputs;
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
 * 递归为参数添加带节点ID前缀的 key
 */
function prefixOutputArgsKeys(
  nodeIdOrPrefix: number | string,
  args: InputAndOutConfig[],
  parentPath: string[] = [],
): InputAndOutConfig[] {
  return args.map((arg) => {
    // 使用 arg.name 作为主要标识，如果为空则使用 arg.key (用于 variableArgs 等场景)
    const argIdentifier = arg.name || arg.key || '';
    const currentPath = [...parentPath, argIdentifier];
    const key = `${nodeIdOrPrefix}.${currentPath.join('.')}`;
    const newArg = { ...arg, key };

    const subArgs = arg.subArgs || arg.children;
    if (subArgs && subArgs.length > 0) {
      newArg.subArgs = prefixOutputArgsKeys(
        nodeIdOrPrefix,
        subArgs,
        currentPath,
      );
      newArg.children = newArg.subArgs;
    }
    return newArg;
  });
}

/**
 * 递归展开参数的子属性，生成 argMap
 */
function flattenArgsToMap(
  nodeIdOrPrefix: number | string,
  args: InputAndOutConfig[],
  parentPath: string[] = [],
): ArgMap {
  const argMap: ArgMap = {};

  args.forEach((arg) => {
    // 使用 arg.name 作为主要标识，如果为空则使用 arg.key (用于 variableArgs 等场景)
    const argIdentifier = arg.name || arg.key || '';
    const currentPath = [...parentPath, argIdentifier];
    const key = `${nodeIdOrPrefix}.${currentPath.join('.')}`;

    argMap[key] = arg;

    // 如果有子参数，递归展开
    const subArgs = arg.subArgs || arg.children;
    if (subArgs && subArgs.length > 0) {
      const subMap = flattenArgsToMap(nodeIdOrPrefix, subArgs, currentPath);
      Object.assign(argMap, subMap);
    }
  });

  return argMap;
}

// ==================== 主要函数 ====================

/**
 * 计算节点的可引用变量（PreviousNodes）和变量映射表（ArgMap）
 * @param nodeId 当前节点ID
 * @param workflowData 工作流数据
 * @returns 上级节点列表和参数映射
 */
export function calculateNodePreviousArgs(
  nodeId: number,
  workflowData: WorkflowDataV3,
): NodePreviousAndArgMap {
  const {
    nodes: nodeList,
    edges: edgeList,
    systemVariables = [],
  } = workflowData;

  // 构建节点映射
  const nodeMap = buildNodeMap(nodeList);

  // 构建反向图（同时使用 nextNodeIds 和 edgeList）
  const reverseGraph = buildReverseGraph(nodeList, edgeList);
  // 构建正向图（用于计算未来节点和执行顺序排序）
  const forwardGraph = buildForwardGraph(nodeList);

  // 确保 nodeId 是 number 类型
  const nodeIdNum = Number(nodeId);

  // 1. 获取所有“逻辑未来节点”，这些节点即便连线回来也不能作为前置参数（同步 Java 死循环规避）
  const futureNodes = getForwardReachableNodes(nodeIdNum, forwardGraph);

  // 2. 找到所有前驱节点，并过滤掉自身和逻辑上的未来节点
  const predecessorIds = findAllPredecessors(nodeIdNum, reverseGraph).filter(
    (id) => id !== nodeIdNum && !futureNodes.has(id),
  );

  // 构建上级节点列表
  const previousNodes: PreviousList[] = [];
  const argMap: ArgMap = {};

  // 提前获取当前节点用于后续过滤
  const currentNode = nodeMap.get(nodeIdNum);

  predecessorIds.forEach((predId) => {
    const predNode = nodeMap.get(predId);
    if (!predNode) return;

    // 跳过循环相关的内部节点（LoopStart, LoopEnd）
    if (
      predNode.type === NodeTypeEnum.LoopStart ||
      predNode.type === NodeTypeEnum.LoopEnd
    ) {
      return;
    }

    // 如果当前节点在循环内，跳过其所属的 Loop 节点（后面的 loopNodeId 块会单独处理）
    if (currentNode?.loopNodeId && predNode.id === currentNode.loopNodeId) {
      return;
    }

    // 跳过属于其他循环的内部节点（loopNodeId 存在但不等于当前节点的 loopNodeId）
    // 注意：使用 Number() 统一类型
    if (
      predNode.loopNodeId &&
      Number(predNode.loopNodeId) !== Number(currentNode?.loopNodeId)
    ) {
      return;
    }

    // 如果当前节点是 Loop，跳过自己的内部节点（这些会在 innerPreviousNodes 中处理）
    // 注意：使用 Number() 统一类型
    if (
      currentNode?.type === NodeTypeEnum.Loop &&
      Number(predNode.loopNodeId) === Number(currentNode.id)
    ) {
      return;
    }

    // 获取并处理输出参数，添加 key 前缀
    const outputArgs = getNodeOutputArgs(predNode, systemVariables);

    // V3: 针对 Loop 节点，部分输出参数使用 -input 前缀以匹配后端格式
    let prefixedOutputArgs: InputAndOutConfig[];
    if (predNode.type === NodeTypeEnum.Loop) {
      prefixedOutputArgs = outputArgs.map((arg) => {
        // 同步 Java: INDEX 和 _item 使用 -input，其他普通输出使用 nodeId
        const prefix =
          arg.name === 'INDEX' || (arg.name && arg.name.endsWith('_item'))
            ? `${predNode.id}-input`
            : predNode.id;
        return prefixOutputArgsKeys(prefix, [arg])[0];
      });
    } else {
      prefixedOutputArgs = prefixOutputArgsKeys(predNode.id, outputArgs);
    }

    // 简化逻辑：如果节点没有有效的 outputArgs（无法展示任何可引用变量），跳过此节点
    if (!prefixedOutputArgs || prefixedOutputArgs.length === 0) {
      return;
    }

    // 添加到上级节点列表 - 确保 id 是数字类型
    const numericId = Number(predNode.id);
    previousNodes.push({
      id: numericId,
      name: predNode.name,
      type: predNode.type,
      icon: predNode.icon as string,
      outputArgs: prefixedOutputArgs,
    });

    // 展开参数到 argMap
    // 针对 Loop 节点，需要分别根据 -input 和 nodeId 展开
    if (predNode.type === NodeTypeEnum.Loop) {
      const inputPart = prefixedOutputArgs.filter((a) =>
        a.key.includes('-input'),
      );
      const normalPart = prefixedOutputArgs.filter(
        (a) => !a.key.includes('-input'),
      );
      if (inputPart.length > 0) {
        Object.assign(
          argMap,
          flattenArgsToMap(`${predNode.id}-input`, inputPart),
        );
      }
      if (normalPart.length > 0) {
        Object.assign(argMap, flattenArgsToMap(numericId, normalPart));
      }
    } else {
      Object.assign(argMap, flattenArgsToMap(numericId, prefixedOutputArgs));
    }
  });

  // 如果当前节点不存在，直接返回
  if (!currentNode) {
    return {
      previousNodes,
      innerPreviousNodes: [],
      argMap,
    };
  }

  let innerPreviousNodes: PreviousList[] = [];

  // 当前节点在循环内部：需要添加循环节点的外部前驱和循环变量 (同步 Java Line 105-237)
  // 注意：innerPreviousNodes 只有当 currentNode 是 Loop 时才填充，循环内部节点不填充
  if (currentNode.loopNodeId) {
    const loopNodeIdNum = Number(currentNode.loopNodeId);
    const loopNode = nodeMap.get(loopNodeIdNum);

    if (loopNode) {
      // 1. 如果当前节点是循环的 innerStartNode，则需要添加循环节点的外部前驱 (Line 106-110)
      // 否则，通过递归遍历最终会到达 innerStartNode 并添加外部前驱 (Line 315-328)
      // 前端简化处理：对于循环内的所有节点，都添加循环的外部前驱
      const loopPredecessors = findAllPredecessors(
        loopNodeIdNum,
        reverseGraph,
      ).filter((id) => id !== loopNodeIdNum && !futureNodes.has(id));

      loopPredecessors.forEach((predId) => {
        const predNode = nodeMap.get(predId);
        if (!predNode) return;

        // 跳过 LoopStart/LoopEnd 和循环内部的节点
        if (
          predNode.type === NodeTypeEnum.LoopStart ||
          predNode.type === NodeTypeEnum.LoopEnd ||
          predNode.loopNodeId === loopNodeIdNum
        ) {
          return;
        }

        // 检查是否已经在 previousNodes 中
        if (previousNodes.some((pn) => pn.id === predId)) {
          return;
        }

        const outputArgs = getNodeOutputArgs(predNode, systemVariables);
        const prefixedOutputArgs = prefixOutputArgsKeys(
          predNode.id,
          outputArgs,
        );

        if (prefixedOutputArgs.length === 0) return;

        previousNodes.push({
          id: predNode.id,
          name: predNode.name,
          type: predNode.type,
          icon: predNode.icon as string,
          outputArgs: prefixedOutputArgs,
        });

        Object.assign(
          argMap,
          flattenArgsToMap(predNode.id, prefixedOutputArgs),
        );
      });

      // 2. 循环节点自身的输入数组与变量也可作为可引用输出 (Line 168-237)
      const inputBasedOutputs: InputAndOutConfig[] = [];
      const varBasedOutputs: InputAndOutConfig[] = [];
      const argMapSnapshot = { ...argMap };

      // 2.1 数组输入展开为 item (使用 -input 后缀)
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
              (DataTypeEnum as any)[elementType] || DataTypeEnum.Object;

            const itemArg: InputAndOutConfig = {
              ...cloneArg(inputArg),
              name: `${inputArg.name}_item`,
              dataType: elementTypeEnum,
              subArgs: refArg.subArgs
                ? (JSON.parse(
                    JSON.stringify(refArg.subArgs),
                  ) as InputAndOutConfig[])
                : refArg.subArgs,
            };
            inputBasedOutputs.push(itemArg);
          }
        }
      });

      // 2.2 追加 INDEX 系统变量 (使用 -input 后缀)
      inputBasedOutputs.push({
        name: INDEX_SYSTEM_NAME,
        dataType: DataTypeEnum.Integer,
        description: '数组索引',
        require: false,
        systemVariable: true,
        bindValueType: undefined,
        bindValue: '',
        key: INDEX_SYSTEM_NAME,
        subArgs: [],
      });

      // 2.3 循环变量 variableArgs (使用 -var 后缀)
      loopNode.nodeConfig.variableArgs?.forEach((variableArg) => {
        const outArg = cloneArg(variableArg);
        if (variableArg.bindValueType === 'Reference') {
          const refArg = argMapSnapshot[variableArg.bindValue || ''];
          if (refArg) {
            outArg.subArgs = refArg.subArgs
              ? (JSON.parse(
                  JSON.stringify(refArg.subArgs),
                ) as InputAndOutConfig[])
              : refArg.subArgs;
          }
        }
        varBasedOutputs.push(outArg);
      });

      // 给 extraOutputs 添加前缀 (匹配后端格式)
      const prefixedInputs = prefixOutputArgsKeys(
        `${loopNode.id}-input`,
        inputBasedOutputs,
      );
      const prefixedVars = prefixOutputArgsKeys(
        `${loopNode.id}-var`,
        varBasedOutputs,
      );
      const allExtraOutputs = [...prefixedInputs, ...prefixedVars];

      if (allExtraOutputs.length > 0) {
        // 检查 Loop 节点是否已经在 previousNodes 中
        const loopIndex = previousNodes.findIndex(
          (item) => Number(item.id) === loopNodeIdNum,
        );
        if (loopIndex > -1) {
          // 合并输出参数，去重
          const existingArgs = previousNodes[loopIndex].outputArgs;
          allExtraOutputs.forEach((newArg) => {
            if (!existingArgs.some((ea) => ea.key === newArg.key)) {
              existingArgs.push(newArg);
            }
          });
        } else {
          previousNodes.push({
            id: loopNodeIdNum,
            name: loopNode.name,
            type: loopNode.type,
            icon: loopNode.icon as string,
            outputArgs: allExtraOutputs,
          });
        }

        Object.assign(
          argMap,
          flattenArgsToMap(`${loopNode.id}-input`, inputBasedOutputs),
        );
        Object.assign(
          argMap,
          flattenArgsToMap(`${loopNode.id}-var`, varBasedOutputs),
        );
      }
    }
  }

  // 如果当前节点是 Loop，补充内部变量到 innerPreviousNodes (用于配置 Loop 自己的输出，同步 Java Line 112-167)
  if (currentNode.type === NodeTypeEnum.Loop) {
    // 1. 从 LoopEnd 节点开始，递归收集所有内部前驱节点 (Line 112-138)
    if (currentNode.innerNodes) {
      // 构建内部节点的反向图
      const innerNodeMap = new Map<number, ChildNode>();
      currentNode.innerNodes.forEach((n) => innerNodeMap.set(n.id, n));
      const innerReverseGraph = buildReverseGraph(currentNode.innerNodes);

      // 从 LoopEnd 开始递归查找所有前驱
      const endNodeId = currentNode.innerEndNodeId;
      if (endNodeId) {
        const innerPredIds = findAllPredecessors(endNodeId, innerReverseGraph);

        // 过滤：只保留属于当前循环的节点 (loopNodeId === currentNode.id)，排除 LoopStart/LoopEnd
        // 注意：需要使用 Number() 统一类型，因为保存后 currentNode.id 可能变成字符串
        const currentLoopId = Number(currentNode.id);
        const validInnerNodes = innerPredIds
          .map((id) => innerNodeMap.get(id))
          .filter(
            (n): n is ChildNode =>
              n !== undefined &&
              Number(n.loopNodeId) === currentLoopId &&
              n.type !== NodeTypeEnum.LoopStart &&
              n.type !== NodeTypeEnum.LoopEnd,
          );

        validInnerNodes.forEach((innerNode) => {
          const outputArgs = getNodeOutputArgs(innerNode, systemVariables);
          if (outputArgs.length === 0) return;

          // 转换类型为 Array_ 前缀，并设置 originDataType (Line 119-138)
          const transformed = outputArgs.map((arg) => {
            const newArg = cloneArg(arg);
            // 记录原始类型
            newArg.originDataType = newArg.dataType;

            // 转换为 Array 类型
            if (
              !newArg.dataType ||
              (typeof newArg.dataType === 'string' &&
                !(newArg.dataType as string).startsWith('Array_'))
            ) {
              const base =
                typeof newArg.dataType === 'string' && newArg.dataType
                  ? newArg.dataType
                  : 'Object';
              newArg.dataType = `Array_${base}` as DataTypeEnum;
            } else {
              // 已经是 Array 类型，转为 Array_Object
              newArg.dataType = DataTypeEnum.Array_Object;
            }
            return newArg;
          });

          const prefixedOutputArgs = prefixOutputArgsKeys(
            innerNode.id,
            transformed,
          );

          innerPreviousNodes.push({
            id: innerNode.id,
            name: innerNode.name,
            type: innerNode.type,
            icon: innerNode.icon as string,
            outputArgs: prefixedOutputArgs,
            loopNodeId: innerNode.loopNodeId,
          });

          Object.assign(argMap, flattenArgsToMap(innerNode.id, transformed));
        });
      }
    }

    // 2. 循环节点自身的变量 - 只添加 variableArgs，不添加 INDEX (Line 140-167)
    // 注意：后端在此场景只添加 variableArgs，INDEX 是给循环内部节点用的
    const varBasedOutputs: InputAndOutConfig[] = [];
    const argMapSnapshot = { ...argMap };

    currentNode.nodeConfig.variableArgs?.forEach((variableArg) => {
      const outArg = cloneArg(variableArg);
      if (variableArg.bindValueType === 'Reference') {
        const refArg = argMapSnapshot[variableArg.bindValue || ''];
        if (refArg) {
          outArg.subArgs = refArg.subArgs
            ? (JSON.parse(
                JSON.stringify(refArg.subArgs),
              ) as InputAndOutConfig[])
            : refArg.subArgs;
        }
      }
      varBasedOutputs.push(outArg);
    });

    if (varBasedOutputs.length > 0) {
      const prefixedVars = prefixOutputArgsKeys(
        `${currentNode.id}-var`,
        varBasedOutputs,
      );

      innerPreviousNodes.push({
        id: Number(currentNode.id),
        name: currentNode.name,
        type: currentNode.type,
        icon: currentNode.icon as string,
        outputArgs: prefixedVars,
      });

      Object.assign(
        argMap,
        flattenArgsToMap(`${currentNode.id}-var`, varBasedOutputs),
      );
    }
  }

  // 按执行流顺序排序 (同步 Java sortPreviousNodes)
  const orderMap = new Map<number, number>();
  const startNodeInWorkflow = nodeList.find(
    (n) => n.type === NodeTypeEnum.Start,
  );
  if (startNodeInWorkflow) {
    const visited = new Set<number>();
    let order = 0;
    const dfs = (id: number) => {
      if (visited.has(id)) return;
      visited.add(id);
      orderMap.set(id, order++);
      const nexts = forwardGraph.get(id) || [];
      nexts.forEach(dfs);
    };
    dfs(Number(startNodeInWorkflow.id));
  }

  const sortByOrder = (a: PreviousList, b: PreviousList) => {
    const oa = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const ob = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (oa === ob) return b.id - a.id;
    return ob - oa;
  };

  previousNodes.sort(sortByOrder);
  innerPreviousNodes.sort(sortByOrder);

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
export function isValidReference(bindValue: string, argMap: ArgMap): boolean {
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
  argMap: ArgMap,
): InputAndOutConfig | null {
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
  targetNode: ChildNode,
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
  workflowData: WorkflowDataV3,
): {
  nodeId: number;
  nodeName: string;
  nodeType: NodeTypeEnum;
  variables: {
    key: string;
    name: string;
    dataType: string;
    path: string;
  }[];
}[] {
  const { previousNodes } = calculateNodePreviousArgs(nodeId, workflowData);

  return previousNodes.map((prevNode) => ({
    nodeId: prevNode.id,
    nodeName: prevNode.name,
    nodeType: prevNode.type,
    variables: prevNode.outputArgs.map((arg) => ({
      key: `${prevNode.id}.${arg.name}`,
      name: arg.name,
      dataType: arg.dataType || 'String',
      path: arg.name,
      description: arg.description,
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
