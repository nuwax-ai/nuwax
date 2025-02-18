import type { DataTypeEnum } from '@/types/enums/common';
import type {
  AgentComponentInfo,
  AgentConfigInfo,
  TriggerTimeZone,
} from '@/types/interfaces/agent';
import React from 'react';

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
  agentId: number;
  onKnowledge: () => void;
  onSet: () => void;
}

// 智能体模型组件，插件、工作流、触发器等组件通用显示组件
export interface AgentModelComponentProps {
  agentComponentInfo: AgentComponentInfo;
  defaultImage?: string;
  extra?: React.ReactNode;
}

// 创建触发器组件
export interface CreateTriggerProps {
  agentId: number;
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// 触发器时区组件
export interface TimingTriggerProps {
  triggerTimeZone?: TriggerTimeZone;
}

// 触发器请求参数输入数据类型
export interface TriggerRequireInputType {
  key: React.Key;
  name: string;
  dataType?: DataTypeEnum;
  description: string;
  children?: TriggerRequireInputType[];
}
