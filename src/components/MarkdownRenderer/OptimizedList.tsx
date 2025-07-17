import React, { memo } from 'react';

import styles from './index.less';

/**
 * 优化的列表项组件
 * 防止列表项重复渲染导致的图片闪动
 */
export interface OptimizedListItemProps {
  children: React.ReactNode;
}

export const OptimizedListItem: React.FC<OptimizedListItemProps> = memo(
  ({ children }) => {
    return <li className={styles['markdown-li']}>{children}</li>;
  },
);

/**
 * 优化的列表组件
 * 防止列表重复渲染
 */
export interface OptimizedListProps {
  children: React.ReactNode;
  ordered?: boolean;
}

export const OptimizedList: React.FC<OptimizedListProps> = memo(
  ({ children, ordered = false }) => {
    const ListComponent = ordered ? 'ol' : 'ul';

    return (
      <ListComponent className={styles['markdown-ul']}>
        {children}
      </ListComponent>
    );
  },
);
