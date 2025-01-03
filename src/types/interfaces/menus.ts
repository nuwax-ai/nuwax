import type {
  TabsEnum,
  UserAvatarEnum,
  UserOperatorAreaEnum,
} from '@/types/enums/menus';
import React from 'react';

// 菜单栏~用户操作区域类型
export interface UserOperateAreaType {
  onClick: (type: UserOperatorAreaEnum) => void;
}

// 菜单栏~tab切换类型
export interface TabsType {
  onClick: (type: TabsEnum) => void;
}

// 用户头像组件类型
export interface UserAvatarType {
  onClick: (open: boolean) => void;
}

// 用户操作项类型
export interface UserActionItemType {
  className?: string;
  onClick: (type: UserAvatarEnum) => void;
  type: UserAvatarEnum;
  icon: React.ReactNode;
  text: string;
}
