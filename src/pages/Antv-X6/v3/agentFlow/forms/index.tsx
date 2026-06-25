/**
 * AgentFlow 节点组件集合
 *
 * 本迭代 AgentFlow 仅支持 4 个节点：工作流(Workflow) / 路由决策(RouteDecision) /
 * 智能体(Agent) / 询问用户(HumanInteraction:Ask)。
 *
 * v2 重构：每种节点独立文件，本文件 re-export 保持 NodeRegistry 导入路径兼容。
 * 使用 default export object 以匹配 NodeRegistry 的解构导入方式。
 */

import './agentFlowPanel.less';

import AgentNodeForm from './AgentNodeForm';
import HumanInteractionAskForm from './HumanInteractionAskForm';
import RouteDecisionForm from './RouteDecisionForm';

export default {
  AgentNode: AgentNodeForm,
  HumanInteractionNode: HumanInteractionAskForm,
  RouteDecisionNode: RouteDecisionForm,
};
