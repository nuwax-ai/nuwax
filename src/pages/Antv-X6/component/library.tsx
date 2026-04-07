// Knowledge-base related nodes.
import Created from '@/components/Created';
import TreeInput from '@/components/FormListItem/TreeInput';
import { SkillList } from '@/components/Skill';
import TooltipIcon from '@/components/custom/TooltipIcon';
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
import '../index.less';
import { TreeOutput } from './commonNode';

const DEFAULT_INPUT_ARGS_DESC_KEY =
  'PC.Pages.AntvX6Library.defaultInputArgsDesc';
const KBC_FORM_KEY = 'knowledgeBaseConfigs';
const KBC_INPUT_ARGS_KEY = 'inputArgs';
// Knowledge base node.
const KnowledgeNode: React.FC<NodeDisposeProps> = ({
  form, // updateNode,
  type,
  id,
}) => {
  // Open/close modal.
  const [open, setOpen] = useState(false);
  const { setIsModified } = useModel('workflow');
  // Components in loading state.
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);

  // Show add modal.
  const showAdd = () => {
    setOpen(true);
  };

  // Add knowledge base.
  const onAddedSkill = (item: CreatedNodeItem) => {
    const knowledgeBaseConfigs = form.getFieldValue(KBC_FORM_KEY) || [];
    item.type = item.targetType as unknown as NodeTypeEnum; // Type cast.
    item.knowledgeBaseId = item.targetId;

    form.setFieldValue(KBC_FORM_KEY, knowledgeBaseConfigs.concat(item));
    setIsModified(true);
    // form.submit();
    setOpen(false);
    // setSkillChange(true);
    setAddComponents([
      ...addComponents,
      {
        type: item.targetType,
        targetId: item.targetId,
        status: AgentAddComponentStatusEnum.Added,
      },
    ]);
  };

  // Remove selected item.
  const removeItem = (item: CreatedNodeItem) => {
    const knowledgeBaseConfigs = form.getFieldValue(KBC_FORM_KEY);
    if (knowledgeBaseConfigs) {
      const newSkillComponentConfigs = knowledgeBaseConfigs.filter(
        (i: CreatedNodeItem) => i.knowledgeBaseId !== item.knowledgeBaseId,
      );
      form.setFieldValue(KBC_FORM_KEY, newSkillComponentConfigs);
      setIsModified(true);
    }
  };

  // Update item config.
  const modifyItem = (item: CreatedNodeItem) => {
    setIsModified(true);
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
        description: item.description || t(DEFAULT_INPUT_ARGS_DESC_KEY),
      };
    },
  );

  return (
    <div className="knowledge-node">
      {/* Input args */}
      <div className="node-item-style">
        <TreeInput
          title={t('PC.Pages.AntvX6Data.input')}
          form={form}
          params={inputArgs}
          key={`${type}-${id}-${KBC_INPUT_ARGS_KEY}`}
        />
      </div>

      {/* Knowledge base selector */}
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
      {/* Output */}
      {/* Output */}
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
