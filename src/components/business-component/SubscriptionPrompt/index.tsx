import { dict } from '@/services/i18nRuntime';
import type { PricingPlanInfo } from '@/types/interfaces/subscription';
import { PricingCycleEnum } from '@/types/interfaces/subscription';
import { LockOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const FALLBACK_PLANS: PricingPlanInfo[] = [
  {
    id: 1,
    spaceId: 1,
    name: 'Basic Plan',
    description: '',
    price: 99,
    cycle: PricingCycleEnum.Monthly,
    enabled: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    spaceId: 1,
    name: 'Pro Plan',
    description: '',
    price: 269,
    cycle: PricingCycleEnum.Quarterly,
    enabled: true,
    createdAt: '',
    updatedAt: '',
  },
];

interface Props {
  plans: PricingPlanInfo[];
  onViewPlans: () => void;
}

const SubscriptionPrompt: React.FC<Props> = ({ plans, onViewPlans }) => {
  const displayPlans = (plans.length > 0 ? plans : FALLBACK_PLANS).slice(0, 2);

  const cycleLabel = useMemo(
    () => ({
      [PricingCycleEnum.Monthly]: dict(
        'PC.Pages.SpaceResourcePricing.cycleMonthly',
      ),
      [PricingCycleEnum.Quarterly]: dict(
        'PC.Pages.SpaceResourcePricing.cycleQuarterly',
      ),
      [PricingCycleEnum.Yearly]: dict(
        'PC.Pages.SpaceResourcePricing.cycleYearly',
      ),
    }),
    [],
  );

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.header)}>
        <LockOutlined className={cx(styles['lock-icon'])} />
        <span>{dict('PC.Components.SubscriptionPrompt.title')}</span>
      </div>
      {displayPlans.length > 0 && (
        <div className={cx(styles.plans)}>
          {displayPlans.map((plan) => (
            <div
              key={plan.id}
              className={cx(styles['plan-chip'])}
              onClick={onViewPlans}
            >
              <span className={cx(styles['plan-name'])}>{plan.name}</span>
              <span className={cx(styles['plan-price'])}>
                {dict('PC.Common.Global.currencySymbol')}
                {plan.price}/{cycleLabel[plan.cycle]}
              </span>
            </div>
          ))}
        </div>
      )}
      <Button type="link" size="small" onClick={onViewPlans}>
        {dict('PC.Components.SubscriptionPrompt.viewAll')}
      </Button>
    </div>
  );
};

export default SubscriptionPrompt;
