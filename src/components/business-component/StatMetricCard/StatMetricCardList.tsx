import classNames from 'classnames';
import React, { useMemo } from 'react';
import StatMetricCard from './StatMetricCard';
import styles from './StatMetricCardList.less';
import type { StatMetricItem } from './types';

/** StatMetricCardList 组件入参 */
export interface StatMetricCardListProps {
  /** 统计指标列表（value 为已格式化字符串） */
  items: StatMetricItem[];
  /** 全局加载态，各卡片展示骨架屏 */
  loading?: boolean;
  /** 外层容器 className */
  className?: string;
  /** 网格单列最小宽度（px），默认 180 */
  minColumnWidth?: number;
}

/**
 * 统计指标卡片列表：网格布局 + 单卡动态字号
 */
const StatMetricCardList: React.FC<StatMetricCardListProps> = ({
  items,
  loading,
  className,
  minColumnWidth = 180,
}) => {
  const listStyle = useMemo(
    () =>
      ({
        '--stat-card-min-width': `${minColumnWidth}px`,
      } as React.CSSProperties),
    [minColumnWidth],
  );

  return (
    <div
      className={classNames(styles['stat-metric-card-list'], className)}
      style={listStyle}
    >
      {items.map((item) => (
        <StatMetricCard
          key={item.key ?? item.label}
          label={item.label}
          value={item.value}
          highlight={item.highlight}
          loading={loading}
        />
      ))}
    </div>
  );
};

export default StatMetricCardList;
