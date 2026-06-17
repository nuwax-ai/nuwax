// 知识库，数据库等节点
import Created from '@/components/Created';
import TooltipIcon from '@/components/custom/TooltipIcon';
import TreeInput from '@/components/FormListItem/TreeInput';
import { t } from '@/services/i18nRuntime';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { NodeTypeEnum } from '@/types/enums/common';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Form, Select, Slider } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import '../indexV3.less';
import { TreeOutput } from './commonNode';
import { SkillList } from './NewSkillV3';

const DEFAULT_INPUT_ARGS_DESC_KEY =
  'PC.Pages.AntvX6Library.defaultInputArgsDesc';
const KBC_FORM_KEY = 'knowledgeBaseConfigs';
const KBC_INPUT_ARGS_KEY = 'inputArgs';
// 定义知识库
const KnowledgeNode: React.FC<NodeDisposeProps> = ({
  form, // updateNode,
  type,
  id,
}) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);
  const { setIsModified } = useModel('workflowV3');
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);

  //   显示新增技能
  const showAdd = () => {
    setOpen(true);
  };

  // 知识库
  const onAddedSkill = (item: CreatedNodeItem) => {
    const knowledgeBaseConfigs = form.getFieldValue(KBC_FORM_KEY) || [];
    item.type = item.targetType as unknown as NodeTypeEnum; //类型转换
    item.knowledgeBaseId = item.targetId;

    form.setFieldValue(KBC_FORM_KEY, knowledgeBaseConfigs.concat(item));
    setIsModified(true);
    // V3: 触发全量保存
    form.submit();
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

  // 移出技能
  const removeItem = (item: CreatedNodeItem) => {
    const knowledgeBaseConfigs = form.getFieldValue(KBC_FORM_KEY);
    if (knowledgeBaseConfigs) {
      const newSkillComponentConfigs = knowledgeBaseConfigs.filter(
        (i: CreatedNodeItem) => i.knowledgeBaseId !== item.knowledgeBaseId,
      );
      form.setFieldValue(KBC_FORM_KEY, newSkillComponentConfigs);
      setIsModified(true);
      // V3: 触发全量保存
      form.submit();
    }
  };

  // 修改技能参数
  const modifyItem = (item: CreatedNodeItem) => {
    setIsModified(true);
    const knowledgeBaseConfigs = form.getFieldValue(KBC_FORM_KEY);
    if (knowledgeBaseConfigs) {
      const newSkillComponentConfigs = knowledgeBaseConfigs.map(
        (i: CreatedNodeItem) =>
          i.knowledgeBaseId === item.knowledgeBaseId ? item : i,
      );
      form.setFieldValue(KBC_FORM_KEY, newSkillComponentConfigs);
      // V3: 触发全量保存
      form.submit();
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
        description: item.description || t(DEFAULT_INPUT_ARGS_DESC_KEY),
      };
    },
  );

  return (
    <div className="knowledge-node">
      {/* 输入参数 */}
      <div className="node-item-style">
        <TreeInput
          title={t('PC.Pages.AntvX6RegisterNodes.input')}
          form={form}
          params={inputArgs}
          key={`${type}-${id}-${KBC_INPUT_ARGS_KEY}`}
        />
      </div>

      {/* 知识库选择 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">
            {t('PC.Pages.AntvX6Library.knowledgeBase')}
          </span>
          <Button
            icon={<PlusOutlined />}
            size={'small'}
            onClick={showAdd}
          ></Button>
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
              <Empty />
            )
          }
        </Form.Item>
      </div>
      <div className="knowledge-node-box node-item-style">
        <div className="dis-sb mb-16">
          <div className="knowlegenow-left-title flex items-center">
            <span>{t('PC.Pages.AntvX6Library.searchStrategy')}</span>
            <TooltipIcon
              title={t('PC.Pages.AntvX6Library.searchStrategyTooltip')}
              icon={<InfoCircleOutlined />}
            />
          </div>
          <Form.Item name={['searchStrategy']} noStyle>
            <Select
              className="flex-1"
              options={[
                {
                  label: t('PC.Pages.AntvX6Library.searchStrategySemantic'),
                  value: 'SEMANTIC',
                },
                {
                  label: t('PC.Pages.AntvX6Library.searchStrategyMixed'),
                  value: 'MIXED',
                },
                {
                  label: t('PC.Pages.AntvX6Library.searchStrategyFullText'),
                  value: 'FULL_TEXT',
                },
              ]}
            />
          </Form.Item>
        </div>
        <div className="dis-sb mb-16">
          <div className="knowlegenow-left-title flex items-center">
            <span>{t('PC.Pages.AntvX6Library.maxRecallCount')}</span>
            <TooltipIcon
              title={t('PC.Pages.AntvX6Library.maxRecallCountTooltip')}
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
        <div className="dis-sb ">
          <div className="knowlegenow-left-title flex items-center">
            <span>{t('PC.Pages.AntvX6Library.minMatchScore')}</span>
            <TooltipIcon
              title={t('PC.Pages.AntvX6Library.minMatchScoreTooltip')}
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
      {/* 输出 */}
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">
                {t('PC.Pages.AntvX6Data.output')}
              </div>
              <TreeOutput treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>
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

export default { KnowledgeNode };
