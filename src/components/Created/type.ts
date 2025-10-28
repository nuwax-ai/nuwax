import type { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  AgentAddComponentBaseInfo,
  AgentAddComponentStatusInfo,
} from '@/types/interfaces/agentConfig';
import type { MenuProps } from 'antd';
/**  提前定义一些东西   */
export interface ButtonList {
  label: string;
  key: AgentComponentTypeEnum;
}

export interface CreatedProp {
  // 打开当前的弹窗
  open: boolean;
  onCancel: () => void;
  // 选中的头部的tag
  checkTag: AgentComponentTypeEnum;
  // 点击添加后,通知父组件添加节点
  onAdded: (val: AgentAddComponentBaseInfo) => void;
  addComponents?: AgentAddComponentStatusInfo[];
  tabs?: { label: string; key: AgentComponentTypeEnum }[];
  // 隐藏顶部
  hideTop?: AgentComponentTypeEnum[];
  addSkillLoading?: boolean | undefined;
  disableCollect?: boolean; // 是否禁用收藏
}

export type MenuItem = Required<MenuProps>['items'][number];
