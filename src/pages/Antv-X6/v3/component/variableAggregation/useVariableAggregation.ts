// 变量聚合节点 - 自定义 Hook
import { DataTypeMap } from '@/constants/common.constants';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig, VariableGroup } from '@/types/interfaces/node';
import { Form, FormInstance } from 'antd';
import React, { useEffect } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';

interface UseVariableAggregationProps {
  form: FormInstance;
  nodeId?: number; // 节点 ID，用于检测节点切换
}

interface UseVariableAggregationReturn {
  variableGroups: VariableGroup[];
  referenceList: any;
  getValue: (key: string) => string;
  handleAddGroup: () => void;
  handleRemoveGroup: (groupIndex: number) => void;
  handleUpdateGroup: (
    groupIndex: number,
    updates: Partial<VariableGroup>,
  ) => void;
  handleAddInput: (groupIndex: number) => void;
  handleRemoveInput: (groupIndex: number, inputIndex: number) => void;
  handleReferenceSelect: (
    groupIndex: number,
    inputIndex: number,
    selectedKey: string,
  ) => void;
  handleClearReference: (groupIndex: number, inputIndex: number) => void;
  getGroupAllowedType: (group: VariableGroup) => DataTypeEnum | undefined;
  getSelectedKeys: (group: VariableGroup) => Set<string>;
  getGroupTypeDisplay: (group: VariableGroup) => string;
}

/**
 * 变量聚合节点的核心逻辑 Hook
 * 包含状态管理、初始化、同步和所有处理函数
 */
