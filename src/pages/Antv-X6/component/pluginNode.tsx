import ExpandableInputTextarea from '@/components/ExpandTextArea';
import { InputOrReference } from '@/components/FormListItem/InputOrReference';
import type {
  NodeConfig,
  NodePreviousAndArgMap,
} from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Empty, Form, Popover, Tag } from 'antd';
import React, { useState } from 'react';
import { InputConfigs, outPutConfigs } from '../params';
import { InputAndOut, TreeOutput } from './commonNode';
import './pluginNode.less';
interface InputListProps {
  inputList: {
    name: string;
    dataType: string;
    description: string;
    bindValue: string;
  }[];
  referenceList: NodePreviousAndArgMap;
  title: string;
  initialValues?: object;
  onChange: (val: string) => void;
}
// 根据输入的list遍历创建输入框
const InputList: React.FC<InputListProps> = ({
  inputList,
  referenceList,
  title,
  initialValues,
  onChange,
}) => {
  const [form] = Form.useForm();

  // 提交表单
  const submitForm = () => {
    const values = form.getFieldsValue();
    onChange(values);
  };

  return (
    <div className="border-bottom">
      <span className="node-title-style">{title}</span>
      <Form form={form} onFinish={submitForm} initialValues={initialValues}>
        <div className="dis-left margin-bottom-10">
          <span className="node-form-label-style">参数名</span>
          <span>参数值</span>
        </div>
        {inputList.map((item, index) => (
          <Form.Item key={index} name={item.name}>
            <div key={index} className="input-item-style">
              <div className="dis-left node-form-label-style">
                <span className="margin-right-6">{item.name}</span>
                <Popover placement="right" content={item.description}>
                  <InfoCircleOutlined className="margin-right-6" />
                </Popover>
                <Tag>{item.dataType}</Tag>
              </div>
              <div>
                <InputOrReference
                  value={item.bindValue}
                  onChange={submitForm}
                  referenceList={referenceList}
                />
              </div>
            </div>
          </Form.Item>
        ))}
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
  // let initialValues={}
  // if (params.inputArgs && params.inputArgs.length) {
  //   initialValues = params.inputArgs;
  // }
  //  获取输入的列表

  const changeInputList = (val: string) => {
    console.log('changeInputList', val);
    Modified({ ...params });
  };

  return (
    <div className="node-style">
      <InputList
        title={'输入'}
        inputList={params.inputArgs || []}
        onChange={changeInputList}
        referenceList={referenceList}
      />
      <p className="node-title-style mt-16">{'输出'}</p>
      <TreeOutput treeData={params.outputArgs || []} />
    </div>
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
  let outputInitialValues = {};
  if (params.outputArgs && params.outputArgs.length) {
    outputInitialValues = params.outputArgs;
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
        <InputAndOut
          title="输出"
          fieldConfigs={InputConfigs}
          handleChangeNodeConfig={handleChangeNodeConfig}
          inputItemName="outputArgs"
          showCopy={true}
          initialValues={outputInitialValues}
        />
      </div>
    </>
  );
};

export default { PluginInNode, DatabaseNode };
