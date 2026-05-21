import { dict } from '@/services/i18nRuntime';
import {
  MyPlanPeriodEnum,
  SystemSubscriptionPlan,
  SystemSubscriptionPlanGroup,
} from '@/types/interfaces/subscription';
import { CheckOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useSubscriptionPurchase } from '../../hooks/useSubscriptionPurchase';
import styles from './index.less';

export interface PlanInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  creditAmount: number;
  period: string;
  isHot: boolean;
  itemGroups: SystemSubscriptionPlanGroup[];
  firstPrice?: number;
  extra?: any;
}

interface SubscriptionPlanCardsProps {
  data?: SystemSubscriptionPlan[];
  currentPlanId?: number;
  endTime?: string;
  price?: number;
}

const cx = classNames.bind(styles);

const StarIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    style={{
      marginRight: 6,
      flexShrink: 0,
      display: 'inline-block',
      verticalAlign: 'middle',
    }}
  >
    <path
      d="M8 0L10.2 5.8L16 8L10.2 10.2L8 16L5.8 10.2L0 8L5.8 5.8L8 0Z"
      fill={color}
    />
  </svg>
);

const SubscriptionPlanCards: React.FC<SubscriptionPlanCardsProps> = (props) => {
  const { data = [], currentPlanId, price } = props;
  const currentPrice = currentPlanId ? price ?? 0 : 0;

  const getActionVerb = (planPrice: number) => {
    if (!currentPlanId) {
      return dict('PC.Pages.MorePage.MySubscriptions.subscribeNow');
    }
    if (planPrice <= currentPrice) {
      return dict('PC.Pages.MorePage.MySubscriptions.subscribeNow');
    }
    return dict('PC.Pages.MorePage.MySubscriptions.upgradeNow');
  };
  const { processingId, handlePay: payPlan } = useSubscriptionPurchase();

  /**
   * 点击订阅/续费处理函数
   * @param plan 套餐信息
   */
  const handlePay = (plan: PlanInfo) => {
    payPlan(plan.id);
  };

  const plans = useMemo<PlanInfo[]>(() => {
    return data.map((item) => ({
      id: item.id.toString(),
      name: item.name,
      description: item.description || '',
      price: item.price,
      firstPrice: item.firstPrice,
      extra: item.extra,
      creditAmount: item.creditAmount,
      period: item.period,
      isHot: !!item.isHot,
      itemGroups: item.itemGroups || [],
    }));
  }, [data]);

  const getPeriodLabel = (period: any) => {
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
        'PC.Pages.MorePage.MySubscriptions.perQuarter',
      ),
      [MyPlanPeriodEnum.Year]: dict(
        'PC.Pages.MorePage.MySubscriptions.perYear',
      ),
      [MyPlanPeriodEnum.Forever]: dict(
        'PC.Pages.MorePage.MySubscriptions.perForever',
      ),
    };
    return periodMap[p] || '';
  };

  const getButtonText = (plan: PlanInfo, isCurrent: boolean) => {
    if (isCurrent) {
      const currentPlanBtnText = dict(
        'PC.Pages.MorePage.MySubscriptions.currentPlanButton',
      );
      const renewNowText = dict('PC.Pages.MorePage.MySubscriptions.renewNow');
      return `${currentPlanBtnText}(${renewNowText})`;
    }
    const verbText = getActionVerb(plan.price);
    let periodText = dict(
      'PC.Pages.MorePage.MySubscriptions.continuousMonthly',
    );

    const pStr = plan.period?.toString();
    if (pStr === '3' || pStr?.toUpperCase() === 'QUARTER') {
      periodText = dict(
        'PC.Pages.MorePage.MySubscriptions.continuousQuarterly',
      );
    } else if (pStr === '12' || pStr?.toUpperCase() === 'YEAR') {
      periodText = dict('PC.Pages.MorePage.MySubscriptions.continuousYearly');
    }

    return `${verbText}${plan.name}${periodText}`;
  };

  const renderBenefitText = (desc: string) => {
    // eslint-disable-next-line no-useless-escape
    const tagRegex = /[\[\(]([^\]\)]+)[\]\)]/;
    const match = desc.match(tagRegex);
    if (match) {
      const textPart = desc.replace(tagRegex, '').trim();
      const tagPart = match[1];

      let tagClass = styles['tag-beige'];

      return (
        <span className={cx(styles['benefit-text-wrapper'])}>
          <span className={cx(styles['benefit-text'])}>{textPart}</span>
          <span className={cx(styles['benefit-tag'], tagClass)}>{tagPart}</span>
        </span>
      );
    }
    return <span className={cx(styles['benefit-text'])}>{desc}</span>;
  };

  const renderPlanContent = (plan: PlanInfo) => {
    const allItems =
      plan.itemGroups
        .filter((item) => item.groupType === 'BASE')
        ?.flatMap((g) => g.items || [])
        ?.filter((benefit) => benefit.selected) || [];

    return (
      <div className={cx(styles['plan-content'])}>
        <div className={cx(styles['benefit-group'])}>
          {allItems.map((benefit, bIdx) => (
            <div key={bIdx} className={cx(styles['benefit-item'])}>
              <div className={cx(styles['check-circle'])}>
                <CheckOutlined className={cx(styles['check-icon'])} />
              </div>
              {renderBenefitText(benefit.description)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cx(styles['subscription-plans-container'])}>
      <div className={cx(styles['plans-title'])}>
        {dict('PC.Pages.MorePage.MySubscriptions.planGrid')}
      </div>
      <div className={cx(styles['plans-flex-wrapper'])}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId?.toString();

          let themeClass = styles['theme-regular'];

          const renewMonthText = dict(
            'PC.Common.Subscription.Period.renewMonth',
          );
          const creditUnitText = dict(
            'PC.Pages.SystemSubscriptionBasicConfig.creditsUnit',
          );
          const introText = `${renewMonthText} ${plan.creditAmount.toLocaleString()} ${creditUnitText}`;

          return (
            <div
              key={plan.id}
              className={cx(styles['plan-card'], themeClass, {
                [styles['is-current']]: isCurrent,
              })}
            >
              {isCurrent ? (
                <div className={cx(styles['current-badge'])}>
                  {dict('PC.Pages.MorePage.MySubscriptions.statusActive')}
                </div>
              ) : (
                plan.isHot && (
                  <div className={cx(styles['hot-badge'])}>
                    {dict('PC.Pages.MorePage.MySubscriptions.statusHot')}
                  </div>
                )
              )}

              <div className={cx(styles['plan-header'])}>
                <div className={cx(styles['plan-name-wrapper'])}>
                  <div
                    className={cx(styles['plan-name'], 'text-ellipsis')}
                    title={plan.name}
                  >
                    {plan.name}
                  </div>
                  {plan.description && (
                    <div
                      className={cx(styles['plan-desc'], 'text-ellipsis-2')}
                      title={plan.description}
                    >
                      {plan.description}
                    </div>
                  )}
                </div>

                <div className={cx(styles['plan-price-area'])}>
                  <span className={cx(styles['price-value'])}>
                    <span className={cx(styles['currency'])}>¥</span>
                    {plan.price}
                    <span className={cx(styles['period'])}>
                      {getPeriodLabel(plan.period)}
                    </span>
                  </span>
                </div>

                <Button
                  type="primary"
                  className={cx(styles['plan-button'], {
                    [styles['plan-button-current']]: isCurrent,
                  })}
                  loading={processingId?.toString() === plan.id}
                  onClick={() => handlePay(plan)}
                  disabled={plan.price <= 0 && !isCurrent}
                >
                  {getButtonText(plan, isCurrent)}
                </Button>
              </div>

              <div className={cx(styles['plan-benefit-intro'])}>
                <StarIcon />
                <span className={cx(styles['intro-text'])}>{introText}</span>
              </div>

              <div className={cx(styles['plan-divider'])} />

              {renderPlanContent(plan)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlanCards;
