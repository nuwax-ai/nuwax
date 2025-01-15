import type { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CollapseProps } from 'antd';
import type { MouseEventHandler } from 'react';
import React from 'react';

export interface ApplicationItemProps {
  onClickMore: (type: ApplicationMoreActionEnum) => void;
}

export interface AgentAnalyzeProps {
  open: boolean;
  onCancel: () => void;
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

// 加号（+）带提示组件
export interface PlusIconProps {
  title?: string;
  onClick?: MouseEventHandler<HTMLSpanElement>;
}

export interface TooltipIconProps {
  type?: 'blank' | 'white';
  title?: string;
  icon?: React.ReactNode;
  onClick?: MouseEventHandler<HTMLSpanElement>;
}
