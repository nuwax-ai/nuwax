import type { CardStyleEnum } from '@/types/enums/common';
import React from 'react';

// 折叠容器
export interface FoldWrapType {
  className?: string;
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  visible?: boolean;
  otherAction?: React.ReactNode;
  onClose: () => void;
  lineMargin?: boolean;
}

// 卡片样式类型
export interface CardStyleType {
  type: string;
  onClick: (type: CardStyleEnum) => void;
}
