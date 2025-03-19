import type {
  TabsEnum,
  UserAvatarEnum,
  UserOperatorAreaEnum,
} from '@/types/enums/menus';
import type { AgentInfo } from '@/types/interfaces/agent';
import React from 'react';

// 用户相关智能体
export interface UserRelAgentListProps {
  list: AgentInfo[];
  onClick: (info: AgentInfo) => void;
}

// 创建新团队组件
export interface CreateNewTeamProps {
  open: boolean;
  onCancel: () => void;
}

// 个人空间Popover内容组件
export interface PersonalSpaceContentType {
  onCreateTeam: () => void;
  onClosePopover: (flag: boolean) => void;
}

// 菜单栏~tab切换类型
export interface TabsType {
  onClick: (type: TabsEnum) => void;
}

export interface TabItemProps {
  active: boolean;
  type: TabsEnum;
  icon: React.ReactNode;
  text: string;
  onClick: (type: TabsEnum) => void;
}

// 用户操作项类型
export interface UserActionItemType {
  className?: string;
  onClick: (type: UserAvatarEnum) => void;
  type: UserAvatarEnum;
  icon: React.ReactNode;
  text: string;
}

// 用户头像组件类型
export interface UserAvatarType {
  onClick: (open: boolean) => void;
}

// 菜单栏~用户操作区域类型
export interface UserOperateAreaType {
  onClick: (type: UserOperatorAreaEnum) => void;
}

// 用户操作区域数据项
export interface UserOperateAreaItem {
  title: string;
  icon: React.ReactNode;
  type: UserOperatorAreaEnum;
}
