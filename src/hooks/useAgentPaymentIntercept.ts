/**
 * 广场/空间广场-付费智能体点击拦截 hook
 * @description 与专家&专家团页(ExpertSkillConnector)付费专家同口径:
 * 列表接口的 paymentRequired/subscribed 可能滞后(如已订阅免费套餐),先按
 * 详情接口(/agent/:id)复核——确认「付费且未订阅」才弹统一专家卡
 * (ExpertSummonModal,卡内详情复核+套餐订阅+召唤自闭环),否则回写列表
 * 角标状态后放行原点击;详情异常时保守按列表口径弹卡。
 * 消费方:广场(Square)、空间广场(SpaceSquare)的智能体卡片点击
 */
import type { ExpertSummonCardInfo } from '@/components/business-component/ExpertSummonCard';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { useCallback, useRef, useState } from 'react';

/** useAgentPaymentIntercept 入参 */
export interface UseAgentPaymentInterceptOptions {
  /** 订阅功能是否开启(租户配置 enableSubscription);关闭时一律放行 */
  enabled: boolean;
  /** 复核/卡内订阅确认订阅状态后就地回写列表角标(按 targetId) */
  onSubscribed?: (targetId: number, subscribed?: boolean) => void;
}

export default function useAgentPaymentIntercept({
  enabled,
  onSubscribed,
}: UseAgentPaymentInterceptOptions) {
  /** 待订阅的付费智能体(详情复核确认后置值弹统一专家卡;null 即关闭) */
  const [paymentItem, setPaymentItem] =
    useState<SquarePublishedItemInfo | null>(null);
  /** 拦截期间暂存的原点击动作(卡内订阅放行/复核已订阅时执行) */
  const proceedRef = useRef<(() => void) | null>(null);

  /** 关闭弹窗并清空暂存的原点击动作 */
  const closePaymentModal = useCallback(() => {
    proceedRef.current = null;
    setPaymentItem(null);
  }, []);

  /**
   * 智能体卡片点击拦截:订阅未开启或非付费/已订阅直接放行;付费未订阅先按
   * /agent/:id 详情复核(列表口径可能滞后)——确认后弹统一专家卡,复核出
   * 已订阅/免费回写角标放行,详情异常保守弹卡
   */
  const interceptAgentClick = useCallback(
    (item: SquarePublishedItemInfo, proceed: () => void) => {
      if (!enabled || !item.paymentRequired || item.subscribed) {
        proceed();
        return;
      }
      const openExpertCard = () => {
        proceedRef.current = proceed;
        setPaymentItem(item);
      };
      void apiPublishedAgentInfo(item.targetId)
        .then((res) => {
          const detail = res?.code === SUCCESS_CODE ? res.data : undefined;
          if (!detail || (detail.paymentRequired && !detail.subscribed)) {
            openExpertCard();
          } else {
            // 回写角标状态(详情口径为权威)后放行
            onSubscribed?.(item.targetId, !!detail?.subscribed);
            proceed();
          }
        })
        .catch(openExpertCard);
    },
    [enabled, onSubscribed],
  );

  /**
   * 卡内召唤放行:按卡内订阅结果回写角标后执行原点击动作(原跳转目标由
   * 拦截时暂存的 proceed 保留)
   */
  const handleSummonFromCard = useCallback(
    (_expert: ExpertSummonCardInfo, subscribed?: boolean) => {
      const item = paymentItem;
      const proceed = proceedRef.current;
      proceedRef.current = null;
      setPaymentItem(null);
      if (!item) {
        return;
      }
      if (subscribed) {
        onSubscribed?.(item.targetId, true);
      }
      proceed?.();
    },
    [paymentItem, onSubscribed],
  );

  return {
    /** 待订阅的付费智能体(null 即关闭弹窗) */
    paymentItem,
    /** 关闭弹窗 */
    closePaymentModal,
    /** 点击拦截(包在卡片 onClick/onStartUse 外层) */
    interceptAgentClick,
    /** 卡内召唤放行(透传给 ExpertSummonModal.onSummon) */
    handleSummonFromCard,
  };
}
