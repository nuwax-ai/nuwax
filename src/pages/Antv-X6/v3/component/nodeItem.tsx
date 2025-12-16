// 这个页面定义普通的节点，如输入，输出，等
import CodeEditor from '@/components/CodeEditor';
import Monaco from '@/components/CodeEditor/monaco';
import InputOrReference from '@/components/FormListItem/InputOrReference';
import CustomTree from '@/components/FormListItem/NestedForm';
import TiptapVariableInput from '@/components/TiptapVariableInput/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { DataTypeMap } from '@/constants/common.constants';
import { VARIABLE_CONFIG_TYPE_OPTIONS } from '@/constants/node.constants';
import { DataTypeEnum } from '@/types/enums/common';
import { InputItemNameEnum, VariableConfigTypeEnum } from '@/types/enums/node';
import { CodeLangEnum } from '@/types/enums/plugin';
import { InputAndOutConfig, VariableGroup } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  ExpandAltOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Popover,
  Segmented,
  Select,
  Space,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import { cycleOption, outPutConfigs } from '../ParamsV3';
import { InputAndOut, OtherFormList, TreeOutput } from './commonNode';
import './nodeItem.less';
// 定义一些公共的数组

// 定义开始节点
const StartNode: React.FC<NodeDisposeProps> = ({
  form,
  nodeConfig,
  id,
  type,
}) => {
  return (
    <Form.Item name={'inputArgs'}>
      <CustomTree
        key={`${type}-${id}-inputArgs`}
        title={'输入'}
        inputItemName={'inputArgs'}
        params={nodeConfig?.inputArgs || []}
        form={form}
        showCheck
      />
    </Form.Item>
  );
};
// 定义文档提取节点
const DocumentExtractionNode: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <>
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
          disabledAdd
          disabledDelete
          disabledInput
        />
      </div>
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">输出</div>
              <TreeOutput treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>
    </>
  );
};

// 定义结束和过程输出的节点渲染
const EndNode: React.FC<NodeDisposeProps> = ({ form, type }) => {
  const { referenceList } = useModel('workflow');
  const segOptions = [
    { label: '返回变量', value: 'VARIABLE' },
    { label: '返回文本', value: 'TEXT' },
  ];
  const outputArgs =
    Form.useWatch(InputItemNameEnum.outputArgs, {
      form,
      preserve: true,
    }) || [];

  return (
    <>
      {type === 'End' && (
        <div className="dis-center">
          <Form.Item name={'returnType'}>
            <Segmented<string>
              options={segOptions}
              style={{ marginBottom: '10px' }}
            />
          </Form.Item>
        </div>
      )}
      <div
        className={
          form.getFieldValue('returnType') !== 'VARIABLE'
            ? 'node-item-style'
            : ''
        }
      >
        <InputAndOut
          title="输出变量"
          form={form}
          fieldConfigs={outPutConfigs}
          showCopy={true}
          inputItemName={InputItemNameEnum.outputArgs}
        />
      </div>

      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('returnType') !== 'VARIABLE' && (
            <>
              <div className="dis-sb margin-bottom">
                <span className="node-title-style gap-6 flex items-center">
                  输出内容
                  <TooltipIcon
                    title="可以在以下输入框中重新组织输出内容，大模型将优先使用输入框中的内容。"
                    icon={<ExclamationCircleOutlined />}
                  />
                </span>
              </div>
              <Form.Item
                name="content"
                getValueFromEvent={(value) =>
                  typeof value === 'string' ? extractTextFromHTML(value) : ''
                }
              >
                <TiptapVariableInput
                  placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、{{变量名[数组 索引]}}的方式引用输出参数中的变量"
                  style={{
                    minHeight: '80px',
                    marginBottom: '10px',
                  }}
                  variables={transformToPromptVariables(
                    outputArgs.filter(
                      (item: InputAndOutConfig) =>
                        !['', null, undefined].includes(item.name),
                    ),
                    referenceList?.argMap,
                  )}
                />
              </Form.Item>
            </>
          )
        }
      </Form.Item>
    </>
  );
};

