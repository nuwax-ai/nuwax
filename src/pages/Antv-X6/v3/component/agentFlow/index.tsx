/**
 * AgentFlow 节点组件集合
 *
 * v2 重构：每种节点独立文件，本文件 re-export 保持 NodeRegistry 导入路径兼容。
 * 使用 default export object 以匹配 NodeRegistry 的解构导入方式。
 *
 * HumanInteraction 特殊处理：根据 hitlMode 分派到 approve 或 ask 子表单。
 */

import { t } from '@/services/i18nRuntime';
import { HitlModeEnum } from '@/types/enums/common';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form, Radio } from 'antd';
import React from 'react';

import AgentNodeForm from './AgentNodeForm';
import EvalGateForm from './EvalGateForm';
import HumanInteractionApproveForm from './HumanInteractionApproveForm';
import HumanInteractionAskForm from './HumanInteractionAskForm';
import RouteDecisionForm from './RouteDecisionForm';

// ExternalConnector 保持原有实现（v2 不在范围内）
import AgentFlowNodesLegacy from '../agentFlowNodes';
const { ExternalConnectorNode } = AgentFlowNodesLegacy;

/**
 * HumanInteraction 统一入口：根据 hitlMode 分派到 approve / ask 子表单
 */
const HumanInteractionNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const hitlMode =
    Form.useWatch('hitlMode', { form, preserve: true }) || HitlModeEnum.Ask;

  return (
    <div className="model-node-style">
      <Form.Item
        name="hitlMode"
        label={t('PC.Pages.AgentFlowNode.hitlModeLabel', '交互模式')}
        initialValue={HitlModeEnum.Ask}
        style={{ marginBottom: 8 }}
      >
        <Radio.Group>
          <Radio.Button value={HitlModeEnum.Ask}>
            {t('PC.Pages.AgentFlowNode.hitlModeAsk', '询问')}
          </Radio.Button>
          <Radio.Button value={HitlModeEnum.Approve}>
            {t('PC.Pages.AgentFlowNode.hitlModeApprove', '审批')}
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      {hitlMode === HitlModeEnum.Approve ? (
        <HumanInteractionApproveForm form={form} />
      ) : (
        <HumanInteractionAskForm form={form} />
      )}
    </div>
  );
};

export default {
  AgentNode: AgentNodeForm,
  HumanInteractionNode,
  EvalGateNode: EvalGateForm,
  ExternalConnectorNode,
  RouteDecisionNode: RouteDecisionForm,
};
