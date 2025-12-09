/**
 * V2 普通节点配置组件
 *
 * 包含：开始节点、结束节点、循环节点、变量节点、代码节点、文本处理节点、文档提取节点
 * 完全独立，不依赖 V1
 */

import CodeEditor from '@/components/CodeEditor';
import Monaco from '@/components/CodeEditor/monaco';
import CustomTree from '@/components/FormListItem/NestedForm';
import TiptapVariableInput from '@/components/TiptapVariableInput/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { VARIABLE_CONFIG_TYPE_OPTIONS } from '@/constants/node.constants';
import { DataTypeEnum } from '@/types/enums/common';
import { InputItemNameEnum, VariableConfigTypeEnum } from '@/types/enums/node';
import { CodeLangEnum } from '@/types/enums/plugin';
import { InputAndOutConfig } from '@/types/interfaces/node';
import {
  ExclamationCircleOutlined,
  ExpandAltOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Popover,
  Segmented,
  Select,
  Space,
} from 'antd';
import React, { useEffect, useState } from 'react';

import type { NodeConfigV2 } from '../../../types';
import {
  InputAndOutV2,
  OtherFormListV2,
  TreeOutputV2,
  outPutConfigsV2,
} from './commonNodeV2';

import './nodeItemV2.less';

// ==================== 类型定义 ====================

export interface NodeDisposePropsV2 {
  form: FormInstance;
  nodeConfig?: NodeConfigV2;
  id: number;
  type: string;
  referenceData?: any;
}

// ==================== 常量配置 ====================

const cycleOptionV2 = [
  { label: '指定次数', value: 'SPECIFY_TIMES_LOOP' },
  { label: '引用数组', value: 'ARRAY_LOOP' },
  { label: '无限循环', value: 'INFINITE_LOOP' },
];

// ==================== 组件实现 ====================

/**
 * 开始节点配置
 */
export const StartNodeV2: React.FC<NodeDisposePropsV2> = ({
  form,
  nodeConfig,
  id,
  type,
}) => {
  return (
    <Form.Item name="inputArgs">
      <CustomTree
        key={`${type}-${id}-inputArgs`}
        title="输入"
        inputItemName="inputArgs"
        params={nodeConfig?.inputArgs || []}
        form={form}
        showCheck
      />
    </Form.Item>
  );
};

/**
 * 文档提取节点配置
 */
export const DocumentExtractionNodeV2: React.FC<NodeDisposePropsV2> = ({
  form,
}) => {
  return (
    <>
      <div className="node-item-style-v2">
        <InputAndOutV2
          title="输入"
          fieldConfigs={outPutConfigsV2}
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
              <div className="node-title-style-v2 margin-bottom">输出</div>
              <TreeOutputV2 treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>
    </>
  );
};

/**
 * 结束节点和输出节点配置
 */
export const EndNodeV2: React.FC<NodeDisposePropsV2> = ({
  form,
  type,
  referenceData,
}) => {
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
          <Form.Item name="returnType">
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
            ? 'node-item-style-v2'
            : ''
        }
      >
        <InputAndOutV2
          title="输出变量"
          form={form}
          fieldConfigs={outPutConfigsV2}
          showCopy={true}
          inputItemName={InputItemNameEnum.outputArgs}
        />
      </div>

      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('returnType') !== 'VARIABLE' && (
            <>
              <div className="dis-sb margin-bottom">
                <span className="node-title-style-v2 gap-6 flex items-center">
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
                  placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、{{变量名[数组索引]}}的方式引用输出参数中的变量"
                  style={{
                    minHeight: '80px',
                    marginBottom: '10px',
                  }}
                  variables={transformToPromptVariables(
                    outputArgs.filter(
                      (item: InputAndOutConfig) =>
                        !['', null, undefined].includes(item.name),
                    ),
                    referenceData?.argMap,
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

/**
 * 循环节点配置
 */
export const CycleNodeV2: React.FC<NodeDisposePropsV2> = ({ form }) => {
  return (
    <div>
      <div className="node-item-style-v2">
        <span className="node-title-style-v2 margin-bottom gap-6 flex items-center">
          循环设置
          <TooltipIcon
            title={
              '如果引用数组，循环次数为数组的长度；如果指定次数，循环次数为指定的次数；如果选择无限循环，需配合"终止循环"节点完成循环流程。'
            }
            icon={<ExclamationCircleOutlined />}
          />
        </span>
        <Form.Item name="loopType">
          <Select
            options={cycleOptionV2}
            style={{ width: '100%', marginBottom: '10px' }}
          />
        </Form.Item>
      </div>

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
              <div className="node-item-style-v2">
                <div className="node-title-style-v2 margin-bottom">
                  循环次数
                </div>
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
              <div className="node-item-style-v2">
                <InputAndOutV2
                  title="循环数组"
                  fieldConfigs={outPutConfigsV2}
                  inputItemName={InputItemNameEnum.inputArgs}
                  form={form}
                />
              </div>
            );
          }
          return null;
        }}
      </Form.Item>
      <div className="node-item-style-v2">
        <InputAndOutV2
          title={
            <>
              中间变量
              <TooltipIcon
                title="变量可在多次循环中实现共享，可用于在多次循环中传递变量。"
                icon={<ExclamationCircleOutlined />}
              />
            </>
          }
          fieldConfigs={outPutConfigsV2}
          inputItemName={InputItemNameEnum.variableArgs}
          form={form}
        />
      </div>

      <InputAndOutV2
        title="输出"
        fieldConfigs={outPutConfigsV2}
        inputItemName={InputItemNameEnum.outputArgs}
        form={form}
        isLoop
      />
    </div>
  );
};

