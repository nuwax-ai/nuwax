// 变量聚合节点
import InputOrReference from '@/components/FormListItem/InputOrReference';
import { DataTypeMap } from '@/constants/common.constants';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig, VariableGroup } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select } from 'antd';
import React, { useEffect } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import { TreeOutput } from './commonNode';

const VariableAggregationNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const strategyOptions = [
    { label: '返回每个分组中第一个非空的值', value: 'FIRST_NON_NULL' },
  ];

  // 获取 workflow model 中的 setIsModified 用于触发保存
  const { setIsModified } = useModel('workflow');

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

  // 初始化：从 inputArgs 生成 variableGroups（用于回显已保存的数据）
  useEffect(() => {
    // 如果已经初始化过，跳过
    if (isInitialized.current) {
      return;
    }

    const existingGroups = form.getFieldValue('variableGroups');

    // 如果已有 variableGroups 数据，标记为已初始化并跳过
    if (existingGroups?.length > 0) {
      isInitialized.current = true;
      return;
    }

    // 如果没有 inputArgs 数据，跳过（但不标记为已初始化，等待数据加载）
    if (!inputArgsFromForm?.length) {
      console.log('[VariableAggregation] 等待 inputArgs 数据...');
      return;
    }

    console.log(
      '[VariableAggregation] 开始从 inputArgs 初始化 variableGroups:',
      inputArgsFromForm,
    );

    // 将 inputArgs 转换为 variableGroups 格式
    const initialGroups: VariableGroup[] = inputArgsFromForm.map(
      (arg: any) => ({
        id: arg.key || uuidv4(),
        name: arg.name || 'Group',
        dataType: arg.dataType || DataTypeEnum.String,
        inputs:
          (arg.subArgs || arg.children || []).map((subArg: any) => ({
            key: subArg.key || uuidv4(),
            name: subArg.name || '',
            dataType: subArg.dataType || DataTypeEnum.String,
            description: subArg.description || '',
            require: subArg.require ?? false,
            systemVariable: subArg.systemVariable ?? false,
            bindValue: subArg.bindValue || '',
            bindValueType: subArg.bindValueType || 'Reference',
          })) || [],
      }),
    );

    console.log('[VariableAggregation] 生成的 variableGroups:', initialGroups);

    if (initialGroups.length > 0) {
      isInitialized.current = true;
      form.setFieldsValue({ variableGroups: initialGroups });
    }
  }, [inputArgsFromForm, form]);

  // 当 variableGroups 变化时，同步更新 inputArgs 和 outputArgs
  useEffect(() => {
    if (!variableGroups || variableGroups.length === 0) {
      form.setFieldsValue({ inputArgs: [], outputArgs: [] });
      return;
    }

    // 生成 inputArgs（嵌套结构，每个分组作为一个条目，inputs 作为 subArgs）
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

      // 将 inputs 作为 subArgs
      if (Array.isArray(group.inputs) && group.inputs.length > 0) {
        groupEntry.subArgs = group.inputs.map((input) => ({
          key: input.key || input.name || uuidv4(),
          name: input.name || '',
          dataType: input.dataType || DataTypeEnum.String,
          description: input.description || '',
          require: input.require ?? false,
          systemVariable: input.systemVariable ?? false,
          bindValue: input.bindValue || '',
          bindValueType: input.bindValueType || 'Reference',
        }));
      }

      return groupEntry;
    });

    // 生成 outputArgs
    const outputArgs: InputAndOutConfig[] = variableGroups.map((group) => {
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
      if (
        group.dataType === DataTypeEnum.Object &&
        Array.isArray(group.inputs) &&
        group.inputs.length > 0
      ) {
        base.subArgs = group.inputs.map((item) => ({
          name: item.name || '',
          dataType: item.dataType || DataTypeEnum.String,
          description: item.description || '',
          require: item.require ?? false,
          systemVariable: item.systemVariable ?? false,
          bindValue: item.bindValue || '',
          key: item.key || item.name || uuidv4(),
        }));
      }
      return base;
    });

    form.setFieldsValue({ inputArgs, outputArgs });
  }, [variableGroups, form]);

  // 更新分组并触发保存
  const updateGroups = (newGroups: VariableGroup[]) => {
    form.setFieldsValue({ variableGroups: newGroups });
    // 由于 form.setFieldsValue 不会触发 onValuesChange，需要手动标记为已修改
    setIsModified(true);
  };

  // 添加分组
  const handleAddGroup = () => {
    const newGroup: VariableGroup = {
      id: uuidv4(),
      name: `Group${variableGroups.length + 1}`,
      dataType: DataTypeEnum.String,
      inputs: [],
    };
    updateGroups([...variableGroups, newGroup]);
  };

  // 删除分组
  const handleRemoveGroup = (groupIndex: number) => {
    const newGroups = variableGroups.filter((_, i) => i !== groupIndex);
    updateGroups(newGroups);
  };

  // 更新分组属性
  const handleUpdateGroup = (
    groupIndex: number,
    updates: Partial<VariableGroup>,
  ) => {
    const newGroups = variableGroups.map((group, i) =>
      i === groupIndex ? { ...group, ...updates } : group,
    );
    updateGroups(newGroups);
  };

  // 添加输入项
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

  // 删除输入项
  const handleRemoveInput = (groupIndex: number, inputIndex: number) => {
    const group = variableGroups[groupIndex];
    const newInputs = (group.inputs || []).filter((_, i) => i !== inputIndex);
    handleUpdateGroup(groupIndex, { inputs: newInputs });
  };

  // 更新输入项
  const handleUpdateInput = (
    groupIndex: number,
    inputIndex: number,
    updates: Partial<InputAndOutConfig>,
  ) => {
    const group = variableGroups[groupIndex];
    const newInputs = (group.inputs || []).map((input, i) =>
      i === inputIndex ? { ...input, ...updates } : input,
    );
    handleUpdateGroup(groupIndex, { inputs: newInputs });
  };

  return (
    <>
      <div className="node-item-style">
        <div className="node-title-style margin-bottom">聚合策略</div>
        <Form.Item name="aggregationStrategy" initialValue="FIRST_NON_NULL">
          <Select options={strategyOptions} />
        </Form.Item>
      </div>

      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">分组配置</span>
          <Button
            icon={<PlusOutlined />}
            onClick={handleAddGroup}
            size="small"
            type="text"
          />
        </div>

        {variableGroups.map((group, groupIndex) => (
          <div key={group.id || groupIndex} className="margin-bottom">
            <div className="dis-sb margin-bottom">
              <Input
                size="small"
                placeholder="分组名称"
                value={group.name}
                onChange={(e) =>
                  handleUpdateGroup(groupIndex, { name: e.target.value })
                }
                style={{ flex: 1, marginRight: 8 }}
              />
              <Select
                size="small"
                value={group.dataType || DataTypeEnum.String}
                options={Object.values(DataTypeEnum).map((value) => ({
                  value,
                  label: DataTypeMap[value as DataTypeEnum] || value,
                }))}
                onChange={(value) =>
                  handleUpdateGroup(groupIndex, {
                    dataType: value as DataTypeEnum,
                  })
                }
                style={{ width: 160, marginRight: 8 }}
              />
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveGroup(groupIndex)}
              />
            </div>

            {/* 分组内的输入项 - 使用受控组件 */}
            <div className="form-list-style">
              <div className="dis-sb">
                <span className="node-title-style gap-6 flex items-center"></span>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => handleAddInput(groupIndex)}
                  size="small"
                  type="text"
                />
              </div>
              {(group.inputs || []).map((input, inputIndex) => (
                <div key={input.key || inputIndex}>
                  {inputIndex === 0 && (
                    <div className="font-color-gray07 font-12 mt-6">
                      <span>参数名</span>
                      <span style={{ marginLeft: '22%' }}>变量值</span>
                    </div>
                  )}
                  <div className="dis-left" style={{ marginBottom: 8 }}>
                    <Input
                      size="small"
                      style={{ width: '30%', marginRight: '10px' }}
                      placeholder="请输入参数名"
                      value={input.name}
                      onChange={(e) =>
                        handleUpdateInput(groupIndex, inputIndex, {
                          name: e.target.value,
                        })
                      }
                    />
                    <InputOrReference
                      form={form}
                      fieldName={['__temp_ref']} // 临时字段名，不实际使用
                      style={{ flex: 1, marginRight: '10px' }}
                      referenceType={input.bindValueType || 'Reference'}
                      value={input.bindValue}
                      onChange={(value: string) => {
                        // Input 类型时直接更新
                        handleUpdateInput(groupIndex, inputIndex, {
                          bindValue: value,
                          bindValueType: 'Input',
                        });
                      }}
                      onReferenceSelect={(
                        value,
                        bindValueType,
                        dataType,
                        name,
                      ) => {
                        // Reference 类型时更新所有相关字段
                        const updates: Partial<InputAndOutConfig> = {
                          bindValue: value,
                          bindValueType: bindValueType,
                          dataType: dataType as DataTypeEnum,
                        };
                        // 如果当前 input.name 为空，使用引用的 name
                        if (!input.name && name) {
                          updates.name = name;
                        }
                        handleUpdateInput(groupIndex, inputIndex, updates);
                      }}
                    />
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      type="text"
                      onClick={() => handleRemoveInput(groupIndex, inputIndex)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 
        注意：不使用隐藏的 Form.Item 包裹 Input 来存储复杂数据
        因为 Input 组件只能存储字符串值，会破坏数组/对象数据
        直接使用 form.setFieldsValue 设置的值会被 form.getFieldsValue(true) 正确获取
      */}

      <Form.Item shouldUpdate noStyle>
        {() => {
          const outputArgs = form.getFieldValue('outputArgs') || [];
          return outputArgs.length > 0 ? (
            <>
              <div className="node-title-style margin-bottom">输出</div>
              <TreeOutput treeData={outputArgs} />
            </>
          ) : null;
        }}
      </Form.Item>
    </>
  );
};

export default VariableAggregationNode;
