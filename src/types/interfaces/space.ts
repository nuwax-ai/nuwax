import type { TooltipTitleTypeEnum } from '@/types/enums/common';
import type {
  ApplicationMoreActionEnum,
  HistoryActionTypeEnum,
  HistoryTargetTypeEnum,
} from '@/types/enums/space';
import type { AgentConfigInfo, CreatorInfo } from '@/types/interfaces/agent';
import type { CollapseProps } from 'antd';
import type { MouseEventHandler } from 'react';
import React from 'react';

// 单个应用项
export interface ApplicationItemProps {
  agentConfigInfo: AgentConfigInfo;
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

// 历史记录数据
export interface HistoryData {
  id: number;
  // 可用值:Agent,Plugin,Workflow
  targetType: HistoryTargetTypeEnum;
  targetId: number;
  // 操作类型,Add 新增, Edit 编辑, Publish 发布,可用值:Add,Edit,Publish,PublishApply,PublishApplyReject,OffShelf,AddComponent,EditComponent,DeleteComponent,AddNode,EditNode,DeleteNode
  type: HistoryActionTypeEnum;
  // 当时的配置信息
  config: object;
  // 操作描述
  description: string;
  // 操作人
  opUser: CreatorInfo;
  modified: string;
  // 创建时间
  created: string;
}

// 版本历史组件
export interface VersionHistoryProps {
  list: HistoryData[];
  visible: boolean;
  onClose: () => void;
}

// 发布智能体弹窗组件
export interface PublishAgentProps {
  agentId: number;
  open: boolean;
  onCancel: () => void;
}

export interface AgentMoveProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: (spaceId: string) => void;
}
