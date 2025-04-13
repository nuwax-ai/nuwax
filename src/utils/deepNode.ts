import { PLUGIN_INPUT_CONFIG } from '@/constants/space.constants';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import omit from 'lodash/omit';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

// 递归计算节点深度
export const getNodeDepth = (
  treeData: BindConfigWithSub[],
  key: React.Key,
  currentDepth = 0,
): number => {
  // 如果当前不是数组，直接返回-1表示未找到
  if (!Array.isArray(treeData)) return -1;

  // 遍历数组
  for (let i = 0; i < treeData.length; i++) {
    const node = treeData[i];
    if (node.key === key) {
      return currentDepth;
    }

    if (node.subArgs) {
      const depth = getNodeDepth(node.subArgs, key, currentDepth + 1);
      if (depth !== -1) {
        return depth;
      }
    }
  }

  // 如果遍历完都没有找到，返回-1
  return -1;
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
              key: uuidv4(),
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

// 过滤数组
export const loopFilterArray = (data: BindConfigWithSub[]) =>
  data.filter((item) => {
    if (item.dataType === DataTypeEnum.Object) {
      item['disabled'] = true;

      if (!!item.subArgs?.length) {
        return { ...item, subArgs: loopFilterArray(item.subArgs) };
      }

      return item;
    }

    return null;
  });

// 删除subArgs属性
export const loopOmitArray = (data: BindConfigWithSub[]) => {
  return data.map((item) => {
    if (item.dataType?.includes('Array')) {
      return omit(item, ['subArgs']);
    }
    if (!!item.subArgs?.length) {
      return { ...item, subArgs: loopOmitArray(item.subArgs) };
    }

    return item;
  });
};

// 设置disabled
export const loopSetDisabled = (data: BindConfigWithSub[]) =>
  data.map((item) => {
    if (
      item.dataType === DataTypeEnum.Object ||
      item.dataType?.includes('Array')
    ) {
      item['disabled'] = true;
    }

    if (!!item.subArgs?.length) {
      return { ...item, subArgs: loopSetDisabled(item.subArgs) };
    }
    return item;
  });

// 查询节点
export const findNode = (treeData: BindConfigWithSub[], key: React.Key) => {
  for (const node of treeData) {
    if (node.key === key) return node;
    if (node.subArgs) {
      const _node = findNode(node.subArgs, key);
      if (_node) return _node;
    }
  }
};
