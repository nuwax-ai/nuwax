/**
 * 统一专家组件·付费链路契约（ExpertSummonCard 逻辑自闭环）：
 * - 免费专家：无套餐区，召唤直通 onSummon(expert)，不拉详情复核/套餐；
 * - 付费未订阅：挂载即按详情复核（/agent/:id 权威口径）+ 拉套餐与我的订阅，
 *   内联渲染套餐卡（名称/价格/订阅按钮/可调用次数）；
 * - 召唤拦截：详情复核仍付费未订阅 → 不触发 onSummon，提示先订阅；
 *   复核出已订阅（如已领免费套餐）→ 放行并回传 subscribed=true；
 * - 租户未开启订阅：付费未订阅也直通；
 * - 套餐订阅按钮 → createSubscriptionOrder(plan)（统一支付收银台）。
 * services/umi/useSubscription/EllipsisTooltip 全部 mock（vitest 不可用 umi request）。
 */
import type { ExpertSummonCardInfo } from '@/components/business-component/ExpertSummonCard';
import ExpertSummonCard from '@/components/business-component/ExpertSummonCard';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiPublishedAgentInfo = vi.hoisted(() => vi.fn());
const queryAgentSubscriptionPlans = vi.hoisted(() => vi.fn());
const createSubscriptionOrder = vi.hoisted(() => vi.fn());
const plans = vi.hoisted(() => [
  {
    id: 1,
    name: '基础版',
    price: 0.02,
    firstPrice: 0.02,
    period: 'FOREVER',
    creditAmount: 0,
    callLimitCount: 100,
    sort: 1,
  },
  {
    id: 2,
    name: 'VIP包',
    price: 12,
    firstPrice: 15,
    period: 'FOREVER',
    creditAmount: 100,
    callLimitCount: -1,
    sort: 2,
  },
]);
const mySubscriptionInfo = vi.hoisted(() => vi.fn());
const tenantConfig = vi.hoisted(() => ({ enableSubscription: 1 }));

vi.mock('@/components/business-component/ExpertSummonCard/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: tenantConfig }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/agentDev', () => ({
  apiPublishedAgentInfo,
}));

vi.mock('@/hooks/useSubscription', () => ({
  default: () => ({
    agentSubscriptionPlans: plans,
    loadingAgentSubscriptionPlans: false,
    mySubscriptionInfo: mySubscriptionInfo(),
    loadingMySubscription: false,
    createSubscriptionOrder,
    queryAgentSubscriptionPlans,
  }),
}));

vi.mock('@/components/custom/EllipsisTooltip', async () => {
  const React = await import('react');
  return {
    EllipsisTooltip: (props: { text?: string; className?: string }) =>
      React.createElement('span', { className: props.className }, props.text),
  };
});

const expert = (
  overloads: Partial<ExpertSummonCardInfo>,
): ExpertSummonCardInfo => ({
  targetId: 101,
  name: '订阅专家',
  description: '专家描述',
  userCount: 1257400,
  paymentRequired: true,
  subscribed: false,
  ...overloads,
});

beforeEach(() => {
  vi.clearAllMocks();
  tenantConfig.enableSubscription = 1;
  mySubscriptionInfo.mockReturnValue(undefined);
  // 详情复核缺省口径：确实付费且未订阅（带试用次数）
  apiPublishedAgentInfo.mockResolvedValue({
    code: '0000',
    data: {
      paymentRequired: true,
      subscribed: false,
      calledTrialCount: 0,
      trialCount: 2,
    },
  });
});

afterEach(cleanup);

const renderCard = (
  info: ExpertSummonCardInfo,
  onSummon: ReturnType<typeof vi.fn>,
) => render(<ExpertSummonCard expert={info} onSummon={onSummon} />);

const clickSummon = () =>
  fireEvent.click(
    screen
      .getAllByText('PC.Components.ExpertSummonCard.summon')[0]
      .closest('button')!,
  );

