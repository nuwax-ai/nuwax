// 知识库，数据库等节点
import Created from '@/components/Created';
import { SkillList } from '@/components/Skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { InputItemNameEnum } from '@/types/enums/node';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type { NodeConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Popover, Select, Slider } from 'antd';
import React, { useState } from 'react';
import '../index.less';
import { TreeOutput } from './commonNode';
import { InputList } from './pluginNode';
// 定义知识库
const KnowledgeNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  // updateNode,
}) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);
  //   显示新增技能
  const showAdd = () => {
    setOpen(true);
  };

  // 知识库
  const onAddedSkill = (item: CreatedNodeItem) => {
    item.type = item.targetType;
    item.knowledgeBaseId = item.targetId;
    const knowledgeBaseConfigs = params.knowledgeBaseConfigs || [];
    Modified({
      ...params,
      knowledgeBaseConfigs: [...knowledgeBaseConfigs, item],
    });
    setOpen(false);
  };
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  return (
    <div className="knowledge-node">
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputList
          title={'输入'}
          initialValues={{ inputArgs: params.inputArgs || [] }}
          onChange={handleChangeNodeConfig}
          inputItemName={InputItemNameEnum.inputArgs}
        />
      </div>
      {/* 知识库选择 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">知识库</span>
          <Button
            icon={<PlusOutlined />}
            size={'small'}
            onClick={showAdd}
          ></Button>
        </div>
        {params.knowledgeBaseConfigs &&
          params.knowledgeBaseConfigs.length > 0 && (
            <SkillList
              skillName={'knowledgeBaseConfigs'}
              params={params}
              handleChange={handleChangeNodeConfig}
            />
          )}
        {(!params.knowledgeBaseConfigs ||
          !params.knowledgeBaseConfigs.length) && <Empty />}
      </div>
      <div className="knowledge-node-box">
        <div className="dis-sb mb-16">
          <div className="knowlegenow-left-title">
            <span>搜索策略</span>
            <Popover
              overlayInnerStyle={{ width: '300px' }}
              placement="right"
              content={
                '从知识库中获取知识的检索方式，不同的检索策略可以更有效地找到正确的信息，提高其生成的答案的准确性和可用性'
              }
            >
              <InfoCircleOutlined className="margin-right-6" />
            </Popover>
          </div>
          <Select
            className="flex-1"
            value={params.searchStrategy}
            onChange={(value) =>
              handleChangeNodeConfig({ ...params, searchStrategy: value })
            }
            options={[
              { label: '语义', value: 'SEMANTIC' },
              { label: '混合', value: 'MIXED' },
              { label: '全文', value: 'FULL_TEXT' },
            ]}
          />
        </div>
        <div className="dis-sb mb-16">
          <div className="knowlegenow-left-title">
            <span>最大召回数量</span>
            <Popover
              overlayInnerStyle={{ width: '300px' }}
              placement="right"
              content={
                '从知识库中返回给大模型的最大段落数，数值越大返回的内容越多'
              }
            >
              <InfoCircleOutlined className="margin-right-6" />
            </Popover>
          </div>
          <Slider
            min={1}
            max={20}
            step={1}
            marks={{ 1: 1, 20: 20 }}
            onChange={(value) =>
              handleChangeNodeConfig({ ...params, maxRecallCount: value })
            }
            value={params.maxRecallCount}
            className="flex-1"
          />
        </div>
        <div className="dis-sb ">
          <div className="knowlegenow-left-title">
            <span>最小匹配度</span>
            <Popover
              overlayInnerStyle={{ width: '300px' }}
              placement="right"
              content={
                '根据设置的匹配度选取段落返回给大模型，低于设定匹配度的内容不会被召回'
              }
            >
              <InfoCircleOutlined className="margin-right-6" />
            </Popover>
          </div>
          <Slider
            min={0.01}
            max={0.99}
            step={0.01}
            marks={{ 0.01: 0.01, 0.99: 0.99 }}
            onChange={(value) =>
              handleChangeNodeConfig({ ...params, matchingDegree: value })
            }
            value={params.matchingDegree}
            className="flex-1"
          />
        </div>
      </div>
      {/* 输出 */}
      <p className="node-title-style mt-16">{'输出'}</p>
      <TreeOutput treeData={params.outputArgs || []} />
      <Created
        checkTag={AgentComponentTypeEnum.Knowledge}
        spaceId={Number(sessionStorage.getItem('spaceId'))}
        onAdded={onAddedSkill}
        open={open}
        onCancel={() => setOpen(false)}
        hasIds={params.knowledgeBaseConfigs?.map((item) =>
          Number(item.knowledgeBaseId),
        )}
      />
    </div>
  );
};

export default { KnowledgeNode };
