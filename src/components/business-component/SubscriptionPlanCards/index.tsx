import { dict } from '@/services/i18nRuntime';
import { Button } from 'antd';
import React from 'react';
import styles from './index.less';

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface SubscriptionPlanCardsProps {
  plans: PlanInfo[];
  currentPlanId?: string;
  onRenew?: (plan: PlanInfo) => void;
  onUpgrade?: (plan: PlanInfo) => void;
  title?: string;
}

const SubscriptionPlanCards: React.FC<SubscriptionPlanCardsProps> = ({
  plans,
  currentPlanId,
  onRenew,
  onUpgrade,
  title,
}) => {
  // 判断是否有比 currentPlanId 更高级的套餐（用于显示"升级"按钮）
  const currentIndex = plans.findIndex((p) => p.id === currentPlanId);
  const isHigherPlan = (index: number) =>
    currentPlanId !== undefined && index > currentIndex;

  return (
    <div className={styles.planGrid}>
      <div className={styles.planGridTitle}>
        {title || dict('PC.Pages.MorePage.MySubscriptions.planGrid')}
      </div>
      <div className={styles.planGridRow}>
        {plans.map((plan, index) => {
          const isCurrent = plan.id === currentPlanId;
          const showUpgrade = isHigherPlan(index);
          return (
            <div
              key={plan.id}
              className={`${styles.planCard} ${
                isCurrent ? styles.planCardCurrent : ''
              }`}
            >
              {isCurrent && (
                <div className={styles.currentBadge}>
                  {dict('PC.Pages.MorePage.MySubscriptions.currentLabel')}
                </div>
              )}
              <div className={styles.planCardName}>{plan.name}</div>
              <div className={styles.planCardPrice}>¥{plan.price}</div>
              <div className={styles.planCardCycle}>
                {dict('PC.Pages.MorePage.MySubscriptions.perMonth')}
              </div>
              <ul className={styles.planCardFeatures}>
                {plan.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              {showUpgrade ? (
                <Button type="primary" block onClick={() => onUpgrade?.(plan)}>
                  {dict('PC.Pages.MorePage.MySubscriptions.upgrade')}
                </Button>
              ) : (
                <Button block onClick={() => onRenew?.(plan)}>
                  {dict('PC.Pages.MorePage.MySubscriptions.renew')}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlanCards;
