/*
 * Variable Tree Utilities
 * 变量树工具函数
 */

import type { PromptVariable, VariableTreeNode, VariableType } from '../types';

/**
 * 将 PromptVariable 转换为 Antd Tree 兼容的节点格式
 */
export const transformVariableToTreeNode = (
  variable: PromptVariable,
  parentPath: string[] = [],
): VariableTreeNode => {
  const currentPath = [...parentPath, variable.name];
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
  if (variable.type.startsWith('array_')) {
    const baseType = variable.type.replace('array_', '');

    // 如果数组元素是对象类型且有子属性，直接将子属性作为数组节点的子节点
    // 不显示中间的 [0] 索引层，但引用路径中仍包含 [0]
    if (
      baseType === 'object' &&
      variable.children &&
      variable.children.length > 0
    ) {
      // 将子属性转换为数组节点的直接子节点
      // 路径格式为: 变量名[0].子属性名
      node.children = variable.children.map((child) => {
        const childNode = transformVariableToTreeNode(child, currentPath);
        // 更新 value 和 key 以包含 [0] 索引
        return {
          ...childNode,
          value: `${value}[0].${child.name}`,
          key: `${uniqueKey}[0].${child.name}`,
        };
      });
      node.isLeaf = false; // 有子节点，不是叶子节点
    } else {
      // 对于非对象数组（如 array_string），仍然是叶子节点，可以直接选中
      node.isLeaf = true;
    }
  }

  // 设置 isLeaf 属性：只有当节点没有子节点时才是叶子节点
  node.isLeaf = !node.children || node.children.length === 0;

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

    // 检查当前段是否包含数组索引，例如 users[0]
    const arrayMatch = currentSegment.match(/^(.+)\[(\d+)\]$/);

    if (arrayMatch) {
      // 如果是 users[0] 这种形式
      // 这里的 node 应该是 users 节点
      // 我们需要查找 key 为 users[0].nextSegment 的子节点

      // 注意：对于 array_object，children 的 key 格式为 parentKey[0].childName
      // 所以我们需要看下一个 segment

      if (index + 1 < segments.length) {
        const nextSegment = segments[index + 1];
        const arrayIndex = arrayMatch[2];
        const expectedKey = `${node.key}[${arrayIndex}].${nextSegment}`;

        const child = node.children?.find((c) => c.key === expectedKey);
        if (child) {
          // 跳过下一个 segment，因为我们已经处理了
          return findInNode(child, segments, index + 2);
        }
      }

      // 如果没有下一个 segment，或者没找到，可能不是 array_object 的简化显示
      // 继续尝试其他逻辑
    }

    // 处理数组索引 (旧逻辑，保留以防万一)
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
    // 检查根节点，支持 users[0] 形式的匹配
    const rootMatch = pathSegments[0].match(/^(.+)\[(\d+)\]$/);
    const rootName = rootMatch ? rootMatch[1] : pathSegments[0];

    if (rootNode.key === rootName) {
      // 如果是 users[0] 形式，我们需要从 index 0 开始处理，但在 findInNode 内部处理索引逻辑
      // 或者我们可以传递 index 1，但是 findInNode 需要知道 context

      // 简单起见，我们让 findInNode 从 0 开始，但跳过 root check?
      // 不，findInNode 假设 node 是已经匹配的父节点。

      // 如果 path 是 users[0].name
      // rootNode 是 users
      // segments 是 ['users[0]', 'name']
      // index 应该是 0? 不，index 是 segments 的索引。

      // 如果 rootNode 匹配了 users
      // 我们调用 findInNode(rootNode, segments, 0) ?
      // 如果 index 0 是 users[0]，findInNode 需要处理它。

      // 修改 findInNode 逻辑：
      // 如果 index 指向的 segment 包含了当前 node 的 key (作为前缀)，那么处理它？

      // 让我们调整调用方式：
      // 如果 pathSegments[0] 是 users[0]，而 rootNode.key 是 users
      // 这是一个特殊的“根匹配但带有索引”的情况

      if (rootMatch) {
        // 特殊处理：我们在 users 节点，当前 segment 是 users[0]
        // 我们需要查找 children
        return findInNode(rootNode, pathSegments, 0);
      } else {
        // 标准匹配 users -> users
        return findInNode(rootNode, pathSegments, 1);
      }
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
    string: '📝',
    integer: '🔢',
    boolean: '✅',
    number: '➕',
    object: '📦',
    array: '📋',
    array_string: '📝',
    array_integer: '🔢',
    array_boolean: '✅',
    array_number: '➕',
    array_object: '📦',
  };

  return iconMap[type] || '📄';
};
