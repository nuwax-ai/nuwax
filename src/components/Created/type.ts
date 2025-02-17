import { PluginAndLibraryEnum } from '@/types/enums/common';
import type { Statistics } from '@/types/interfaces/common';
import type { MenuProps } from 'antd';
/**  提前定义一些东西   */
export interface ButtonList {
  label: string;
  key: PluginAndLibraryEnum;
}

export interface CreatedNodeItem {
  // 图片
  icon: string;
  // 名称
  name: string;
  // 简介
  description: string;
  // 创建时间
  created: string;
  // 修改时间
  modified: string;
  // 备注
  remark: string;
  // 统计信息
  statistics: Statistics | null;
  // 当前id
  spaceId: number;
  // 正在使用的
  targetId: number;
  // 发布人员信息
  publishUser: {
    userId: number;
    userName: string;
    nickName: string;
    avatar: string;
  };
  collect: boolean;
}
export interface CreatedProp {
  // 选中的头部的tag
  checkTag: PluginAndLibraryEnum;
  //   点击添加后,通知父组件添加节点
  onAdded: (val: CreatedNodeItem) => void;
  // 当前空间ID
  spaceId: number;
  // 当前的工作流id
  targetId?: number;
  //
}

export type MenuItem = Required<MenuProps>['items'][number];
