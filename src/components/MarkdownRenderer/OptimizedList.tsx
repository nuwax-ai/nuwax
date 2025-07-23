import React, { memo } from 'react';

import styles from './index.less';

/**
 * 优化的列表项组件
 * 防止列表项重复渲染导致的图片闪动
 */
export interface OptimizedListItemProps {
  children: React.ReactNode;
  dataKey: string;
}

export const OptimizedListItem: React.FC<OptimizedListItemProps> = memo(
  ({ children, dataKey }) => {
    return (
      <li key={dataKey} data-key={dataKey} className={styles['markdown-li']}>
        {children}
      </li>
    );
  },
);

/**
 * 优化的列表组件
 * 防止列表重复渲染
 */
export interface OptimizedListProps {
  children: React.ReactNode;
  ordered?: boolean;
  dataKey: string;
}

export const OptimizedList: React.FC<OptimizedListProps> = memo(
  ({ children, ordered = false, dataKey }) => {
    const ListComponent = ordered ? 'ol' : 'ul';
    return (
      <ListComponent
        key={dataKey}
        data-key={dataKey}
        className={styles['markdown-ul']}
      >
        {children}
      </ListComponent>
    );
  },
);
