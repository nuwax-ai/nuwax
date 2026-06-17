import { dict } from '@/services/i18nRuntime';
import { formatPrice } from '@/utils/format';
import { Button, Card, Tag } from 'antd';
import React from 'react';
import styles from './index.less';

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  // 简单模式字段
  features?: string[];
  // 丰富模式字段
  desc?: string;
  cycle?: string;
  calls?: string;
  callsNum?: number;
  trialCalls?: number;
  recommend?: boolean;
  headerBarStyle?: React.CSSProperties;
  expireDate?: string;
}

interface SubscriptionPlanCardsProps {
  plans: PlanInfo[];
  currentPlanId?: string;
  onRenew?: (plan: PlanInfo) => void;
  onUpgrade?: (plan: PlanInfo) => void;
  onDowngrade?: (plan: PlanInfo) => void;
  onSubscribe?: (plan: PlanInfo) => void;
  onPlanClick?: (plan: PlanInfo) => void;
  title?: string;
  mode?: 'simple' | 'rich';
  loading?: boolean;
  sectionHeader?: {
    title: string;
    hint?: string;
  };
  getCycleLabel?: (cycle: string) => string;
}

const getDefaultCycleLabel = (cycle: string) => {
  const cycleLabelMap: Record<string, string> = {
    monthly: dict('PC.Pages.SpaceSubscriptionSettings.fieldCycleMonthly'),
    quarterly: dict('PC.Pages.SpaceSubscriptionSettings.fieldCycleQuarterly'),
    yearly: dict('PC.Pages.SpaceSubscriptionSettings.fieldCycleYearly'),
    月: dict('PC.Pages.SpaceSubscriptionSettings.fieldCycleMonthly'),
  };
  return cycleLabelMap[cycle] || cycle;
};

const SubscriptionPlanCards: React.FC<SubscriptionPlanCardsProps> = ({
  plans,
  currentPlanId,
  onRenew,
  onUpgrade,
  onDowngrade,
  onSubscribe,
  onPlanClick,
  title,
  mode = 'simple',
  loading = false,
  sectionHeader,
  getCycleLabel = getDefaultCycleLabel,
}) => {
  const currentIndex = plans.findIndex((p) => p.id === currentPlanId);
  const currentPlan = plans.find((p) => p.id === currentPlanId);

  const isHigherPlan = (index: number) =>
    currentPlanId !== undefined && index > currentIndex;

  const getRichButton = (plan: PlanInfo) => {
    const isCurrent = plan.id === currentPlanId;
    if (isCurrent) {
      return (
        <Button
          type="primary"
          ghost
          size="small"
          className={styles.planBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRenew?.(plan);
          }}
        >
          {dict('PC.Pages.MorePage.MySubscriptions.renew')}
        </Button>
      );
    }
    if (plan.price === 0) return null;
    if (currentPlan) {
      if (plan.price > currentPlan.price) {
        return (
          <Button
            type="primary"
            size="small"
            className={styles.planBtn}
            onClick={(e) => {
              e.stopPropagation();
              onUpgrade?.(plan);
            }}
          >
            {dict('PC.Pages.MorePage.MySubscriptions.upgrade')}
          </Button>
        );
      }
      if (plan.price < currentPlan.price && plan.price > 0) {
        return (
          <Button
            size="small"
            className={`${styles.planBtn} ${styles.downgradeBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              onDowngrade?.(plan);
            }}
          >
            {dict('PC.Pages.SpaceAgentSubscriptions.downgrade')}
          </Button>
        );
      }
    }
    return (
      <Button
        type="primary"
        size="small"
        className={styles.planBtn}
        onClick={(e) => {
          e.stopPropagation();
          onSubscribe?.(plan);
        }}
      >
        {dict('PC.Pages.SpaceAgentSubscriptions.subscribe')}
      </Button>
    );
  };

  // 丰富模式
  if (mode === 'rich') {
    return (
      <div>
        {sectionHeader && (
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionBar} />
              {sectionHeader.title}
            </h2>
            {sectionHeader.hint && (
              <span className={styles.sectionHint}>{sectionHeader.hint}</span>
            )}
          </div>
        )}
        <div className={styles.cardGrid}>
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <Card
                key={plan.id}
                hoverable
                loading={loading}
                className={`${styles.richCard} ${
                  isCurrent ? styles.richCardSubscribed : ''
                }`}
                styles={{ body: { padding: 0 } }}
                onClick={() => onPlanClick?.(plan)}
              >
                <div
                  className={styles.cardHeaderBar}
                  style={plan.headerBarStyle}
                />
                {isCurrent && (
                  <Tag color="blue" className={styles.tagCurrent}>
                    {dict('PC.Pages.SpaceAgentSubscriptions.currentSub')}
                  </Tag>
                )}
                {!isCurrent && plan.recommend && (
                  <Tag color="warning" className={styles.tagRecommend}>
                    {dict('PC.Pages.SpaceAgentSubscriptions.recommend')}
                  </Tag>
                )}
                <div className={styles.cardBody}>
                  <div className={styles.richPlanName}>
                    {plan.name}
                    {plan.cycle &&
                      plan.cycle !== 'monthly' &&
                      plan.cycle !== '月' && (
                        <Tag color="orange" className={styles.cycleTag}>
                          {getCycleLabel(plan.cycle)}
                        </Tag>
                      )}
                  </div>
                  {plan.desc && (
                    <div className={styles.planDesc}>{plan.desc}</div>
                  )}
                  <div className={styles.priceBox}>
                    <div className={styles.priceValue}>
                      <span className={styles.priceSymbol}>¥</span>
                      {formatPrice(plan.price)}
                      {plan.cycle && (
                        <span className={styles.priceCycle}>
                          /{getCycleLabel(plan.cycle)}
                        </span>
                      )}
                    </div>
                  </div>
                  {(plan.calls || plan.callsNum !== undefined) && (
                    <div className={styles.planMeta}>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {plan.callsNum === -1 ? (
                        <span className={styles.callsUnlimited}>
                          {dict('PC.Pages.SpaceAgentSubscriptions.unlimited')}
                        </span>
                      ) : (
                        plan.calls
                      )}
                      {plan.trialCalls !== undefined && plan.trialCalls > 0 && (
                        <span className={styles.trialBadge}>
                          {dict('PC.Pages.SpaceAgentSubscriptions.trial')}{' '}
                          {plan.trialCalls}
                          {dict('PC.Pages.SpaceAgentSubscriptions.callsPerDay')}
                        </span>
                      )}
                    </div>
                  )}
                  {isCurrent && plan.expireDate && (
                    <div className={styles.expireRow}>
                      <span>
                        {dict('PC.Pages.SpaceAgentSubscriptions.expireAt')}
                      </span>
                      <span className={styles.expireDate}>
                        {plan.expireDate}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.cardFooter}>{getRichButton(plan)}</div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // 简单模式
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
                {(plan.features || []).map((f, i) => (
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
