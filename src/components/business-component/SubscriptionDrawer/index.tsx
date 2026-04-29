import { dict } from '@/services/i18nRuntime';
import {
  apiCheckSubscription,
  apiSubscribePlan,
} from '@/services/subscriptionService';
import type {
  CheckSubscriptionResult,
  PricingPlanInfo,
} from '@/types/interfaces/subscription';
import { PricingCycleEnum } from '@/types/interfaces/subscription';
import { CheckCircleFilled, CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Spin, Tag, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const MOCK_CHECK_RESULT: CheckSubscriptionResult = {
  hasSubscription: false,
  trialRemaining: 3,
  plans: [
    {
      id: 1,
      spaceId: 1,
      name: 'Basic Plan',
      description: '基础订阅计划，包含核心功能',
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
      description: '专业计划，包含高级功能和更高限额',
      price: 269,
      cycle: PricingCycleEnum.Quarterly,
      enabled: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 3,
      spaceId: 1,
      name: 'Enterprise Plan',
      description: '企业级计划，无限访问量和专属支持',
      price: 999,
      cycle: PricingCycleEnum.Yearly,
      enabled: true,
      createdAt: '',
      updatedAt: '',
    },
  ],
};

interface Props {
  agentId: number;
  open: boolean;
  onClose: () => void;
  onSubscribeSuccess?: () => void;
}

const SubscriptionDrawer: React.FC<Props> = ({
  agentId,
  open,
  onClose,
  onSubscribeSuccess,
}) => {
  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [checkResult, setCheckResult] =
    useState<CheckSubscriptionResult | null>(MOCK_CHECK_RESULT);

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

  const { loading, run: checkSubscription } = useRequest(
    () => apiCheckSubscription(agentId),
    {
      manual: true,
      onSuccess: (res) => setCheckResult(res?.data ?? MOCK_CHECK_RESULT),
    },
  );

  useEffect(() => {
    if (open) checkSubscription();
  }, [open, agentId]);

  const handleSubscribe = async (plan: PricingPlanInfo) => {
    setSubscribingId(plan.id);
    try {
      await apiSubscribePlan({ agentId, planId: plan.id });
      message.success(
        dict('PC.Components.SubscriptionDrawer.subscribeSuccess'),
      );
      checkSubscription();
      onSubscribeSuccess?.();
    } catch {
      message.error(dict('PC.Components.SubscriptionDrawer.subscribeFailed'));
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <Drawer
      title={dict('PC.Components.SubscriptionDrawer.title')}
      open={open}
      onClose={onClose}
      width={400}
      destroyOnHidden
      closeIcon={<CloseOutlined />}
    >
      {loading ? (
        <div
          className={cx(
            'flex',
            'items-center',
            'content-center',
            styles['loading-box'],
          )}
        >
          <Spin />
        </div>
      ) : (
        <div className={cx(styles.content)}>
          {checkResult?.hasSubscription && (
            <div className={cx(styles['status-box'])}>
              <CheckCircleFilled className={cx(styles['check-icon'])} />
              <span>
                {dict('PC.Components.SubscriptionDrawer.activeSubscription')}
              </span>
            </div>
          )}

          {(checkResult?.trialRemaining ?? 0) > 0 && (
            <div className={cx(styles['trial-box'])}>
              {dict(
                'PC.Components.SubscriptionDrawer.trialRemaining',
                String(checkResult?.trialRemaining ?? 0),
              )}
            </div>
          )}

          {checkResult?.plans && checkResult.plans.length > 0 && (
            <div className={cx(styles['plans-section'])}>
              <h4 className={cx(styles['plans-title'])}>
                {dict('PC.Components.SubscriptionDrawer.availablePlans')}
              </h4>
              <div className={cx(styles['plans-list'])}>
                {checkResult.plans.map((plan) => (
                  <div key={plan.id} className={cx(styles['plan-card'])}>
                    <div className={cx(styles['plan-header'])}>
                      <span className={cx(styles['plan-name'])}>
                        {plan.name}
                      </span>
                      <Tag color="blue">{cycleLabel[plan.cycle]}</Tag>
                    </div>
                    {plan.description && (
                      <p className={cx(styles['plan-desc'])}>
                        {plan.description}
                      </p>
                    )}
                    <div className={cx(styles['plan-footer'])}>
                      <span className={cx(styles['plan-price'])}>
                        <strong>
                          {dict('PC.Common.Global.currencySymbol')}
                          {plan.price}
                        </strong>
                        <span>/{cycleLabel[plan.cycle]}</span>
                      </span>
                      <Button
                        type="primary"
                        size="small"
                        loading={subscribingId === plan.id}
                        disabled={checkResult.hasSubscription}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {checkResult.hasSubscription
                          ? dict('PC.Components.SubscriptionDrawer.subscribed')
                          : dict('PC.Components.SubscriptionDrawer.subscribe')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default SubscriptionDrawer;
