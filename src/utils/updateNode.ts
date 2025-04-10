import service from '@/services/modifyNode';
import { ChildNode } from '@/types/interfaces/graph';
import { InputAndOutConfig, NodeConfig } from '@/types/interfaces/node';
import { isEqual } from 'lodash';
export const updateNode = async (params: ChildNode) => {
  const _params = {
    ...params,
    nodeId: params.id,
  };
  return await service.modifyNode(_params, params.type);
};

/**
 * 使用深度优先搜索(DFS)找到所有从起始节点到终止节点的路径
 * @param {number} startNodeId - 当前处理的节点ID
 * @param {Set<number>} visited - 已经访问过的节点集合，防止循环引用
 * @param {Array<number>} currentPath - 当前路径
 * @returns {Array<Array<number>>} 所有可能的路径
 */
function findAllPaths(
  nodeMap: Map<number, ChildNode>,
  startNodeId: number,
  targetNodeId: number, // 新增目标节点ID参数
  visited = new Set<number>(),
  currentPath: number[] = [],
): number[][] {
  if (visited.has(startNodeId)) return []; // 防止循环引用导致无限递归
  visited.add(startNodeId);

  const currentNode = nodeMap.get(startNodeId);
  if (!currentNode) return []; // 如果找不到节点，返回空数组

  let allPaths: number[][] = [];
  const newPath = [...currentPath, startNodeId]; // 当前路径加入当前节点

  // 如果到达目标节点，则直接返回当前路径
  if (startNodeId === targetNodeId) {
    allPaths.push(newPath);
    return allPaths;
  }

  // 如果当前节点有后续节点，则继续递归
  if (currentNode.nextNodeIds && currentNode.nextNodeIds.length > 0) {
    // 对于每一个后续节点ID，递归寻找路径
    for (const nextNodeId of currentNode.nextNodeIds) {
      const pathsFromNextNode = findAllPaths(
        nodeMap,
        nextNodeId,
        targetNodeId,
        new Set(visited),
        newPath,
      );
      allPaths = allPaths.concat(pathsFromNextNode);
    }
  }

  return allPaths;
}

// 修改getNodeRelation函数以接收targetNodeId参数
export const getNodeRelation = async (
  nodes: ChildNode[],
  startNodeId: number,
  targetNodeId: number, // 新增目标节点ID参数
): Promise<number[][]> => {
  // 创建一个映射方便查找，确保键为 number 类型
  const nodeMap = new Map<number, ChildNode>(
    nodes.map((node) => [Number(node.id), node]),
  );
  const relationList = findAllPaths(nodeMap, startNodeId, targetNodeId);
  console.log(relationList);
  return relationList;
};

function findAllPathsAndCollectArgs(
  nodeMap: Map<number, ChildNode>,
  startNodeId: number,
  targetNodeId: number,
  visited = new Set<number>(),
  currentPath: { title: string; inputArgs: any[]; outputArgs: any[] }[] = [],
): { title: string; inputArgs: any[]; outputArgs: any[] }[][] {
  if (visited.has(startNodeId)) return []; // 防止循环引用导致无限递归
  visited.add(startNodeId);

  const currentNode = nodeMap.get(startNodeId);
  if (!currentNode) return []; // 如果找不到节点，返回空数组
  let allPaths: {
    title: string;
    inputArgs: InputAndOutConfig[];
    outputArgs: InputAndOutConfig[];
  }[][] = [];
  const newPath = [
    ...currentPath,
    {
      title: currentNode.name,
      inputArgs: currentNode.nodeConfig.inputArgs || [],
      outputArgs: currentNode.nodeConfig.outputArgs || [],
    },
  ]; // 当前路径加入当前节点的信息

  // 如果到达目标节点，则直接返回当前路径
  if (startNodeId === targetNodeId) {
    allPaths.push(newPath);
  } else if (currentNode.nextNodeIds && currentNode.nextNodeIds.length > 0) {
    // 对于每一个后续节点ID，递归寻找路径
    for (const nextNodeId of currentNode.nextNodeIds) {
      const pathsFromNextNode = findAllPathsAndCollectArgs(
        nodeMap,
        nextNodeId,
        targetNodeId,
        new Set(visited),
        newPath,
      );
      allPaths = allPaths.concat(pathsFromNextNode);
    }
  }

  return allPaths;
}

// 获取一条线上的节点关系及它们的inputArgs和outputArgs
export const getNodeRelationWithArgs = (
  nodes: ChildNode[],
  startNodeId: number,
  targetNodeId: number,
): { title: string; inputArgs: any[]; outputArgs: any[] }[][] => {
  // 创建一个映射方便查找
  const nodeMap = new Map(nodes.map((node) => [Number(node.id), node]));
  const relationList = findAllPathsAndCollectArgs(
    nodeMap,
    startNodeId,
    targetNodeId,
  );
  return relationList;
};

// // 遍历查看所有节点是否都已经输入或者输出了参数
// const validateNodeList =( nodes: ChildNode[])=>{
//   const _arr
// }
export const changeNodeConfig = (
  type: string,
  values: NodeConfig,
  config: NodeConfig,
): NodeConfig => {
  // 根据 type 来返回不同的字段
  const filed =
    type === 'QA'
      ? 'options'
      : type === 'IntentRecognition'
      ? 'intentConfigs'
      : 'conditionBranchConfigs';

  // 确保 values[filed] 和 config[filed] 都是数组
  const valuesArray = values[filed] || [];
  const configArray = config[filed] || [];

  // 更新 values[filed]
  const updatedFiled = valuesArray.map((valueItem) => {
    // 在 config[filed] 中找到对应 uuid 的项
    const configItem = configArray.find(
      (configItem) => configItem.uuid === valueItem.uuid,
    );

    // 如果找到匹配项，且 nextNodeIds 不同，则替换
    if (configItem && !isEqual(configItem.nextNodeIds, valueItem.nextNodeIds)) {
      return {
        ...valueItem,
        nextNodeIds: configItem.nextNodeIds,
      };
    }

    // 否则保持原样
    return valueItem;
  });

  // 返回新的 values，仅更新 filed 对应的字段
  return {
    ...values,
    [filed]: updatedFiled,
  };
};
