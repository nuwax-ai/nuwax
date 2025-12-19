/**
 * V2 知识库节点配置组件
 *
 * 支持知识库选择、搜索策略配置、召回参数配置
 * 完全独立，不依赖 V1
 */

import Created from '@/components/Created';
import TreeInput from '@/components/FormListItem/TreeInput';
import { SkillList } from '@/components/Skill';
import TooltipIcon from '@/components/custom/TooltipIcon';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { NodeTypeEnum } from '@/types/enums/common';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Form, FormInstance, Select, Slider } from 'antd';
import React, { useEffect, useState } from 'react';

import type { NodeConfigV2 } from '../../../types';
import { TreeOutputV2 } from './commonNodeV2';

import './KnowledgeNodeV2.less';

// ==================== 类型定义 ====================

export interface KnowledgeNodeV2Props {
  form: FormInstance;
  nodeConfig?: NodeConfigV2;
  id: number;
  type: string;
  referenceData?: any;
}

// ==================== 常量配置 ====================

const DEFAULT_INPUT_ARGS_DESC = '检索关键词';
const KBC_FORM_KEY = 'knowledgeBaseConfigs';
const KBC_INPUT_ARGS_KEY = 'inputArgs';

// ==================== 组件实现 ====================

const KnowledgeNodeV2: React.FC<KnowledgeNodeV2Props> = ({
  form,
  type,
  id,
}) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);

  // 显示新增技能
  const showAdd = () => {
    setOpen(true);
  };

  // 知识库添加
  const onAddedSkill = (item: CreatedNodeItem) => {
    const knowledgeBaseConfigs = form.getFieldValue(KBC_FORM_KEY) || [];
    item.type = item.targetType as unknown as NodeTypeEnum;
    item.knowledgeBaseId = item.targetId;

    form.setFieldValue(KBC_FORM_KEY, knowledgeBaseConfigs.concat(item));
    setOpen(false);
    setAddComponents([
      ...addComponents,
      {
        type: item.targetType,
        targetId: item.targetId,
        status: AgentAddComponentStatusEnum.Added,
      },
    ]);
  };

  // 移除技能
  const removeItem = (item: CreatedNodeItem) => {
    const knowledgeBaseConfigs = form.getFieldValue(KBC_FORM_KEY);
    if (knowledgeBaseConfigs) {
      const newSkillComponentConfigs = knowledgeBaseConfigs.filter(
        (i: CreatedNodeItem) => i.knowledgeBaseId !== item.knowledgeBaseId,
      );
      form.setFieldValue(KBC_FORM_KEY, newSkillComponentConfigs);
    }
  };

  // 修改技能参数
  const modifyItem = (item: CreatedNodeItem) => {
    const knowledgeBaseConfigs = form.getFieldValue(KBC_FORM_KEY);
    if (knowledgeBaseConfigs) {
      const newSkillComponentConfigs = knowledgeBaseConfigs.map(
        (i: CreatedNodeItem) =>
          i.knowledgeBaseId === item.knowledgeBaseId ? item : i,
      );
      form.setFieldValue(KBC_FORM_KEY, newSkillComponentConfigs);
    }
  };

  const knowledgeBaseConfigs = form.getFieldValue(KBC_FORM_KEY);
  useEffect(() => {
    const _arr =
      knowledgeBaseConfigs?.map((item: CreatedNodeItem) => {
        return {
          type: item.type,
          targetId: item.knowledgeBaseId,
          status: AgentAddComponentStatusEnum.Added,
        };
      }) || [];
    setAddComponents(_arr);
  }, [knowledgeBaseConfigs]);

  const inputArgs = (form?.getFieldValue(KBC_INPUT_ARGS_KEY) || []).map(
    (item: any) => {
      return {
        ...item,
        description: item.description || DEFAULT_INPUT_ARGS_DESC,
      };
    },
  );

  return (
    <div className="knowledge-node-v2">
      {/* 输入参数 */}
      <div className="node-item-style-v2">
        <TreeInput
          title={'输入'}
          form={form}
          params={inputArgs}
          key={`${type}-${id}-${KBC_INPUT_ARGS_KEY}`}
        />
      </div>

      {/* 知识库选择 */}
      <div className="node-item-style-v2">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style-v2">知识库</span>
          <Button icon={<PlusOutlined />} size={'small'} onClick={showAdd} />
        </div>
        <Form.Item shouldUpdate noStyle>
          {() =>
            form.getFieldValue(KBC_FORM_KEY) ? (
              <SkillList
                skillName={KBC_FORM_KEY}
                params={form.getFieldValue(KBC_FORM_KEY)}
                form={form}
                modifyItem={modifyItem}
                removeItem={removeItem}
              />
            ) : (
              <Empty description="暂无知识库" />
            )
          }
        </Form.Item>
      </div>

      {/* 搜索策略配置 */}
      <div className="knowledge-node-box-v2 node-item-style-v2">
        <div className="dis-sb mb-16">
          <div className="knowledge-left-title-v2 flex items-center">
            <span>搜索策略</span>
            <TooltipIcon
              title="从知识库中获取知识的检索方式，不同的检索策略可以更有效地找到正确的信息，提高其生成的答案的准确性和可用性"
              icon={<InfoCircleOutlined />}
            />
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
          <div className="knowledge-left-title-v2 flex items-center">
            <span>最大召回数量</span>
            <TooltipIcon
              title="从知识库中返回给大模型的最大段落数，数值越大返回的内容越多"
              icon={<InfoCircleOutlined />}
            />
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
        <div className="dis-sb">
          <div className="knowledge-left-title-v2 flex items-center">
            <span>最小匹配度</span>
            <TooltipIcon
              title="根据设置的匹配度选取段落返回给大模型，低于设定匹配度的内容不会被召回"
              icon={<InfoCircleOutlined />}
            />
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

      {/* 知识库选择弹窗 */}
      <Created
        checkTag={AgentComponentTypeEnum.Knowledge}
        onAdded={onAddedSkill}
        open={open}
        onCancel={() => setOpen(false)}
        addComponents={addComponents}
        hideTop={[
          AgentComponentTypeEnum.Table,
          AgentComponentTypeEnum.Agent,
          AgentComponentTypeEnum.Plugin,
          AgentComponentTypeEnum.Workflow,
          AgentComponentTypeEnum.MCP,
        ]}
      />
    </div>
  );
};

export default KnowledgeNodeV2;
