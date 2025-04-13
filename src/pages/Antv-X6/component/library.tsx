// 知识库，数据库等节点
import Created from '@/components/Created';
import type { HasIdsType } from '@/components/Created/type';
import TreeInput from '@/components/FormListItem/TreeInput';
import { SkillList } from '@/components/Skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Form, Popover, Select, Slider } from 'antd';
import React, { useState } from 'react';
import { useModel } from 'umi';
import '../index.less';
import { TreeOutput } from './commonNode';
// 定义知识库
const KnowledgeNode: React.FC<NodeDisposeProps> = ({
  form, // updateNode,
}) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);
  const { setSkillChange } = useModel('workflow');
  //   显示新增技能
  const showAdd = () => {
    setOpen(true);
  };

  // 知识库
  const onAddedSkill = (item: CreatedNodeItem) => {
    const knowledgeBaseConfigs =
      form.getFieldValue('knowledgeBaseConfigs') || [];
    item.type = item.targetType;
    item.knowledgeBaseId = item.targetId;
    form.setFieldValue(
      'knowledgeBaseConfigs',
      knowledgeBaseConfigs.concat(item),
    );
    form.submit();
    setOpen(false);
    setSkillChange(true);
  };

  const hasIds: HasIdsType = {
    [AgentComponentTypeEnum.Plugin]: [],
    [AgentComponentTypeEnum.Workflow]: [],
    [AgentComponentTypeEnum.Knowledge]: [],
  };

  // 遍历 skillComponentConfigs 并填充 hasIds
  for (const item of form.getFieldValue('knowledgeBaseConfigs') || []) {
    if (item.type && item.knowledgeBaseId) {
      const type = item.type as AgentComponentTypeEnum; // 明确类型
      if (hasIds[type]) {
        hasIds[type]?.push(Number(item.knowledgeBaseId));
      }
    }
  }

  return (
    <div className="knowledge-node">
      {/* 输入参数 */}
      <div className="node-item-style">
        <TreeInput
          title={'输入'}
          form={form}
          params={form.getFieldValue('inputArgs')}
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
        <Form.Item shouldUpdate noStyle>
          {() =>
            form.getFieldValue('knowledgeBaseConfigs') ? (
              <SkillList
                skillName={'knowledgeBaseConfigs'}
                params={form.getFieldValue('knowledgeBaseConfigs')}
                form={form}
              />
            ) : (
              <Empty />
            )
          }
        </Form.Item>
      </div>
      <div className="knowledge-node-box node-item-style">
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
          <Form.Item name={['searchStrategy']} noStyle>
            <Select
              className="flex-1"
              options={[
                { label: '语义', value: 'SEMANTIC' },
                { label: '混合', value: 'MIXED' },
                { label: '全文', value: 'FULL_TEXT' },
              ]}
            />
          </Form.Item>
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
          <Form.Item name={['maxRecallCount']} noStyle>
            <Slider
              min={1}
              max={20}
              step={1}
              marks={{ 1: 1, 20: 20 }}
              className="flex-1"
            />
          </Form.Item>
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
          <Form.Item name={'matchingDegree'} noStyle>
            <Slider
              min={0.01}
              max={0.99}
              step={0.01}
              marks={{ 0.01: 0.01, 0.99: 0.99 }}
              className="flex-1"
            />
          </Form.Item>
        </div>
      </div>
      {/* 输出 */}
      {/* 输出 */}
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
      <Created
        checkTag={AgentComponentTypeEnum.Knowledge}
        spaceId={Number(sessionStorage.getItem('spaceId'))}
        onAdded={onAddedSkill}
        open={open}
        onCancel={() => setOpen(false)}
        hasIds={hasIds}
      />
    </div>
  );
};

export default { KnowledgeNode };
