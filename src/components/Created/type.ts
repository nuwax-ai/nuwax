import type { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type { MenuProps } from 'antd';
/**  提前定义一些东西   */
export interface ButtonList {
  label: string;
  key: AgentComponentTypeEnum;
}

// 定义 hasIds 类型
type HasIdsType = {
  [AgentComponentTypeEnum.Plugin]: number[];
  [AgentComponentTypeEnum.Workflow]: number[];
  [AgentComponentTypeEnum.Knowledge]: number[];
};

export interface CreatedProp {
  // 打开当前的弹窗
  open: boolean;
  onCancel: () => void;
  // 选中的头部的tag
  checkTag: AgentComponentTypeEnum;
  //   点击添加后,通知父组件添加节点
  onAdded: (val: CreatedNodeItem) => void;
  // 当前空间ID
  spaceId: number;
  // 当前工作流、工作空间已有的
  hasIds?: HasIdsType;
  // 当前的工作流id
  targetId?: number;
}

export type MenuItem = Required<MenuProps>['items'][number];
