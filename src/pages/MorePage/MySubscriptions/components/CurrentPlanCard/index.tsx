import { dict } from '@/services/i18nRuntime';
import {
  MyPlanPeriodEnum,
  MySubscriptionItem,
  MySubscriptionStatusEnum,
} from '@/types/interfaces/subscription';
import { CheckOutlined } from '@ant-design/icons';
import { Statistic } from 'antd';
import React from 'react';
import styles from './index.less';

/**
 * 获取周期续费文案
 */
const getPeriodRenewText = (period: MyPlanPeriodEnum) => {
  switch (period) {
    case MyPlanPeriodEnum.Month:
      return dict('PC.Common.Subscription.Period.renewMonth');
    case MyPlanPeriodEnum.Quarter:
      return dict('PC.Common.Subscription.Period.renewQuarter');
    case MyPlanPeriodEnum.Year:
      return dict('PC.Common.Subscription.Period.renewYear');
    default:
      return '';
  }
};

/**
 * 获取订阅状态文案
 */
const getStatusText = (status: MySubscriptionStatusEnum) => {
  switch (status) {
    case MySubscriptionStatusEnum.Active:
      return dict('PC.Common.Subscription.Status.active');
    case MySubscriptionStatusEnum.Expired:
      return dict('PC.Common.Subscription.Status.expired');
    case MySubscriptionStatusEnum.Cancelled:
      return dict('PC.Common.Subscription.Status.cancelled');
    default:
      return status;
  }
};

/**
 * 获取费用标签
 */
const getFeeLabel = (period: MyPlanPeriodEnum) => {
  switch (period) {
    case MyPlanPeriodEnum.Month:
      return dict('PC.Pages.MorePage.MySubscriptions.feeMonth');
    case MyPlanPeriodEnum.Quarter:
      return dict('PC.Pages.MorePage.MySubscriptions.feeQuarter');
    case MyPlanPeriodEnum.Year:
      return dict('PC.Pages.MorePage.MySubscriptions.feeYear');
    default:
      return '';
  }
};

/**
 * 获取积分标签
 */
const getCreditsLabel = (period: MyPlanPeriodEnum) => {
  switch (period) {
    case MyPlanPeriodEnum.Month:
      return dict('PC.Pages.MorePage.MySubscriptions.creditsMonth');
    case MyPlanPeriodEnum.Quarter:
      return dict('PC.Pages.MorePage.MySubscriptions.creditsQuarter');
    case MyPlanPeriodEnum.Year:
      return dict('PC.Pages.MorePage.MySubscriptions.creditsYear');
    default:
      return '';
  }
};

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
    const dateStr = planInfo.endTime.split(' ')[0];
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
                  <Statistic value={planInfo.plan.creditAmount} />
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
