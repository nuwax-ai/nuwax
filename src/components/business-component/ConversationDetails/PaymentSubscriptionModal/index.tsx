/**
 * PaymentSubscriptionModal — 会话页付费订阅套餐弹窗
 * props：开关、加载态、计划列表与订阅下单回调
 *
 * 布局备注：
 * - 弹窗 width 随有效列数变化：1 套餐单列、2 套餐双列、≥3 套餐三列；与网格 `--plan-cols` 一致。
 * - BODY_PAD_X / CARD_GAP / CARD_COL_WIDTH 需与 index.less 中 `.body` 横向 padding、`.cards-row` gap 及单列视觉对齐，避免错位。
 * - 窄屏：less 中 ≤900px 可将三列降为两列，≤560px 单列；width 仍受 min(..., 100vw - 32px) 限制。
 */
import ConditionRender from '@/components/ConditionRender';
import {
  SubscriptionPlanInfo,
  SubscriptionPlanPeriodEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { AgentDetailDto } from '@/types/interfaces/agent';
import {
  MyPlanPeriodEnum,
  MySubscriptionStatusEnum,
  type MySubscriptionItem,
} from '@/types/interfaces/subscription';
import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Empty, Modal, Spin } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 弹窗内容区单侧水平留白合计（`.body` 左右各 20px，与样式表一致） */
const BODY_PAD_X = 40;
/** 套餐卡片网格列间距（与 `.cards-row` 的 gap: 16px 一致） */
const CARD_GAP = 16;
/**
 * 单列在桌面下的基准宽度(px)，用于推算 Modal 总宽。
 * 备注：调高会使三列弹窗更接近原 ~760px 视觉；改动时请同步目测三列并排效果。
 */
const CARD_COL_WIDTH = 270;

/**
 * 按列数推算 Modal 宽度：内容区 = 横向留白 + N×列宽 + (N-1)×间距，再与视口做 min。
 * @param columnCount — 桌面下列数，有效范围 clamp 到 1～3
 */
function calcModalWidthForColumns(columnCount: number): string {
  const c = Math.min(Math.max(columnCount, 1), 3);
  const inner = BODY_PAD_X + c * CARD_COL_WIDTH + (c - 1) * CARD_GAP;
  return `min(${inner}px, calc(100vw - 32px))`;
}

const periodLabelMap: Record<SubscriptionPlanPeriodEnum, string> = {
  [SubscriptionPlanPeriodEnum.MONTH]: '月',
  [SubscriptionPlanPeriodEnum.QUARTER]: '季度',
  [SubscriptionPlanPeriodEnum.YEAR]: '年',
  [SubscriptionPlanPeriodEnum.FOREVER]: '永久',
};

const BADGE_REGEX = /(限时免费|功能限免|限时尝鲜)/;

/** 未订阅时：与历史逻辑一致的主操作按钮文案 */
function getUnsubscribedActionLabel(
  targetType: 'Agent' | 'Skill',
  plan: SubscriptionPlanInfo,
): string {
  if (targetType === 'Agent') {
    return '订阅套餐';
  }
  return plan?.period === SubscriptionPlanPeriodEnum.MONTH
    ? '订阅包月套餐'
    : '订阅买断套餐';
}

/**
 * 套餐卡片主按钮文案：当前档 / 未订阅默认文案 / 已订阅比价升级
 */
function getSubscribeButtonLabel(
  targetType: 'Agent' | 'Skill',
  plan: SubscriptionPlanInfo,
  options: {
    isCurrentEffective: boolean;
    isCurrentSubscriptionExpired: boolean;
    isUserSubscribed: boolean;
    resolvedSubscribedPrice: number | null;
    priceMain: number;
    currentSubscribedPlanPeriod: MyPlanPeriodEnum | null | undefined;
  },
): string {
  const {
    isCurrentEffective,
    isCurrentSubscriptionExpired,
    isUserSubscribed,
    resolvedSubscribedPrice,
    priceMain,
    currentSubscribedPlanPeriod,
  } = options;

  const isSkillForeverSubscribed =
    targetType === 'Skill' &&
    isUserSubscribed &&
    currentSubscribedPlanPeriod === MyPlanPeriodEnum.Forever;

  if (isCurrentEffective) {
    if (isSkillForeverSubscribed) {
      return '已买断套餐';
    }
    if (isCurrentSubscriptionExpired) {
      return '套餐已过期(续订)';
    }
    return '当前套餐(续订)';
  }
  if (!isUserSubscribed) {
    return getUnsubscribedActionLabel(targetType, plan);
  }
  if (
    resolvedSubscribedPrice === null ||
    resolvedSubscribedPrice === undefined
  ) {
    return getUnsubscribedActionLabel(targetType, plan);
  }
  if (resolvedSubscribedPrice < priceMain) {
    return '升级';
  }
  return getUnsubscribedActionLabel(targetType, plan);
}

