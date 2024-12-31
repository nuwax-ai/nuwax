import React from 'react';

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
