import { dict } from '@/services/i18nRuntime';
import { apiGetCreditBatches } from '@/services/subscriptionService';
import {
  CreditBatchItem,
  CreditTypeEnum,
} from '@/types/interfaces/subscription';
import { Empty, Spin, Statistic } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const SubscribedCredits: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CreditBatchItem[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiGetCreditBatches({
        creditType: CreditTypeEnum.PURCHASE,
      });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch credit batches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles['loading-wrapper']}>
        <Spin />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <Empty style={{ marginTop: 40 }} />;
  }

  // 辅助函数：根据索引返回渐变背景色
  const getGradient = (index: number) => {
    const gradients = [
      'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
      'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)',
      'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
      'linear-gradient(90deg, #1890ff 0%, #36cfc9 100%)',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className={styles['credits-grid']}>
      {data.map((pack, index) => (
        <div key={pack.id} className={styles['credit-card']}>
          <div
            className={styles['card-header']}
            style={{
              background: getGradient(index),
            }}
          >
            <div className={styles['pack-name']}>{pack.remark}</div>
            <div className={styles['purchase-date']}>
              {pack.created ? dayjs(pack.created).format('YYYY-MM-DD') : '-'}
            </div>
          </div>

          <div className={styles['card-body']}>
            <div className={styles['stats-grid']}>
              <div className={styles['stat-item']}>
                <div className={styles['label']}>
                  {dict('PC.Pages.MorePage.MySubscriptions.totalCredits')}
                </div>
                <div className={styles['value-main']}>
                  <Statistic
                    value={pack.totalAmount}
                    prefix="+"
                    precision={0}
                    valueStyle={{
                      fontSize: 18,
                    }}
                  />
                </div>
              </div>
              <div className={styles['stat-item']}>
                <div className={styles['label']}>
                  {dict('PC.Pages.MorePage.MySubscriptions.usedAmount')}
                </div>
                <div className={styles['value-normal']}>
                  <Statistic
                    value={pack.usedAmount}
                    precision={0}
                    valueStyle={{
                      fontSize: 18,
                    }}
                  />
                </div>
              </div>
              <div className={styles['stat-item']}>
                <div className={styles['label']}>
                  {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}
                </div>
                <div className={styles['value-normal']}>
                  {pack.expireTime
                    ? dayjs(pack.expireTime).format('YYYY-MM-DD')
                    : '-'}
                </div>
              </div>
              <div className={styles['stat-item']}>
                <div className={styles['label']}>
                  {dict('PC.Pages.MorePage.MySubscriptions.purchaseAmount')}
                </div>
                <div className={styles['value-price']}>
                  <Statistic
                    value={pack.extra?.price || 0}
                    prefix={dict('PC.Common.Global.currencySymbol')}
                    precision={2}
                    valueStyle={{
                      fontSize: 18,
                      color: '#f59e0b',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles['card-footer']}>
            <div className={styles['remaining-text']}>
              <span className={styles['count']}>
                <Statistic
                  value={pack.remainAmount}
                  precision={0}
                  prefix={dict('PC.Pages.MorePage.MySubscriptions.remaining')}
                  suffix={dict('PC.Pages.MorePage.MySubscriptions.creditUnit')}
                  valueStyle={{
                    fontSize: 12,
                    fontWeight: '400',
                    color: '#8c8c8c',
                  }}
                />
              </span>
            </div>
            {/* 后端暂时未提供即将用完、已用完的状态，暂时使用占位逻辑 */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscribedCredits;
