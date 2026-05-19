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
  /** 是否展示 hover Tooltip，默认展示 */
  showTooltip?: boolean;
}

/**
 * 统计指标卡片列表：网格布局 + 单卡动态字号
 */
const StatMetricCardList: React.FC<StatMetricCardListProps> = ({
  items,
  loading,
  className,
  minColumnWidth = 180,
  showTooltip = true,
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
          highlightColor={item.highlightColor}
          loading={loading}
          showTooltip={item.showTooltip ?? showTooltip}
        />
      ))}
    </div>
  );
};

export default StatMetricCardList;
