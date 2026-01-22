import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { StatCardProps } from './type';

const cx = classNames.bind(styles);

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  icon,
  iconColor = '#1890ff',
  iconBgColor = '#e6f7ff',
}) => {
  return (
    <Card className={cx(styles['stat-card'])} bordered={false}>
      <div className={cx(styles['stat-card-content'])}>
        <div className={cx(styles['stat-card-info'])}>
          <div className={cx(styles['stat-card-title'])}>{title}</div>
          <div className={cx(styles['stat-card-value'])}>
            {value.toLocaleString()}
          </div>
          {trend && (
            <div
              className={cx(
                styles['stat-card-trend'],
                trend.isUp ? styles['up'] : styles['down'],
              )}
            >
              {trend.isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span className={cx(styles['trend-value'])}>
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </span>
              {trend.label && (
                <span className={cx(styles['trend-label'])}>{trend.label}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cx(styles['stat-card-icon'])}
          style={{
            color: iconColor,
            backgroundColor: iconBgColor,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
