// Variable aggregation node - custom hook.
import { DataTypeMap } from '@/constants/common.constants';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig, VariableGroup } from '@/types/interfaces/node';
import { Form, FormInstance } from 'antd';
import React, { useEffect } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';

interface UseVariableAggregationProps {
  form: FormInstance;
  nodeId?: number; // Node ID, used to detect node switch.
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
 * Core hook for variable aggregation node.
 */
export const useVariableAggregation = ({
  form,
  nodeId,
}: UseVariableAggregationProps): UseVariableAggregationReturn => {
  const { setIsModified, referenceList, getValue } = useModel('workflowV3');

  // Watch variableGroups.
  const variableGroups: VariableGroup[] =
    Form.useWatch('variableGroups', { form, preserve: true }) || [];

  // Watch inputArgs for initialization.
  const inputArgsFromForm = Form.useWatch('inputArgs', {
    form,
    preserve: true,
  });

  // Init guards.
  const isInitialized = React.useRef(false);
  const prevNodeIdRef = React.useRef<number | undefined>(nodeId);
  const forceReinitRef = React.useRef(false);

  // Reset initialization state when node changes.
  useEffect(() => {
    if (nodeId !== undefined && prevNodeIdRef.current !== nodeId) {
      isInitialized.current = false;
      forceReinitRef.current = true;
      prevNodeIdRef.current = nodeId;
    }
  }, [nodeId]);

  // Initialization.
  useEffect(() => {
    if (isInitialized.current && !forceReinitRef.current) {
      return;
    }

    // Wait only when data is not available yet.
    if (inputArgsFromForm === undefined || inputArgsFromForm === null) {
      return;
    }

    // Detect whether complex args require argMap for subArgs hydration.
    const hasComplexTypeWithBindValue = inputArgsFromForm.some((arg: any) => {
      const isComplexType =
        arg.dataType === DataTypeEnum.Object ||
        arg.dataType === DataTypeEnum.Array_Object;
      const hasBindValue = (arg.subArgs || arg.children || []).some(
        (subArg: any) => subArg.bindValue,
      );
      return isComplexType && hasBindValue;
    });

    // Wait until argMap is ready for complex types.
    const argMapKeys = Object.keys(referenceList?.argMap || {});
    if (hasComplexTypeWithBindValue && argMapKeys.length === 0) {
      return;
    }

    // Convert inputArgs to variableGroups.
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

    isInitialized.current = true;
    forceReinitRef.current = false;

    if (initialGroups.length > 0) {
      form.setFieldsValue({ variableGroups: initialGroups });
    }
  }, [inputArgsFromForm, form, referenceList]);

  // Sync inputArgs and outputArgs.
  useEffect(() => {
    if (!isInitialized.current) {
      return;
    }

    if (!variableGroups || variableGroups.length === 0) {
      form.setFieldsValue({ inputArgs: [], outputArgs: [] });
      return;
    }
    // Deep-copy nested fields and ensure unique keys.
    const deepCopySubArgs = (
      items: InputAndOutConfig[] | undefined,
      parentKey: string = '',
    ): InputAndOutConfig[] => {
      if (!items || items.length === 0) return [];
      return items.map((item, index) => {
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

    // Build inputArgs.
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

    // Build outputArgs.
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

  // Group actions.
  const updateGroups = (newGroups: VariableGroup[]) => {
    form.setFieldsValue({ variableGroups: newGroups });
    setIsModified(true);
  };

  const handleAddGroup = () => {
    // Create one default empty input.
    const defaultInput: InputAndOutConfig = {
      key: uuidv4(),
      name: '',
      bindValue: '',
      bindValueType: 'Reference',
      dataType: DataTypeEnum.String,
      description: '',
      require: false,
      systemVariable: false,
    };

    const newGroup: VariableGroup = {
      id: uuidv4(),
      name: `Group${variableGroups.length + 1}`,
      dataType: DataTypeEnum.String,
      inputs: [defaultInput],
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

  // Input-item actions.
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

  // Variable-reference actions.
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

  // Helper functions.
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
