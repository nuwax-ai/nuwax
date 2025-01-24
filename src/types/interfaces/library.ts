import type { PluginModeEnum } from '@/types/enums/library';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import React from 'react';

// 组件库单个组件项
export interface ComponentItemProps {
  title: string;
  desc: string;
  img: string;
  onClick: () => void;
  onClickMore: (type: CustomPopoverItem) => void;
}

// 新建、更新插件组件
export interface CreateNewPluginProps {
  type?: PluginModeEnum;
  open: boolean;
  onCancel: () => void;
}

// 出参配置数据类型
export interface outputConfigDataType {
  key: React.Key;
  // 参数名称
  paramName: string;
  // 参数描述
  desc: string;
  // 参数类型
  paramType: number;
  // 开启
  open: boolean;
  children?: outputConfigDataType[];
}

// 入参配置数据类型
export interface InputConfigDataType extends outputConfigDataType {
  // 传入方式
  afferentMode: number;
  // 是否必须
  mustNot: boolean;
  // 默认值
  default: string;
  children?: InputConfigDataType[];
}

// table头部header带*号标题
export interface LabelStarProps {
  label: string;
}

// 试运行弹窗组件属性
export interface TryRunModelProps {
  open: boolean;
  onCancel: () => void;
}

// 试运行~table出参配置数据类型
export interface tryOutputConfigDataType {
  key: React.Key;
  // 参数名称
  paramName: string;
  // 参数值
  desc: string;
  children?: tryOutputConfigDataType[];
}
