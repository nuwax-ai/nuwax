import { useCallback, useMemo } from 'react';
import { useModel } from 'umi';
import { TreeNodeConfig } from './useTreeData';

/**
 * 必填状态管理Hook
 * @param treeData 树形数据
 * @param updateTreeData 更新树形数据的方法
 * @param form 表单实例
 * @param inputItemName 表单字段名
 */
export const useRequireStatus = (
  treeData: TreeNodeConfig[],
  updateTreeData: (data: TreeNodeConfig[]) => void,
) => {
  const { setIsModified } = useModel('workflow');

  /**
   * 查找目标节点的所有父节点路径
   * @param tree 树形数据
   * @param targetKey 目标节点key
   * @param path 当前路径
   * @returns 节点路径数组或null
   */
  const findPathToNode = useCallback(
    (
      tree: TreeNodeConfig[],
      targetKey: string,
      path: TreeNodeConfig[] = [],
    ): TreeNodeConfig[] | null => {
      for (const node of tree) {
        const currentPath = [...path, node];

        if (node.key === targetKey) {
          return currentPath; // 找到目标节点，返回路径
        }

        if (node.subArgs) {
          const result = findPathToNode(node.subArgs, targetKey, currentPath);
          if (result) {
            return result; // 如果子节点中找到目标节点，返回路径
          }
        }
      }

      return null; // 没有找到目标节点
    },
    [],
  );

  /**
   * 递归更新节点及其所有子节点的require状态
   * @param data 节点数据
   * @returns 更新后的节点数据
   */
  const updateNodeAndChildren = useCallback(
    (data: TreeNodeConfig): TreeNodeConfig => {
      const updatedData = { ...data, require: false };
      if (data.subArgs) {
        updatedData.subArgs = data.subArgs.map((item) =>
          updateNodeAndChildren(item),
        );
      }
      return updatedData;
    },
    [],
  );

  /**
   * 更新路径上所有节点的require状态为true
   * @param tree 树形数据
   * @param path 节点路径
   * @param level 当前层级
   * @returns 更新后的树形数据
   */
  const updatePathRequireStatus = useCallback(
    (
      tree: TreeNodeConfig[],
      path: TreeNodeConfig[],
      level: number,
    ): TreeNodeConfig[] => {
      if (level > path.length) return tree;
      return tree.map((item) => {
        if (item.key === path[level].key) {
          const updatedItem = { ...item, require: true };
          if (level < path.length - 1 && item.subArgs) {
            return {
              ...updatedItem,
              subArgs: updatePathRequireStatus(item.subArgs, path, level + 1),
            };
          }
          return updatedItem;
        }
        return item;
      });
    },
    [],
  );

  /**
   * 更新树中指定节点的数据
   * @param data 树形数据
   * @param newNodeData 新的节点数据
   * @returns 更新后的树形数据
   */
  const updateTreeNode = useCallback(
    (data: TreeNodeConfig[], newNodeData: TreeNodeConfig): TreeNodeConfig[] =>
      data.map((node) => {
        if (node.key === newNodeData.key) {
          return newNodeData; // 返回更新后的节点
        }
        if (node.subArgs) {
          return {
            ...node,
            subArgs: updateTreeNode(node.subArgs, newNodeData),
          };
        }
        return node;
      }),
    [],
  );

  /**
   * 更新节点的必填状态
   * @param nodeData 节点数据
   * @param checked 是否必填
   */
  const updateRequireStatus = useCallback(
    async (nodeData: TreeNodeConfig, checked: boolean) => {
      let newData: TreeNodeConfig[];

      if (checked) {
        // 如果当前节点被选中，递归更新所有父节点的 require 状态
        const path = findPathToNode(treeData, nodeData.key!);
        if (!path) {
          return; // 如果没有找到目标节点，直接返回
        }
        newData = updatePathRequireStatus(treeData, path, 0);
      } else {
        // 递归更改当前数据require和所有子节点的require状态
        const newNodeData = updateNodeAndChildren(nodeData);
        newData = updateTreeNode(treeData, newNodeData);
      }

      // 更新树数据并标记为已修改
      updateTreeData(newData);
      setIsModified(true);
    },
    [
      treeData,
      findPathToNode,
      updatePathRequireStatus,
      updateNodeAndChildren,
      updateTreeNode,
      updateTreeData,
      setIsModified,
    ],
  );

  // 优化返回对象，避免每次渲染都创建新对象
  return useMemo(
    () => ({
      updateRequireStatus,
    }),
    [updateRequireStatus],
  );
};
