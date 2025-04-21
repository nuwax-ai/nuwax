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
const updateRequireFieldFalse = (data: BindConfigWithSub[], value: boolean) => {
  data.forEach((node) => {
    node.require = value;
    if (node.subArgs?.length) {
      updateRequireFieldFalse(node.subArgs, value);
    }
  });
};

// 递归查找节点路径的函数
function findParentPathByKey(
  tree: BindConfigWithSub[],
  targetKey: React.Key,
  path: React.Key[] = [],
) {
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
}

const updateRequireFieldTrue = (
  data: BindConfigWithSub[],
  pathKeys: React.Key[],
) => {
  data.forEach((node) => {
    if (pathKeys.includes(node.key)) {
      node.require = true;
    }
    if (node?.subArgs?.length) {
      return updateRequireFieldTrue(node.subArgs, pathKeys);
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
        // 是否必须为true时，如果默认值为空，打开开启
        if (field === 'require' && !!value && !node.bindValue) {
          node.enable = true;
        }
        if (field === 'require') {
          // 选中, 父级以及父级以上，都设置为true
          if (value) {
            pathKeys = findParentPathByKey(arr, node.key);
          } else if (node.subArgs) {
            // 取消选中, 下级以及下下级等，都设置为false
            updateRequireFieldFalse(node.subArgs, false);
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

  const newList = (updateRecursive(arr) as BindConfigWithSub[]) || [];
  // 设置父级require为true
  updateRequireFieldTrue(newList, pathKeys);
  return newList;
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
export const loopSetDisabled = (data: BindConfigWithSub[]) => {
  // 为确保类型安全，添加返回类型批注，这里假设返回类型与输入数据项类型一致
  return data.map<BindConfigWithSub>((item) => {
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