export const useVariableAggregation = ({
  form,
  nodeId,
}: UseVariableAggregationProps): UseVariableAggregationReturn => {
  const { setIsModified, referenceList, getValue } = useModel('workflowV3');

  // 使用 Form.useWatch 监听 variableGroups
  const variableGroups: VariableGroup[] =
    Form.useWatch('variableGroups', { form, preserve: true }) || [];

  // 监听 inputArgs 用于初始化回显
  const inputArgsFromForm = Form.useWatch('inputArgs', {
    form,
    preserve: true,
  });

  // 使用 ref 标记是否已经初始化过
  const isInitialized = React.useRef(false);
  // 跟踪上一个节点 ID，用于检测节点切换
  const prevNodeIdRef = React.useRef<number | undefined>(nodeId);
  // 标记是否需要强制重新初始化（节点切换时）
  const forceReinitRef = React.useRef(false);

  // 当节点切换时重置初始化状态
  useEffect(() => {
    if (nodeId !== undefined && prevNodeIdRef.current !== nodeId) {
      isInitialized.current = false;
      forceReinitRef.current = true; // 标记需要强制重新初始化
      prevNodeIdRef.current = nodeId;
    }
  }, [nodeId]);

  // ========== 初始化逻辑 ==========
  useEffect(() => {
    // 如果已初始化且不是强制重新初始化，跳过
    if (isInitialized.current && !forceReinitRef.current) {
      return;
    }

    // 如果 inputArgsFromForm 为空，等待数据加载
    // 注意：不要在这里清空 variableGroups，否则会导致数据丢失
    if (!inputArgsFromForm?.length) {
      return;
    }

    // 检查是否有需要从 argMap 获取 subArgs 的变量引用
    const hasComplexTypeWithBindValue = inputArgsFromForm.some((arg: any) => {
      const isComplexType =
        arg.dataType === DataTypeEnum.Object ||
        arg.dataType === DataTypeEnum.Array_Object;
      const hasBindValue = (arg.subArgs || arg.children || []).some(
        (subArg: any) => subArg.bindValue,
      );
      return isComplexType && hasBindValue;
    });

    // 如果有复杂类型需要 subArgs，但 argMap 还没加载，则等待
    const argMapKeys = Object.keys(referenceList?.argMap || {});
    if (hasComplexTypeWithBindValue && argMapKeys.length === 0) {
      return;
    }

    // 将 inputArgs 转换为 variableGroups 格式
    const initialGroups: VariableGroup[] = inputArgsFromForm.map(
      (arg: any) => ({
        id: arg.key || uuidv4(),
        name: arg.name || 'Group',
        dataType: arg.dataType || DataTypeEnum.String,
        inputs:
          (arg.subArgs || arg.children || []).map((subArg: any) => {
            const bindValue = subArg.bindValue || '';
            const refInfo = referenceList?.argMap?.[bindValue];
            const refSubArgs = refInfo?.subArgs || refInfo?.children || [];

            return {
              key: subArg.key || uuidv4(),
              name: subArg.name || '',
              dataType: subArg.dataType || DataTypeEnum.String,
              description: subArg.description || '',
              require: subArg.require ?? false,
              systemVariable: subArg.systemVariable ?? false,
              bindValue: bindValue,
              bindValueType: subArg.bindValueType || 'Reference',
              subArgs:
                refSubArgs.length > 0
                  ? refSubArgs
                  : subArg.subArgs || subArg.children || [],
            };
          }) || [],
      }),
    );

    if (initialGroups.length > 0) {
      isInitialized.current = true;
      forceReinitRef.current = false; // 重置强制初始化标记
      form.setFieldsValue({ variableGroups: initialGroups });
    }
  }, [inputArgsFromForm, form, referenceList]);

  // ========== 同步 inputArgs 和 outputArgs ==========
  // 注意：只在初始化完成后才同步，避免在数据加载前清空表单
  useEffect(() => {
    // 如果还没初始化完成，不执行同步逻辑
    if (!isInitialized.current) {
      return;
    }

    if (!variableGroups || variableGroups.length === 0) {
      form.setFieldsValue({ inputArgs: [], outputArgs: [] });
      return;
    }
    // 递归深度复制子字段结构，确保每个节点有唯一的 key
    const deepCopySubArgs = (
      items: InputAndOutConfig[] | undefined,
      parentKey: string = '',
    ): InputAndOutConfig[] => {
      if (!items || items.length === 0) return [];
      return items.map((item, index) => {
        // 使用完整的 uuid 确保全局唯一，避免任何可能的冲突
        const uniqueKey = `out_${parentKey}_${index}_${uuidv4()}`;
        return {
          name: item.name || '',
          dataType: item.dataType || DataTypeEnum.String,
          description: item.description || '',
          require: item.require ?? false,
          systemVariable: item.systemVariable ?? false,
          bindValue: '',
          key: uniqueKey,
          subArgs: deepCopySubArgs(item.subArgs || item.children, uniqueKey),
        };
      });
    };

    // 生成 inputArgs
    const inputArgs: InputAndOutConfig[] = variableGroups.map((group) => {
      const groupEntry: InputAndOutConfig = {
        key: group.id || group.name || uuidv4(),
        name: group.name || 'Group',
        dataType: group.dataType || DataTypeEnum.String,
        description: `${group.name || 'Group'} ${
          DataTypeMap[group.dataType || DataTypeEnum.String] || ''
        }`,
        require: false,
        systemVariable: false,
        bindValue: '',
      };

      if (Array.isArray(group.inputs) && group.inputs.length > 0) {
        groupEntry.subArgs = group.inputs.map((input) => ({
          key: input.key || uuidv4(),
          name: input.name || '',
          dataType: input.dataType || DataTypeEnum.String,
          description: input.description || '',
          require: input.require ?? false,
          systemVariable: input.systemVariable ?? false,
          bindValue: input.bindValue || '',
          bindValueType: input.bindValueType || 'Reference',
          subArgs: input.subArgs || [],
        }));
      }

      return groupEntry;
    });

    // 生成 outputArgs
    const outputArgs: InputAndOutConfig[] = variableGroups.map((group) => {
      const isComplexType =
        group.dataType === DataTypeEnum.Object ||
        group.dataType === DataTypeEnum.Array_Object;
      const firstValidInput = (group.inputs || []).find(
        (input) => input.bindValue,
      );

      const base: InputAndOutConfig = {
        name: group.name || 'Group',
        dataType: group.dataType || DataTypeEnum.String,
        description: `${group.name || 'Group'} ${
          DataTypeMap[group.dataType || DataTypeEnum.String] || ''
        }`,
        require: false,
        systemVariable: false,
        bindValue: '',
        key: group.id || group.name || uuidv4(),
      };

      const firstInputSubArgs =
        firstValidInput?.subArgs || firstValidInput?.children;
      if (isComplexType && firstInputSubArgs && firstInputSubArgs.length > 0) {
        base.subArgs = deepCopySubArgs(firstInputSubArgs);
      }

      return base;
    });

    form.setFieldsValue({ inputArgs, outputArgs });
  }, [variableGroups, form]);

  // ========== 分组操作函数 ==========
  const updateGroups = (newGroups: VariableGroup[]) => {
    form.setFieldsValue({ variableGroups: newGroups });
    setIsModified(true);
  };

  const handleAddGroup = () => {
    const newGroup: VariableGroup = {
      id: uuidv4(),
      name: `Group${variableGroups.length + 1}`,
      dataType: DataTypeEnum.String,
      inputs: [],
    };
    updateGroups([...variableGroups, newGroup]);
  };

  const handleRemoveGroup = (groupIndex: number) => {
    const newGroups = variableGroups.filter((_, i) => i !== groupIndex);
    updateGroups(newGroups);
  };

  const handleUpdateGroup = (
    groupIndex: number,
    updates: Partial<VariableGroup>,
  ) => {
    const newGroups = variableGroups.map((group, i) =>
      i === groupIndex ? { ...group, ...updates } : group,
    );
    updateGroups(newGroups);
  };

  // ========== 输入项操作函数 ==========
  const handleAddInput = (groupIndex: number) => {
    const group = variableGroups[groupIndex];
    const newInput: InputAndOutConfig = {
      key: uuidv4(),
      name: '',
      bindValue: '',
      bindValueType: 'Reference',
      dataType: DataTypeEnum.String,
      description: '',
      require: false,
      systemVariable: false,
    };
    handleUpdateGroup(groupIndex, {
      inputs: [...(group.inputs || []), newInput],
    });
  };

  const handleRemoveInput = (groupIndex: number, inputIndex: number) => {
    const group = variableGroups[groupIndex];
    const newInputs = (group.inputs || []).filter((_, i) => i !== inputIndex);

    if (inputIndex === 0 && newInputs.length > 0) {
      const newFirstInput = newInputs[0];
      const newType = newFirstInput.dataType || DataTypeEnum.String;
      handleUpdateGroup(groupIndex, { inputs: newInputs, dataType: newType });
    } else if (newInputs.length === 0) {
      handleUpdateGroup(groupIndex, {
        inputs: newInputs,
        dataType: DataTypeEnum.String,
      });
    } else {
      handleUpdateGroup(groupIndex, { inputs: newInputs });
    }
  };

  // ========== 变量引用操作函数 ==========
  const handleReferenceSelect = (
    groupIndex: number,
    inputIndex: number,
    selectedKey: string,
  ) => {
    const group = variableGroups[groupIndex];
    const refInfo = referenceList?.argMap?.[selectedKey];
    if (!refInfo) return;

    const refDataType = refInfo.dataType || DataTypeEnum.String;
    const refName = refInfo.name || '';
    const refSubArgs = refInfo.subArgs || refInfo.children || [];

    const updates: Partial<InputAndOutConfig> = {
      bindValue: selectedKey,
      bindValueType: 'Reference',
      dataType: refDataType as DataTypeEnum,
      name: refName,
      subArgs: refSubArgs,
    };

    const newInputs = (group.inputs || []).map((input, i) =>
      i === inputIndex ? { ...input, ...updates } : input,
    );

    if (
      inputIndex === 0 ||
      (group.inputs || []).filter((i) => i.bindValue).length === 0
    ) {
      handleUpdateGroup(groupIndex, {
        inputs: newInputs,
        dataType: refDataType as DataTypeEnum,
      });
    } else {
      handleUpdateGroup(groupIndex, { inputs: newInputs });
    }
  };

  const handleClearReference = (groupIndex: number, inputIndex: number) => {
    const group = variableGroups[groupIndex];
    const newInputs = (group.inputs || []).map((input, i) =>
      i === inputIndex
        ? {
            ...input,
            bindValue: '',
            bindValueType: 'Input' as const,
            name: '',
            subArgs: [],
          }
        : input,
    );

    if (inputIndex === 0) {
      const nextValidInput = newInputs.find(
        (inp, idx) => idx > 0 && inp.bindValue,
      );
      if (nextValidInput && nextValidInput.dataType) {
        handleUpdateGroup(groupIndex, {
          inputs: newInputs,
          dataType: nextValidInput.dataType,
        });
      } else {
        handleUpdateGroup(groupIndex, {
          inputs: newInputs,
          dataType: DataTypeEnum.String,
        });
      }
    } else {
      handleUpdateGroup(groupIndex, { inputs: newInputs });
    }
  };

  // ========== 辅助函数 ==========
  const getGroupAllowedType = (
    group: VariableGroup,
  ): DataTypeEnum | undefined => {
    const firstValidInput = (group.inputs || []).find(
      (input) => input.bindValue,
    );
    return firstValidInput?.dataType ?? undefined;
  };

  const getSelectedKeys = (group: VariableGroup): Set<string> => {
    return new Set(
      (group.inputs || [])
        .map((input) => input.bindValue)
        .filter(Boolean) as string[],
    );
  };

  const getGroupTypeDisplay = (group: VariableGroup) => {
    const type = group.dataType || DataTypeEnum.String;
    return DataTypeMap[type] || type;
  };

  return {
    variableGroups,
    referenceList,
    getValue,
    handleAddGroup,
    handleRemoveGroup,
    handleUpdateGroup,
    handleAddInput,
    handleRemoveInput,
    handleReferenceSelect,
    handleClearReference,
    getGroupAllowedType,
    getSelectedKeys,
    getGroupTypeDisplay,
  };
};
