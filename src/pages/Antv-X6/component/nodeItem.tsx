// 这个页面定义普通的节点，如输入，输出，等
import CodeEditor from '@/components/CodeEditor';
import Monaco from '@/components/CodeEditor/monaco';
import CustomTree from '@/components/FormListItem/NestedForm';
import TiptapVariableInput from '@/components/TiptapVariableInput/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import {
  PromptVariable,
  VariableType,
} from '@/components/VariableInferenceInput/types';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { VARIABLE_CONFIG_TYPE_OPTIONS } from '@/constants/node.constants';
import { DataTypeEnum } from '@/types/enums/common';
import { InputItemNameEnum, VariableConfigTypeEnum } from '@/types/enums/node';
import { CodeLangEnum } from '@/types/enums/plugin';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import {
  ExclamationCircleOutlined,
  ExpandAltOutlined,
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
import { cycleOption, outPutConfigs } from '../params';
import { InputAndOut, OtherFormList, TreeOutput } from './commonNode';
import './nodeItem.less';
// 定义一些公共的数组

// 转换变量类型的辅助函数
const transformToPromptVariables = (
  configs: InputAndOutConfig[],
): PromptVariable[] => {
  return configs.map((item) => {
    const typeStr = item.dataType?.toLowerCase() || 'string';
    // 简单的类型映射，根据实际情况调整
    let type: VariableType = VariableType.String;
    if (Object.values(VariableType).includes(typeStr as VariableType)) {
      type = typeStr as VariableType;
    }

    return {
      key: item.key || item.name,
      name: item.name,
      type: type,
      label: item.name, // 使用 name 作为 label
      description: item.description || '',
      children: item.children
        ? transformToPromptVariables(item.children)
        : undefined,
    };
  });
};

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
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '4px 11px',
                    marginBottom: '10px',
                  }}
                  variables={transformToPromptVariables(
                    outputArgs.filter(
                      (item: InputAndOutConfig) =>
                        !['', null, undefined].includes(item.name),
                    ),
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

// 定义文本处理的节点渲染
const TextProcessingNode: React.FC<NodeDisposeProps> = ({ form }) => {
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
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '4px 11px',
                  }}
                  variables={transformToPromptVariables(
                    inputArgs.filter(
                      (item: InputAndOutConfig) =>
                        !['', null, undefined].includes(item.name),
                    ),
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
  CodeNode,
  TextProcessingNode,
  DocumentExtractionNode,
};
