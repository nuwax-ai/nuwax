/**
 * ExpertSummonCard — 统一专家组件（付费场景逻辑自闭环）
 * @description 竖版专家卡：头像/名称/「召唤专家」按钮/使用次数 + 描述 +
 * 付费内联订阅套餐区。外部只需传入专家信息与 onSummon 回调：
 * - 付费链路（参考 CapabilityModal / PaymentSubscriptionModal）组件内闭环：
 *   列表口径付费 → 挂载即按详情口径复核（/agent/:id 权威判定
 *   paymentRequired/subscribed/试用次数）并拉取套餐与「我的订阅」；
 * - 召唤拦截：免费/已订阅/租户未开启订阅 → 直接回调 onSummon；
 *   付费未订阅 → 先按详情复核（列表状态可能滞后，如已领免费套餐），
 *   复核已订阅则放行回传 subscribed=true，仍待订阅则提示先订阅并高亮套餐区；
 * - 订阅下单走 useSubscription.createSubscriptionOrder（统一支付收银台），
 *   支付回流后重挂载/重渲染即按最新「我的订阅」展示当前套餐。
 *
 * 用法：
 * ```tsx
 * <ExpertSummonCard
 *   expert={{ targetId: 101, name: '专家', paymentRequired: true }}
 *   onSummon={(expert, subscribed) => ...}
 * />
 * ```
 */
