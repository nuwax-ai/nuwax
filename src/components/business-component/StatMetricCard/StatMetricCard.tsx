import { getStatValueFontSize } from '@/utils/statDisplay';
import { Skeleton, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import styles from './StatMetricCard.less';

/** StatMetricCard 组件入参 */
export interface StatMetricCardProps {
  /** 指标名称（如「调用次数」） */
  label: string;
  /** 已格式化的展示值（formatInteger / formatDecimal / formatCurrency 结果） */
  value: string;
  /** 是否高亮展示（如金额、积分等重要指标） */
  highlight?: boolean;
  /** 自定义高亮色，需配合 highlight 使用 */
  highlightColor?: string;
  /** 骨架屏加载态 */
  loading?: boolean;
  /** 是否展示 hover Tooltip，默认展示 */
  showTooltip?: boolean;
}

/**
 * 统计指标卡片：展示 label + 数值，数值字号随字符长度与卡片宽度动态缩放
 */
const StatMetricCard: React.FC<StatMetricCardProps> = ({
  label,
  value,
  highlight,
  highlightColor,
  loading,
  showTooltip = true,
}) => {
  const fontSize = useMemo(() => getStatValueFontSize(value), [value]);

  const valueStyle = useMemo(
    () =>
      ({
        '--stat-value-font-size': `${fontSize}px`,
        ...(highlightColor ? { '--stat-highlight-color': highlightColor } : {}),
      } as React.CSSProperties),
    [fontSize, highlightColor],
  );

  if (loading) {
    return (
      <div className={styles['stat-item-card']}>
        <Skeleton
          active
          paragraph={{ rows: 1, width: '50%' }}
          title={{ width: '70%' }}
        />
      </div>
    );
  }

  const valueNode = (
    <span className={styles['stat-value-trigger']}>
      <span
        className={`${styles['stat-value']} ${
          highlight ? styles.highlight : ''
        }`}
      >
        {value}
      </span>
    </span>
  );

  return (
    <div className={styles['stat-item-card']} style={valueStyle}>
      <span className={styles['stat-label']}>{label}</span>
      {showTooltip ? (
        <Tooltip title={value} placement="topLeft">
          {valueNode}
        </Tooltip>
      ) : (
        valueNode
      )}
    </div>
  );
};

export default StatMetricCard;
