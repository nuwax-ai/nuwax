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
import { Button, Col, Empty, Row, Spin } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import { useRequest } from 'umi';
import { useSubscriptionPurchase } from '../../../../hooks/useSubscriptionPurchase';
import { getPeriodUnitText } from '../../../../utils';
import styles from './index.less';

const cx = classNames.bind(styles);

const SubscribedAgents: React.FC = () => {
  const { processingId, handlePaySubscription: handlePay } =
    useSubscriptionPurchase();
  const { data: subData, loading } = useRequest(() =>
    apiGetMySubscription({ bizType: BizTypeEnum.Agent }),
  );

  const list = subData?.subscriptions || [];
  const normalizePeriod = (period: any): MyPlanPeriodEnum => {
    const periodValueMap: Record<string, MyPlanPeriodEnum> = {
      '1': MyPlanPeriodEnum.Month,
      '3': MyPlanPeriodEnum.Quarter,
      '12': MyPlanPeriodEnum.Year,
    };
    return (periodValueMap[period?.toString()] ||
      period?.toString().toUpperCase()) as MyPlanPeriodEnum;
  };

  if (loading) {
    return (
      <div className={cx(styles['loading-wrapper'])}>
        <Spin />
      </div>
    );
  }

  if (list.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Row gutter={[24, 24]}>
      {list.map((item: any) => {
        const isActive = item.status === MySubscriptionStatusEnum.Active;
        return (
          <Col key={item.id} xs={24} sm={12} md={8} lg={8} xl={8} xxl={6}>
            <div className={cx(styles['agent-card'])}>
              <div className={cx(styles['card-header'])}>
                <div
                  className={cx(styles['agent-icon'])}
                  style={{
                    backgroundColor: item.icon ? 'transparent' : '#1890ff',
                  }}
                >
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt={item.bizName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <AppstoreOutlined />
                  )}
                </div>
                <div className={cx(styles['agent-info'])}>
                  <div className={cx(styles['agent-name'])}>{item.bizName}</div>
                  <div className={cx(styles['agent-provider'])}>
                    {item?.planName || '-'}
                  </div>
                </div>
              </div>

              <div className={cx(styles['card-body'])}>
                <div className={cx(styles['info-item'])}>
                  <div className={cx(styles['info-label'])}>
                    {dict('PC.Pages.MorePage.MySubscriptions.subAmount')}
                  </div>
                  <div className={cx(styles['info-value'])}>
                    <span className={cx(styles['price'])}>
                      ¥{item.plan?.price}
                    </span>
                    {item.plan?.period !== MyPlanPeriodEnum.Forever && (
                      <span className={cx(styles['unit'])}>
                        {getPeriodUnitText(normalizePeriod(item.plan?.period))}
                      </span>
                    )}
                  </div>
                </div>
                <div className={cx(styles['info-item'])}>
                  <div className={cx(styles['info-label'])}>
                    {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}
                  </div>
                  <div className={cx(styles['info-value'])}>
                    {item.endTime
                      ? dayjs(item.endTime).format('YYYY-MM-DD')
                      : '-'}
                  </div>
                </div>
              </div>

              <div className={cx(styles['card-footer'])}>
                <div
                  className={cx(styles['status-box'], {
                    [styles['status-active']]: isActive,
                    [styles['status-expired']]: !isActive,
                  })}
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
                  loading={processingId === item.planId}
                  onClick={() => handlePay(item.planId)}
                >
                  {dict('PC.Pages.MorePage.MySubscriptions.renewNow')}
                </Button>
              </div>
            </div>
          </Col>
        );
      })}
    </Row>
  );
};

export default SubscribedAgents;