import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import useSubscription from '@/hooks/useSubscription';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import type { AgentDetailDto } from '@/types/interfaces/agent';
import {
  MySubscriptionStatusEnum,
  type MySubscriptionItem,
} from '@/types/interfaces/subscription';
import { SendOutlined } from '@ant-design/icons';
import { Button, Empty, message, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 套餐信息类型：从 useSubscription 返回值推导（类型源在页面层，组件层
 * 依赖页面层违反分层红线，故按 hook 契约推导保持同步）
 */
type PlanInfo = ReturnType<
  typeof useSubscription
>['agentSubscriptionPlans'][number];

/** 外部传入的专家信息（列表/入口口径即可，付费状态组件内会按详情复核） */
export interface ExpertSummonCardInfo {
  /** 智能体本体 ID（详情复核/套餐查询/订阅寻址） */
  targetId: number;
  /** 名称 */
  name: string;
  /** 头像地址（空/加载失败回退名称首字） */
  icon?: string;
  /** 描述 */
  description?: string;
  /** 使用次数（头部右上「x次使用」，无值不展示） */
  userCount?: number;
  /** 是否需要付费（列表口径；组件内按详情复核） */
  paymentRequired?: boolean;
  /** 是否已订阅（列表口径） */
  subscribed?: boolean;
}

export interface ExpertSummonCardProps {
  expert: ExpertSummonCardInfo;
  /** 召唤回调：免费/已订阅（含详情复核出的已订阅）/租户未开启订阅时触发 */
  onSummon: (expert: ExpertSummonCardInfo, subscribed?: boolean) => void;
  /** 召唤按钮 loading（外部业务请求态） */
  summonLoading?: boolean;
  className?: string;
}

/** 使用次数紧凑格式：≥1万展示「x.xx万」，去尾零 */
const formatUsage = (count?: number): string | undefined => {
  if (!count || count <= 0) return undefined;
  if (count < 10000) return String(count);
  const wan = count / 10000;
  const text =
    wan >= 100 ? String(Math.round(wan)) : String(Math.round(wan * 100) / 100);
  return `${text}万`;
};

/** 套餐计费周期展示文案（与 PaymentSubscriptionModal 同款 key；枚举值即
 * 'MONTH'|'QUARTER'|'YEAR'|'FOREVER' 字符串，本地映射避免依赖页面层类型源） */
const PLAN_PERIOD_LABELS: Record<string, string> = {
  MONTH: dict('PC.Components.PaymentSubscriptionModal.periodMonth'),
  QUARTER: dict('PC.Components.PaymentSubscriptionModal.periodQuarter'),
  YEAR: dict('PC.Components.PaymentSubscriptionModal.periodYear'),
  FOREVER: dict('PC.Components.PaymentSubscriptionModal.periodForever'),
};

const getPlanPeriodLabel = (period?: string | null): string =>
  (period && PLAN_PERIOD_LABELS[period]) || PLAN_PERIOD_LABELS.MONTH;

/** 详情复核后需要合入本地态的字段（权威口径） */
interface DetailPatch {
  paymentRequired?: boolean;
  subscribed?: boolean;
  calledTrialCount?: number;
  trialCount?: number;
}

/**
 * 统一专家组件
 */
const ExpertSummonCard: React.FC<ExpertSummonCardProps> = ({
  expert,
  onSummon,
  summonLoading,
  className,
}) => {
  const { targetId } = expert;

  // 租户订阅开关（关闭时付费专家照常直选，对齐广场/能力弹窗口径）
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;

  // 套餐列表 + 我的订阅（queryAgentSubscriptionPlans 一次拉齐两份数据）
  const {
    agentSubscriptionPlans,
    loadingAgentSubscriptionPlans,
    mySubscriptionInfo,
    loadingMySubscription,
    createSubscriptionOrder,
    queryAgentSubscriptionPlans,
  } = useSubscription();

  // 详情复核结果（权威口径，优先于列表字段）
  const [detailPatch, setDetailPatch] = useState<DetailPatch>({});
  const paymentRequired =
    detailPatch.paymentRequired ?? !!expert.paymentRequired;
  const subscribed = detailPatch.subscribed ?? !!expert.subscribed;

  // 套餐区高亮（召唤被拦截时提示用户先选套餐订阅，2s 自动消退）
  const [plansHighlighted, setPlansHighlighted] = useState<boolean>(false);
  const highlightTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    },
    [],
  );

  // 正在下单的套餐 key（按钮 loading 与防重复）
  const [subscribingPlanKey, setSubscribingPlanKey] = useState<
    number | string | null
  >(null);

  /**
   * 列表口径付费且租户开启订阅时挂载即拉齐：详情复核（权威判定付费/订阅/
   * 试用次数，列表状态可能滞后）+ 套餐与我的订阅。免费专家/租户未开启
   * 订阅无需复核（省请求；召唤时会按开关直通）。
   */
  useEffect(() => {
    setDetailPatch({});
    if (!expert.paymentRequired || !isEnableSubscription) {
      return;
    }
    let cancelled = false;
    queryAgentSubscriptionPlans(targetId);
    void apiPublishedAgentInfo(targetId)
      .then((res) => {
        if (cancelled || res?.code !== SUCCESS_CODE) {
          return;
        }
        const detail = res.data as AgentDetailDto | undefined;
        if (detail) {
          setDetailPatch({
            paymentRequired: detail.paymentRequired,
            subscribed: detail.subscribed,
            calledTrialCount: detail.calledTrialCount,
            trialCount: detail.trialCount,
          });
        }
      })
      .catch(() => {
        // 复核失败保持列表口径（召唤时会再复核兜底）
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, expert.paymentRequired, isEnableSubscription]);

  /** 召唤拦截：付费未订阅 → 提示先订阅并高亮套餐区 */
  const promptSubscribeFirst = useCallback(() => {
    message.warning(dict('PC.Components.ExpertSummonCard.subscribeFirst'));
    setPlansHighlighted(true);
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(
      () => setPlansHighlighted(false),
      2000,
    );
  }, []);

  /** 召唤：免费/已订阅/租户未开启订阅直通；付费未订阅先按详情复核放行 */
  const handleSummon = useCallback(() => {
    if (!isEnableSubscription || !paymentRequired || subscribed) {
      onSummon(expert, paymentRequired ? true : undefined);
      return;
    }
    void apiPublishedAgentInfo(targetId)
      .then((res) => {
        const detail =
          res?.code === SUCCESS_CODE
            ? (res.data as AgentDetailDto | undefined)
            : undefined;
        if (detail?.subscribed) {
          setDetailPatch((prev) => ({ ...prev, subscribed: true }));
          onSummon(expert, true);
          return;
        }
        promptSubscribeFirst();
      })
      .catch(() => promptSubscribeFirst());
  }, [
    isEnableSubscription,
    paymentRequired,
    subscribed,
    expert,
    targetId,
    onSummon,
    promptSubscribeFirst,
  ]);

  /** 套餐订阅下单（走统一支付收银台；回流后按最新我的订阅展示） */
  const handleSubscribe = useCallback(
    async (plan: PlanInfo) => {
      if (subscribingPlanKey !== null) {
        return;
      }
      setSubscribingPlanKey(plan.id ?? plan.name ?? '');
      try {
        await createSubscriptionOrder(plan);
      } finally {
        setSubscribingPlanKey(null);
      }
    },
    [subscribingPlanKey, createSubscriptionOrder],
  );

  const sortedPlans = useMemo(
    () =>
      [...agentSubscriptionPlans].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    [agentSubscriptionPlans],
  );

  // 我的订阅解析（与 PaymentSubscriptionModal 同口径）
  const currentSubscribedInfo: MySubscriptionItem | null =
    mySubscriptionInfo?.currentSubscription ?? null;
  const currentSubscribedPlanId = currentSubscribedInfo?.planId ?? null;
  const isUserSubscribed =
    currentSubscribedPlanId !== null && currentSubscribedPlanId !== undefined;
  const currentSubscribedPrice = currentSubscribedInfo?.plan?.price ?? null;
  const isCurrentSubscriptionExpired =
    currentSubscribedInfo?.status === MySubscriptionStatusEnum.Expired;

  const plansLoading = loadingAgentSubscriptionPlans || loadingMySubscription;

  /** 试用次数小字：仅待订阅且有总额度时展示（同弹窗口径） */
  const showTrialCount =
    paymentRequired && !subscribed && (detailPatch.trialCount ?? 0) > 0;

  /** 付费才展示套餐区；租户未开启订阅时整段隐藏 */
  const showPlans = isEnableSubscription && paymentRequired;

  // 头像（受保护地址解析 + 失败回退名称首字）
  const [iconFailed, setIconFailed] = useState(false);
  const { displaySrc: protectedIconSrc } = useAuthProtectedImageSrc(
    expert.icon,
  );
  const effectiveIcon = iconFailed ? undefined : protectedIconSrc;
  const usageText = formatUsage(expert.userCount);

  return (
    <div className={cx(styles.card, className)}>
      {/* 头部：头像 + 名称/召唤按钮 + 右上使用次数 */}
      <div className={cx(styles.head)}>
        <span className={cx(styles.avatar)}>
          {!effectiveIcon ? (
            expert.name.charAt(0)
          ) : /^(?:https?:\/\/|\/|blob:|data:)/.test(effectiveIcon) ? (
            <img
              src={effectiveIcon}
              alt=""
              onError={() => setIconFailed(true)}
            />
          ) : (
            effectiveIcon
          )}
        </span>
        <div className={cx(styles['head-main'])}>
          <EllipsisTooltip text={expert.name} className={cx(styles.name)} />
          {/* 大号主色按钮 + 渐变层（渐变悬浮 hover 褪去回主色，同 antd 渐变按钮示例） */}
          <Button
            type="primary"
            size="large"
            className={cx(styles['summon-btn'])}
            icon={<SendOutlined />}
            loading={summonLoading}
            onClick={handleSummon}
          >
            {dict('PC.Components.ExpertSummonCard.summon')}
          </Button>
        </div>
        {usageText && (
          <span className={cx(styles.usage)}>
            {dict('PC.Components.ExpertSummonCard.usageTimes', usageText)}
          </span>
        )}
      </div>

      {/* 描述 */}
      {expert.description && (
        <div className={cx(styles.desc)} title={expert.description}>
          {expert.description}
        </div>
      )}

      {/* 内联订阅套餐区（付费专家；订阅状态/比价升级同弹窗口径） */}
      {showPlans && (
        <div
          className={cx(styles.plans, {
            [styles['plans-highlight']]: plansHighlighted,
          })}
        >
          <div className={cx(styles['plans-title'])}>
            <span className={cx(styles['plans-title-main'])}>
              {dict('PC.Components.PaymentSubscriptionModal.titleSelectPlan')}
            </span>
            {showTrialCount && (
              <span className={cx(styles['plans-title-helper'])}>{`（${dict(
                'PC.Components.PaymentSubscriptionModal.trialCountText',
                detailPatch.calledTrialCount ?? 0,
                detailPatch.trialCount ?? 0,
              )}）`}</span>
            )}
          </div>
          {plansLoading ? (
            <div className={cx(styles['plans-loading'])}>
              <Spin size="small" />
            </div>
          ) : sortedPlans.length === 0 ? (
            <Empty
              className={cx(styles['plans-empty'])}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={dict(
                'PC.Components.PaymentSubscriptionModal.emptyNoPlans',
              )}
            />
          ) : (
            <div className={cx(styles['plans-grid'])}>
              {sortedPlans.map((plan) => {
                const priceMain = plan.price ?? 0;
                const period = getPlanPeriodLabel(plan.period);
                const isCurrentEffective =
                  plan.id !== null &&
                  plan.id !== undefined &&
                  currentSubscribedPlanId !== null &&
                  Number(plan.id) === Number(currentSubscribedPlanId);
                const showAsUpgrade =
                  isUserSubscribed &&
                  !isCurrentEffective &&
                  currentSubscribedPrice !== null &&
                  currentSubscribedPrice !== undefined &&
                  priceMain > Number(currentSubscribedPrice);
                const buttonLabel = isCurrentEffective
                  ? dict(
                      'PC.Components.PaymentSubscriptionModal.' +
                        (isCurrentSubscriptionExpired
                          ? 'btnExpiredRenew'
                          : priceMain === 0
                          ? 'btnCurrent'
                          : 'btnCurrentRenew'),
                    )
                  : showAsUpgrade
                  ? dict('PC.Components.PaymentSubscriptionModal.btnUpgrade')
                  : dict(
                      'PC.Components.PaymentSubscriptionModal.btnSubscribePlan',
                    );
                const planKey = plan.id ?? plan.name ?? '';
                const callLimit = plan.callLimitCount;
                const callLimitText =
                  callLimit === -1
                    ? dict(
                        'PC.Components.PaymentSubscriptionModal.callLimitUnlimited',
                      )
                    : dict(
                        'PC.Components.PaymentSubscriptionModal.callLimitPerMonth',
                        callLimit ?? 0,
                      );
                return (
                  <div
                    key={planKey}
                    data-plan-id={planKey}
                    className={cx(styles['plan-card'])}
                  >
                    <div className={cx(styles['plan-name'])} title={plan.name}>
                      {plan.name}
                    </div>
                    <div className={cx(styles['plan-price'])}>
                      <span className={cx(styles['price-main'])}>
                        <span className={cx(styles['price-symbol'])}>
                          {dict('PC.Common.Global.currencySymbol')}
                        </span>
                        {priceMain}
                      </span>
                      <span className={cx(styles['price-unit'])}>
                        / {period}
                      </span>
                    </div>
                    <div className={cx(styles['plan-original'])}>
                      {plan.firstPrice !== undefined &&
                      plan.firstPrice !== priceMain
                        ? dict(
                            'PC.Components.PaymentSubscriptionModal.originalPrice',
                            dict('PC.Common.Global.currencySymbol'),
                            plan.firstPrice ?? 0,
                            period,
                          )
                        : ''}
                    </div>
                    <Button
                      type="primary"
                      block
                      className={cx(styles['plan-btn'], {
                        [styles['plan-btn-current']]: isCurrentEffective,
                        [styles['plan-btn-upgrade']]: showAsUpgrade,
                      })}
                      loading={subscribingPlanKey === planKey}
                      disabled={subscribingPlanKey !== null}
                      onClick={() => void handleSubscribe(plan)}
                    >
                      {buttonLabel}
                    </Button>
                    {plan.creditAmount && plan.creditAmount > 0 ? (
                      <div className={cx(styles['plan-row'])}>
                        {dict(
                          'PC.Components.PaymentSubscriptionModal.monthlyCredits',
                          plan.creditAmount,
                        )}
                      </div>
                    ) : null}
                    <div className={cx(styles['plan-row'])}>
                      {dict(
                        'PC.Components.PaymentSubscriptionModal.callCountLabel',
                        callLimitText,
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertSummonCard;
