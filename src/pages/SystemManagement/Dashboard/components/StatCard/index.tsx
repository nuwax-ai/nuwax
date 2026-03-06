import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Card, Skeleton } from 'antd';
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
  loading = false,
}) => {
  return (
    <Card className={cx(styles['stat-card'])} variant="borderless">
      {loading ? (
        <div className={cx(styles['stat-card-content'])}>
          <div className={cx(styles['stat-card-info'])}>
            <Skeleton
              active
              paragraph={{ rows: 1, width: ['60%'] }}
              title={{ width: '40%' }}
            />
          </div>
          <Skeleton.Button
            active
            className={cx(styles['stat-card-icon'])}
            style={{ width: 56, height: 56, borderRadius: 12 }}
          />
        </div>
      ) : (
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
                  <span className={cx(styles['trend-label'])}>
                    {trend.label}
                  </span>
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
      )}
    </Card>
  );
};

export default StatCard;
