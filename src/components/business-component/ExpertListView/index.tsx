/**
 * ExpertListView — 独立专家列表组件（数据内聚 + 双布局变体）
 * @description 只做「专家列表」：按 type 四场景拉数（最近召唤/系统广场/
 * 团队空间/搜索场景，接口参数矩阵见 useExpertList）、滚动分页、
 * 付费拦截门（选择前置）。tab/搜索框/分类 pill 等宿主 UI 不在组件内；
 * 选中经 onSelect 回调由外部走业务，付费统一专家卡弹窗
 * （ExpertSummonCard，含 Modal 壳）内聚。
 *
 * 用法：
 * ```tsx
 * <ExpertListView
 *   type="team"
 *   keyword={kw}
 *   spaceIds={allSpaceIds}
 *   onSelect={(item) => summonExpert(item)}
 * />
 * ```
 */
import ExpertSummonCard from '@/components/business-component/ExpertSummonCard';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { t } from '@/services/i18nRuntime';
import { Empty, Modal, Spin } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
import ExpertGridCard from './ExpertGridCard';
import ExpertListRow from './ExpertListRow';
import useExpertList from './hooks/useExpertList';
import styles from './index.less';
import type { ExpertListItem, ExpertListViewProps } from './types';

const cx = classNames.bind(styles);

const ExpertListView: React.FC<ExpertListViewProps> = ({
  type,
  variant = 'grid',
  keyword,
  category,
  spaceId,
  spaceIds,
  onSelect,
  pageSize = 20,
  className,
}) => {
  const { list, loading, hasMore, loadMore, updateItem, waitingSpaces } =
    useExpertList({ type, keyword, category, spaceId, spaceIds, pageSize });

  // ---- 付费拦截门（选择前置，内聚；通过才触发 onSelect）----
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;
  // 待订阅的付费专家（统一专家卡弹窗持有；卡内套餐/复核/下单自闭环）
  const [pendingItem, setPendingItem] = useState<ExpertListItem | null>(null);

  /**
   * 选择前置门：免费/已订阅/租户未开启订阅直通；付费未订阅先按详情复核
   * （/agent/:id，列表状态可能滞后），复核已订阅回写后就地放行并随选中
   * 带出 subscribed；仍待订阅/复核异常则弹统一专家卡，不触发回调——
   * 卡内「召唤专家」复核放行后经 handleSummon 触发 onSelect
   */
  const handleSelect = useCallback(
    (item: ExpertListItem) => {
      const paidPending =
        !!item.paymentRequired &&
        !item.subscribed &&
        item.targetId !== undefined;
      if (!isEnableSubscription || !paidPending) {
        onSelect(item);
        return;
      }
      void apiPublishedAgentInfo(item.targetId as number)
        .then((res) => {
          const detail = res?.code === SUCCESS_CODE ? res.data : undefined;
          if (!detail || (detail.paymentRequired && !detail.subscribed)) {
            setPendingItem(item);
            return;
          }
          updateItem(item.key, { subscribed: !!detail.subscribed });
          onSelect({ ...item, subscribed: !!detail.subscribed });
        })
        .catch(() => setPendingItem(item));
    },
    [isEnableSubscription, updateItem, onSelect],
  );

  /**
   * 统一专家卡内召唤放行：复核/订阅完成的已订阅随选中带出
   * （未带则保持列表口径），关闭卡弹窗
   */
  const handleSummon = useCallback(
    (_info: unknown, subscribed?: boolean) => {
      const item = pendingItem;
      if (!item) {
        return;
      }
      setPendingItem(null);
      onSelect(subscribed === true ? { ...item, subscribed: true } : item);
    },
    [pendingItem, onSelect],
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
  const isGrid = variant === 'grid';
  const cardProps = { onSelect: handleSelect };

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
              <ExpertGridCard
                key={item.key}
                item={item}
                index={index}
                {...cardProps}
              />
            ) : (
              <ExpertListRow
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

      {/* 付费:统一专家卡弹窗（内联套餐区,详情复核/订阅下单在卡内
          自闭环；召唤放行走 handleSummon）；宽度随内容自适应 */}
      {isEnableSubscription && (
        <Modal
          open={!!pendingItem}
          onCancel={() => setPendingItem(null)}
          footer={null}
          width="fit-content"
          centered
          destroyOnHidden
          className={cx(styles['summon-modal'])}
        >
          {pendingItem && (
            <ExpertSummonCard
              expert={{
                targetId: (pendingItem.targetId ?? pendingItem.rawId) as number,
                name: pendingItem.name,
                icon: pendingItem.icon,
                description: pendingItem.description,
                userCount: pendingItem.userCount,
                // 拦截时已按详情复核确认付费未订阅
                paymentRequired: true,
                subscribed: false,
              }}
              onSummon={handleSummon}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default ExpertListView;
export type {
  ExpertListItem,
  ExpertListSourceType,
  ExpertListVariant,
  ExpertListViewProps,
} from './types';
