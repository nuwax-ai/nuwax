/**
 * 能力弹窗·付费专家聘请拦截契约（复用广场智能体详情 /agent/:id 付费链路）：
 * - 聘请「付费未订阅」专家 → 先按详情接口复核（列表 subscribed 可能滞后），
 *   详情确认付费未订阅才弹套餐弹窗（queryAgentSubscriptionPlans 拉套餐 +
 *   我的订阅，PaymentSubscriptionModal targetType=Agent），不触发 onSelect；
 * - 详情确认已订阅（如已领免费套餐）→ 回写卡片后直接聘请，不弹套餐；
 * - 详情接口异常 → 保守按列表口径弹套餐；
 * - 免费 / 租户未开启订阅 → 照常直选。
 * 渲染整组件：services/umi/useSubscription/子弹窗全部 mock（vitest 不可用 umi request）。
 */
import CapabilityModal from '@/components/ChatInputHome/CapabilityModal';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiPublishedAgentList = vi.hoisted(() => vi.fn());
const apiPublishedAgentInfo = vi.hoisted(() => vi.fn());
const apiPublishedSkillList = vi.hoisted(() => vi.fn());
const apiPublishedSkillDetail = vi.hoisted(() => vi.fn());
const queryAgentSubscriptionPlans = vi.hoisted(() => vi.fn());
const querySkillSubscriptionPlans = vi.hoisted(() => vi.fn());
const createSubscriptionOrder = vi.hoisted(() => vi.fn());
const tenantConfig = vi.hoisted(() => ({ enableSubscription: 1 }));
const paymentModal = vi.hoisted(() => ({ props: {} as Record<string, any> }));

vi.mock('@/components/ChatInputHome/CapabilityModal/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

// 连接器扫码连接弹窗挂在 CapabilityModal 内,less 同样 mock,
// 否则 styles undefined 渲染崩溃
vi.mock(
  '@/components/business-component/ConnectorDeviceAuthModal/index.less',
  () => ({
    default: new Proxy({}, { get: (_, key) => String(key) }),
  }),
);

vi.mock('@/components/business-component/ExpertSummonCard/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

// 技能维度列表已接入 SkillListView,其自带 less 同样 mock
vi.mock('@/components/business-component/SkillListView/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

// 专家维度列表已接入 ExpertListView,其自带 less 同样 mock
vi.mock('@/components/business-component/ExpertListView/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: tenantConfig }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/square', () => ({
  apiPublishedAgentList,
  apiPublishedSkillList,
  apiPublishedCategoryList: vi.fn().mockResolvedValue({ data: [] }),
  apiPublishedSkillCollect: vi.fn(),
  apiPublishedSkillUnCollect: vi.fn(),
  apiPublishedSkillEnable: vi.fn(),
  apiPublishedSkillUnEnable: vi.fn(),
  apiPublishedSkillEnableList: vi
    .fn()
    .mockResolvedValue({ code: '0000', data: [] }),
}));

vi.mock('@/services/skill', () => ({
  apiPublishedSkillDetail,
}));

vi.mock('@/services/workspace', () => ({ apiSpaceList: vi.fn() }));
vi.mock('@/services/repo', () => ({ apiRepoSpaceTree: vi.fn() }));
vi.mock('@/services/agentDev', () => ({
  apiCollectAgent: vi.fn(),
  apiUnCollectAgent: vi.fn(),
  apiPublishedAgentInfo,
  // 弹窗「最近召唤」页签可见性 hook 调用；缺省无记录（不显示页签）
  apiUserUsedAgentList: vi.fn().mockResolvedValue({ code: '0000', data: [] }),
}));
vi.mock('@/services/systemManage', () => ({
  apiConnectorProviderPageList: vi.fn(),
  apiSystemConnectorProviderList: vi.fn(),
  apiConnectorConnectionDelete: vi.fn(),
  apiConnectorConnectionList: vi.fn(),
  apiConnectorOauthAuthorize: vi.fn(),
  apiSystemConnectorProviderDetail: vi.fn(),
}));

vi.mock('@/hooks/useSubscription', () => ({
  default: () => ({
    agentSubscriptionPlans: [],
    loadingAgentSubscriptionPlans: false,
    targetSubscriptionPlans: [],
    loadingTargetPricing: false,
    mySubscriptionInfo: undefined,
    loadingMySubscription: false,
    createSubscriptionOrder,
    queryAgentSubscriptionPlans,
    querySkillSubscriptionPlans,
  }),
}));

vi.mock('@/components/business-component/ConnectorConnectModal', () => ({
  default: () => null,
}));
vi.mock(
  '@/components/business-component/PaymentSubscriptionModal',
  async () => {
    const React = await import('react');
    return {
      default: (props: any) => {
        paymentModal.props = props;
        return props.open
          ? React.createElement('div', { 'data-testid': 'payment-modal' })
          : null;
      },
    };
  },
);
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/constants/images.constants', () => ({
  ICON_MESSAGE: () => null,
  ICON_STAR: () => null,
  ICON_STAR_FILL: () => null,
  ICON_USER: () => null,
}));

