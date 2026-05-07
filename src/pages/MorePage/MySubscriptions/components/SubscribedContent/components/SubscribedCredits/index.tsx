import { Tag } from 'antd';
import React from 'react';
import styles from './index.less';

export interface CreditPack {
  id: number;
  name: string;
  purchaseDate: string;
  totalCredits: number;
  consumed: number;
  expireAt: string;
  amount: number;
  remaining: number;
  status: 'normal' | 'low' | 'empty';
  themeColor?: string;
}

interface SubscribedCreditsProps {
  data: CreditPack[];
}

const SubscribedCredits: React.FC<SubscribedCreditsProps> = ({ data }) => {
  return (
    <div className={styles['credits-grid']}>
      {data.map((pack) => (
        <div key={pack.id} className={styles['credit-card']}>
          <div
            className={styles['card-header']}
            style={{
              background:
                pack.themeColor ||
                'linear-gradient(90deg, #1890ff 0%, #36cfc9 100%)',
            }}
          >
            <div className={styles['pack-name']}>{pack.name}</div>
            <div className={styles['purchase-date']}>{pack.purchaseDate}</div>
          </div>

          <div className={styles['card-body']}>
            <div className={styles['stats-grid']}>
              <div className={styles['stat-item']}>
                <div className={styles['label']}>总积分</div>
                <div className={styles['value-main']}>
                  +{pack.totalCredits.toLocaleString()}
                </div>
              </div>
              <div className={styles['stat-item']}>
                <div className={styles['label']}>已消耗</div>
                <div className={styles['value-normal']}>
                  {pack.consumed.toLocaleString()}
                </div>
              </div>
              <div className={styles['stat-item']}>
                <div className={styles['label']}>过期时间</div>
                <div className={styles['value-normal']}>{pack.expireAt}</div>
              </div>
              <div className={styles['stat-item']}>
                <div className={styles['label']}>增购金额</div>
                <div className={styles['value-price']}>¥{pack.amount}</div>
              </div>
            </div>
          </div>

          <div className={styles['card-footer']}>
            <div className={styles['remaining-text']}>
              剩余{' '}
              <span className={styles['count']}>
                {pack.remaining.toLocaleString()}
              </span>{' '}
              积分
            </div>
            <Tag
              className={styles['status-tag']}
              color={
                pack.status === 'empty'
                  ? 'error'
                  : pack.status === 'low'
                  ? 'warning'
                  : 'success'
              }
            >
              {pack.status === 'empty'
                ? '已用完'
                : pack.status === 'low'
                ? '即将用完'
                : '有效期 1 年'}
            </Tag>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscribedCredits;
