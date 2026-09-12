/**
 * SkillListView — 独立技能列表组件（数据内聚 + 双布局变体）
 * @description 只做「技能列表」：按 type 四场景拉数（我启用的/系统广场/
 * 团队空间/搜索场景，接口参数矩阵见 useSkillList）、滚动分页、启用开关
 * 闭环、付费拦截门（选择前先复核，已付费才触发 onSelect）。
 * tab/搜索框/分类 pill 等宿主 UI 不在组件内；选择经 onSelect 回调由外部
 * 走业务，付费订阅套餐弹窗（Skill 口径）内聚。
 *
 * 用法：
 * ```tsx
 * <SkillListView
 *   type="team"
 *   keyword={kw}
 *   spaceIds={allSpaceIds}
 *   variant="list"
 *   onSelect={(item) => insertSkillChip(item)}
 * />
 * ```
 */
import PaymentSubscriptionModal from '@/components/business-component/PaymentSubscriptionModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useSubscription from '@/hooks/useSubscription';
import { t } from '@/services/i18nRuntime';
import { apiPublishedSkillDetail } from '@/services/skill';
import {
  apiPublishedSkillEnable,
  apiPublishedSkillUnEnable,
} from '@/services/square';
import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
import SkillGridCard from './SkillGridCard';
import SkillListRow from './SkillListRow';
import useSkillList from './hooks/useSkillList';
import styles from './index.less';
import type { SkillListItem, SkillListViewProps } from './types';

const cx = classNames.bind(styles);

const SkillListView: React.FC<SkillListViewProps> = ({
  type,
  variant = 'grid',
  keyword,
  category,
  spaceId,
  spaceIds,
  onSelect,
  onEnabledChange,
  pageSize = 20,
  className,
}) => {
  const {
    list,
    loading,
    hasMore,
    loadMore,
    reload,
    updateItem,
    waitingSpaces,
  } = useSkillList({ type, keyword, category, spaceId, spaceIds, pageSize });

  // ---- 启用开关（内聚闭环）----
  const [enablingKeys, setEnablingKeys] = useState<string[]>([]);
  /** 启用/取消启用：成功后就地回写开关；「我启用的」聚合视图需整体重拉
   * 同步条目增减（取消最后一项后由外部凭 onEnabledChange/自身数据决定回落），
   * 其余视图以就地补丁为准，避免整页重拉丢滚动位置 */
  const handleToggleEnable = useCallback(
    (item: SkillListItem) => {
      if (item.targetId === undefined) return;
      const enabling = !item.enabled;
      setEnablingKeys((prev) => [...prev, item.key]);
      const request = enabling
        ? apiPublishedSkillEnable(item.targetId)
        : apiPublishedSkillUnEnable(item.targetId);
      void request
        .then((res) => {
          if (res?.code === SUCCESS_CODE) {
            updateItem(item.key, { enabled: enabling });
            onEnabledChange?.({ ...item, enabled: enabling }, enabling);
            if (type === 'enabled') {
              reload();
            }
          }
        })
        .finally(() => {
          setEnablingKeys((prev) => prev.filter((key) => key !== item.key));
        });
    },
    [updateItem, onEnabledChange, reload, type],
  );

  // ---- 付费拦截门（选择前置，内聚；通过才触发 onSelect）----
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;
  const {
    targetSubscriptionPlans,
    loadingTargetPricing,
    mySubscriptionInfo,
    loadingMySubscription,
    createSubscriptionOrder,
    querySkillSubscriptionPlans,
  } = useSubscription();
  // 待订阅的付费技能（套餐弹窗打开期间持有；支付回流后重选即已订阅）
  const [paymentItem, setPaymentItem] = useState<SkillListItem | null>(null);

  /**
   * 选择前置门：免费/已订阅/租户未开启订阅直通；付费未订阅先按详情复核
   * （列表状态可能滞后，如已领免费套餐），复核已订阅回写后就地放行并随
   * 选中带出 subscribed；仍待订阅/复核异常则弹套餐弹窗，不触发回调。
   */
  const handleSelect = useCallback(
    (item: SkillListItem) => {
      const paidPending =
        !!item.paymentRequired &&
        !item.subscribed &&
        item.targetId !== undefined;
      if (!isEnableSubscription || !paidPending) {
        onSelect(item);
        return;
      }
      const targetId = item.targetId as number;
      const openPayment = () => {
        querySkillSubscriptionPlans(targetId);
        setPaymentItem(item);
      };
      void apiPublishedSkillDetail(targetId)
        .then((res) => {
          const detail = res?.code === SUCCESS_CODE ? res.data : undefined;
          if (!detail || (detail.paymentRequired && !detail.subscribed)) {
            openPayment();
            return;
          }
          updateItem(item.key, { subscribed: !!detail.subscribed });
          onSelect({ ...item, subscribed: !!detail.subscribed });
        })
        .catch(() => openPayment());
    },
    [isEnableSubscription, querySkillSubscriptionPlans, updateItem, onSelect],
  );

  // ---- 滚动分页与首屏补拉（滚动容器为组件根节点）----
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 48 &&
      !loading &&
      hasMore
    ) {
      loadMore();
    }
  };
  // 列表未填满容器且还有数据时自动补拉
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore || list.length === 0) {
      return;
    }
    if (el.scrollHeight <= el.clientHeight) {
      loadMore();
    }
  }, [list, loading, hasMore, loadMore]);

  const initialLoading = (loading || waitingSpaces) && list.length === 0;
  // grid 变体两栏网格；list 变体单列行
  const isGrid = variant === 'grid';
  const cardProps = {
    onSelect: handleSelect,
    onToggleEnable: handleToggleEnable,
    enableBusyKeys: enablingKeys,
  };

  return (
    <div
      ref={scrollRef}
      className={cx(
        styles.root,
        isGrid ? styles['root-grid'] : styles['root-list'],
        className,
      )}
      onScroll={handleScroll}
    >
      {initialLoading ? (
        <div className={cx(styles.state)}>
          <Spin size="large" />
        </div>
      ) : list.length === 0 ? (
        <div className={cx(styles.state)}>
          <Empty description={t('PC.Common.Global.emptyData')} />
        </div>
      ) : (
        <>
          {list.map((item, index) =>
            isGrid ? (
              <SkillGridCard
                key={item.key}
                item={item}
                index={index}
                {...cardProps}
              />
            ) : (
              <SkillListRow
                key={item.key}
                item={item}
                index={index}
                {...cardProps}
              />
            ),
          )}
          {loading && (
            <div className={cx(styles['state-loading'])}>
              <Spin size="small" />
            </div>
          )}
        </>
      )}

      {/* 付费订阅套餐弹窗（Skill 定价口径）：订阅完成支付回流后再选即放行 */}
      {isEnableSubscription && (
        <PaymentSubscriptionModal
          open={!!paymentItem}
          targetType="Skill"
          loading={loadingTargetPricing || loadingMySubscription}
          plans={targetSubscriptionPlans}
          currentSubscribedInfo={
            mySubscriptionInfo?.currentSubscription ?? null
          }
          onClose={() => setPaymentItem(null)}
          onSubscribe={createSubscriptionOrder}
        />
      )}
    </div>
  );
};

export default SkillListView;
export type {
  SkillListItem,
  SkillListSourceType,
  SkillListVariant,
  SkillListViewProps,
} from './types';
