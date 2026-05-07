import { dict } from '@/services/i18nRuntime';
import { CheckOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  features: string[];
  isRecommended?: boolean;
}

interface SubscriptionPlanCardsProps {
  plans: PlanInfo[];
  currentPlanId?: string;
  onRenew?: (plan: PlanInfo) => void;
  onUpgrade?: (plan: PlanInfo) => void;
}

const SubscriptionPlanCards: React.FC<SubscriptionPlanCardsProps> = ({
  plans,
  currentPlanId,
  onRenew,
  onUpgrade,
}) => {
  return (
    <div className={styles['subscription-plans-container']}>
      <div className={styles['plans-title']}>
        {dict('PC.Pages.MorePage.MySubscriptions.planGrid')}
      </div>
      <div className={styles['plans-grid']}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
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
                      {dict('PC.Pages.MorePage.MySubscriptions.perMonth')}
                    </span>
                  </span>
                </div>
                <div className={styles['plan-hint-tag']}>
                  {plan.features[0]}
                </div>
              </div>

              <div className={styles['plan-features']}>
                {plan.features.slice(1).map((feature, index) => (
                  <div key={index} className={styles['feature-item']}>
                    <CheckOutlined className={styles['feature-icon']} />
                    <span className={styles['feature-text']}>{feature}</span>
                  </div>
                ))}
              </div>

              <div className={styles['plan-footer']}>
                {isCurrent ? (
                  <div className={styles['renewal-info']}>
                    <span className={styles['renewal-label']}>下次续费:</span>
                    <span className={styles['renewal-date']}>2025-12-31</span>
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
                    ? dict('PC.Pages.MorePage.MySubscriptions.renewNow') ||
                      '续订'
                    : dict('PC.Pages.MorePage.MySubscriptions.upgradeNow') ||
                      '升级'}
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
