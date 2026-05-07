import { dict } from '@/services/i18nRuntime';
import { apiGetMySubscription } from '@/services/subscriptionService';
import { BizTypeEnum, MyPlanPeriodEnum } from '@/types/interfaces/subscription';
import { PlayCircleOutlined } from '@ant-design/icons';
import { Empty, Skeleton, Tag } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const SubscribedSkills: React.FC = () => {
  const { data: subData, loading } = useRequest(() =>
    apiGetMySubscription({ bizType: BizTypeEnum.Skill }),
  );

  const list = subData?.subscriptions || [];

  if (loading) {
    return (
      <div className={styles['skills-grid']}>
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
                  {dict('PC.Pages.MorePage.MySubscriptions.permanentUse') ||
                    '已买断 · 永久使用'}
                </Tag>
              )}
            </div>

            <div className={styles['card-body']}>
              {buyout ? (
                <div className={styles['buyout-info']}>
                  <div className={styles['buyout-price']}>
                    <span className={styles['label']}>买断价</span>
                    <span className={styles['value']}>¥{item.plan?.price}</span>
                  </div>
                  <Tag className={styles['status-tag-inner']} color="cyan">
                    已买断
                  </Tag>
                </div>
              ) : (
                <div className={styles['sub-info-grid']}>
                  <div className={styles['info-item']}>
                    <div className={styles['label']}>订阅金额</div>
                    <div className={styles['value']}>
                      <span className={styles['price']}>
                        ¥{item.plan?.price}
                      </span>
                      /月
                    </div>
                  </div>
                  <div className={styles['info-item']}>
                    <div className={styles['label']}>到期时间</div>
                    <div className={styles['value']}>
                      {item.endTime
                        ? dayjs(item.endTime).format('YYYY-MM-DD')
                        : '-'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubscribedSkills;
