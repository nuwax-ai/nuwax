import { dict } from '@/services/i18nRuntime';
import {
  CreditPackageInfo,
  MyPlanPeriodEnum,
} from '@/types/interfaces/subscription';
import { Button } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styles from './index.less';

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  creditAmount: number;
  period: string;
}

interface SubscriptionPlanCardsProps {
  data?: CreditPackageInfo[];
  currentPlanId?: number;
  endTime?: string;
  onRenew?: (plan: PlanInfo) => void;
  onUpgrade?: (plan: PlanInfo) => void;
}

const SubscriptionPlanCards: React.FC<SubscriptionPlanCardsProps> = ({
  data = [],
  currentPlanId,
  endTime,
  onRenew,
  onUpgrade,
}) => {
  const plans = useMemo<PlanInfo[]>(() => {
    return data.map((item) => ({
      id: item.id.toString(),
      name: item.packageName,
      price: item.price,
      creditAmount: item.creditAmount,
      period: item.period,
    }));
  }, [data]);

  const getPeriodLabel = (period: any) => {
    // 处理数值映射到枚举字符串
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

  return (
    <div className={styles['subscription-plans-container']}>
      <div className={styles['plans-title']}>
        {dict('PC.Pages.MorePage.MySubscriptions.planGrid')}
      </div>
      <div className={styles['plans-grid']}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId?.toString();
          const themeClass = styles['theme-blue'];

          return (
            <div
              key={plan.id}
              className={classNames(styles['plan-card'], themeClass, {
                [styles['is-current']]: isCurrent,
              })}
            >
              {isCurrent && (
                <div className={styles['current-badge']}>
                  {dict('PC.Pages.MorePage.MySubscriptions.statusActive')}
                </div>
              )}

              <div className={styles['plan-header']}>
                <div className={styles['plan-name']}>{plan.name}</div>
                <div className={styles['plan-price-area']}>
                  <span className={styles['price-value']}>
                    <span className={styles['currency']}>¥</span>
                    {plan.price}
                    <span className={styles['period']}>
                      {getPeriodLabel(plan.period)}
                    </span>
                  </span>
                </div>
                <div className={styles['plan-hint-tag']}>
                  {plan.creditAmount}{' '}
                  {dict('PC.Pages.SystemSubscriptionBasicConfig.creditsUnit')}
                  {getPeriodLabel(plan.period)}
                </div>
              </div>

              <div className={styles['plan-footer']}>
                {isCurrent && endTime ? (
                  <div className={styles['renewal-info']}>
                    {dict(
                      'PC.Pages.MorePage.MySubscriptions.nextRenewal',
                      dayjs(endTime).format('YYYY-MM-DD'),
                    )}
                  </div>
                ) : (
                  <div className={styles['footer-placeholder']} />
                )}
                <Button
                  type="primary"
                  className={styles['action-button']}
                  onClick={() =>
                    isCurrent ? onRenew?.(plan) : onUpgrade?.(plan)
                  }
                >
                  {isCurrent
                    ? dict('PC.Pages.MorePage.MySubscriptions.renewNow')
                    : dict('PC.Pages.MorePage.MySubscriptions.upgradeNow')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlanCards;
