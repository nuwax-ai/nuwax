import ExpandableInputTextarea from '@/components/ExpandTextArea';
import InputOrReference from '@/components/FormListItem/InputOrReference';
import type {
  NodeConfig,
  NodePreviousAndArgMap,
} from '@/types/interfaces/node';
import { InitialValues, NodeDisposeProps } from '@/types/interfaces/workflow';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Empty, Form, Popover } from 'antd';
import React, { useEffect, useState } from 'react';
import { outPutConfigs } from '../params';
import { InputAndOut, TreeOutput } from './commonNode';
import './pluginNode.less';
interface InputListProps {
  referenceList: NodePreviousAndArgMap;
  title: string;
  inputItemName: string;
  onChange: (val: NodeConfig) => void;
  initialValues: InitialValues;
}
// 根据输入的list遍历创建输入框

const InputList: React.FC<InputListProps> = ({
  referenceList,
  title,
  inputItemName,
  onChange,
  initialValues,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    // 设置初始值，确保Form.List能正确展示已有条目
    form.setFieldsValue(initialValues);
  }, [form, inputItemName, initialValues]);

  // 表单提交
  const submitForm = () => {
    const values = form.getFieldsValue();
    onChange(values);
  };

  return (
    <div className="border-bottom pb-12">
      <span className="node-title-style">{title}</span>
      <Form
        layout={'vertical'}
        form={form}
        initialValues={initialValues}
        onValuesChange={submitForm}
        className="input-and-out-form"
      >
        <Form.List name={inputItemName}>
          {(fields) => (
            <>
              {fields.map((item, index) => {
                return (
                  <div key={item.name}>
                    {/* 只在第一个输入框组旁边显示标签 */}
                    {index === 0 && (
                      <>
                        <span>参数名</span>
                        <span style={{ marginLeft: '25%' }}>参数值</span>
                      </>
                    )}
                    <Form.Item key={item.key}>
                      <div className="dis-left">
                        <Form.Item noStyle name={[item.name, 'bindValue']}>
                          <div className="dis-left node-form-label-style">
                            <span className="margin-right-6 font-12 form-name-style">
                              {form.getFieldValue([
                                inputItemName,
                                item.name,
                                'name',
                              ])}
                            </span>
                            <Popover
                              placement="right"
                              content={form.getFieldValue([
                                inputItemName,
                                item.name,
                                'description',
                              ])}
                            >
                              <InfoCircleOutlined className="margin-right-6 font-12" />
                            </Popover>
                          </div>
                        </Form.Item>
                        <Form.Item name={[item.name, 'bindValue']} noStyle>
                          <InputOrReference
                            referenceList={
                              referenceList || {
                                previousNodes: [],
                                innerPreviousNodes: [],
                                argMap: {},
                              }
                            }
                            onChange={submitForm}
                            value={form.getFieldValue([
                              inputItemName,
                              item.name,
                              'bindValue',
                            ])}
                            form={form}
                            fieldName={[inputItemName, item.name, 'bindValue']}
                            style={{ width: '65%' }}
                          />
                        </Form.Item>
                      </div>
                    </Form.Item>
                  </div>
                );
              })}
            </>
          )}
        </Form.List>
      </Form>
    </div>
  );
};

// 定义插件,工作流的节点渲染
const PluginInNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  //  获取输入的列表

  const changeInputList = (newNode: NodeConfig) => {
    Modified({ ...params, ...newNode });
  };

  return (
    <>
      <InputList
        title={'输入'}
        initialValues={{ inputArgs: params.inputArgs || [] }}
        onChange={changeInputList}
        referenceList={referenceList}
        inputItemName={'inputArgs'}
      />
      <p className="node-title-style mt-16">{'输出'}</p>
      <TreeOutput treeData={params.outputArgs || []} />
    </>
  );
};

// 定义数据库
const DatabaseNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  let inputInitialValues = {};
  if (params.inputArgs && params.inputArgs.length) {
    inputInitialValues = params.inputArgs;
  }

  const [sql, setSql] = useState('');
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  return (
    <>
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          referenceList={referenceList}
          inputItemName="inputArgs"
          handleChangeNodeConfig={handleChangeNodeConfig}
          initialValues={inputInitialValues}
        />
      </div>
      {/* 数据表 */}
      <Empty />

      {/* SQL */}
      <ExpandableInputTextarea
        title="SQL"
        value={sql}
        onChange={setSql}
        onExpand
        placeholder="以使用{{变量名}}、{{变量名.子变量名}}、{{变量名[数组 索引]}}的方式引用输出参数中的变量"
      />
      {/* 输出参数 */}
      <div className="node-item-style">
        {/* <InputAndOut
          title="输出"
          fieldConfigs={InputConfigs}
          handleChangeNodeConfig={handleChangeNodeConfig}
          inputItemName="outputArgs"
          showCopy={true}
          initialValues={outputInitialValues}
        /> */}
      </div>
    </>
  );
};

export default { PluginInNode, DatabaseNode };
