/*
 * Variable Tree Utilities
 * 变量树工具函数
 */

import type { PromptVariable, VariableTreeNode } from '../types';
import { VariableType } from '../types';

/**
 * 将 PromptVariable 转换为 Antd Tree 兼容的节点格式
 */
export const transformVariableToTreeNode = (
  variable: PromptVariable,
  parentPath: string[] = [],
): VariableTreeNode => {
  const currentPath = [...parentPath, variable.key];
  const value = currentPath.join('.');
  // 使用完整的路径作为 key，确保唯一性
  const uniqueKey = value;

  const node: VariableTreeNode = {
    label: variable.label || variable.name,
    value: value,
    key: uniqueKey,
    variable,
    children: [],
  };

  // 处理子变量
  if (variable.children && variable.children.length > 0) {
    node.children = variable.children.map((child) =>
      transformVariableToTreeNode(child, currentPath),
    );
  }

  // 处理数组类型的特殊结构
  if (variable.type.startsWith('array_') && !variable.children) {
    // 为数组类型添加索引示例节点
    const baseType = variable.type.replace('array_', '');
    node.children = [
      {
        label: `[0] (数组索引)`,
        value: `${value}[0]`,
        key: `${uniqueKey}_index_0`,
        variable: {
          key: '0',
          type: baseType as VariableType,
          name: '数组元素',
        },
        children: [],
      },
    ];
  }

  return node;
};

/**
 * 构建变量树
 */
export const buildVariableTree = (
  variables: PromptVariable[] = [],
): VariableTreeNode[] => {
  if (!Array.isArray(variables)) {
    return [];
  }
  return variables.map((variable) => transformVariableToTreeNode(variable));
};

/**
 * 根据路径查找变量节点
 */
export const findNodeByPath = (
  tree: VariableTreeNode[],
  path: string,
): VariableTreeNode | null => {
  const pathSegments = path.split('.');

  const findInNode = (
    node: VariableTreeNode,
    segments: string[],
    index: number,
  ): VariableTreeNode | null => {
    if (index === segments.length) {
      return node;
    }

    const currentSegment = segments[index];

    // 处理数组索引
    if (currentSegment.startsWith('[') && currentSegment.endsWith(']')) {
      const arrayIndex = currentSegment.slice(1, -1);
      const child = node.children?.find(
        (child) =>
          child.key === `${node.key}[${arrayIndex}]` ||
          child.key === `${node.key}_index_${arrayIndex}`,
      );

      if (child) {
        return findInNode(child, segments, index + 1);
      }
    }

    // 处理常规属性
    const child = node.children?.find(
      (child) => child.key === `${node.key}.${currentSegment}`,
    );

    if (child) {
      return findInNode(child, segments, index + 1);
    }

    return null;
  };

  for (const rootNode of tree) {
    if (rootNode.key === pathSegments[0]) {
      return findInNode(rootNode, pathSegments, 1);
    }
  }

  return null;
};

/**
 * 过滤变量树
 */
export const filterVariableTree = (
  tree: VariableTreeNode[],
  filterText: string,
): VariableTreeNode[] => {
  if (!filterText.trim()) {
    return tree;
  }

  const filterNode = (node: VariableTreeNode): VariableTreeNode | null => {
    const matchesFilter =
      node.label.toLowerCase().includes(filterText.toLowerCase()) ||
      node.key.toLowerCase().includes(filterText.toLowerCase()) ||
      node.value.toLowerCase().includes(filterText.toLowerCase());

    const filteredChildren =
      (node.children
        ?.map((child) => filterNode(child))
        .filter(Boolean) as VariableTreeNode[]) || [];

    if (matchesFilter || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  };

  return tree
    .map((node) => filterNode(node))
    .filter(Boolean) as VariableTreeNode[];
};

/**
 * 展开变量树到指定路径
 */
export const drillToPath = (
  tree: VariableTreeNode[],
  path: string,
): VariableTreeNode[] => {
  if (!path.trim()) {
    return tree;
  }

  const findAndExpandNode = (
    node: VariableTreeNode,
    targetPath: string,
  ): VariableTreeNode => {
    if (node.key === targetPath) {
      // 找到目标节点，展开它
      return node;
    }

    if (node.children && targetPath.startsWith(node.key + '.')) {
      const childPath = targetPath.substring(node.key.length + 1);
      const expandedChild = node.children.map((child) =>
        findAndExpandNode(child, childPath),
      );
      return {
        ...node,
        children: expandedChild,
      };
    }

    return node;
  };

  return tree.map((node) => findAndExpandNode(node, path));
};

/**
 * 获取变量显示路径
 */
export const getVariableDisplayPath = (node: VariableTreeNode): string => {
  // 使用 key 作为显示路径，因为 key 已经包含了完整的路径信息
  return node.key;
};

/**
 * 生成变量引用字符串
 */
export const generateVariableReference = (path: string): string => {
  return `{{${path}}}`;
};

/**
 * 根据变量类型获取图标
 */
export const getVariableTypeIcon = (type: VariableType): string => {
  const iconMap = {
    [VariableType.String]: '📝',
    [VariableType.Integer]: '🔢',
    [VariableType.Boolean]: '✅',
    [VariableType.Number]: '➕',
    [VariableType.Object]: '📦',
    [VariableType.Array]: '📋',
    [VariableType.ArrayString]: '📝',
    [VariableType.ArrayInteger]: '🔢',
    [VariableType.ArrayBoolean]: '✅',
    [VariableType.ArrayNumber]: '➕',
    [VariableType.ArrayObject]: '📦',
  };

  return iconMap[type] || '📄';
};
