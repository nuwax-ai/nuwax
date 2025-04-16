import type { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
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
  onAdded: (val: CreatedNodeItem) => void;
  addComponents?: AgentAddComponentStatusInfo[];
  // 当前的工作流id
  targetId?: number;
}

export type MenuItem = Required<MenuProps>['items'][number];
