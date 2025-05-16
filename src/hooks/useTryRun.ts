import { ARRAY_ITEM } from '@/constants/common.constants';
import { PLUGIN_INPUT_CONFIG } from '@/constants/space.constants';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import { addChildNode, deleteNode, updateNodeField } from '@/utils/deepNode';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const useTryRun = () => {
  const [dataSource, setDataSource] = useState<BindConfigWithSub[]>([]);
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // 处理Array_Object类型数据
  const handleArrayObjectArr = (
    treeData: BindConfigWithSub[],
    keys: React.Key[],
  ) => {
    const deepArrayObject = (arr: BindConfigWithSub[]) => {
      // 为 map 函数添加返回类型注解，确保函数有明确的返回类型，避免隐式的 "any" 类型
      return arr.map((node): BindConfigWithSub => {
        const { dataType, subArgs } = node;
        if (dataType === DataTypeEnum.Array_Object) {
          const key = uuidv4();
          keys.push(key);
          // 子级数组长度大于0
          if (subArgs && subArgs.length > 0) {
            const _subArgs: BindConfigWithSub[] = [
              {
                ...PLUGIN_INPUT_CONFIG,
                key,
                name: ARRAY_ITEM,
                dataType: DataTypeEnum.Object,
                subArgs: deepArrayObject(subArgs as BindConfigWithSub[]),
              },
            ];

            return {
              ...node,
              subArgs: _subArgs,
            };
          }
        }

        if (dataType === DataTypeEnum.Object) {
          return {
            ...node,
            subArgs: deepArrayObject(subArgs || []),
          };
        }

        return node;
      });
    };

    return (deepArrayObject(treeData) as BindConfigWithSub[]) || [];
  };

  // 初始化dataSource
  const handleInit = (
    inputConfigArgs: BindConfigWithSub[],
    inputExpandedRowKeys: React.Key[],
  ) => {
    if (inputConfigArgs?.length > 0) {
      const keys = [...inputExpandedRowKeys];
      const _inputConfigArgs =
        handleArrayObjectArr(inputConfigArgs, keys) || [];
      setExpandedRowKeys(keys);
      setDataSource(_inputConfigArgs);
    } else {
      setDataSource([]);
    }
  };

  // 入参配置 - changeValue
  const handleInputValue = (
    key: React.Key,
    attr: string,
    value: string | number | boolean,
  ) => {
    const _dataSource = updateNodeField(dataSource, key, attr, value);
    setDataSource(_dataSource);
  };

  // 递归获取子级，以及展开的key值
  const handleChangeSubArgsKey = (
    bindConfig: BindConfigWithSub,
    keys: React.Key[],
  ) => {
    const addKey = (data: BindConfigWithSub) => {
      // 存在下级，递归更新key值
      if (data.subArgs && data.subArgs.length > 0) {
        // 更新下级
        const newSub: BindConfigWithSub[] =
          data.subArgs?.map((item) => {
            const subKey = uuidv4();
            // 不存在下级
            if (!item.subArgs?.length) {
              return {
                ...item,
                key: subKey,
                bindValue: '', // 清空默认值
              };
            } else {
              keys.push(subKey);
              return addKey(item);
            }
          }) || [];
        // 更新父级key， 并加入active keys
        const newDataKey = uuidv4();
        keys.push(newDataKey);
        return {
          ...data,
          key: newDataKey,
          subArgs: newSub,
        };
      }

      // 不存在subArgs
      return {
        ...data,
        key: uuidv4(),
      };
    };

    return addKey(bindConfig);
  };

  // 入参配置 - 新增参数 只有“数组类型（eg: Array_）”才有新增下级按钮
  const handleInputAddChild = (record: BindConfigWithSub) => {
    const { key, dataType } = record;
    let newNode;
    const keys: React.Key[] = [];
    // 数组对象, 必须要有第一项，不认复制的对象不存在name值
    if (dataType === DataTypeEnum.Array_Object) {
      if (record.subArgs && record.subArgs.length > 0) {
        // 取第一行对象数据，作为添加的项，但是需要更新key值，以及它的子级的key值
        const currentSubArgs = record.subArgs?.[0] as BindConfigWithSub;
        newNode = handleChangeSubArgsKey(currentSubArgs, keys);
      }
    } else {
      const addDataType = dataType?.toString()?.split('_')?.[1] as DataTypeEnum;
      newNode = {
        ...PLUGIN_INPUT_CONFIG,
        key: uuidv4(),
        name: ARRAY_ITEM,
        dataType: addDataType,
      };
    }

    const _dataSource = addChildNode(
      dataSource,
      key,
      newNode as BindConfigWithSub,
    );
    setDataSource(_dataSource);

    // 设置默认展开行
    const _expandedRowKeys = [...expandedRowKeys];
    if (!_expandedRowKeys.includes(key)) {
      _expandedRowKeys.push(key);
    }
    if (dataType === DataTypeEnum.Array_Object) {
      _expandedRowKeys.push(...keys);
    }
    setExpandedRowKeys(_expandedRowKeys);
  };

  // 配置删除操作
  const handleInputDel = (key: React.Key) => {
    const _dataSource = deleteNode(dataSource, key);
    setDataSource(_dataSource);
  };

  // 处理Array_Object
  const handleArrayObject = (data: BindConfigWithSub[]) => {
    return data?.map((item) => {
      const { subArgs } = item;
      const _params: {
        [key: string]: any;
      } = {};
      subArgs?.forEach((info) => {
        // 如果是非数组默认名称（Array_Item）对象
        if (info.dataType === DataTypeEnum.Object && info.name !== ARRAY_ITEM) {
          const obj = {} as { [key: string]: any };
          info.subArgs?.forEach((info) => {
            obj[info.name] = info.bindValue;
          });
          _params[info.name] = obj;
        }
        // 数据类型是Array，但不是Array_Object
        else if (
          info.dataType?.includes('Array') &&
          !info.dataType?.includes('Object')
        ) {
          _params[info.name] = info.subArgs?.map((_arg) => _arg.bindValue);
        }
        // 数据类型不是Array，也不是Object
        else if (
          !info.dataType?.includes('Array') &&
          info.dataType !== DataTypeEnum.Object
        ) {
          _params[info.name] = info.bindValue;
        } else {
          // 系统对象（Array_Item）
          _params[info.name] = handleArrayObject(
            info?.subArgs as BindConfigWithSub[],
          );
        }
      });
      return _params;
    });
  };

  // 处理入参列表数据
  const handleDataSource = (treeData: BindConfigWithSub[]) => {
    const params: {
      [key: string]: any;
    } = {};
    treeData?.forEach((item) => {
      const { name, dataType, subArgs } = item;
      // 数据类型不是Array，也不是Object
      if (!dataType?.includes('Array') && dataType !== DataTypeEnum.Object) {
        params[name] = item.bindValue;
      }
      // 数据类型是Array，但不是Array_Object
      if (dataType?.includes('Array') && !dataType?.includes('Object')) {
        params[name] = item.subArgs?.map((info) => info.bindValue);
      }
      if (dataType === DataTypeEnum.Object && name !== ARRAY_ITEM) {
        params[name] = handleDataSource(subArgs || []);
      }

      if (
        dataType === DataTypeEnum.Array_Object &&
        subArgs &&
        subArgs?.length > 0
      ) {
        params[name] = handleArrayObject(subArgs);
      }
    });
    return params;
  };

  return {
    handleInit,
    dataSource,
    handleDataSource,
    expandedRowKeys,
    handleInputValue,
    handleInputAddChild,
    handleInputDel,
  };
};

export default useTryRun;