describe('统一专家组件·免费/租户口径', () => {
  it('免费专家：无套餐区，召唤直通且不拉详情/套餐', async () => {
    const onSummon = vi.fn();
    renderCard(expert({ paymentRequired: false }), onSummon);

    // 使用次数展示（万位紧凑格式）
    expect(
      screen.getByText('PC.Components.ExpertSummonCard.usageTimes'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getAllByText('PC.Components.ExpertSummonCard.summon').length,
      ).toBeGreaterThan(0),
    );
    // 无套餐区（标题不渲染）
    expect(
      screen.queryByText(
        'PC.Components.PaymentSubscriptionModal.titleSelectPlan',
      ),
    ).toBeNull();

    clickSummon();
    await waitFor(() => expect(onSummon).toHaveBeenCalled());
    expect(onSummon.mock.calls[0][0]).toMatchObject({ targetId: 101 });
    expect(onSummon.mock.calls[0][1]).toBeUndefined();
    expect(apiPublishedAgentInfo).not.toHaveBeenCalled();
    expect(queryAgentSubscriptionPlans).not.toHaveBeenCalled();
  });

  it('租户未开启订阅：付费未订阅也直通', async () => {
    tenantConfig.enableSubscription = 0;
    const onSummon = vi.fn();
    renderCard(expert({ paymentRequired: true }), onSummon);

    await waitFor(() =>
      expect(queryAgentSubscriptionPlans).not.toHaveBeenCalled(),
    );
    clickSummon();
    await waitFor(() => expect(onSummon).toHaveBeenCalled());
    expect(apiPublishedAgentInfo).not.toHaveBeenCalled();
  });
});

describe('统一专家组件·付费链路（逻辑自闭环）', () => {
  it('付费未订阅：挂载即详情复核+拉套餐，内联渲染套餐卡并可下单', async () => {
    const onSummon = vi.fn();
    renderCard(expert({}), onSummon);

    // 详情复核 + 套餐/我的订阅拉齐
    await waitFor(() =>
      expect(apiPublishedAgentInfo).toHaveBeenCalledWith(101),
    );
    expect(queryAgentSubscriptionPlans).toHaveBeenCalledWith(101);
    // 套餐区标题：主标题加粗 + 括号包裹的试用次数 helper 小字
    expect(
      screen.getByText(
        'PC.Components.PaymentSubscriptionModal.titleSelectPlan',
      ),
    ).toBeInTheDocument();
    const trialHelper = screen.getByText(/trialCountText/);
    expect(trialHelper.textContent).toContain('（');
    expect(trialHelper.textContent).toContain('）');
    expect(screen.getByText('基础版')).toBeInTheDocument();
    expect(screen.getByText('VIP包')).toBeInTheDocument();
    expect(
      screen.getAllByText(
        'PC.Components.PaymentSubscriptionModal.btnSubscribePlan',
      ).length,
    ).toBe(2);

    // 订阅按钮 → createSubscriptionOrder（统一支付收银台）
    fireEvent.click(document.querySelector('[data-plan-id="1"] button')!);
    await waitFor(() =>
      expect(createSubscriptionOrder).toHaveBeenCalledTimes(1),
    );
    expect(createSubscriptionOrder.mock.calls[0][0]).toMatchObject({
      id: 1,
      name: '基础版',
    });
  });

  it('召唤拦截：详情复核仍付费未订阅 → 不触发 onSummon，提示先订阅', async () => {
    const onSummon = vi.fn();
    renderCard(expert({}), onSummon);
    await screen.findByText('基础版');

    clickSummon();
    await waitFor(() => expect(apiPublishedAgentInfo).toHaveBeenCalledTimes(2));
    expect(onSummon).not.toHaveBeenCalled();
    // 提示文案（antd message 渲染进 document）
    await waitFor(() =>
      expect(
        screen.getByText('PC.Components.ExpertSummonCard.subscribeFirst'),
      ).toBeInTheDocument(),
    );
  });

  it('列表未订阅但详情复核已订阅（免费套餐）：召唤放行并回传 subscribed=true', async () => {
    // 挂载复核已订阅 → 套餐区仍展示（可续订/升级），召唤直通
    apiPublishedAgentInfo.mockResolvedValue({
      code: '0000',
      data: {
        paymentRequired: true,
        subscribed: true,
        calledTrialCount: 1,
        trialCount: 2,
      },
    });
    const onSummon = vi.fn();
    renderCard(expert({ subscribed: false }), onSummon);

    await screen.findByText('基础版');
    clickSummon();
    await waitFor(() => expect(onSummon).toHaveBeenCalledTimes(1));
    expect(onSummon.mock.calls[0][1]).toBe(true);
  });

  it('详情复核接口异常：保守按待订阅口径拦截提示', async () => {
    apiPublishedAgentInfo.mockRejectedValue(new Error('network'));
    const onSummon = vi.fn();
    renderCard(expert({}), onSummon);
    await screen.findByText('基础版');

    clickSummon();
    await waitFor(() =>
      expect(
        screen.getByText('PC.Components.ExpertSummonCard.subscribeFirst'),
      ).toBeInTheDocument(),
    );
    expect(onSummon).not.toHaveBeenCalled();
  });
});
