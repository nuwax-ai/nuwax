import { FormInstance } from 'antd';
import { useCallback, useState } from 'react';

// 定义树节点类型（因为antd没有导出TreeNode）
export interface TreeNode {
  title: string;
  key: string;
  children?: TreeNode[];
  isLeaf?: boolean;
  // 添加你的自定义字段
  dataType?: string;
  required?: boolean;
  description?: string;
  [key: string]: any;
}

// 工具函数：添加节点到树
const addNodeToTree = (
  treeData: TreeNode[],
  parentKey: string,
  newNode: TreeNode,
): TreeNode[] => {
  return treeData.map((node) => {
    if (node.key === parentKey) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addNodeToTree(node.children, parentKey, newNode),
      };
    }
    return node;
  });
};

// 工具函数：从树中删除节点
const deleteNodeFromTree = (
  treeData: TreeNode[],
  targetKey: string,
): TreeNode[] => {
  return treeData
    .filter((node) => node.key !== targetKey)
    .map((node) => ({
      ...node,
      children: node.children
        ? deleteNodeFromTree(node.children, targetKey)
        : undefined,
    }));
};

// 工具函数：更新树中的节点
const updateNodeInTree = (
  treeData: TreeNode[],
  targetKey: string,
  field: string,
  value: any,
): TreeNode[] => {
  return treeData.map((node) => {
    if (node.key === targetKey) {
      return { ...node, [field]: value };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeInTree(node.children, targetKey, field, value),
      };
    }
    return node;
  });
};

// 纯函数：获取节点深度（避免闭包陷阱）
const getNodeDepthFromTree = (
  nodeKey: string,
  nodes: TreeNode[],
  depth = 0,
): number => {
  for (const node of nodes) {
    if (node.key === nodeKey) {
      return depth;
    }
    if (node.children) {
      const childDepth = getNodeDepthFromTree(
        nodeKey,
        node.children,
        depth + 1,
      );
      if (childDepth !== -1) {
        return childDepth;
      }
    }
  }
  return -1;
};

// 纯函数：获取所有父节点的key（避免闭包陷阱）
const getAllParentKeysFromTree = (
  nodeKey: string,
  nodes: TreeNode[],
  parents: string[] = [],
): string[] => {
  for (const node of nodes) {
    if (node.key === nodeKey) {
      return parents;
    }
    if (node.children) {
      const result = getAllParentKeysFromTree(nodeKey, node.children, [
        ...parents,
        node.key,
      ]);
      if (
        result.length > 0 ||
        node.children.some((child) => child.key === nodeKey)
      ) {
        return result;
      }
    }
  }
  return [];
};

export const useTreeData = (initialData: TreeNode[], form: FormInstance) => {
  const [treeData, setTreeData] = useState<TreeNode[]>(initialData);
  const [isModified, setIsModified] = useState(false);

  // 使用函数式更新避免闭包陷阱
  const addRootNode = useCallback(() => {
    const newNode: TreeNode = {
      title: '新节点',
      key: `node_${Date.now()}`,
      children: [],
      dataType: 'string',
      required: false,
    };

    setTreeData((current) => {
      const newTreeData = [...current, newNode];
      form.setFieldValue('treeData', newTreeData);
      return newTreeData;
    });
    setIsModified(true);
  }, [form]);

  const addChildNode = useCallback(
    (parentKey: string) => {
      const newNode: TreeNode = {
        title: '新子节点',
        key: `node_${Date.now()}`,
        children: [],
        dataType: 'string',
        required: false,
      };

      setTreeData((current) => {
        const newTreeData = addNodeToTree(current, parentKey, newNode);
        form.setFieldValue('treeData', newTreeData);
        return newTreeData;
      });
      setIsModified(true);
    },
    [form],
  );

  const deleteNode = useCallback(
    (nodeKey: string) => {
      setTreeData((current) => {
        const newTreeData = deleteNodeFromTree(current, nodeKey);
        form.setFieldValue('treeData', newTreeData);
        return newTreeData;
      });
      setIsModified(true);
    },
    [form],
  );

  const updateNodeField = useCallback(
    (nodeKey: string, field: string, value: any) => {
      setTreeData((current) => {
        const newTreeData = updateNodeInTree(current, nodeKey, field, value);
        form.setFieldValue('treeData', newTreeData);
        return newTreeData;
      });
      setIsModified(true);
    },
    [form],
  );

  // 修复：返回一个函数，该函数接收当前treeData作为参数
  const getNodeDepth = useCallback(
    (nodeKey: string, customTreeData?: TreeNode[]): number => {
      // 如果传入了自定义数据则使用，否则需要在调用时传入当前状态
      const dataToSearch = customTreeData || treeData;
      return getNodeDepthFromTree(nodeKey, dataToSearch);
    },
    [treeData],
  );

  // 修复：返回一个函数，该函数接收当前treeData作为参数
  const getAllParentKeys = useCallback(
    (nodeKey: string, customTreeData?: TreeNode[]): string[] => {
      // 如果传入了自定义数据则使用，否则需要在调用时传入当前状态
      const dataToSearch = customTreeData || treeData;
      return getAllParentKeysFromTree(nodeKey, dataToSearch);
    },
    [treeData],
  );

  // 提供纯函数版本，避免闭包陷阱
  const getNodeDepthPure = useCallback((nodeKey: string, nodes: TreeNode[]) => {
    return getNodeDepthFromTree(nodeKey, nodes);
  }, []);

  const getAllParentKeysPure = useCallback(
    (nodeKey: string, nodes: TreeNode[]) => {
      return getAllParentKeysFromTree(nodeKey, nodes);
    },
    [],
  );

  return {
    treeData,
    isModified,
    addRootNode,
    addChildNode,
    deleteNode,
    updateNodeField,
    getNodeDepth,
    getAllParentKeys,
    // 提供纯函数版本，推荐在回调中使用
    getNodeDepthPure,
    getAllParentKeysPure,
    setTreeData,
    setIsModified,
  };
};
