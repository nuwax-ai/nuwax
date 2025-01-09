import type { CardStyleEnum } from '@/types/enums/common';
import React from 'react';

// 折叠容器
export interface FoldWrapType {
  className?: string;
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  visible?: boolean;
  // 关闭按钮左侧操作区域，可选
  otherAction?: React.ReactNode;
  onClose: () => void;
  // 顶部线条是否有margin样式
  lineMargin?: boolean;
  key?: string;
}

// 卡片样式类型
export interface CardStyleType {
  type: string;
  onClick: (type: CardStyleEnum) => void;
}

// 下拉选择框组件
export interface SelectListType {
  className?: string;
  value: string | number;
  // 自定义前缀
  prefix?: React.ReactNode;
  // 自定义的选择框后缀图标
  suffixIcon?: React.ReactNode;
  dropdownRenderComponent?: React.ReactNode;
  placeholder?: string;
  options: { label; value }[];
  // 是否选中的图标或者图片
  selectIcon?: React.ReactNode;
  // label文本前的图片
  img?: string;
  onChange: (value: React.Key) => void;
}

// 默认的object
export interface DefaultObjectType {
  [key: string]: any;
}
