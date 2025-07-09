import {
  DEFAULT_NODE_CONFIG_MAP,
  EXCEPTION_NODES_TYPE,
} from '@/constants/node.constants';
import service, { UrlListType } from '@/services/modifyNode';
import { NodeTypeEnum } from '@/types/enums/common';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { ChildNode, CurrentNodeRefProps } from '@/types/interfaces/graph';
import {
  CurrentNodeRefKey,
  InputAndOutConfig,
  NodeConfig,
} from '@/types/interfaces/node';
import { cloneDeep } from '@/utils/common';
import { isEqual } from 'lodash';
export const apiUpdateNode = async (params: ChildNode) => {
  const _params = {
    ...params,
    nodeId: params.id,
  };
  return await service.modifyNode(_params, params.type as UrlListType);
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
    type === NodeTypeEnum.QA
      ? 'options'
      : type === NodeTypeEnum.IntentRecognition
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

export const updateSkillComponentConfigs = (
  values: CreatedNodeItem[],
  data: CreatedNodeItem[],
) => {
  const updateValue = values.map((item: CreatedNodeItem) => {
    const dataItem =
      data?.find(
        (i) =>
          i.type === item.type &&
          i.targetId === item.targetId &&
          (i.toolName || '') === (item.toolName || ''),
      ) || {};
    return {
      ...item,
      ...dataItem,
    };
  });
  return updateValue;
};

export const updateCurrentNode = (
  key: CurrentNodeRefKey,
  updateNodeData: any,
  currentNode: CurrentNodeRefProps | null,
): CurrentNodeRefProps | null => {
  if (!currentNode) return null;

  const _currentNode = cloneDeep(currentNode);
  if (key && currentNode && key in _currentNode) {
    if (typeof _currentNode[key] === 'object') {
      _currentNode[key] = {
        ..._currentNode[key],
        ...updateNodeData,
      };
    } else {
      _currentNode[key] = updateNodeData;
    }
  }
  return _currentNode;
};

// 根据节点动态给予宽高
// TODO 处理新场景 需要处理有异常节点的高度
export const getWidthAndHeight = (node: ChildNode) => {
  const { type, nodeConfig } = node;
  const extension = nodeConfig?.extension || {};
  const { defaultWidth, defaultHeight } =
    DEFAULT_NODE_CONFIG_MAP[type as keyof typeof DEFAULT_NODE_CONFIG_MAP] ||
    DEFAULT_NODE_CONFIG_MAP.default;
  const hasExceptionHandleItem = EXCEPTION_NODES_TYPE.includes(type);
  const exceptionHandleItemHeight = 32;
  const extraHeight = hasExceptionHandleItem ? exceptionHandleItemHeight : 0;
  if (
    type === NodeTypeEnum.QA ||
    type === NodeTypeEnum.Condition ||
    type === NodeTypeEnum.IntentRecognition
  ) {
    return {
      width: defaultWidth,
      height: (extension.height || defaultHeight) + extraHeight,
    };
  }
  if (type === NodeTypeEnum.Loop) {
    return {
      width: extension.width || defaultWidth,
      height: (extension.height || defaultHeight) + extraHeight,
    };
  }

  // 通用节点
  return {
    width: defaultWidth,
    height: defaultHeight + extraHeight,
  }; // 通用节点的默认大小
};
