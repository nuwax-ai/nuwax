import { dict } from '@/services/i18nRuntime';
import { apiGetMySubscription } from '@/services/subscriptionService';
import {
  BizTypeEnum,
  MyPlanPeriodEnum,
  MySubscriptionStatusEnum,
} from '@/types/interfaces/subscription';
import { PlayCircleOutlined } from '@ant-design/icons';
import { Empty, Spin, Statistic, Tag } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useRequest } from 'umi';
import { getPeriodPayTypeText, getPeriodUnitText } from '../../../../utils';
import styles from './index.less';

const SubscribedSkills: React.FC = () => {
  const { data: subData, loading } = useRequest(() =>
    apiGetMySubscription({ bizType: BizTypeEnum.Skill }),
  );

  const list = subData?.subscriptions || [];

  if (loading) {
    return (
      <div className={styles['loading-wrapper']}>
        <Spin />
      </div>
    );
  }

  if (list.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles['skills-grid']}>
      {list.map((item: any) => {
        const buyout = item.plan?.period === MyPlanPeriodEnum.Forever;
        const themeColor = '#1890ff';

        return (
          <div
            key={item.id}
            className={styles['skill-card']}
            style={{ borderTop: `3px solid ${themeColor}` }}
          >
            <div className={styles['card-header']}>
              <div className={styles['header-top']}>
                <div
                  className={styles['skill-icon']}
                  style={{ backgroundColor: themeColor }}
                >
                  <PlayCircleOutlined />
                </div>
                <div className={styles['skill-info']}>
                  <div className={styles['skill-name']}>{item.planName}</div>
                  <div className={styles['skill-provider']}>
                    {item.plan?.description || '-'}
                  </div>
                </div>
              </div>

              {buyout && (
                <Tag color="cyan" className={styles['buyout-tag']}>
                  {dict('PC.Pages.MorePage.MySubscriptions.permanentUse')}
                </Tag>
              )}
            </div>

            <div className={styles['card-body']}>
              {buyout ? (
                <div className={styles['buyout-info']}>
                  <div className={styles['buyout-price']}>
                    <span className={styles['label']}>
                      {dict(
                        'PC.Pages.MorePage.MySubscriptions.buyoutPriceLabel',
                      )}
                    </span>
                    <Statistic
                      value={item.plan?.price}
                      valueStyle={{ fontSize: '14px' }}
                      prefix="¥"
                      precision={2}
                    />
                  </div>
                  <Tag className={styles['status-tag-inner']} color="cyan">
                    {dict('PC.Pages.MorePage.MySubscriptions.boughtOut')}
                  </Tag>
                </div>
              ) : (
                <>
                  <div className={styles['sub-info-grid']}>
                    <div className={styles['info-item']}>
                      <div className={styles['label']}>
                        {dict('PC.Pages.MorePage.MySubscriptions.subAmount')}
                      </div>
                      <div className={styles['value']}>
                        <Statistic
                          className={styles['price-statistic']}
                          value={item.plan?.price}
                          prefix="¥"
                          suffix={getPeriodUnitText(item.plan?.period)}
                          precision={2}
                        />
                      </div>
                    </div>
                    <div className={styles['info-item']}>
                      <div className={styles['label']}>
                        {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}
                      </div>
                      <div className={styles['value']}>
                        {item.endTime
                          ? dayjs(item.endTime).format('YYYY-MM-DD')
                          : '-'}
                      </div>
                    </div>
                  </div>
                  <div className={styles['buyout-info']}>
                    <div className={styles['pay-type']}>
                      {getPeriodPayTypeText(item.plan?.period)}
                    </div>
                    <Tag
                      className={styles['status-tag-inner']}
                      color={
                        item.status === MySubscriptionStatusEnum.Active
                          ? 'success'
                          : 'error'
                      }
                    >
                      {item.status === MySubscriptionStatusEnum.Active
                        ? dict('PC.Pages.MorePage.MySubscriptions.subscribing')
                        : dict('PC.Pages.MorePage.MySubscriptions.expired')}
                    </Tag>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubscribedSkills;
