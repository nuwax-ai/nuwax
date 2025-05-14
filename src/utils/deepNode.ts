import { PLUGIN_INPUT_CONFIG } from '@/constants/space.constants';
import { DataTypeEnum } from '@/types/enums/common';
import type {
  BindConfigWithSub,
  BindConfigWithSubDisabled,
} from '@/types/interfaces/agent';
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
  const updateRecursive = (arr: BindConfigWithSub[]): BindConfigWithSub[] => {
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
  if (!arr) {
    return [];
  }
  const activeList: React.Key[] = [];
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

// 递归更新子级require值
const updateRequireFieldFalse = (
  field: string,
  data: BindConfigWithSub[],
  value: boolean,
) => {
  data?.forEach((node) => {
    node[field] = value;
    if (node.subArgs?.length) {
      updateRequireFieldFalse(field, node.subArgs, value);
    }
  });
};

// 递归查找节点路径的函数
const findParentPathByKey = (
  tree: BindConfigWithSub[],
  targetKey: React.Key,
  path: React.Key[] = [],
): React.Key[] | null => {
  // 遍历当前层级的节点
  for (const node of tree) {
    // 如果当前节点的key等于目标key，返回路径
    if (node.key === targetKey) {
      return path;
    }

    // 如果当前节点有子节点，继续递归查找
    if (node.subArgs && node.subArgs.length > 0) {
      // 将当前节点添加到路径中
      path.push(node.key);

      // 递归调用，查找目标节点
      const result = findParentPathByKey(node.subArgs, targetKey, path);

      // 如果找到了目标节点，返回路径
      if (result) {
        return result;
      }

      // 如果没有找到目标节点，回溯：移除当前节点
      path.pop();
    }
  }

  // 如果所有节点都遍历完仍未找到目标节点，返回null
  return null;
};

const updateRequireFieldTrue = (
  field: string,
  data: BindConfigWithSub[],
  pathKeys: React.Key[],
) => {
  data.forEach((node) => {
    if (pathKeys.includes(node.key)) {
      node[field] = true;
    }
    if (node?.subArgs?.length) {
      updateRequireFieldTrue(field, node.subArgs, pathKeys);
    }
  });
};

// 更新节点字段
export const updateNodeField = (
  arr: BindConfigWithSub[],
  key: React.Key,
  field: string,
  value: React.Key | boolean | any,
) => {
  let pathKeys: React.Key[] = [];
  const updateRecursive = (data: BindConfigWithSub[]): BindConfigWithSub[] => {
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
        // 是否必须为true时，如果默认值为空，打开开启
        if (field === 'require' && !!value && !node.bindValue) {
          node.enable = true;
        }
        if (field === 'require' || field === 'enable') {
          // 选中, 父级以及父级以上，都设置为true
          if (value) {
            pathKeys = findParentPathByKey(arr, node.key) as React.Key[];
          } else if (node.subArgs) {
            // 取消选中, 下级以及下下级等，都设置为false
            updateRequireFieldFalse(field, node.subArgs, false);
          }
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

  const newList = updateRecursive(arr) || [];
  // 设置父级require为true
  updateRequireFieldTrue(field, newList, pathKeys);
  return newList;
};

// 过滤数组, 只保留对象类型，且设置disabled为true
export const loopFilterAndDisabledArray = (
  data: BindConfigWithSub[],
): BindConfigWithSubDisabled[] => {
  // 过滤数组
  const loopFilterArray = (arr: BindConfigWithSub[]): BindConfigWithSub[] => {
    return arr?.filter((item) => {
      if (
        item.dataType === DataTypeEnum.Object ||
        item.dataType?.includes('Array')
      ) {
        if (!!item.subArgs?.length) {
          return { ...item, subArgs: loopFilterArray(item.subArgs) };
        }
        return true;
      }
      return false;
    });
  };

  // 设置disabled
  const loopSetObjectDisabled = (
    arr: BindConfigWithSub[],
  ): BindConfigWithSubDisabled[] => {
    // 为确保类型安全，添加返回类型批注，这里假设返回类型与输入数据项类型一致
    return arr.map<BindConfigWithSubDisabled>((item) => {
      const newItem = {
        ...item,
        // 确保每个元素都有 disabled 属性
        disabled: item.dataType === DataTypeEnum.Object || false,
      };

      if (newItem.subArgs?.length) {
        return { ...newItem, subArgs: loopSetObjectDisabled(newItem.subArgs) };
      }
      return newItem;
    });
  };
  // 过滤数组
  const loopFilterArrayData = loopFilterArray(data);
  // 设置disabled
  return loopSetObjectDisabled(loopFilterArrayData);
};

// 删除subArgs属性
export const loopOmitArray = (
  data: BindConfigWithSub[],
): BindConfigWithSub[] => {
  return data.map((item) => {
    if (item.dataType?.includes('Array')) {
      // 手动补充缺失的属性，确保类型兼容
      const omittedItem = omit(item, ['subArgs']);
      return {
        ...omittedItem,
        key: item.key,
        name: item.name,
        description: item.description,
      };
    }
    if (!!item.subArgs?.length) {
      return { ...item, subArgs: loopOmitArray(item.subArgs) };
    }

    return item;
  });
};

// 设置disabled
// 原类型 BindConfigWithSubDisabled 期望的是一个对象类型，而不是函数类型，这里将返回类型改为 BindConfigWithSubDisabled[] 以匹配函数返回值
export const loopSetDisabled = (
  data: BindConfigWithSub[],
): BindConfigWithSubDisabled[] => {
  // 为确保类型安全，添加返回类型批注，这里假设返回类型与输入数据项类型一致
  return data.map<BindConfigWithSubDisabled>((item) => {
    const newItem: BindConfigWithSubDisabled = {
      ...item,
      // 确保每个元素都有 disabled 属性
      disabled:
        item.dataType === DataTypeEnum.Object ||
        item.dataType?.includes('Array') ||
        false,
    };

    if (newItem.subArgs?.length) {
      return { ...newItem, subArgs: loopSetDisabled(newItem.subArgs) };
    }
    return newItem;
  });
};

// 查询节点
export const findNode = (treeData: BindConfigWithSub[], key: React.Key) => {
  for (const node of treeData) {
    if (node.key === key) return node;
    if (node.subArgs) {
      const _node = findNode(node.subArgs, key) as BindConfigWithSub;
      if (_node) return _node;
    }
  }
};

// 循环设置nameRequired、descRequired, 并获取flag
// flag: true 表示存在未填写的字段，false 表示不存在未填写的字段
export const loopInputRequired = (data: BindConfigWithSub[]) => {
  let isAllRequired = true;
  const updateRequiredRecursive = (arr: BindConfigWithSub[]) => {
    // 为 map 函数的回调添加返回类型，假设 item 的类型为 BindConfigWithSub，返回类型也为 BindConfigWithSub
    return arr?.map((item): BindConfigWithSub => {
      item.nameRequired = !item.name;
      item.descRequired = !item.description;
      // 如果存在未填写的字段，设置isAllRequired为false
      if (isAllRequired) {
        isAllRequired = !!item.name && !!item.description;
      }

      if (item?.subArgs?.length) {
        return { ...item, subArgs: updateRequiredRecursive(item.subArgs) };
      }

      return item;
    });
  };

  const list = updateRequiredRecursive(data);
  return { list, isAllRequired };
};
