/**
 * 能力弹窗·专家「最近召唤」页签契约（复用最近使用接口 used/list）：
 * - 无最近使用记录：不显示「最近召唤」页签；
 * - 有记录：页签显示且位于数据源 tab 最前（系统广场/团队空间之前）；
 * - 聚合视图：卡片为简化专家卡（无开关），右上角展示最近使用相对时间，
 *   聘请按钮悬停浮现、按 targetId=agentId 选中回传；
 * - 分类 pill 行在聚合视图隐藏。
 * 渲染整组件：services/umi/useSubscription/子弹窗全部 mock（vitest 不可用 umi request）；
 * utils/common 不 mock——formatTimeAgo 真实执行，i18n dict mock 为 key 回显。
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

const apiUserUsedAgentList = vi.hoisted(() => vi.fn());
const apiPublishedAgentList = vi.hoisted(() => vi.fn());

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

vi.mock('@/components/business-component/ExpertListView/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: { enableSubscription: 1 } }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/agentDev', () => ({
  apiUserUsedAgentList,
  apiPublishedAgentInfo: vi.fn(),
  apiCollectAgent: vi.fn(),
  apiUnCollectAgent: vi.fn(),
}));

vi.mock('@/services/square', () => ({
  apiPublishedAgentList,
  apiPublishedSkillList: vi.fn(),
  apiPublishedCategoryList: vi.fn().mockResolvedValue({ data: [] }),
  apiPublishedSkillEnable: vi.fn(),
  apiPublishedSkillUnEnable: vi.fn(),
  apiPublishedSkillEnableList: vi
    .fn()
    .mockResolvedValue({ code: '0000', data: [] }),
  apiPublishedSkillCollect: vi.fn(),
  apiPublishedSkillUnCollect: vi.fn(),
}));

vi.mock('@/services/skill', () => ({
  apiPublishedSkillDetail: vi.fn(),
}));
vi.mock('@/services/workspace', () => ({ apiSpaceList: vi.fn() }));
vi.mock('@/services/repo', () => ({ apiRepoSpaceTree: vi.fn() }));
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
    createSubscriptionOrder: vi.fn(),
    queryAgentSubscriptionPlans: vi.fn(),
    querySkillSubscriptionPlans: vi.fn(),
  }),
}));

vi.mock('@/components/business-component/ConnectorConnectModal', () => ({
  default: () => null,
}));
vi.mock('@/components/business-component/PaymentSubscriptionModal', () => ({
  default: () => null,
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));

/** 最近使用时间（N 小时前，ISO 串） */
const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  // 系统广场专家列表（默认视图兜底）
  apiPublishedAgentList.mockResolvedValue({
    code: '0000',
    data: {
      records: [
        {
          id: 11,
          targetId: 101,
          name: '系统广场专家',
          description: '',
          icon: '',
          statistics: { userCount: 0, convCount: 0, collectCount: 0 },
        },
      ],
      current: 1,
      pages: 1,
    },
  });
  // 最近使用缺省：无记录（页签不显示）
  apiUserUsedAgentList.mockResolvedValue({ code: '0000', data: [] });
});

afterEach(cleanup);

const renderExpertModal = (onSelect: ReturnType<typeof vi.fn>) =>
  render(
    <CapabilityModal
      open
      onClose={vi.fn()}
      onSelect={onSelect}
      defaultResourceType="expert"
    />,
  );

describe('能力弹窗·专家「最近召唤」页签（复用最近使用接口）', () => {
  it('无最近使用记录：不显示「最近召唤」页签', async () => {
    renderExpertModal(vi.fn());
    await screen.findByText('系统广场专家');
    expect(
      screen.queryByText('PC.Components.CapabilityModal.mainTabUsed'),
    ).toBeNull();
  });

  it('有记录：页签置于 tab 最前；聚合视图卡片展示相对时间并可聘请', async () => {
    apiUserUsedAgentList.mockResolvedValue({
      code: '0000',
      data: [
        {
          id: 41,
          agentId: 401,
          name: '召唤专家',
          description: '最近召唤过的专家',
          icon: '',
          modified: hoursAgo(5),
          agentType: 'ChatBot',
          spaceId: 1,
          userId: 1,
        },
      ],
    });
    const onSelect = vi.fn();
    renderExpertModal(onSelect);

    // 页签出现且位于 tab 行最前（antd Tabs 结构，断言首个 tab 节点即「最近召唤」）
    const tab = await screen.findByText(
      'PC.Components.CapabilityModal.mainTabUsed',
    );
    const tabsRow = tab.closest('[role="tablist"]')!;
    expect(tabsRow.querySelector('.ant-tabs-tab')?.textContent).toContain(
      'PC.Components.CapabilityModal.mainTabUsed',
    );

    // 进入聚合视图：展示最近使用条目（key 按聚合态 used 标识）
    fireEvent.click(tab);
    const card = await waitFor(() => {
      const el = document.querySelector('[data-expert-key="expert:used:41"]');
      expect(el).toBeTruthy();
      return el!;
    });
    // 右上角相对时间（5 小时前 → hoursAgo 文案）；专家卡无启用开关
    expect(card.textContent).toContain('PC.Utils.Common.hoursAgo');
    expect(card.querySelector('[role="switch"]')).toBeNull();
    // 分类 pill 行隐藏
    expect(
      screen.queryByText('PC.Components.CapabilityModal.tabAll'),
    ).toBeNull();

    // 聘请：按 targetId=agentId 选中回传（悬停浮现按钮，fireEvent 不受 opacity 影响）
    const hireBtn = Array.from(card.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'PC.Components.CapabilityModal.hire',
    );
    expect(hireBtn?.className).toContain('card-hire');
    fireEvent.click(hireBtn!);
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      resourceType: 'expert',
      targetId: 401,
    });
  });
});
