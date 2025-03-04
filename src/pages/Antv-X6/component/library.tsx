// 知识库，数据库等节点
import type { NodeConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Empty, Popover, Select, Slider } from 'antd';
import React from 'react';
import '../index.less';
import { outPutConfigs } from '../params';
import { InputAndOut, TreeOutput } from './commonNode';
// 定义知识库
const KnowledgeNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  const treeData = [
    { name: 'msg', key: 'msg', dataType: 'String' },
    {
      name: 'response_for_model',
      key: 'response_for_model',
      dataType: 'String',
    },
    { name: 'msg', key: 'msg', dataType: 'String' },
    {
      name: 'data',
      key: 'data',
      dataType: 'Object',
      children: [
        {
          name: '_type',
          key: '_type',
          dataType: 'String',
        },
        {
          name: 'images',
          key: 'images',
          dataType: 'Object',
          children: [
            {
              name: 'leaf',
              key: '0-0-1-0',
              dataType: 'String',
            },
          ],
        },
      ],
    },
  ];

  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };
  return (
    <div className="knowledge-node">
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          referenceList={referenceList}
          inputItemName="inputArgs"
          initialValues={{ inputArgs: params.inputArgs || [] }}
          handleChangeNodeConfig={handleChangeNodeConfig}
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
            value={params.searchStrategy}
            onChange={(value) =>
              handleChangeNodeConfig({ ...params, searchStrategy: value })
            }
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
            onChange={(value) =>
              handleChangeNodeConfig({ ...params, maxRecallCount: value })
            }
            value={params.maxRecallCount}
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
            onChange={(value) =>
              handleChangeNodeConfig({ ...params, matchingDegree: value })
            }
            value={params.matchingDegree}
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
