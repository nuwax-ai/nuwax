/**
 * PaymentSubscriptionModal — 会话页付费订阅套餐弹窗
 * props：开关、加载态、计划列表与订阅下单回调
 *
 * 布局备注：
 * - 弹窗 width 随有效列数变化：1 套餐单列、2 套餐双列、≥3 套餐三列；与网格 `--plan-cols` 一致。
 * - BODY_PAD_X / CARD_GAP / CARD_COL_WIDTH 需与 index.less 中 `.body` 横向 padding、`.cards-row` gap 及单列视觉对齐，避免错位。
 * - 窄屏：less 中 ≤900px 可将三列降为两列，≤560px 单列；width 仍受 min(..., 100vw - 32px) 限制。
 */
import {
  SubscriptionPlanInfo,
  SubscriptionPlanPeriodEnum,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
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

function parseRenewalPrice(extra: unknown): number | undefined {
  if (!extra || typeof extra !== 'object') return undefined;
  const v = (extra as Record<string, unknown>).renewalPrice;
  return typeof v === 'number' ? v : undefined;
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
  open: boolean;
  loading: boolean;
  plans: SubscriptionPlanInfo[];
  userSubscribed: boolean;
  onClose: () => void;
  // 订阅回调
  onSubscribe: (plan: SubscriptionPlanInfo) => void;
}

/**
 * 付费订阅套餐弹窗
 */
const PaymentSubscriptionModal: React.FC<PaymentSubscriptionModalProps> = ({
  open,
  loading,
  plans,
  userSubscribed,
  onClose,
  onSubscribe,
}) => {
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    [plans],
  );

  const firstFreeTierIndex = useMemo(
    () => sortedPlans.findIndex((p) => (p.price ?? 0) <= 0),
    [sortedPlans],
  );

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

  // Modal.width：由 planColumnCount 推算，公式见 calcModalWidthForColumns
  const modalWidth = useMemo(
    () => calcModalWidthForColumns(planColumnCount),
    [planColumnCount],
  );

  /** 注入 CSS 变量，供 `.cards-row` repeat(var(--plan-cols)) 使用 */
  const cardsGridStyle = useMemo(
    () =>
      ({
        ['--plan-cols' as string]: planColumnCount,
      } as React.CSSProperties),
    [planColumnCount],
  );

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
      title="选择订阅套餐"
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
            {sortedPlans.map((plan, index) => {
              // 周期
              const period = periodLabelMap[plan.period] || '月';
              // 价格
              const priceMain = plan.price ?? 0;
              // 原价
              const firstPrice = plan.firstPrice;
              // 是否显示原价
              const showStrikeOriginal = firstPrice !== priceMain;
              // 续费价格
              const renewal = parseRenewalPrice(plan.extra);
              // 权益列表
              const features = buildFeatureRows(plan);
              const creditAmountText = `每月 ${plan.creditAmount} 积分`;
              // 可调用次数
              const callLimit = plan.callLimitCount;
              const callLimitText =
                callLimit === -1 ? '不限制' : `${callLimit ?? 0} 次`;
              // 是否是当前套餐
              const isCurrentEffective =
                !userSubscribed &&
                priceMain <= 0 &&
                firstFreeTierIndex !== -1 &&
                index === firstFreeTierIndex;

              // 是否可购买
              const canPurchase =
                plan.status === SubscriptionPlanStatusEnum.Online &&
                !isCurrentEffective;

              // 是否是升级按钮
              const isAccentBtn =
                index === sortedPlans.length - 1 &&
                priceMain > 0 &&
                !isCurrentEffective;

              return (
                <div
                  key={plan.id ?? plan.name}
                  className={cx(styles['plan-pay-card'])}
                >
                  <div className={cx(styles.title, 'text-ellipsis')}>
                    {plan.name}
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
                    {showStrikeOriginal ? (
                      <div className={cx(styles['price-original'])}>
                        原价¥{firstPrice}/{period}
                      </div>
                    ) : null}
                    {renewal !== undefined ? (
                      <div className={cx(styles['renewal-hint'])}>
                        次月续费金额¥{renewal}/{period}
                      </div>
                    ) : null}
                  </div>

                  {/* 订阅按钮 */}
                  <div className={cx(styles['subscribe-btn-wrap'])}>
                    {isCurrentEffective ? (
                      <Button
                        disabled
                        className={cx(styles['subscribe-btn-current'])}
                      >
                        当前套餐
                      </Button>
                    ) : (
                      // 升级按钮
                      <Button
                        type="primary"
                        disabled={!canPurchase}
                        className={
                          isAccentBtn
                            ? cx(styles['subscribe-btn-upgrade-accent'])
                            : cx(styles['subscribe-btn-upgrade'])
                        }
                        onClick={() => onSubscribe(plan)}
                      >
                        {`升级为${plan.name}连续包月`}
                      </Button>
                    )}
                  </div>

                  {/* 每月赠送积分 */}
                  <div className={cx(styles['points-row'])}>
                    <span className={cx(styles.diamond)} aria-hidden />
                    <span>{creditAmountText}</span>
                  </div>

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
