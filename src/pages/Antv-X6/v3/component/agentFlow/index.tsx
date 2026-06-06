/**
 * AgentFlow 节点组件集合
 *
 * v2 重构：每种节点独立文件，本文件 re-export 保持 NodeRegistry 导入路径兼容。
 * 使用 default export object 以匹配 NodeRegistry 的解构导入方式。
 *
 * HumanInteraction 特殊处理：根据 hitlMode 分派到 approve 或 ask 子表单。
 */

import { HitlModeEnum } from '@/types/enums/common';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form } from 'antd';
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

  if (hitlMode === HitlModeEnum.Approve) {
    return <HumanInteractionApproveForm form={form} />;
  }
  return <HumanInteractionAskForm form={form} />;
};

export default {
  AgentNode: AgentNodeForm,
  HumanInteractionNode,
  EvalGateNode: EvalGateForm,
  ExternalConnectorNode,
  RouteDecisionNode: RouteDecisionForm,
};
