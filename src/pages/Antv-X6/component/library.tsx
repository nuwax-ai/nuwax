// 知识库，数据库等节点
import { InfoCircleOutlined } from '@ant-design/icons';
import { Empty, Popover, Select, Slider } from 'antd';
import React, { useState } from 'react';
import '../index.less';
import { outPutConfigs } from '../params';
import { NodeDisposeProps } from '../type';
import { InputAndOut, TreeOutput } from './commonNode';
// 定义知识库
const KnowledgeNode: React.FC<NodeDisposeProps> = () => {
  const [params, setParams] = useState({
    strategy: '',
    recall: 0,
    match: '',
  });

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
  return (
    <div className="knowledge-node">
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
      {/* 知识库选择 */}
      <Empty />
      <div className="knowledge-node-box">
        <div className="dis-sb">
          <div>
            <span>搜索策略</span>
            <Popover placement="right" content={'123'}>
              <InfoCircleOutlined className="margin-right-6" />
            </Popover>
          </div>
          <Select
            value={params.strategy}
            onChange={(value) => setParams({ ...params, strategy: value })}
          />
        </div>
        <div className="dis-sb">
          <div>
            <span>最大召回数量</span>
            <Popover placement="right" content={'123'}>
              <InfoCircleOutlined className="margin-right-6" />
            </Popover>
          </div>
          <Slider
            min={0}
            max={100}
            onChange={(val: number) => setParams({ ...params, recall: val })}
            value={params.recall}
            className="slider-style"
          />
        </div>
        <div className="dis-sb">
          <div>
            <span>最小匹配度</span>
            <Popover placement="right" content={'123'}>
              <InfoCircleOutlined className="margin-right-6" />
            </Popover>
          </div>
          <Slider
            min={0}
            max={100}
            onChange={(val: number) => setParams({ ...params, recall: val })}
            value={params.recall}
            className="slider-style"
          />
        </div>
      </div>
      {/* 输出 */}
      <p className="node-title-style mt-16">{'输出'}</p>
      <TreeOutput treeData={treeData} />
    </div>
  );
};

export default { KnowledgeNode };
