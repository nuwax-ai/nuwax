import { PLUGIN_INPUT_CONFIG } from '@/constants/space.constants';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import React from 'react';

// 递归计算节点深度
export const getNodeDepth = (
  treeData: BindConfigWithSub[],
  key: React.Key,
  depth = 1,
): number => {
  for (const node of treeData) {
    if (node.key === key) return depth;
    if (node.subArgs) {
      const found = getNodeDepth(node.subArgs, key, depth + 1);
      if (found) return found;
    }
  }
  return depth;
};

// 添加子节点
export const addChildNode = (
  treeData: BindConfigWithSub[],
  key: React.Key,
  newNode: BindConfigWithSub,
) => {
  const updateRecursive = (arr: BindConfigWithSub[]) => {
    return arr.map((node) => {
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
  };

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
export const deleteNode = (arr: BindConfigWithSub[], key: React.Key) => {
  const filterRecursive = (data: BindConfigWithSub[]) => {
    return data.filter((node) => {
      if (node.key === key) return false;
      if (node.subArgs) node.subArgs = filterRecursive(node.subArgs);
      return true;
    });
  };

  return (filterRecursive(arr) as BindConfigWithSub[]) || [];
};

// 更新节点字段
export const updateNodeField = (
  arr: BindConfigWithSub[],
  key: React.Key,
  field: string,
  value: React.Key | boolean | any,
) => {
  const updateRecursive = (data: BindConfigWithSub[]) => {
    return data.map((node) => {
      if (node.key === key) {
        // 数据类型
        if (field === 'dataType') {
          // 切换参数类型： 如果是对象或者数组对象或者是数组相关类型，则清空默认值
          if (
            [DataTypeEnum.Object, DataTypeEnum.Array_Object].includes(value) ||
            value.toString().includes('Array')
          ) {
            // 对象或数组时，默认值置空
            node.bindValue = '';
          }
          // 切换参数类型： 如果是对象或者数组对象，则自动添加子项，反之，清空子项
          if (
            [DataTypeEnum.Object, DataTypeEnum.Array_Object].includes(value)
          ) {
            const newNode = {
              key: Math.random(),
              ...PLUGIN_INPUT_CONFIG,
            };
            node.subArgs = [newNode];
          } else {
            node.subArgs = undefined;
          }
        }
        // 切换值引用类型时，清空bindValue值
        if (field === 'bindValueType') {
          node.bindValue = '';
        }
        // 返回节点
        return { ...node, [field]: value };
      }
      if (node.subArgs) {
        return { ...node, subArgs: updateRecursive(node.subArgs) };
      }
      return node;
    });
  };

  return (updateRecursive(arr) as BindConfigWithSub[]) || [];
};
