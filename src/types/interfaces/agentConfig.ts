import type { DataTypeEnum } from '@/types/enums/common';
import type {
  AgentCardInfo,
  AgentComponentInfo,
  AgentConfigInfo,
  TriggerTimeZone,
} from '@/types/interfaces/agent';
import React from 'react';

// 智能体header组件
export interface AgentHeaderProps {
  agentConfigInfo: AgentConfigInfo;
  onToggleShowStand: () => void;
  onToggleVersionHistory: () => void;
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
  spaceId: number;
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
  // 参数名称，符合函数命名规则
  name: string;
  // 参数详细描述信息
  description: string;
  // 数据类型
  dataType: DataTypeEnum;
  children?: TriggerRequireInputType[];
}

// 智能体模型设置弹窗组件
export interface AgentModelSettingProps {
  spaceId: number;
  modelComponentConfig: AgentComponentInfo;
  open: boolean;
  onCancel: () => void;
}

// 卡片设置组件
export interface CardModeSettingProps {
  cardKey: string;
  list: AgentCardInfo[];
  onChoose: (cardKey: string) => void;
}
