import type { AgentConfigInfo } from '@/types/interfaces/agent';

// 智能体header组件
export interface AgentHeaderProps {
  agentConfigInfo: AgentConfigInfo;
  onToggleShowStand: () => void;
  handlerToggleVersionHistory: () => void;
  onEditAgent: () => void;
  onPublish: () => void;
}

// 编配title组件
export interface ArrangeTitleProps {
  modelName?: string;
  onClick: () => void;
}

// 智能体编排区域配置组件
export interface AgentArrangeConfigProps {
  agentId: string;
  onKnowledge: () => void;
  onSet: () => void;
}
