import type { ConditionRenderProps } from '@/types/interfaces/common';
import type { PropsWithChildren } from 'react';
import React from 'react';

/**
 * 条件渲染组件
 */
const ConditionRender: React.FC<PropsWithChildren<ConditionRenderProps>> = ({
  children,
  condition,
}) => {
  if (!!condition) {
    return <>{children}</>;
  }
  return null;
};

export default ConditionRender;