const expert = (overloads: Record<string, unknown>) => ({
  description: '',
  icon: '',
  statistics: { userCount: 0, convCount: 0, collectCount: 0 },
  ...overloads,
});

beforeEach(() => {
  vi.clearAllMocks();
  tenantConfig.enableSubscription = 1;
  // 详情复核缺省口径：确实付费且未订阅（命中弹套餐）
  apiPublishedAgentInfo.mockResolvedValue({
    code: '0000',
    data: { paymentRequired: true, subscribed: false },
  });
  apiPublishedAgentList.mockResolvedValue({
    code: '0000',
    data: {
      records: [
        expert({
          id: 11,
          targetId: 101,
          name: '付费专家',
          paymentRequired: true,
          subscribed: false,
        }),
        expert({
          id: 12,
          targetId: 102,
          name: '免费专家',
          paymentRequired: false,
        }),
        expert({
          id: 13,
          targetId: 103,
          name: '已订阅专家',
          paymentRequired: true,
          subscribed: true,
        }),
      ],
      current: 1,
      pages: 1,
    },
  });
});

afterEach(cleanup);

const renderModal = (
  onSelect: ReturnType<typeof vi.fn>,
  type: 'expert' | 'skill' = 'expert',
) =>
  render(
    <CapabilityModal
      open
      onClose={vi.fn()}
      onSelect={onSelect}
      defaultResourceType={type}
    />,
  );

/** 点击指定卡上的主按钮（专家=聘请 / 技能=选择，按钮按卡片顺序一一对应）。
 *  专家卡标识 data-capability-key、SkillListView 条目标识 data-skill-key */
const CARD_KEY_SELECTOR =
  '[data-capability-key], [data-skill-key], [data-expert-key]';
const clickCardAction = async (
  name: string,
  label:
    | 'PC.Components.CapabilityModal.hire'
    | 'PC.Components.CapabilityModal.select',
) => {
  const card = await screen.findByText(name);
  const buttons = screen.getAllByText(label);
  const cards = document.querySelectorAll(CARD_KEY_SELECTOR);
  const index = Array.from(cards).indexOf(card.closest(CARD_KEY_SELECTOR)!);
  fireEvent.click(buttons[index]);
};