// 定义循环的节点渲染
const CycleNode: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <div>
      <div className="node-item-style">
        <span className="node-title-style margin-bottom gap-6 flex items-center">
          循环设置
          <TooltipIcon
            title="如果引用数组，循环次数为数组的长度；如果指定次数，循环次数为指定的次数；如果选择无限循环，需配合“终止循环”节点完成循环流程。"
            icon={<ExclamationCircleOutlined />}
          />
        </span>
        <Form.Item name={'loopType'}>
          <Select
            options={cycleOption}
            style={{ width: '100%', marginBottom: '10px' }}
          ></Select>
        </Form.Item>
      </div>

      {/* 动态渲染循环次数 */}
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.loopType !== currentValues.loopType
        }
      >
        {() => {
          const loopType = form.getFieldValue('loopType');
          if (loopType === 'SPECIFY_TIMES_LOOP') {
            return (
              <div className="node-item-style">
                <div className="node-title-style margin-bottom">循环次数</div>
                <Form.Item name="loopTimes">
                  <InputNumber
                    size="small"
                    style={{ width: '100%', marginBottom: '10px' }}
                    placeholder="请输入循环次数，并且值为正整数"
                    min={1}
                    precision={0}
                  />
                </Form.Item>
              </div>
            );
          } else if (loopType === 'ARRAY_LOOP') {
            return (
              <div className="node-item-style">
                <InputAndOut
                  title="循环数组"
                  fieldConfigs={outPutConfigs}
                  inputItemName={InputItemNameEnum.inputArgs}
                  form={form}
                />
              </div>
            );
          }
          return null;
        }}
      </Form.Item>
      <div className="node-item-style">
        <InputAndOut
          title={
            <>
              中间变量
              <TooltipIcon
                title="变量可在多次循环中实现共享，可用于在多次循环中传递变量。"
                icon={<ExclamationCircleOutlined />}
              />
            </>
          }
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.variableArgs}
          form={form}
          isVariable
        />
      </div>

      <InputAndOut
        title="输出"
        fieldConfigs={outPutConfigs}
        inputItemName={InputItemNameEnum.outputArgs}
        form={form}
        isLoop
      />
    </div>
  );
};

// 定义变量的节点渲染
const VariableNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const options = VARIABLE_CONFIG_TYPE_OPTIONS;
  const configType = form.getFieldValue('configType');
  const isSetVariable = configType === VariableConfigTypeEnum.SET_VARIABLE;
  return (
    <>
      <Form.Item
        name={'configType'}
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <Segmented options={options} />
      </Form.Item>

      <Form.Item shouldUpdate noStyle>
        {() =>
          isSetVariable ? (
            <div className="node-item-style">
              <InputAndOut
                title={'设置变量'}
                fieldConfigs={outPutConfigs}
                inputItemName={InputItemNameEnum.inputArgs}
                form={form}
              />
            </div>
          ) : null
        }
      </Form.Item>
      <Form.Item shouldUpdate noStyle>
        {() =>
          !isSetVariable ? (
            <OtherFormList
              title={'输出变量'}
              fieldConfigs={outPutConfigs}
              inputItemName={InputItemNameEnum.outputArgs}
              form={form}
            />
          ) : null
        }
      </Form.Item>
      <Form.Item shouldUpdate noStyle>
        {() =>
          isSetVariable ? (
            <>
              <div className="node-title-style margin-bottom">输出</div>
              <TreeOutput
                treeData={[
                  {
                    name: 'isSuccess',
                    dataType: DataTypeEnum.Boolean,
                    description: '',
                    require: true,
                    systemVariable: false,
                    bindValue: '',
                    key: 'outputArray',
                  },
                ]}
              />
            </>
          ) : null
        }
      </Form.Item>
    </>
  );
};

