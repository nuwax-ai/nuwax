import React from 'react';
import styles from './index.less';

interface PlanStatCardProps {
  title: string;
  value: React.ReactNode;
}

/**
 * 订阅套餐统计卡片
 * @param title 标题
 * @param value 值
 */
const PlanStatCard: React.FC<PlanStatCardProps> = ({ title, value }) => {
  return (
    <div className={styles['plan-stat-card']}>
      <div className={styles['plan-stat-card-title']}>{title}</div>
      <div className={styles['plan-stat-card-value']}>{value}</div>
    </div>
  );
};

export default PlanStatCard;