describe('能力弹窗·付费专家聘请拦截（复用智能体详情订阅链路）', () => {
  it('付费未订阅：详情复核确认后弹统一专家卡（卡内自拉套餐），不触发选中', async () => {
    const onSelect = vi.fn();
    renderModal(onSelect);

    await clickCardAction('付费专家', 'PC.Components.CapabilityModal.hire');
    // 列表口径命中后先按详情接口复核
    await waitFor(() =>
      expect(apiPublishedAgentInfo).toHaveBeenCalledWith(101),
    );
    // 复核确认待订阅 → 弹统一专家卡（召唤按钮 + 内联套餐区，套餐由卡内自拉）
    await screen.findByText('PC.Components.ExpertSummonCard.summon');
    await screen.findByText(
      'PC.Components.PaymentSubscriptionModal.titleSelectPlan',
    );
    await waitFor(() =>
      expect(queryAgentSubscriptionPlans).toHaveBeenCalledWith(101),
    );
    // 原套餐弹窗（Agent 口径）不再由弹窗持有——技能口径内聚在 SkillListView
    expect(paymentModal.props.open).toBeFalsy();
    // 未订阅完成前不选中、不关闭
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('专家卡弹窗内召唤：订阅后复核已订阅放行，选中带 subscribed 且关闭', async () => {
    // 复核时序：聘请复核(待订阅) → 卡挂载复核(待订阅) → 召唤复核(已订阅)
    apiPublishedAgentInfo
      .mockResolvedValueOnce({
        code: '0000',
        data: { paymentRequired: true, subscribed: false },
      })
      .mockResolvedValueOnce({
        code: '0000',
        data: { paymentRequired: true, subscribed: false },
      })
      .mockResolvedValue({
        code: '0000',
        data: { paymentRequired: true, subscribed: true },
      });
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <CapabilityModal
        open
        onClose={onClose}
        onSelect={onSelect}
        defaultResourceType="expert"
      />,
    );

    await clickCardAction('付费专家', 'PC.Components.CapabilityModal.hire');
    const summonBtn = await screen.findByText(
      'PC.Components.ExpertSummonCard.summon',
    );
    // 卡内点「召唤专家」：复核已订阅 → 放行回传 subscribed=true 并关闭
    fireEvent.click(summonBtn.closest('button')!);
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      resourceType: 'expert',
      targetId: 101,
      subscribed: true,
    });
    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByText('PC.Components.ExpertSummonCard.summon'),
      ).toBeNull(),
    );
  });

  it('列表显示付费未订阅，但详情已订阅（如已领免费套餐）：直接聘请不弹套餐', async () => {
    apiPublishedAgentInfo.mockResolvedValue({
      code: '0000',
      data: { paymentRequired: true, subscribed: true },
    });
    const onSelect = vi.fn();
    renderModal(onSelect);

    await clickCardAction('付费专家', 'PC.Components.CapabilityModal.hire');
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      resourceType: 'expert',
      targetId: 101,
    });
    expect(queryAgentSubscriptionPlans).not.toHaveBeenCalled();
    expect(paymentModal.props.open).toBeFalsy();
    // 卡片状态回写：付费标识切换为已订阅（按卡片 key 精确定位，
    // 列表中另有一个原生已订阅专家也会渲染同文案；付费标识为 Badge.Ribbon，
    // 文案在卡片外层 wrapper 上，连同 wrapper 一起断言）
    const patchedCard = document.querySelector(
      '[data-expert-key="expert:system:11"]',
    );
    expect(patchedCard?.closest('.ant-ribbon-wrapper')?.textContent).toContain(
      'PC.Pages.Square.SingleAgent.subscribed',
    );
  });

  it('详情复核接口异常：保守按列表口径弹统一专家卡', async () => {
    apiPublishedAgentInfo.mockRejectedValue(new Error('network'));
    const onSelect = vi.fn();
    renderModal(onSelect);

    await clickCardAction('付费专家', 'PC.Components.CapabilityModal.hire');
    await screen.findByText('PC.Components.ExpertSummonCard.summon');
    expect(paymentModal.props.open).toBeFalsy();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('免费专家：照常直选', async () => {
    const onSelect = vi.fn();
    renderModal(onSelect);

    await clickCardAction('免费专家', 'PC.Components.CapabilityModal.hire');
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      resourceType: 'expert',
      targetId: 102,
    });
    expect(queryAgentSubscriptionPlans).not.toHaveBeenCalled();
  });

  it('已订阅专家：直选不弹套餐', async () => {
    const onSelect = vi.fn();
    renderModal(onSelect);

    await clickCardAction('已订阅专家', 'PC.Components.CapabilityModal.hire');
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(paymentModal.props.open).toBeFalsy();
  });

  it('租户未开启订阅：付费未订阅也直选（对齐广场口径）', async () => {
    tenantConfig.enableSubscription = 0;
    const onSelect = vi.fn();
    renderModal(onSelect);

    await clickCardAction('付费专家', 'PC.Components.CapabilityModal.hire');
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(queryAgentSubscriptionPlans).not.toHaveBeenCalled();
  });

  it('专家卡简化：与技能卡同款布局，无官方/作者/统计/收藏，聘请悬停浮现', async () => {
    apiPublishedAgentList.mockResolvedValue({
      code: '0000',
      data: {
        records: [
          expert({
            id: 14,
            targetId: 104,
            name: '简化专家',
            description: '一句话简介',
            official: true,
            collect: true,
            statistics: { userCount: 12, convCount: 34, collectCount: 56 },
            publishUser: { nickName: '作者乙', userName: 'b' },
          }),
        ],
        current: 1,
        pages: 1,
      },
    });
    renderModal(vi.fn());

    await screen.findByText('简化专家');
    const card = document.querySelector(
      '[data-expert-key="expert:system:14"]',
    )!;
    // 简化：无官方徽标/作者/统计行/收藏入口
    expect(card.textContent).not.toContain(
      'PC.Components.CapabilityModal.official',
    );
    expect(card.textContent).not.toContain('作者乙');
    expect(card.textContent).not.toContain(
      'PC.Components.CapabilityModal.collect',
    );
    // 聘请按钮：悬停浮现（card-hire）+ 方形圆角 tint 底（card-select），无开关
    const hireBtn = Array.from(card.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'PC.Components.CapabilityModal.hire',
    );
    expect(hireBtn?.className).toContain('card-hire');
    expect(hireBtn?.className).toContain('card-select');
    expect(card.querySelector('[role="switch"]')).toBeNull();
    // 名称下一行的单行描述（ExpertListView 双变体共用 .card-desc）
    expect(card.querySelector('.card-desc')).toBeTruthy();
  });
});

