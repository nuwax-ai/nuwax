/**
 * 变量数据转换工具
 * 将 InputAndOutConfig[] 转换为 TreeNodeData[]
 */

import { TreeNodeData } from '@/components/SmartVariableInput/utils';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig } from '@/types/interfaces/node';

/**
 * 判断数据类型是否为数组类型
 * @param dataType 数据类型
 * @returns 是否为数组类型
 */
const isArrayType = (dataType: DataTypeEnum | null): boolean => {
  if (!dataType) return false;
  return dataType.startsWith('Array_') || dataType === 'Array';
};

/**
 * 将 InputAndOutConfig 转换为 TreeNodeData
 * @param config 输入配置
 * @param parentKey 父节点key
 * @param pathPrefix 路径前缀（用于生成唯一key）
 * @returns TreeNodeData
 */
const convertSingleNode = (
  config: InputAndOutConfig,
  parentKey?: string,
  pathPrefix: string = '',
): TreeNodeData => {
  // 生成唯一key，使用路径前缀 + 当前key
  const nodeKey = pathPrefix ? `${pathPrefix}.${config.key}` : config.key;

  // 判断是否为数组类型
  const isArray = isArrayType(config.dataType);

  // 构建节点数据
  const node: TreeNodeData = {
    key: nodeKey,
    title: config.name || '',
    parentKey,
    isArray,
    dataType: isArray
      ? 'array'
      : config.dataType === DataTypeEnum.Object
      ? 'object'
      : config.dataType === DataTypeEnum.String
      ? 'string'
      : config.dataType === DataTypeEnum.Integer ||
        config.dataType === DataTypeEnum.Number
      ? 'number'
      : config.dataType === DataTypeEnum.Boolean
      ? 'boolean'
      : 'string',
    description: config.description || undefined,
  };

  // 处理子节点
  const children: TreeNodeData[] = [];

  // 优先使用 subArgs，如果没有则使用 children
  const childConfigs = config.subArgs || config.children || [];

  if (childConfigs.length > 0) {
    childConfigs.forEach((child) => {
      children.push(convertSingleNode(child, nodeKey, nodeKey));
    });
    node.children = children;
  }

  return node;
};

/**
 * 将 InputAndOutConfig[] 转换为 TreeNodeData[]
 * @param configs 输入配置数组
 * @returns TreeNodeData 数组
 */
export const convertInputConfigToTreeNodeData = (
  configs: InputAndOutConfig[],
): TreeNodeData[] => {
  if (!configs || configs.length === 0) {
    return [];
  }

  // 过滤掉无效的配置（没有name或key的）
  const validConfigs = configs.filter(
    (config) => config.name && config.key && config.name.trim() !== '',
  );

  return validConfigs.map((config) => convertSingleNode(config));
};
