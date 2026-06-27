/**
 * 知识库写入节点属性面板
 * - 只读展示 nodeConfig.knowledgeBaseId / name / description / icon
 * - 添加节点时已绑定，无增删改
 */

import TreeInput from '@/components/FormListItem/TreeInput';
import { t } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Empty, Form } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useModel } from 'umi';
import { getImg } from '../../utils/workflowV3';
import { TreeOutput } from '../commonNode';
import {
  KNOWLEDGE_INSERT_BINDING_KEYS,
  pickKnowledgeInsertBinding,
  type KnowledgeInsertBinding,
} from './knowledgeInsertNode';

const DEFAULT_INPUT_ARGS_DESC_KEY =
  'PC.Pages.AntvX6Library.defaultInputArgsDesc';
const INPUT_ARGS_KEY = 'inputArgs';

const KnowledgeBaseReadonlyCard: React.FC<{ item: KnowledgeInsertBinding }> = ({
  item,
}) => (
  <div className="skill-item-style background-c9 dis-left">
    <img
      src={item.icon || getImg(AgentComponentTypeEnum.Knowledge)}
      alt=""
      className="skill-item-icon"
    />
    <div className="skill-item-content-style">
      <div className="skill-item-title-style">{item.name}</div>
      <div className="skill-item-desc-style">{item.description}</div>
    </div>
  </div>
);

const KnowledgeInsertNodePanel: React.FC<NodeDisposeProps> = ({
  form,
  type,
  id,
  nodeConfig,
}) => {
  const { getWorkflow } = useModel('workflowV3');

  // 展示以 nodeConfig 为准（刷新后接口数据在 foldWrapItem.nodeConfig）
  const boundKnowledge = useMemo(() => {
    const fromProps = pickKnowledgeInsertBinding(nodeConfig);
    if (fromProps) {
      return fromProps;
    }
    const drawerConfig = getWorkflow('drawerForm')?.nodeConfig;
    return pickKnowledgeInsertBinding(drawerConfig);
  }, [nodeConfig, getWorkflow, id]);

  // 将绑定字段写入 form，保证保存时不丢失（hidden 字段晚于 Form initialValues 注册）
  useEffect(() => {
    if (!boundKnowledge) {
      return;
    }
    form.setFieldsValue(boundKnowledge);
  }, [boundKnowledge, form]);

  const inputArgs = (form?.getFieldValue(INPUT_ARGS_KEY) || []).map(
    (item: { description?: string }) => ({
      ...item,
      description: item.description || t(DEFAULT_INPUT_ARGS_DESC_KEY),
    }),
  );

  return (
    <div className="knowledge-node">
      <div className="node-item-style">
        <div className="margin-bottom">
          <span className="node-title-style">
            {t('PC.Pages.AntvX6Library.knowledgeBase')}
          </span>
        </div>
        {KNOWLEDGE_INSERT_BINDING_KEYS.map((key) => (
          <Form.Item
            key={key}
            name={key}
            hidden
            preserve
            initialValue={boundKnowledge?.[key]}
          >
            <span />
          </Form.Item>
        ))}
        {boundKnowledge ? (
          <KnowledgeBaseReadonlyCard item={boundKnowledge} />
        ) : (
          <Empty />
        )}
      </div>

      <div className="node-item-style">
        <TreeInput
          title={t('PC.Pages.AntvX6RegisterNodes.input')}
          form={form}
          params={inputArgs}
          key={`${type}-${id}-${INPUT_ARGS_KEY}`}
        />
      </div>

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
    </div>
  );
};

export default KnowledgeInsertNodePanel;
