import type SubscriptionPlanCards from '@/components/business-component/SystemSubscriptionPlanCards';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  BizTypeEnum,
  type SystemSubscriptionPlan,
} from '@/types/interfaces/subscription';
import { Button, Empty, Modal, Segmented, Spin, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

type PlanCardsComponent = typeof SubscriptionPlanCards;
type CreditPackageListComponent = React.ComponentType<{ active?: boolean }>;

interface SystemSubscriptionPlansModalProps {
  open: boolean;
  onClose: () => void;
}

interface LoadedPlans {
  plans: SystemSubscriptionPlan[];
  currentPlanId?: number;
  endTime?: string;
  price?: number;
  status?: React.ComponentProps<PlanCardsComponent>['status'];
  period?: React.ComponentProps<PlanCardsComponent>['period'];
}

/**
 * 升级套餐弹窗。打开时才拉取系统套餐和当前订阅，列表与「我的订阅」同一套卡片。
 */
const SystemSubscriptionPlansModal: React.FC<
  SystemSubscriptionPlansModalProps
> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<LoadedPlans | null>(null);
  const [PlanCards, setPlanCards] = useState<PlanCardsComponent | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [view, setView] = useState<'plans' | 'packages'>('plans');
  const [PackageList, setPackageList] =
    useState<CreditPackageListComponent | null>(null);

  useEffect(() => {
    if (!open) {
      setView('plans');
    }
  }, [open]);

  useEffect(() => {
    if (!open || view !== 'packages' || PackageList) {
      return;
    }
    let cancelled = false;
    import('@/components/business-component/PurchaseModal/CreditPackageList')
      .then((module) => {
        if (!cancelled) {
          setPackageList(() => module.default);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        console.error('[SystemSubscriptionPlansModal] 积分套餐加载失败', error);
        message.error(
          dict('PC.Components.CreditInsufficientNotice.loadFailed'),
        );
        setView('plans');
      });
    return () => {
      cancelled = true;
    };
  }, [open, view, PackageList]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    const load = async () => {
      const [serviceModule, cardsModule] = await Promise.all([
        import('@/services/subscriptionService'),
        import('@/components/business-component/SystemSubscriptionPlanCards'),
      ]);
      if (cancelled) {
        return;
      }
      setPlanCards(() => cardsModule.default);
      const plansResult = await serviceModule.apiListSystemSubscriptionPlans();
      if (cancelled) {
        return;
      }
      if (plansResult.code !== SUCCESS_CODE) {
        throw new Error(plansResult.message);
      }
      let current: LoadedPlans = { plans: plansResult.data ?? [] };
      try {
        const mineResult = await serviceModule.apiGetMySubscription({
          bizType: BizTypeEnum.System,
        });
        const currentSubscription =
          mineResult.code === SUCCESS_CODE
            ? mineResult.data?.currentSubscription
            : undefined;
        if (currentSubscription) {
          current = {
            ...current,
            currentPlanId: currentSubscription.planId,
            endTime: currentSubscription.endTime ?? undefined,
            price: currentSubscription.plan?.price,
            status: currentSubscription.status,
            period: currentSubscription.period ?? undefined,
          };
        }
      } catch (error) {
        console.error('[SystemSubscriptionPlansModal] 当前订阅查询失败', error);
      }
      if (!cancelled) {
        setLoaded(current);
      }
    };

    load()
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        console.error('[SystemSubscriptionPlansModal] 套餐查询失败', error);
        setLoaded(null);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, reloadKey]);

  return (
    <Modal
      open={open}
      title={
        <div className={cx(styles['modal-title-bar'])}>
          <Segmented
            value={view}
            onChange={(value) => setView(value as 'plans' | 'packages')}
            options={[
              {
                label: dict(
                  'PC.Components.CreditInsufficientNotice.modalTitle',
                ),
                value: 'plans',
              },
              {
                label: dict(
                  'PC.Pages.MorePage.MySubscriptions.purchaseCredits',
                ),
                value: 'packages',
              },
            ]}
          />
        </div>
      }
      footer={null}
      onCancel={onClose}
      destroyOnHidden
      width={
        view === 'packages'
          ? 'min(640px, calc(100vw - 32px))'
          : 'min(1080px, calc(100vw - 32px))'
      }
      wrapClassName={styles['plans-modal-wrap']}
    >
      {view === 'packages' ? (
        PackageList ? (
          <PackageList active={open} />
        ) : (
          <div className={styles['plans-placeholder']} />
        )
      ) : (
        <Spin spinning={loading}>
          {failed ? (
            <Empty
              description={dict(
                'PC.Components.CreditInsufficientNotice.loadFailed',
              )}
            >
              <Button onClick={() => setReloadKey((value) => value + 1)}>
                {dict('PC.Components.CreditInsufficientNotice.retry')}
              </Button>
            </Empty>
          ) : PlanCards && loaded ? (
            loaded.plans.length > 0 ? (
              <PlanCards
                embedded
                data={loaded.plans}
                currentPlanId={loaded.currentPlanId}
                endTime={loaded.endTime}
                price={loaded.price}
                status={loaded.status}
                period={loaded.period}
              />
            ) : (
              <Empty
                description={dict(
                  'PC.Components.PaymentSubscriptionModal.emptyNoPlans',
                )}
              />
            )
          ) : (
            <div className={styles['plans-placeholder']} />
          )}
        </Spin>
      )}
    </Modal>
  );
};

export default SystemSubscriptionPlansModal;
