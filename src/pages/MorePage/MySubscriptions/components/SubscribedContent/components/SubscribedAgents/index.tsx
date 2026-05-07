import { dict } from '@/services/i18nRuntime';
import { apiGetMySubscription } from '@/services/subscriptionService';
import {
  BizTypeEnum,
  MyPlanPeriodEnum,
  MySubscriptionStatusEnum,
} from '@/types/interfaces/subscription';
import {
  AppstoreOutlined,
  CheckOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { Button, Empty, Skeleton, message } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const SubscribedAgents: React.FC = () => {
  const { data: subData, loading } = useRequest(() =>
    apiGetMySubscription({ bizType: BizTypeEnum.Agent }),
  );

  const list = subData?.subscriptions || [];

  const getPeriodLabel = (period: any) => {
    const periodValueMap: Record<string, MyPlanPeriodEnum> = {
      '1': MyPlanPeriodEnum.Month,
      '3': MyPlanPeriodEnum.Quarter,
      '12': MyPlanPeriodEnum.Year,
    };

    const p = (periodValueMap[period?.toString()] ||
      period?.toString().toUpperCase()) as MyPlanPeriodEnum;

    const periodMap: Record<MyPlanPeriodEnum, string> = {
      [MyPlanPeriodEnum.Month]: dict(
        'PC.Pages.MorePage.MySubscriptions.perMonth',
      ),
      [MyPlanPeriodEnum.Quarter]: dict(
        'PC.Pages.MorePage.MySubscriptions.feeQuarter',
      ),
      [MyPlanPeriodEnum.Year]: dict(
        'PC.Pages.MorePage.MySubscriptions.feeYear',
      ),
      [MyPlanPeriodEnum.Forever]: dict(
        'PC.Pages.MorePage.MySubscriptions.validityForever',
      ),
    };
    return periodMap[p] || '';
  };

  if (loading) {
    return (
      <div className={styles['agents-grid']}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} active avatar paragraph={{ rows: 3 }} />
        ))}
      </div>
    );
  }

  if (list.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles['agents-grid']}>
      {list.map((item: any) => {
        const isActive = item.status === MySubscriptionStatusEnum.Active;
        return (
          <div key={item.id} className={styles['agent-card']}>
            <div className={styles['card-header']}>
              <div
                className={styles['agent-icon']}
                style={{ backgroundColor: '#1890ff' }}
              >
                <AppstoreOutlined />
              </div>
              <div className={styles['agent-info']}>
                <div className={styles['agent-name']}>{item.planName}</div>
                <div className={styles['agent-provider']}>
                  {item.plan?.description || '-'}
                </div>
              </div>
            </div>

            <div className={styles['card-body']}>
              <div className={styles['info-item']}>
                <div className={styles['info-label']}>
                  {dict('PC.Pages.MorePage.MySubscriptions.subAmount')}
                </div>
                <div className={styles['info-value']}>
                  <span className={styles['price']}>¥{item.plan?.price}</span>
                  {item.plan?.period !== MyPlanPeriodEnum.Forever && (
                    <span className={styles['unit']}>
                      {getPeriodLabel(item.plan?.period)}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles['info-item']}>
                <div className={styles['info-label']}>
                  {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}
                </div>
                <div className={styles['info-value']}>
                  {item.endTime
                    ? dayjs(item.endTime).format('YYYY-MM-DD')
                    : '-'}
                </div>
              </div>
            </div>

            <div className={styles['card-footer']}>
              <div
                className={`${styles['status-box']} ${
                  isActive ? styles['status-active'] : styles['status-expired']
                }`}
              >
                {isActive ? (
                  <>
                    <CheckOutlined />
                    <span>
                      {dict('PC.Pages.MorePage.MySubscriptions.subscribing')}
                    </span>
                  </>
                ) : (
                  <>
                    <CloseCircleOutlined />
                    <span>
                      {dict('PC.Pages.MorePage.MySubscriptions.expired')}
                    </span>
                  </>
                )}
              </div>
              <Button
                type="primary"
                className={styles['renew-button']}
                onClick={() => message.success('续订功能开发中')}
              >
                {dict('PC.Pages.MorePage.MySubscriptions.renewNow')}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubscribedAgents;
