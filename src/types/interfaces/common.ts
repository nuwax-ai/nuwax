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

// 默认的object
export interface DefaultObjectType {
  [key: string]: any;
}
