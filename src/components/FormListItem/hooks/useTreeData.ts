import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { FormInstance } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';

/**
 * 树节点配置接口，扩展了基础配置
 */
interface TreeNodeConfig extends InputAndOutConfig {
  key: string;
  subArgs?: TreeNodeConfig[];
}

/**
 * 工具函数：更新树中指定节点的字段
 */
const updateNodeInTree = (
  data: TreeNodeConfig[],
  key: string,
  field: string,
  value: any,
  type?: 'Input' | 'Reference',
  dataType?: DataTypeEnum,
): TreeNodeConfig[] => {
  return data.map((node) => {
    if (node.key === key) {
      const newObj = {
        ...node,
        [field]: value,
        bindValueType: type || node.bindValueType,
      };
      if (dataType) {
        newObj.dataType = dataType;
      }
      return newObj;
    }
    if (node.subArgs) {
      return {
        ...node,
        subArgs: updateNodeInTree(
          node.subArgs,
          key,
          field,
          value,
          type,
          dataType,
        ),
      };
    }
    return node;
  });
};

/**
 * 工具函数：从树中删除节点
 */
const deleteNodeFromTree = (
  data: TreeNodeConfig[],
  key: string,
): TreeNodeConfig[] => {
  return data.filter((node) => {
    if (node.key === key) return false;
    if (node.subArgs) {
      node.subArgs = deleteNodeFromTree(node.subArgs, key);
    }
    return true;
  });
};

/**
 * 工具函数：添加子节点到指定父节点
 */
const addChildNodeToTree = (
  data: TreeNodeConfig[],
  parentKey: string,
  newNode: TreeNodeConfig,
): TreeNodeConfig[] => {
  return data.map((node) => {
    if (node.key === parentKey) {
      return {
        ...node,
        subArgs: [...(node.subArgs || []), newNode],
      };
    }
    if (node.subArgs) {
      return {
        ...node,
        subArgs: addChildNodeToTree(node.subArgs, parentKey, newNode),
      };
    }
    return node;
  });
};

/**
 * 树形数据管理Hook
 * @param params 初始参数数据
 * @param form 表单实例
 * @param inputItemName 表单字段名
 */
export const useTreeData = (
  params: InputAndOutConfig[] | undefined,
  form: FormInstance,
  inputItemName: string,
) => {
  const [treeData, setTreeData] = useState<TreeNodeConfig[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const { setIsModified } = useModel('workflow');

  // 初始化和同步逻辑
  useEffect(() => {
    if (params) {
      setTreeData(params);
    }
  }, [params]);

  /**
   * 通用更新树数据并同步到表单的函数
   */
  const updateTreeDataAndForm = useCallback(
    (newData: TreeNodeConfig[]) => {
      form.setFieldValue(inputItemName, newData);
      setIsModified(true);
      return newData;
    },
    [form, inputItemName, setIsModified],
  );

  // 获取节点深度函数
  const getNodeDepth = useCallback(
    (data: TreeNodeConfig[], key: string, depth = 1): number => {
      for (const node of data) {
        if (node.key === key) return depth;
        if (node.subArgs) {
          const found = getNodeDepth(node.subArgs, key, depth + 1);
          if (found) return found;
        }
      }
      return 0;
    },
    [],
  );

  // 获取所有父节点的key函数
  const getAllParentKeys = useCallback(
    (data: TreeNodeConfig[]): React.Key[] => {
      const keys: React.Key[] = [];
      data.forEach((node) => {
        if (node.subArgs && node.subArgs.length > 0) {
          keys.push(node.key);
          keys.push(...getAllParentKeys(node.subArgs));
        }
      });
      return keys;
    },
    [],
  );

  // 更新树数据方法
  const updateTreeData = useCallback(
    (newData: TreeNodeConfig[]) => {
      setTreeData(newData);
      updateTreeDataAndForm(newData);
    },
    [updateTreeDataAndForm],
  );

  // 添加根节点函数
  const addRootNode = useCallback(() => {
    const newNode: TreeNodeConfig = {
      key: uuidv4(),
      name: '',
      description: '',
      dataType: DataTypeEnum.String,
      require: false,
      systemVariable: false,
      bindValueType: 'Input',
      bindValue: '',
    };

    setTreeData((currentTreeData) => {
      const newData = [...currentTreeData, newNode];
      return updateTreeDataAndForm(newData);
    });
  }, [updateTreeDataAndForm]);

  // 添加子节点函数
  const addChildNode = useCallback(
    (parentKey: string) => {
      setTreeData((currentTreeData) => {
        const depth = getNodeDepth(currentTreeData, parentKey);
        if (depth >= 4) {
          return currentTreeData;
        }

        const newNode: TreeNodeConfig = {
          key: uuidv4(),
          name: '',
          description: null,
          dataType: DataTypeEnum.String,
          require: false,
          systemVariable: false,
          bindValueType: 'Input',
          bindValue: '',
        };

        const newData = addChildNodeToTree(currentTreeData, parentKey, newNode);
        return updateTreeDataAndForm(newData);
      });

      setExpandedKeys((current) =>
        Array.from(new Set([...current, parentKey])),
      );
    },
    [getNodeDepth, updateTreeDataAndForm],
  );

  // 删除节点函数
  const deleteNode = useCallback(
    (key: string) => {
      setTreeData((currentTreeData) => {
        const newData = deleteNodeFromTree(currentTreeData, key);
        return updateTreeDataAndForm(newData);
      });
    },
    [updateTreeDataAndForm],
  );

  // 更新节点字段函数
  const updateNodeField = useCallback(
    (
      key: string,
      field: string,
      value: any,
      type?: 'Input' | 'Reference',
      dataType?: DataTypeEnum,
    ) => {
      setTreeData((currentTreeData) => {
        const newData = updateNodeInTree(
          currentTreeData,
          key,
          field,
          value,
          type,
          dataType,
        );
        return updateTreeDataAndForm(newData);
      });
    },
    [updateTreeDataAndForm],
  );

  // 优化父节点keys的计算
  const parentKeys = useMemo(() => {
    return getAllParentKeys(treeData);
  }, [treeData, getAllParentKeys]);

  // 自动展开所有父节点
  useEffect(() => {
    setExpandedKeys(parentKeys);
  }, [parentKeys]);

  // 优化返回对象，避免每次渲染都创建新对象
  return useMemo(
    () => ({
      treeData,
      expandedKeys,
      setExpandedKeys,
      addRootNode,
      addChildNode,
      deleteNode,
      updateNodeField,
      getNodeDepth,
      updateTreeData,
    }),
    [
      treeData,
      expandedKeys,
      setExpandedKeys,
      addRootNode,
      addChildNode,
      deleteNode,
      updateNodeField,
      getNodeDepth,
      updateTreeData,
    ],
  );
};

export type { TreeNodeConfig };