/**
 * 变量节点配置
 */
export const VariableNodeV2: React.FC<NodeDisposePropsV2> = ({ form }) => {
  const options = VARIABLE_CONFIG_TYPE_OPTIONS;
  const configType = form.getFieldValue('configType');
  const isSetVariable = configType === VariableConfigTypeEnum.SET_VARIABLE;

  return (
    <>
      <Form.Item
        name="configType"
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <Segmented options={options} />
      </Form.Item>

      <Form.Item shouldUpdate noStyle>
        {() =>
          isSetVariable ? (
            <div className="node-item-style-v2">
              <InputAndOutV2
                title="设置变量"
                fieldConfigs={outPutConfigsV2}
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
            <OtherFormListV2
              title="输出变量"
              fieldConfigs={outPutConfigsV2}
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
              <div className="node-title-style-v2 margin-bottom">输出</div>
              <TreeOutputV2
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

/**
 * 文本处理节点配置
 */
export const TextProcessingNodeV2: React.FC<NodeDisposePropsV2> = ({
  form,
  referenceData,
}) => {
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
        name="textHandleType"
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <Segmented
          options={
            textTypeOptions as { label: string; value: 'CONCAT' | 'SPLIT' }[]
          }
        />
      </Form.Item>
      <div className="node-item-style-v2">
        <InputAndOutV2
          title="输入"
          fieldConfigs={outPutConfigsV2}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('textHandleType') === 'CONCAT' ? (
            <div className="node-item-style-v2">
              <div className="dis-sb margin-bottom">
                <span className="node-title-style-v2">字符串拼接</span>
                <Popover
                  placement="topRight"
                  content={
                    <>
                      <p className="node-title-style-v2">数组连接符设置</p>
                      <p>使用以下符号来自动连接数组中的每个项目</p>
                      <p className="array-link-setting-select-label">连接符</p>
                      <Form.Item name="join">
                        <Select
                          options={options}
                          allowClear
                          placeholder="请选择连接符号"
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
                                    onKeyDown={(e) => e.stopPropagation()}
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
                                    onKeyDown={(e) => e.stopPropagation()}
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
                    referenceData?.argMap,
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
            <div className="node-item-style-v2">
              <span className="node-title-style-v2">分隔符</span>
              <Form.Item name="splits">
                <Select
                  allowClear
                  placeholder="请选择分割符号"
                  mode="multiple"
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
                            onKeyDown={(e) => e.stopPropagation()}
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
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          <Button type="primary" onClick={addItem}>
                            添加
                          </Button>
                        </Space>
                      </div>
                    </>
                  )}
                  options={options}
                />
              </Form.Item>
            </div>
          ) : null
        }
      </Form.Item>

      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style-v2 margin-bottom">输出</div>
              <TreeOutputV2
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

/**
 * 代码节点配置
 */
export const CodeNodeV2: React.FC<NodeDisposePropsV2> = ({
  form,
  nodeConfig,
  type,
  id,
}) => {
  const [show, setShow] = useState(false);
  const fieldName =
    form.getFieldValue('codeLanguage') === CodeLangEnum.JavaScript
      ? 'codeJavaScript'
      : 'codePython';

  const codeLanguage =
    form.getFieldValue('codeLanguage') || CodeLangEnum.JavaScript;

  return (
    <>
      <div className="node-item-style-v2">
        <InputAndOutV2
          title="输入"
          fieldConfigs={outPutConfigsV2}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      <div className="node-item-style-v2">
        <div>
          <div className="dis-sb margin-bottom">
            <span className="node-title-style-v2">代码</span>
            <Button
              icon={<ExpandAltOutlined />}
              size="small"
              type="text"
              onClick={() => setShow(true)}
            />
          </div>
          <CodeEditor
            form={form}
            value={form.getFieldValue(fieldName)}
            onChange={(value) => {
              form.setFieldValue(fieldName, value);
            }}
            codeLanguage={codeLanguage}
            height="180px"
          />
        </div>
      </div>
      <CustomTree
        title="输出"
        key={`${type}-${id}-outputArgs`}
        params={nodeConfig?.outputArgs || []}
        form={form}
        inputItemName="outputArgs"
      />
      <Monaco form={form} isShow={show} close={() => setShow(false)} />
    </>
  );
};

/**
 * 循环继续节点（简单提示）
 */
export const LoopContinueV2: React.FC = () => {
  return (
    <div className="node-title-style-v2">用于终止当前循环，执行下次循环</div>
  );
};

/**
 * 循环终止节点（简单提示）
 */
export const LoopBreakV2: React.FC = () => {
  return (
    <div className="node-title-style-v2">
      用于立即终止当前所在的循环，跳出循环体
    </div>
  );
};

export default {
  StartNodeV2,
  EndNodeV2,
  CycleNodeV2,
  VariableNodeV2,
  CodeNodeV2,
  TextProcessingNodeV2,
  DocumentExtractionNodeV2,
  LoopContinueV2,
  LoopBreakV2,
};
