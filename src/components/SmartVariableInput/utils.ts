/**
 * SmartVariableInput 工具函数
 * 提供树路径构建和变量处理相关功能
 */

// 定义树节点的扩展类型
export interface TreeNodeData {
  key: string;
  title: string;
  children?: TreeNodeData[];
  parentKey?: string; // 父节点key
  isArray?: boolean; // 标识是否为数组类型
  dataType?: 'string' | 'number' | 'boolean' | 'object' | 'array'; // 数据类型
  description?: string; // 节点描述
}

// 路径构建选项
export interface PathBuildOptions {
  arrayIndexPlaceholder?: string; // 数组索引占位符，默认为 '0'
  pathSeparator?: string; // 路径分隔符，默认为 '.'
  wrapWithBraces?: boolean; // 是否用双大括号包装，默认为 true
  includeArrayBrackets?: boolean; // 是否包含数组括号，默认为 true
}

/**
 * 查找节点的完整路径
 * @param nodes 树节点数组
 * @param targetKey 目标节点key
 * @param currentPath 当前路径
 * @returns 完整路径数组或null
 */
export const findNodePath = (
  nodes: TreeNodeData[],
  targetKey: string,
  currentPath: TreeNodeData[] = [],
): TreeNodeData[] | null => {
  for (const node of nodes) {
    const newPath = [...currentPath, node];

    if (node.key === targetKey) {
      return newPath;
    }

    if (node.children) {
      const result = findNodePath(node.children, targetKey, newPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
};

/**
 * 查找父节点
 * @param nodes 树节点数组
 * @param targetKey 目标节点key
 * @returns 父节点或null
 */
export const findParentNode = (
  nodes: TreeNodeData[],
  targetKey: string,
): TreeNodeData | null => {
  for (const node of nodes) {
    if (node.children) {
      // 检查直接子节点
      const directChild = node.children.find(
        (child) => child.key === targetKey,
      );
      if (directChild) {
        return node;
      }

      // 递归查找
      const result = findParentNode(node.children, targetKey);
      if (result) {
        return result;
      }
    }
  }
  return null;
};

/**
 * 构建变量路径
 * @param node 选中的节点
 * @param treeData 完整的树数据
 * @param options 路径构建选项
 * @returns 构建的变量路径
 */
export const buildVariablePath = (
  node: any,
  treeData: TreeNodeData[],
  options: PathBuildOptions = {},
): string => {
  const {
    arrayIndexPlaceholder = '0',
    pathSeparator = '.',
    wrapWithBraces = true,
    includeArrayBrackets = true,
  } = options;

  // 获取完整路径
  const fullPath = findNodePath(treeData, node.key);

  if (!fullPath || fullPath.length === 0) {
    const result = node.title;
    return wrapWithBraces ? `{{${result}}}` : result;
  }

  // 如果只有一层，直接返回
  if (fullPath.length === 1) {
    const result = fullPath[0].title;
    return wrapWithBraces ? `{{${result}}}` : result;
  }

  // 构建路径
  const pathSegments: string[] = [];

  for (let i = 0; i < fullPath.length; i++) {
    const currentNode = fullPath[i];
    const nextNode = fullPath[i + 1];

    if (i === 0) {
      // 根节点
      pathSegments.push(currentNode.title);
    } else {
      // 检查当前节点是否为数组
      if (currentNode.isArray && includeArrayBrackets) {
        // 如果是数组，添加索引访问
        pathSegments.push(
          `[${arrayIndexPlaceholder}]${pathSeparator}${currentNode.title}`,
        );
      } else {
        // 普通对象属性
        pathSegments.push(currentNode.title);
      }
    }

    // 如果下一个节点存在且当前节点是数组，需要特殊处理
    if (nextNode && currentNode.isArray && includeArrayBrackets) {
      // 已经在上面处理了
      continue;
    }
  }

  let result = pathSegments.join(pathSeparator);

  // 清理多余的分隔符
  result = result.replace(
    new RegExp(`\\${pathSeparator}+`, 'g'),
    pathSeparator,
  );

  return wrapWithBraces ? `{{${result}}}` : result;
};

/**
 * 高级路径构建器 - 支持更复杂的路径逻辑
 * @param node 选中的节点
 * @param treeData 完整的树数据
 * @param options 路径构建选项
 * @returns 构建的变量路径
 */
export const buildAdvancedVariablePath = (
  node: any,
  treeData: TreeNodeData[],
  options: PathBuildOptions = {},
): string => {
  const {
    arrayIndexPlaceholder = '0',
    pathSeparator = '.',
    wrapWithBraces = true,
    includeArrayBrackets = true,
  } = options;

  // 获取完整路径
  const fullPath = findNodePath(treeData, node.key);

  if (!fullPath || fullPath.length === 0) {
    const result = node.title;
    return wrapWithBraces ? `{{${result}}}` : result;
  }

  // 如果只有一层，直接返回
  if (fullPath.length === 1) {
    const result = fullPath[0].title;
    return wrapWithBraces ? `{{${result}}}` : result;
  }

  // 构建路径 - 更智能的逻辑
  let result = '';

  for (let i = 0; i < fullPath.length; i++) {
    const currentNode = fullPath[i];
    const parentNode = i > 0 ? fullPath[i - 1] : null;

    if (i === 0) {
      // 根节点
      result = currentNode.title;
    } else {
      // 检查父节点是否为数组
      if (parentNode?.isArray && includeArrayBrackets) {
        // 父节点是数组，使用数组访问语法
        result += `[${arrayIndexPlaceholder}]${pathSeparator}${currentNode.title}`;
      } else {
        // 普通对象属性访问
        result += `${pathSeparator}${currentNode.title}`;
      }
    }
  }

  return wrapWithBraces ? `{{${result}}}` : result;
};

/**
 * 验证变量路径格式
 * @param path 变量路径
 * @returns 是否为有效格式
 */
export const validateVariablePath = (path: string): boolean => {
  // 检查是否符合变量格式：{{...}} 或 简单的路径格式
  const bracePattern = /^\{\{.+\}\}$/;
  const simplePattern =
    /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+\])*$/;

  return bracePattern.test(path) || simplePattern.test(path);
};

/**
 * 提取变量路径中的变量名
 * @param path 完整的变量路径
 * @returns 提取的变量名
 */
export const extractVariableName = (path: string): string => {
  // 移除双大括号
  const cleaned = path.replace(/^\{\{|\}\}$/g, '');
  return cleaned;
};

/**
 * 格式化树数据 - 为节点添加必要的元数据
 * @param nodes 原始树节点数组
 * @param parentKey 父节点key
 * @returns 格式化后的树节点数组
 */
export const formatTreeData = (
  nodes: TreeNodeData[],
  parentKey?: string,
): TreeNodeData[] => {
  return nodes.map((node) => {
    const formattedNode: TreeNodeData = {
      ...node,
      parentKey,
    };

    if (node.children) {
      formattedNode.children = formatTreeData(node.children, node.key);
    }

    return formattedNode;
  });
};
