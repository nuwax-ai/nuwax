import { dict } from '@/services/i18nRuntime';
import {
  MyPlanPeriodEnum,
  MySubscriptionItem,
} from '@/types/interfaces/subscription';
import { CheckOutlined } from '@ant-design/icons';
import { Statistic } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import {
  getCreditsLabel,
  getFeeLabel,
  getPeriodRenewText,
  getStatusText,
} from '../../utils';
import styles from './index.less';

interface CurrentPlanCardProps {
  planInfo: MySubscriptionItem;
}

/**
 * 当前订阅计划卡片组件
 */
const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({ planInfo }) => {
  // 格式化到期时间展示
  const renderValidity = () => {
    if (!planInfo.endTime) {
      return (
        <div className={styles['plan-validity']}>
          {dict('PC.Pages.MorePage.MySubscriptions.validityForever')}
        </div>
      );
    }

    // 格式化日期 YYYY-MM-DD
    const dateStr = dayjs(planInfo.endTime).format('YYYY-MM-DD');
    const periodText = getPeriodRenewText(planInfo.plan.period);

    return (
      <div className={styles['plan-validity']}>
        {dict(
          'PC.Pages.MorePage.MySubscriptions.validityTemplate',
          dateStr,
          periodText,
        )}
      </div>
    );
  };

  return (
    <>
      {/* 背景装饰元素 */}
      <div className={styles['current-plan-card']}>
        <div className={styles['bg-decoration-1']} />
        <div className={styles['bg-decoration-2']} />
        <div className={styles['card-content']}>
          <div className={styles['plan-header']}>
            <div className={styles['header-left']}>
              <div className={styles['current-plan-label']}>
                {/* 当前订阅 */}
                {dict('PC.Pages.MorePage.MySubscriptions.currentPlan')}
              </div>
              {/* 计划名称 */}
              <div className={styles['plan-name']}>{planInfo.planName}</div>
              {/* 到期时间 */}
              {renderValidity()}
            </div>
            <div className={styles['plan-status']}>
              <CheckOutlined className={styles['status-icon']} />
              {getStatusText(planInfo.status)}
            </div>
          </div>

          {planInfo.plan.period !== MyPlanPeriodEnum.Forever && (
            <div className={styles['plan-meta']}>
              <div className={styles['plan-meta-item']}>
                <span className={styles['meta-label']}>
                  {getFeeLabel(planInfo.plan.period)}
                </span>
                <span className={styles['meta-value']}>
                  <Statistic
                    value={planInfo.plan.price}
                    valueStyle={{ color: '#fff' }}
                    prefix="¥"
                    precision={2}
                  />
                </span>
              </div>
              <div className={styles['plan-meta-item']}>
                <span className={styles['meta-label']}>
                  {getCreditsLabel(planInfo.plan.period)}
                </span>
                <span className={styles['meta-value']}>
                  <Statistic
                    value={planInfo.plan.creditAmount}
                    valueStyle={{ color: '#fff' }}
                  />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CurrentPlanCard;
