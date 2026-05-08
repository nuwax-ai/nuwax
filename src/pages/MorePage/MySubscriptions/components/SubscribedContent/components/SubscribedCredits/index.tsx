import { dict } from '@/services/i18nRuntime';
import { apiGetCreditBatches } from '@/services/subscriptionService';
import {
  CreditBatchItem,
  CreditTypeEnum,
} from '@/types/interfaces/subscription';
import { Col, Empty, Row, Spin, Statistic } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import PointStatusTags from '../../../PointStatusTags';
import styles from './index.less';

const cx = classNames.bind(styles);

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

  return (
    <Row gutter={[24, 24]}>
      {data.map((pack) => (
        <Col key={pack.id} xs={24} sm={12} md={8} lg={8} xl={8} xxl={6}>
          <div className={cx(styles['credit-card'])}>
            <div className={cx(styles['card-header'])}>
              <div className={cx(styles['pack-name'])}>{pack.remark}</div>
              <div className={cx(styles['purchase-date'])}>
                {pack.created ? dayjs(pack.created).format('YYYY-MM-DD') : '-'}
              </div>
            </div>

            <div className={cx(styles['card-body'])}>
              <div className={cx(styles['stats-grid'])}>
                <div className={cx(styles['stat-item'])}>
                  <div className={cx(styles['label'])}>
                    {dict('PC.Pages.MorePage.MySubscriptions.totalCredits')}
                  </div>
                  <div className={cx(styles['value-main'])}>
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
                <div className={cx(styles['stat-item'])}>
                  <div className={cx(styles['label'])}>
                    {dict('PC.Pages.MorePage.MySubscriptions.usedAmount')}
                  </div>
                  <div className={cx(styles['value-normal'])}>
                    <Statistic
                      value={pack.usedAmount}
                      precision={0}
                      valueStyle={{
                        fontSize: 18,
                      }}
                    />
                  </div>
                </div>
                <div className={cx(styles['stat-item'])}>
                  <div className={cx(styles['label'])}>
                    {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}
                  </div>
                  <div className={cx(styles['value-normal'])}>
                    {pack.expireTime
                      ? dayjs(pack.expireTime).format('YYYY-MM-DD')
                      : '-'}
                  </div>
                </div>
                <div className={cx(styles['stat-item'])}>
                  <div className={cx(styles['label'])}>
                    {dict('PC.Pages.MorePage.MySubscriptions.purchaseAmount')}
                  </div>
                  <div className={cx(styles['value-price'])}>
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

            <div className={cx(styles['card-footer'])}>
              <div className={cx(styles['remaining-text'])}>
                <span className={cx(styles['count'])}>
                  <Statistic
                    value={pack.remainAmount}
                    precision={0}
                    prefix={dict('PC.Pages.MorePage.MySubscriptions.remaining')}
                    suffix={dict(
                      'PC.Pages.MorePage.MySubscriptions.creditUnit',
                    )}
                    valueStyle={{
                      fontSize: 12,
                      fontWeight: '400',
                      color: '#8c8c8c',
                    }}
                  />
                </span>
              </div>
              {/* 后端暂时未提供即将用完、已用完的状态，暂时使用占位逻辑 */}
              <PointStatusTags
                totalAmount={pack.totalAmount}
                usedAmount={pack.usedAmount}
                created={pack.created}
                expireTime={pack.expireTime}
              />
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default SubscribedCredits;
