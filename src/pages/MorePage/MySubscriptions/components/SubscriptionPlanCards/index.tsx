import { dict } from '@/services/i18nRuntime';
import {
  MyPlanPeriodEnum,
  SystemSubscriptionPlan,
  SystemSubscriptionPlanGroup,
} from '@/types/interfaces/subscription';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Col, Row } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
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
}

interface SubscriptionPlanCardsProps {
  data?: SystemSubscriptionPlan[];
  currentPlanId?: number;
  endTime?: string;
  price?: number;
}

const cx = classNames.bind(styles);

const SubscriptionPlanCards: React.FC<SubscriptionPlanCardsProps> = ({
  data = [],
  currentPlanId,
  endTime,
  price,
}) => {
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
      creditAmount: item.creditAmount,
      period: item.period,
      isHot: !!item.isHot,
      itemGroups: item.itemGroups || [],
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

  const renderPlanContent = (plan: PlanInfo) => {
    const allItems =
      plan.itemGroups
        .filter((item) => {
          return item.groupType === 'BASE';
        })
        ?.flatMap((g) => g.items || []) || [];

    return (
      <div className={cx(styles['plan-content'])}>
        <div className={cx(styles['benefit-group'])}>
          {allItems.map((benefit, bIdx) => (
            <div key={bIdx} className={cx(styles['benefit-item'])}>
              {benefit.selected ? (
                <CheckOutlined className={cx(styles['check-icon'])} />
              ) : (
                <CloseOutlined className={cx(styles['close-icon'])} />
              )}
              <span className={cx(styles['benefit-text'])}>
                {benefit.description}
              </span>
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
      <Row gutter={[24, 24]}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId?.toString();
          const themeClass = styles['theme-blue'];

          return (
            <Col key={plan.id} xs={24} sm={12} md={8} lg={8} xl={8} xxl={6}>
              <div
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
                  <div className={cx(styles['plan-name'])}>{plan.name}</div>
                  {plan.description && (
                    <div className={cx(styles['plan-description'])}>
                      {plan.description}
                    </div>
                  )}
                  <div className={cx(styles['plan-price-area'])}>
                    <span className={cx(styles['price-value'])}>
                      <span className={cx(styles['currency'])}>¥</span>
                      {plan.price}
                      <span className={cx(styles['period'])}>
                        {getPeriodLabel(plan.period)}
                      </span>
                    </span>
                  </div>
                  <div className={cx(styles['plan-hint-tag'])}>
                    {plan.creditAmount}{' '}
                    {dict('PC.Pages.SystemSubscriptionBasicConfig.creditsUnit')}
                    {dict('PC.Pages.MorePage.MySubscriptions.perMonth')}
                  </div>
                </div>

                {renderPlanContent(plan)}

                <div className={cx(styles['plan-footer'])}>
                  {isCurrent && endTime ? (
                    <div className={cx(styles['renewal-info'])}>
                      {dict(
                        'PC.Pages.MorePage.MySubscriptions.nextRenewal',
                        dayjs(endTime).format('YYYY-MM-DD'),
                      )}
                    </div>
                  ) : (
                    <div className={cx(styles['footer-placeholder'])} />
                  )}
                  <Button
                    type="primary"
                    className="btn-premium-dark"
                    loading={processingId?.toString() === plan.id}
                    onClick={() => handlePay(plan)}
                    disabled={plan.price <= 0}
                  >
                    {isCurrent
                      ? dict('PC.Pages.MorePage.MySubscriptions.renewNow')
                      : plan.price <= (price || 0)
                      ? dict('PC.Pages.MorePage.MySubscriptions.subscribeNow')
                      : dict('PC.Pages.MorePage.MySubscriptions.upgradeNow')}
                  </Button>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default SubscriptionPlanCards;
