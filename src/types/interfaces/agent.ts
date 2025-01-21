import type { TooltipTitleTypeEnum } from '@/types/enums/common';
import React from 'react';

// 知识库设置label
export interface LabelIconProps {
  label: string;
  title: React.ReactNode;
  type?: TooltipTitleTypeEnum;
}

// 智能体编排区域配置组件
export interface AgentArrangeConfigProps {
  onKnowledge: () => void;
  onSet: () => void;
}
