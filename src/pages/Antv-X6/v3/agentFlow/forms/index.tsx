/**
 * AgentFlow 节点属性面板集合
 *
 * 6 类节点均在 agentFlow/forms/ 独立维护，与 Workflow 面板零共享。
 */

import AgentFlowEndForm from './AgentFlowEndForm';
import AgentFlowStartForm from './AgentFlowStartForm';
import AgentFlowWorkflowForm from './AgentFlowWorkflowForm';
import AgentNodeForm from './AgentNodeForm';
import HumanInteractionAskForm from './HumanInteractionAskForm';
import RouteDecisionForm from './RouteDecisionForm';

export default {
  AgentFlowStartNode: AgentFlowStartForm,
  AgentFlowEndNode: AgentFlowEndForm,
  AgentFlowWorkflowNode: AgentFlowWorkflowForm,
  AgentNode: AgentNodeForm,
  HumanInteractionNode: HumanInteractionAskForm,
  RouteDecisionNode: RouteDecisionForm,
};

export {
  AgentFlowEndForm,
  AgentFlowStartForm,
  AgentFlowWorkflowForm,
  AgentNodeForm,
  HumanInteractionAskForm,
  RouteDecisionForm,
};
