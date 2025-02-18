import { PluginAndLibraryEnum } from '@/types/enums/common';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type { MenuProps } from 'antd';
/**  提前定义一些东西   */
export interface ButtonList {
  label: string;
  key: PluginAndLibraryEnum;
}

export interface CreatedProp {
  // 打开当前的弹窗
  open: boolean;
  onCancel: () => void;
  // 选中的头部的tag
  checkTag: PluginAndLibraryEnum;
  //   点击添加后,通知父组件添加节点
  onAdded: (val: CreatedNodeItem) => void;
  // 当前空间ID
  spaceId: number;
  // 当前的工作流id
  targetId?: number;
}

export type MenuItem = Required<MenuProps>['items'][number];