describe('能力弹窗·付费技能选择拦截（复用技能详情订阅链路）', () => {
  beforeEach(() => {
    // 技能详情复核缺省口径：确实付费且未订阅
    apiPublishedSkillDetail.mockResolvedValue({
      code: '0000',
      data: { paymentRequired: true, subscribed: false },
    });
    apiPublishedSkillList.mockResolvedValue({
      code: '0000',
      data: {
        records: [
          expert({
            id: 21,
            targetId: 201,
            name: '付费技能',
            paymentRequired: true,
            subscribed: false,
          }),
          expert({
            id: 22,
            targetId: 202,
            name: '免费技能',
            paymentRequired: false,
          }),
        ],
        current: 1,
        pages: 1,
      },
    });
  });

  it('付费未订阅：技能详情复核确认后弹套餐弹窗（Skill 口径），不触发选中', async () => {
    const onSelect = vi.fn();
    renderModal(onSelect, 'skill');

    await clickCardAction('付费技能', 'PC.Components.CapabilityModal.select');
    // 技能走技能详情接口复核 + 技能定价套餐查询
    await waitFor(() =>
      expect(apiPublishedSkillDetail).toHaveBeenCalledWith(201),
    );
    await waitFor(() =>
      expect(querySkillSubscriptionPlans).toHaveBeenCalledWith(201),
    );
    expect(paymentModal.props.open).toBe(true);
    expect(paymentModal.props.targetType).toBe('Skill');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('列表付费未订阅但详情已订阅（免费套餐）：直选且选中项带 subscribed=true（chip 插入不二次弹）', async () => {
    apiPublishedSkillDetail.mockResolvedValue({
      code: '0000',
      data: { paymentRequired: true, subscribed: true },
    });
    const onSelect = vi.fn();
    renderModal(onSelect, 'skill');

    await clickCardAction('付费技能', 'PC.Components.CapabilityModal.select');
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      resourceType: 'skill',
      targetId: 201,
      subscribed: true,
    });
    expect(querySkillSubscriptionPlans).not.toHaveBeenCalled();
    expect(paymentModal.props.open).toBeFalsy();
  });

  it('免费技能：直选不复核', async () => {
    const onSelect = vi.fn();
    renderModal(onSelect, 'skill');

    await clickCardAction('免费技能', 'PC.Components.CapabilityModal.select');
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(apiPublishedSkillDetail).not.toHaveBeenCalled();
    expect(querySkillSubscriptionPlans).not.toHaveBeenCalled();
  });
});
