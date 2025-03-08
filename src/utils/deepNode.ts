// 递归计算节点深度
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';

// 递归计算节点深度
export const getNodeDepth = (
  treeData: BindConfigWithSub[],
  key: string,
  depth = 1,
): number => {
  for (const node of treeData) {
    if (node.key === key) return depth;
    if (node.subArgs) {
      const found = getNodeDepth(node.subArgs, key, depth + 1);
      if (found) return found;
    }
  }
  return 0;
};

// 添加子节点
export const addChildNode = (
  treeData: BindConfigWithSub[],
  key: string,
  newNode: BindConfigWithSub,
) => {
  const updateRecursive = (arr: BindConfigWithSub[]) =>
    arr.map((node) => {
      if (node.key === key) {
        return {
          ...node,
          subArgs: [...(node.subArgs || []), newNode],
        };
      }
      if (node.subArgs) {
        return { ...node, subArgs: updateRecursive(node.subArgs) };
      }
      return node;
    });

  return (updateRecursive(treeData) as BindConfigWithSub[]) || [];
};

// 获取默认展开的配置key
export const getActiveKeys = (arr: BindConfigWithSub[]) => {
  const activeList = [];
  const filterRecursive = (data: BindConfigWithSub[]) => {
    for (let info of data) {
      if (info.subArgs) {
        activeList.push(info.key);
        filterRecursive(info.subArgs);
      }
    }
  };

  filterRecursive(arr);
  return activeList;
};

// 删除节点
export const deleteNode = (arr: BindConfigWithSub[], key: string) => {
  const filterRecursive = (data: BindConfigWithSub[]) =>
    data.filter((node) => {
      if (node.key === key) return false;
      if (node.subArgs) node.subArgs = filterRecursive(node.subArgs);
      return true;
    });

  return (filterRecursive(arr) as BindConfigWithSub[]) || [];
};

// 更新节点字段
export const updateNodeField = (
  arr: BindConfigWithSub[],
  key: string,
  field: string,
  value: string | number | boolean,
) => {
  const updateRecursive = (data: BindConfigWithSub[]) =>
    data.map((node) => {
      if (node.key === key) {
        if (
          field === 'dataType' &&
          [DataTypeEnum.Object, DataTypeEnum.Array_Object].includes(value)
        ) {
          node.bindValue = '';
        }
        return { ...node, [field]: value };
      }
      if (node.subArgs) {
        return { ...node, subArgs: updateRecursive(node.subArgs) };
      }
      return node;
    });

  return (updateRecursive(arr) as BindConfigWithSub[]) || [];
};