/** 同一套权益解析逻辑，与后台 PlanItemCard 对齐，并兼容 items 明细 */
function buildFeatureRows(
  plan: SubscriptionPlanInfo,
): { text: string; badge: string }[] {
  const rows: { text: string; badge: string }[] = [];

  const pushParsedLine = (raw: string) => {
    const featureText = String(raw || '');
    const badgeMatch = featureText.match(BADGE_REGEX);
    const badge = badgeMatch?.[1] || '';
    const text = featureText
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/\((限时免费|功能限免|限时尝鲜)\)/g, '')
      .replace(BADGE_REGEX, '')
      .replace(/\s+/g, ' ')
      .trim();
    rows.push({ text: text || featureText, badge });
  };

  (plan.itemGroups || []).forEach((group) => {
    const items = group.items?.filter((it) => it.selected !== false) ?? [];
    if (items.length > 0) {
      items.forEach((it) => {
        const line = `${it.name || ''}${
          it.description ? ` · ${it.description}` : ''
        }`.trim();
        if (line) pushParsedLine(line);
      });
    } else if (group.name) {
      pushParsedLine(group.name);
    }
  });

  const gift = plan.dailyGiftCreditAmount;
  if (gift && gift > 0) {
    const line = `每日登录领 ${gift.toLocaleString()} 积分`;
    if (!rows.some((r) => r.text.includes('每日登录'))) {
      rows.unshift({ text: line, badge: '' });
    }
  }
  return rows;
}

export interface PaymentSubscriptionModalProps {
  agentDetail?: AgentDetailDto | null;
  /**
   * 是否已超出调用限制（与 AgentDetail.overCallLimit 对齐）。
   * true：标题「选择订阅套餐」；false：标题「选择订阅套餐（可试用）」
   */
  overCallLimit?: boolean;
  targetType: 'Agent' | 'Skill';
  open: boolean;
  loading: boolean;
  plans: SubscriptionPlanInfo[];
  /**
   * 「我的订阅」当前业务下的 currentSubscription（与接口 MySubscriptionData 对齐）
   * - null：无当前订阅或未拉到数据；planId / 价格 / 周期在弹窗内从此对象解析
   */
  currentSubscribedInfo?: MySubscriptionItem | null;
  onClose: () => void;
  // 订阅回调
  onSubscribe: (plan: SubscriptionPlanInfo) => void;
}

/**
 * 付费订阅套餐弹窗
 */
