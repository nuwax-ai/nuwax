import ExpandableInputTextarea from '@/components/ExpandTextArea';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Empty, Form, Popover, Select, Slider, Tag } from 'antd';
import React, { useState } from 'react';
import { InputConfigs, modelTypes, outPutConfigs } from '../params';
import { NodeDisposeProps, ReferenceList } from '../type';
import { InputAndOut, InputOrReference, TreeOutput } from './commonNode';
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

// 定义知识库
const KnowledgeNode: React.FC<NodeDisposeProps> = () => {
  const [params, setParams] = useState({
    strategy: '',
    recall: 0,
    match: 0.01,
  });

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
    <div className="knowledge-node">
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputList title={'输入'} inputList={list} onChange={changeInputList} />
      </div>
      {/* 知识库选择 */}
      <Empty />
      <div className="knowledge-node-box">
        <div className="dis-sb">
          <div className="left-label-style">
            <span>搜索策略</span>
            <Popover placement="right" content={'123'}>
              <InfoCircleOutlined className="margin-right-6" />
            </Popover>
          </div>
          <Select
            className="flex-1"
            value={params.strategy}
            onChange={(value) => setParams({ ...params, strategy: value })}
          />
        </div>
        <div className="dis-sb">
          <div className="left-label-style">
            <span>最大召回数量</span>
            <Popover placement="right" content={'123'}>
              <InfoCircleOutlined className="margin-right-6" />
            </Popover>
          </div>
          <Slider
            min={1}
            max={20}
            onChange={(val: number) => setParams({ ...params, recall: val })}
            value={params.recall}
            className="flex-1"
          />
        </div>
        <div className="dis-sb">
          <div className="left-label-style">
            <span>最小匹配度</span>
            <Popover placement="right" content={'123'}>
              <InfoCircleOutlined className="margin-right-6" />
            </Popover>
          </div>
          <Slider
            min={0.01}
            max={1}
            onChange={(val: number) => setParams({ ...params, match: val })}
            value={params.match}
            className="flex-1"
          />
        </div>
      </div>
      {/* 输出 */}
      <p className="node-title-style mt-16">{'输出'}</p>
      <TreeOutput treeData={treeData} />
    </div>
  );
};

// 定义数据库
const DatabaseNode: React.FC<NodeDisposeProps> = () => {
  const [sql, setSql] = useState('');

  return (
    <>
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
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
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
    </>
  );
};

export default { PluginInNode, KnowledgeNode, DatabaseNode };
