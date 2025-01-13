import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Popover, Tag } from 'antd';
import React from 'react';
import { modelTypes } from '../params';
import { NodeDisposeProps, ReferenceList } from '../type';
import { InputOrReference, TreeOutput } from './commonNode';
import './pluginNode.less';
interface InputListProps {
  inputList: {
    label: string;
    tag: string;
    desc: string;
    value: string;
    referenceList: ReferenceList[];
  }[];
  title: string;
  initialValues?: object;
  onChange: (val: string) => void;
}
// 根据输入的list遍历创建输入框
const InputList: React.FC<InputListProps> = ({
  inputList,
  title,
  initialValues,
  onChange,
}) => {
  const [form] = Form.useForm();

  // 提交表单
  const submitForm = (values: any) => {
    console.log('Received values of form:', values);
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
          <Form.Item key={index} name={item.label}>
            <div key={index} className="input-item-style">
              <div className="dis-left node-form-label-style">
                <span className="margin-right-6">{item.label}</span>
                <Popover placement="right" content={item.desc}>
                  <InfoCircleOutlined className="margin-right-6" />
                </Popover>
                <Tag>{item.tag}</Tag>
              </div>
              <div>
                <InputOrReference
                  value={item.value}
                  onChange={onChange}
                  referenceList={item.referenceList}
                />
              </div>
            </div>
          </Form.Item>
        ))}
      </Form>
    </div>
  );
};

// 定义插件,工作流,知识库,数据库的节点渲染
const PluginInNode: React.FC<NodeDisposeProps> = () => {
  const list = [
    {
      label: 'count',
      desc: 'xxxxxxxxxxxx',
      tag: 'Integer',
      value: '',
      referenceList: modelTypes,
    },
    {
      label: 'query',
      desc: 'xxxxxxxxxxxx',
      tag: 'String',
      value: '',
      referenceList: modelTypes,
    },
  ];

  const treeData = [
    { title: 'msg', key: 'msg', tag: 'String' },
    { title: 'response_for_model', key: 'response_for_model', tag: 'String' },
    { title: 'msg', key: 'msg', tag: 'String' },
    {
      title: 'data',
      key: 'data',
      tag: 'Object',
      children: [
        {
          title: '_type',
          key: '_type',
          tag: 'String',
        },
        {
          title: 'images',
          key: 'images',
          tag: 'Object',
          children: [
            {
              title: 'leaf',
              key: '0-0-1-0',
              tag: 'String',
            },
          ],
        },
      ],
    },
  ];

  const changeInputList = (val: string) => {
    console.log('changeInputList', val);
  };

  return (
    <div className="node-style">
      <InputList title={'输入'} inputList={list} onChange={changeInputList} />
      <p className="node-title-style mt-16">{'输出'}</p>
      <TreeOutput treeData={treeData} />
    </div>
  );
};
export default { PluginInNode };