const PaymentSubscriptionModal: React.FC<PaymentSubscriptionModalProps> = ({
  open,
  overCallLimit = false,
  targetType,
  loading,
  plans,
  currentSubscribedInfo,
  onClose,
  onSubscribe,
}) => {
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    [plans],
  );

  /** 从「我的订阅」条目解析 planId / 价格 / 周期 */
  const currentSubscribedPlanId = currentSubscribedInfo?.planId ?? null;
  // 价格
  const currentSubscribedPlanPrice = currentSubscribedInfo?.plan?.price ?? null;
  // 周期：1-月，3-季度，12-年,可用值:MONTH,QUARTER,YEAR,FOREVER
  const currentSubscribedPlanPeriod = currentSubscribedInfo?.period ?? null;
  // 状态：ACTIVE / EXPIRED / CANCELLED
  const currentSubscribedStatus = currentSubscribedInfo?.status;
  // 是否已过期
  const isCurrentSubscriptionExpired =
    currentSubscribedStatus === MySubscriptionStatusEnum.Expired;

  /** 已有当前业务下的订阅（planId 已确定） */
  const isUserSubscribed =
    currentSubscribedPlanId !== null && currentSubscribedPlanId !== undefined;

  /**
   * 用户当前订阅套餐价格：优先接口 plan.price；否则在列表里按 planId 查找
   */
  const resolvedSubscribedPrice = useMemo(() => {
    if (!isUserSubscribed) return null;
    if (
      currentSubscribedPlanPrice !== null &&
      currentSubscribedPlanPrice !== undefined
    ) {
      return Number(currentSubscribedPlanPrice);
    }
    const match = sortedPlans.find(
      (p) =>
        p.id !== null &&
        p.id !== undefined &&
        Number(p.id) === Number(currentSubscribedPlanId),
    );
    if (
      match !== undefined &&
      match.price !== null &&
      match.price !== undefined
    ) {
      return Number(match.price);
    }
    return null;
  }, [
    currentSubscribedPlanPrice,
    currentSubscribedPlanId,
    isUserSubscribed,
    sortedPlans,
  ]);

  /**
   * 网格列数与弹窗宽度依据：
   * - loading：按 3 列占位（避免载入完成后宽度跳动过大）
   * - 无套餐：按 1 列（空状态窄一些）
   * - 有套餐：min(个数, 3)，超过 3 条仍在三列网格内自动换行
   */
  const planColumnCount = useMemo(() => {
    if (loading) return 3;
    if (sortedPlans.length === 0) return 1;
    return Math.min(sortedPlans.length, 3);
  }, [loading, sortedPlans.length]);

  // Modal.width：Agent 按列数推算；Skill 固定为单列卡片基准宽
  const modalWidth = useMemo(() => {
    if (targetType === 'Skill') {
      return CARD_COL_WIDTH;
    }
    return calcModalWidthForColumns(planColumnCount);
  }, [targetType, planColumnCount]);

  /** 注入 CSS 变量，供 `.cards-row` repeat(var(--plan-cols)) 使用 */
  const cardsGridStyle = useMemo(
    () =>
      ({
        ['--plan-cols' as string]: planColumnCount,
      } as React.CSSProperties),
    [planColumnCount],
  );

  const modalTitle = overCallLimit ? '选择订阅套餐' : '选择订阅套餐（可试用）';

  return (
    <Modal
      styles={{
        content: {
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
        },
        header: {
          margin: 0,
          padding: '16px 20px',
          borderBottom: 'none',
          background: 'transparent',
        },
        body: {
          padding: 0,
        },
      }}
      title={modalTitle}
      open={open}
      onCancel={onClose}
      footer={null}
      width={modalWidth}
      centered
      destroyOnHidden
    >
      <div className={cx(styles.body)}>
        {loading ? (
          <div className={cx(styles['loading-wrap'])}>
            <Spin size="large" />
          </div>
        ) : sortedPlans.length === 0 ? (
          <Empty className={cx(styles.empty)} description="暂无可用套餐" />
        ) : (
          <div
            className={cx(styles['cards-row'])}
            style={cardsGridStyle}
            data-desktop-cols={planColumnCount}
          >
            {sortedPlans.map((plan) => {
              // 周期
              const period = periodLabelMap[plan?.period] || '月';
              // 价格
              const priceMain = plan.price ?? 0;
              // 原价
              const firstPrice = plan.firstPrice;
              // 是否显示原价
              const showStrikeOriginal = firstPrice !== priceMain;
              // 权益列表
              const features = buildFeatureRows(plan);
              const creditAmountText = `每月 ${plan.creditAmount} 积分`;
              // 可调用次数
              const callLimit = plan.callLimitCount;
              const callLimitText =
                callLimit === -1 ? '不限制' : `${callLimit ?? 0} 次/月`;
              // 是否是当前套餐（与「我的订阅」currentSubscription.planId 对齐）
              const isCurrentEffective =
                currentSubscribedPlanId !== null &&
                currentSubscribedPlanId !== undefined &&
                plan.id !== null &&
                plan.id !== undefined &&
                Number(plan.id) === Number(currentSubscribedPlanId);

              // 是否显示升级按钮
              const showAsUpgrade =
                isUserSubscribed &&
                !isCurrentEffective &&
                resolvedSubscribedPrice !== null &&
                resolvedSubscribedPrice !== undefined &&
                priceMain > resolvedSubscribedPrice;

              // 金色强调：仅对应文案「升级」的付费档位；未订阅的多档同为「订阅*」时需统一底色
              const isAccentBtn = showAsUpgrade && priceMain > 0;

              const isSkillForeverBuyoutLocked =
                targetType === 'Skill' &&
                isUserSubscribed &&
                currentSubscribedPlanPeriod === MyPlanPeriodEnum.Forever &&
                isCurrentEffective;

              const subscribeButtonLabel = getSubscribeButtonLabel(
                targetType,
                plan,
                {
                  isCurrentEffective,
                  isCurrentSubscriptionExpired,
                  isUserSubscribed,
                  resolvedSubscribedPrice,
                  priceMain,
                  currentSubscribedPlanPeriod,
                },
              );

              return (
                <div
                  key={plan.id ?? plan.name}
                  className={cx(styles['plan-pay-card'])}
                >
                  <div className={cx(styles['card-header'])}>
                    <div className={cx(styles.title, 'text-ellipsis')}>
                      {plan.name}
                    </div>
                  </div>
                  <div className={cx(styles['price-block'])}>
                    <div className={cx(styles['price-main-row'])}>
                      <span className={cx(styles['price-main'])}>
                        ¥{priceMain}
                      </span>
                      <span className={cx(styles['price-unit'])}>
                        /{period}
                      </span>
                    </div>
                    {/* 原价, 技能只占位，不显示原价 */}
                    <div className={cx(styles['price-original'])}>
                      {targetType === 'Agent'
                        ? showStrikeOriginal
                          ? `原价¥${firstPrice}/${period}`
                          : ''
                        : ''}
                    </div>
                  </div>

                  {/* 订阅按钮 */}
                  <div className={cx(styles['subscribe-btn-wrap'])}>
                    {isCurrentEffective ? (
                      <Button
                        disabled={isSkillForeverBuyoutLocked}
                        className={cx(
                          styles['subscribe-btn-current'],
                          !isSkillForeverBuyoutLocked && 'cursor-pointer',
                        )}
                        onClick={
                          isSkillForeverBuyoutLocked
                            ? undefined
                            : () => onSubscribe(plan)
                        }
                      >
                        {subscribeButtonLabel}
                      </Button>
                    ) : (
                      // 升级 / 订阅
                      <Button
                        type="primary"
                        className={
                          isAccentBtn
                            ? cx(styles['subscribe-btn-upgrade-accent'])
                            : cx(styles['subscribe-btn-upgrade'])
                        }
                        onClick={() => onSubscribe(plan)}
                      >
                        {subscribeButtonLabel}
                      </Button>
                    )}
                  </div>

                  <ConditionRender
                    condition={plan.creditAmount && plan.creditAmount > 0}
                  >
                    {/* 每月赠送积分 */}
                    <div className={cx(styles['points-row'])}>
                      <span className={cx(styles.diamond)} aria-hidden />
                      <span>{creditAmountText}</span>
                    </div>
                  </ConditionRender>

                  {/* 可调用次数 */}
                  <div className={cx(styles['points-row'])}>
                    <span className={cx(styles.diamond)} aria-hidden />
                    <span>{`可调用次数：${callLimitText}`}</span>
                  </div>

                  {/* 分割线 */}
                  <hr className={cx(styles['divider-dashed'])} />
                  {/* 权益列表 */}
                  <div className={cx(styles['feature-list'])}>
                    {features.map((feature, fi) => (
                      <div
                        key={`${feature.text}-${fi}`}
                        className={cx(styles['feature-item'])}
                      >
                        <CheckCircleFilled
                          className={cx(styles['feature-icon'])}
                        />
                        <span className={cx(styles['feature-text'])}>
                          {feature.text}
                        </span>
                        {feature.badge ? (
                          <span className={cx(styles['feature-badge'])}>
                            {feature.badge}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentSubscriptionModal;