// 变量聚合节点
const VariableAggregationNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const strategyOptions = [
    { label: '返回每个分组中第一个非空的值', value: 'FIRST_NON_NULL' },
  ];

  // 获取 workflow model 中的 setIsModified 用于触发保存
  const { setIsModified } = useModel('workflow');

  // 使用 Form.useWatch 监听 variableGroups
  const variableGroups: VariableGroup[] =
    Form.useWatch('variableGroups', { form, preserve: true }) || [];

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

// 定义文本处理的节点渲染
const TextProcessingNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const { referenceList } = useModel('workflow');
  const textTypeOptions = [
    { label: '字符串拼接', value: 'CONCAT' },
    { label: '字符串分割', value: 'SPLIT' },
  ];

  const [options, setOptions] = useState([
    { value: '\\n', label: '换行 (\\n)' },
    { value: '\\t', label: '制表符 (\\t)' },
    { value: '。', label: '句号 (。)' },
    { value: ',', label: '逗号 (,)' },
    { value: ';', label: '分号 (;)' },
    { value: '&nbsp;', label: '空格 ( )' },
  ]);

  const [newItem, setNewItem] = useState({
    label: '',
    value: '',
  });

  const inputArgs =
    Form.useWatch(InputItemNameEnum.inputArgs, {
      form,
      preserve: true,
    }) || [];

  // 添加新选项
  const addItem = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    if (newItem.label === '' || newItem.value === '') return;
    const newOption = {
      label: `${newItem.label}(${newItem.value})`,
      value: newItem.value,
    };
    setOptions([...options, newOption]);
    setNewItem({ label: '', value: '' });
    localStorage.setItem(
      'arrayLinkSetting',
      JSON.stringify([...options, newOption]),
    );
  };

  useEffect(() => {
    const arrayLinkSetting = localStorage.getItem('arrayLinkSetting');
    if (arrayLinkSetting) {
      setOptions(JSON.parse(arrayLinkSetting));
    }
  }, []);

  return (
    <>
      <Form.Item
        name={'textHandleType'}
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <Segmented
          options={
            textTypeOptions as { label: string; value: 'CONCAT' | 'SPLIT' }[]
          }
        />
      </Form.Item>
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('textHandleType') === 'CONCAT' ? (
            <div className="node-item-style">
              <div className="dis-sb margin-bottom">
                <span className="node-title-style">字符串拼接</span>
                <Popover
                  placement="topRight"
                  content={
                    <>
                      <p className="node-title-style">数组连接符设置</p>
                      <p>使用以下符号来自动连接数组中的每个项目</p>
                      <p className="array-link-setting-select-label">连接符</p>
                      <Form.Item name="join">
                        <Select
                          options={options}
                          allowClear
                          placeholder={'请选择连接符号'}
                          popupRender={(menu) => (
                            <>
                              {menu}
                              <Divider style={{ margin: '8px 0' }} />
                              <div
                                style={{ padding: '8px' }}
                                className="dis-sb"
                              >
                                <Space>
                                  <Input
                                    value={newItem.label}
                                    placeholder="选项名称"
                                    onChange={(e) =>
                                      setNewItem({
                                        value: newItem.value,
                                        label: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => e.stopPropagation()} // 阻止键盘事件冒泡
                                  />
                                  <Input
                                    value={newItem.value}
                                    placeholder="选项值"
                                    onChange={(e) =>
                                      setNewItem({
                                        label: newItem.label,
                                        value: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => e.stopPropagation()} // 阻止键盘事件冒泡
                                  />
                                  <Button type="primary" onClick={addItem}>
                                    添加
                                  </Button>
                                </Space>
                              </div>
                            </>
                          )}
                          style={{ width: '100%', marginBottom: '10px' }}
                        />
                      </Form.Item>
                    </>
                  }
                  trigger="click"
                >
                  <Button type="text" icon={<SettingOutlined />} size="small" />
                </Popover>
              </div>
              <Form.Item
                name="text"
                getValueFromEvent={(value) =>
                  typeof value === 'string' ? extractTextFromHTML(value) : ''
                }
              >
                <TiptapVariableInput
                  placeholder="可以使用{{变量名}}的方式引用输入参数中的变量"
                  style={{
                    minHeight: '80px',
                  }}
                  variables={transformToPromptVariables(
                    inputArgs.filter(
                      (item: InputAndOutConfig) =>
                        !['', null, undefined].includes(item.name),
                    ),
                    referenceList?.argMap,
                  )}
                />
              </Form.Item>
            </div>
          ) : null
        }
      </Form.Item>
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('textHandleType') === 'SPLIT' ? (
            <div className="node-item-style">
              <span className="node-title-style">分隔符</span>
              <Form.Item name="splits">
                <Select
                  allowClear
                  placeholder={'请选择分割符号'}
                  mode={'multiple'}
                  maxTagCount={3}
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ padding: '8px' }} className="dis-sb">
                        <Space>
                          <Input
                            value={newItem.label}
                            placeholder="选项名称"
                            onChange={(e) =>
                              setNewItem({
                                value: newItem.value,
                                label: e.target.value,
                              })
                            }
                            onKeyDown={(e) => e.stopPropagation()} // 阻止键盘事件冒泡
                          />
                          <Input
                            value={newItem.value}
                            placeholder="选项值"
                            onChange={(e) =>
                              setNewItem({
                                label: newItem.label,
                                value: e.target.value,
                              })
                            }
                            onKeyDown={(e) => e.stopPropagation()} // 阻止键盘事件冒泡
                          />
                          <Button type="primary" onClick={addItem}>
                            添加
                          </Button>
                        </Space>
                      </div>
                    </>
                  )}
                  options={options}
                ></Select>
              </Form.Item>
            </div>
          ) : null
        }
      </Form.Item>

      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">输出</div>
              <TreeOutput
                treeData={
                  form.getFieldValue('textHandleType') === 'CONCAT'
                    ? [
                        {
                          name: 'output',
                          dataType: DataTypeEnum.String,
                          description: '',
                          require: true,
                          systemVariable: false,
                          bindValue: '',
                          key: 'outputArray',
                        },
                      ]
                    : [
                        {
                          name: 'output',
                          dataType: DataTypeEnum.Array_String,
                          description: '',
                          require: true,
                          systemVariable: false,
                          bindValue: '',
                          key: 'outputString',
                        },
                      ]
                }
              />
            </>
          )
        }
      </Form.Item>
    </>
  );
};

