import type { TooltipTitleTypeEnum } from '@/types/enums/common';
import type { ApplicationMoreActionEnum } from '@/types/enums/space';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import type { CollapseProps } from 'antd';
import type { MouseEventHandler } from 'react';
import React from 'react';

export interface ApplicationItemProps {
  agentConfigInfo: AgentConfigInfo;
  onClick: (agentId: string) => void;
  onCollect: (isCollect: boolean) => void;
  onClickMore: (type: ApplicationMoreActionEnum) => void;
}

// 系统提示词组件属性
export interface SystemTipsWordProps {
  value: string;
  onChange: (value: string) => void;
}

// 智能体编排-单个配置选项header组件属性
export interface ConfigOptionsHeaderProps {
  title: string;
}

// 智能体编排-单个配置选项手风琴组件属性
export interface ConfigOptionCollapseProps {
  items: CollapseProps['items'];
}

// 自定义icon带提示组件， 默认加号（+）
export interface TooltipIconProps {
  className?: string;
  type?: TooltipTitleTypeEnum;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: MouseEventHandler<HTMLSpanElement>;
}

// 版本历史组件
export interface VersionHistoryProps {
  visible: boolean;
  onClose: () => void;
}

// 发布智能体弹窗组件
export interface PublishAgentProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
