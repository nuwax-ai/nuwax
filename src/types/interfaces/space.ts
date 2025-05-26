import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { TooltipTitleTypeEnum } from '@/types/enums/common';
import type {
  AgentArrangeConfigEnum,
  ApplicationMoreActionEnum,
} from '@/types/enums/space';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import type { CollapseProps } from 'antd';
import type { MouseEventHandler } from 'react';
import React from 'react';
import { UserInfo } from './login';

// 单个应用项
export interface ApplicationItemProps {
  agentConfigInfo: AgentConfigInfo;
  userInfo: UserInfo | null;
  onClick: (agentId: number) => void;
  onCollect: (isCollect: boolean) => void;
  onClickMore: (type: ApplicationMoreActionEnum) => void;
}

// 单个应用项顶部组件
export interface ApplicationHeaderProps {
  agentConfigInfo: AgentConfigInfo;
}

// 收藏star组件
export interface CollectStarProps {
  devCollected: boolean;
  onClick: () => void;
}

// 系统提示词组件属性
export interface SystemTipsWordProps {
  value?: string;
  agentConfigInfo?: AgentConfigInfo;
  onChange: (value: string) => void;
  onReplace: (value?: string) => void;
}

// 智能体编排-单个配置选项header组件属性
export interface ConfigOptionsHeaderProps {
  title: string;
}

// 智能体编排-单个配置选项手风琴组件属性
export interface ConfigOptionCollapseProps {
  items: CollapseProps['items'];
  defaultActiveKey: AgentArrangeConfigEnum[];
  onChangeCollapse?: (key: AgentArrangeConfigEnum[]) => void;
}

// 自定义icon带提示组件， 默认加号（+）
export interface TooltipIconProps {
  className?: string;
  type?: TooltipTitleTypeEnum;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: MouseEventHandler<HTMLSpanElement>;
}

// 发布智能体、插件、工作流等弹窗组件
export interface PublishComponentModalProps {
  mode?: AgentComponentTypeEnum;
  agentId: number;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// 智能体迁移弹窗组件
export interface AgentMoveProps {
  spaceId: number;
  open: boolean;
  title?: string;
  onCancel: () => void;
  onConfirm: (spaceId: string) => void;
}

// 创建临时会话弹窗属性
export interface CreateTempChatModelProps {
  agentId?: number;
  open: boolean;
  name?: string;
  onCancel: () => void;
}