// 定义代码节点
const CodeNode: React.FC<NodeDisposeProps> = ({
  form,
  nodeConfig,
  type,
  id,
}) => {
  const [show, setShow] = useState(false);
  const { setIsModified } = useModel('workflow');
  const fieldName =
    form.getFieldValue('codeLanguage') === CodeLangEnum.JavaScript
      ? 'codeJavaScript'
      : 'codePython';

  const codeLanguage =
    form.getFieldValue('codeLanguage') || CodeLangEnum.JavaScript;
  return (
    <>
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      <div className="node-item-style">
        <div>
          <div className="dis-sb margin-bottom">
            <span className="node-title-style ">代码</span>
            <Button
              icon={<ExpandAltOutlined />}
              size="small"
              type="text"
              onClick={() => setShow(true)}
            ></Button>
          </div>
          <CodeEditor
            form={form}
            value={form.getFieldValue(fieldName)}
            onChange={(value) => {
              form.setFieldValue(fieldName, value);
              setIsModified(true);
            }}
            codeLanguage={codeLanguage}
            height="180px"
          />
        </div>
      </div>
      <CustomTree
        title={'输出'}
        key={`${type}-${id}-outputArgs`}
        params={nodeConfig?.outputArgs || []}
        form={form}
        inputItemName={'outputArgs'}
      />
      <Monaco form={form} isShow={show} close={() => setShow(false)} />
    </>
  );
};

export default {
  StartNode,
  EndNode,
  CycleNode,
  VariableNode,
  VariableAggregationNode,
  CodeNode,
  TextProcessingNode,
  DocumentExtractionNode,
};
