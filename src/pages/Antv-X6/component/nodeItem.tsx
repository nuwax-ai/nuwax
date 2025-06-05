// 这个页面定义普通的节点，如输入，输出，等
import CodeEditor from '@/components/CodeEditor';
import Monaco from '@/components/CodeEditor/monaco';
import CustomTree from '@/components/FormListItem/NestedForm';
import { DataTypeEnum } from '@/types/enums/common';
import { InputItemNameEnum } from '@/types/enums/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { ExpandAltOutlined, SettingOutlined } from '@ant-design/icons';
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

// 定义开始节点
const StartNode: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <Form.Item name={'inputArgs'}>
      <CustomTree
        title={'输入'}
        inputItemName={'inputArgs'}
        params={form.getFieldValue('inputArgs') || []} // 改为直接读取表单最新值
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
                <span className="node-title-style">输出内容</span>
              </div>
              <Form.Item name="content">
                <Input.TextArea
                  placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、{{变量名[数组 索引]}}的方式引用输出参数中的变量"
                  autoSize={{ minRows: 3, maxRows: 5 }}
                  style={{ marginBottom: '10px' }}
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
        <span className="node-title-style margin-bottom">循环设置</span>
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
          title="中间变量"
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
  const options = [
    { label: '设置变量值', value: 'SET_VARIABLE' },
    { label: '获取变量值', value: 'GET_VARIABLE' },
  ];
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
          form.getFieldValue('configType') === 'SET_VARIABLE' ? (
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
          form.getFieldValue('configType') !== 'SET_VARIABLE' ? (
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
          form.getFieldValue('configType') === 'SET_VARIABLE' ? (
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
                          dropdownRender={(menu) => (
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
              <Form.Item name="text">
                <Input.TextArea
                  placeholder="可以使用{{变量名}}的方式引用输入参数中的变量"
                  autoSize={{ minRows: 3, maxRows: 5 }}
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
                  dropdownRender={(menu) => (
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
const CodeNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const [show, setShow] = useState(false);
  const { setIsModified } = useModel('workflow');
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
            value={form.getFieldValue(
              form.getFieldValue('codeLanguage') === 'JavaScript'
                ? 'codeJavaScript'
                : 'codePython',
            )}
            onChange={(value) => {
              form.setFieldValue(
                form.getFieldValue('codeLanguage') === 'JavaScript'
                  ? 'codeJavaScript'
                  : 'codePython',
                value,
              );
              setIsModified(true);
            }}
            codeLanguage={form.getFieldValue('codeLanguage') || 'JavaScript'}
            height="180px"
          />
        </div>
      </div>
      <CustomTree
        title={'输出'}
        params={form.getFieldValue('outputArgs') || []} // 改为直接读取表单最新值
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
