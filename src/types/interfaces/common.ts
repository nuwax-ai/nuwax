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

export interface LeftMenu {
  // 图标
  icon: React.ReactNode;
  // 名称
  name: string;
  // key
  key: string;
}

export interface LeftGroup {
  key: string;
  children: LeftMenu[];
  label?: string;
}

// 定义没有 searchBar 和 onSearch 的基础属性
export interface ModelBoxProps {
  // 标题
  title: string;
  // 左侧展示的列表
  leftMenuList: LeftMenu[] | LeftGroup[];
  // 右侧主体内容
  Content: React.ComponentType<any>;
  // 创建的按钮或下拉菜单
  createNode?: React.ReactNode;
  width?: number;
  searchBar?: boolean;
  onSearch?: (value: string) => void;
}
