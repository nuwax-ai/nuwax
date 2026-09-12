/**
 * 能力弹窗·技能卡简化 + 启用开关契约（替代原「钉住」）：
 * - 技能卡常驻「选择」按钮与启用开关（无作者/统计/收藏/钉住）；
 * - 启用开关 → POST /api/published/skill/enable/:skillId（targetId 寻址），
 *   成功后就地回写卡片 enabled 并重拉「我启用的」列表 → 页签出现；
 * - 「我启用的」页签仅在有启用技能时显示、位于数据源 tab 最前；聚合视图
 *   隐藏分类 pill；
 * - 聚合视图取消启用 → unEnable 成功重拉为空 → 页签隐藏并回落系统广场；
 * - 无启用技能时页签不显示。
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

const apiPublishedSkillList = vi.hoisted(() => vi.fn());
const apiPublishedSkillEnable = vi.hoisted(() => vi.fn());
const apiPublishedSkillUnEnable = vi.hoisted(() => vi.fn());
const apiPublishedSkillEnableList = vi.hoisted(() => vi.fn());

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

// 技能维度列表已接入 SkillListView,其自带 less 同样 mock
vi.mock('@/components/business-component/SkillListView/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/business-component/ExpertSummonModal/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock(
  '@/components/business-component/ConnectorDeviceAuthModal/index.less',
  () => ({
    default: new Proxy({}, { get: (_, key) => String(key) }),
  }),
);

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: { enableSubscription: 1 } }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/square', () => ({
  apiPublishedSkillList,
  apiPublishedSkillEnable,
  apiPublishedSkillUnEnable,
  apiPublishedSkillEnableList,
  apiPublishedAgentList: vi.fn(),
  apiPublishedCategoryList: vi.fn().mockResolvedValue({ data: [] }),
  apiPublishedSkillCollect: vi.fn(),
  apiPublishedSkillUnCollect: vi.fn(),
}));

vi.mock('@/services/skill', () => ({
  apiPublishedSkillDetail: vi.fn(),
}));
vi.mock('@/services/workspace', () => ({ apiSpaceList: vi.fn() }));
vi.mock('@/services/repo', () => ({ apiRepoSpaceTree: vi.fn() }));
vi.mock('@/services/agentDev', () => ({
  apiCollectAgent: vi.fn(),
  apiUnCollectAgent: vi.fn(),
  apiPublishedAgentInfo: vi.fn(),
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
vi.mock('@/constants/images.constants', () => ({
  ICON_MESSAGE: () => null,
  ICON_STAR: () => null,
  ICON_STAR_FILL: () => null,
  ICON_USER: () => null,
}));

const skill = (overloads: Record<string, unknown>) => ({
  description: '技能描述',
  icon: '',
  statistics: { userCount: 0, convCount: 0, collectCount: 0 },
  publishUser: { nickName: '作者甲', userName: 'author' },
  ...overloads,
});

beforeEach(() => {
  vi.clearAllMocks();
  // 系统广场技能列表：两个免费技能（付费拦截链路不介入）
  apiPublishedSkillList.mockResolvedValue({
    code: '0000',
    data: {
      records: [
        skill({ id: 21, targetId: 201, name: '翻译技能', enabled: false }),
        skill({ id: 22, targetId: 202, name: '写作技能', enabled: true }),
      ],
      current: 1,
      pages: 1,
    },
  });
  // 已启用列表缺省：空（页签不显示）
  apiPublishedSkillEnableList.mockResolvedValue({ code: '0000', data: [] });
  apiPublishedSkillEnable.mockResolvedValue({ code: '0000', data: null });
  apiPublishedSkillUnEnable.mockResolvedValue({ code: '0000', data: null });
});

afterEach(cleanup);

const renderSkillModal = () =>
  render(
    <CapabilityModal
      open
      onClose={vi.fn()}
      onSelect={vi.fn()}
      defaultResourceType="skill"
    />,
  );

/** 定位指定条目内的启用开关（SkillListView 条目标识为 data-skill-key） */
const switchOfCard = (key: string) =>
  document
    .querySelector(`[data-skill-key="${key}"]`)
    ?.querySelector<HTMLButtonElement>('[role="switch"]') ?? null;

describe('能力弹窗·技能卡简化样式（开关替代钉住）', () => {
  it('技能卡：悬停浮现「选择」（方形圆角）+ 常驻启用开关，无作者/统计/收藏', async () => {
    apiPublishedSkillList.mockResolvedValue({
      code: '0000',
      data: {
        records: [
          skill({
            id: 21,
            targetId: 201,
            name: '付费技能',
            enabled: false,
            paymentRequired: true,
            subscribed: false,
          }),
          skill({ id: 22, targetId: 202, name: '写作技能', enabled: true }),
        ],
        current: 1,
        pages: 1,
      },
    });
    renderSkillModal();

    await screen.findByText('付费技能');
    const card = document.querySelector('[data-skill-key="skill:system:21"]')!;
    // 选择按钮：挂 .card-hire 悬停浮现类（默认 opacity 隐藏，hover/聚焦时浮现）
    const selectBtn = Array.from(card.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'PC.Components.CapabilityModal.select',
    );
    expect(selectBtn).toBeTruthy();
    expect(selectBtn?.className).toContain('card-hire');
    expect(selectBtn?.className).not.toContain('ant-btn-round');
    // 常驻启用开关
    expect(switchOfCard('skill:system:21')).toBeTruthy();
    // 简化：无作者/统计行/收藏入口，付费走 Badge.Ribbon 左上角角标
    // （ribbon 文案在卡片外层 wrapper 上，连同 wrapper 一起断言）
    expect(card.textContent).not.toContain('作者甲');
    expect(card.closest('.ant-ribbon-wrapper')?.textContent).toContain(
      'PC.Pages.Square.SingleAgent.paid',
    );
    // 开关初始态：列表 enabled 驱动（付费技能 enabled=false）
    expect(switchOfCard('skill:system:21')?.getAttribute('aria-checked')).toBe(
      'false',
    );
    // 已启用技能卡开关初始为 on
    await screen.findByText('写作技能');
    expect(switchOfCard('skill:system:22')?.getAttribute('aria-checked')).toBe(
      'true',
    );
  });
});

describe('能力弹窗·技能启用/取消启用 + 「我启用的」页签', () => {
  it('无启用技能：不显示「我启用的」页签', async () => {
    renderSkillModal();
    await screen.findByText('翻译技能');
    expect(
      screen.queryByText('PC.Components.CapabilityModal.mainTabEnabled'),
    ).toBeNull();
  });

  it('启用：enable(targetId) 成功后回写开关并重拉列表，页签出现；聚合视图隐藏分类 pill', async () => {
    // 调用序列（接入 SkillListView 后）：弹窗可见性 hook 首拉（空）→
    // 组件内开关成功经 onEnabledChange 重拉（启用项）→ 聚合视图挂载再拉（启用项）。
    // enable/list 条目即使显式下发 enabled:false 也一律按已启用渲染
    apiPublishedSkillEnableList
      .mockResolvedValueOnce({ code: '0000', data: [] })
      .mockResolvedValue({
        code: '0000',
        data: [
          skill({ id: 31, targetId: 201, name: '翻译技能', enabled: false }),
        ],
      });
    renderSkillModal();
    await screen.findByText('翻译技能');

    // 打开翻译技能的启用开关（按 targetId 寻址）
    fireEvent.click(switchOfCard('skill:system:21')!);
    await waitFor(() =>
      expect(apiPublishedSkillEnable).toHaveBeenCalledWith(201),
    );
    // 成功后：卡片开关就地回写为 on + 已启用列表重拉（可见性 hook）
    await waitFor(() =>
      expect(
        apiPublishedSkillEnableList.mock.calls.length,
      ).toBeGreaterThanOrEqual(2),
    );
    await waitFor(() =>
      expect(
        switchOfCard('skill:system:21')?.getAttribute('aria-checked'),
      ).toBe('true'),
    );

    // 页签出现且位于 tab 行最前（antd Tabs 结构：tablist > nav-wrap > list > tab 节点，
    // 断言首个 tab 节点即「我启用的」）
    const tab = await screen.findByText(
      'PC.Components.CapabilityModal.mainTabEnabled',
    );
    const tabsRow = tab.closest('[role="tablist"]')!;
    expect(tabsRow.querySelector('.ant-tabs-tab')?.textContent).toContain(
      'PC.Components.CapabilityModal.mainTabEnabled',
    );

    // 进入聚合视图：展示已启用条目，分类 pill 不再渲染
    fireEvent.click(tab);
    await waitFor(() =>
      expect(
        document.querySelector('[data-skill-key="skill:enabled:31"]'),
      ).toBeTruthy(),
    );
    // 能拉到的即已启用：聚合视图开关显示为 on（不依赖条目级 enabled 字段）
    expect(switchOfCard('skill:enabled:31')?.getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(
      screen.queryByText('PC.Components.CapabilityModal.tabAll'),
    ).toBeNull();
    // 聚合视图条目仍可正常选中
    expect(
      document.querySelector('[data-skill-key="skill:system:21"]'),
    ).toBeNull();
  });

  it('聚合视图取消启用最后一项：unEnable 成功重拉为空 → 页签隐藏并回落系统广场', async () => {
    // 数据源随取消启用翻转：首拉（弹窗可见性 hook + 聚合视图挂载）有启用项，
    // unEnable 成功后置空 → 组件/可见性 hook 的重拉均拿到空 → 页签隐藏回落
    let enabledData = [
      skill({ id: 31, targetId: 201, name: '翻译技能', enabled: false }),
    ];
    apiPublishedSkillEnableList.mockImplementation(async () => ({
      code: '0000',
      data: enabledData,
    }));
    apiPublishedSkillUnEnable.mockImplementation(async () => {
      enabledData = [];
      return { code: '0000', data: null };
    });
    renderSkillModal();

    const tab = await screen.findByText(
      'PC.Components.CapabilityModal.mainTabEnabled',
    );
    fireEvent.click(tab);
    await screen.findByText('翻译技能');

    // 能拉到的即已启用：开关显示为 on（不依赖条目级 enabled 字段）
    expect(switchOfCard('skill:enabled:31')?.getAttribute('aria-checked')).toBe(
      'true',
    );

    // 关掉唯一启用技能的开关
    fireEvent.click(switchOfCard('skill:enabled:31')!);
    await waitFor(() =>
      expect(apiPublishedSkillUnEnable).toHaveBeenCalledWith(201),
    );
    // 重拉为空：页签消失，视图回落系统广场列表
    await waitFor(() =>
      expect(
        screen.queryByText('PC.Components.CapabilityModal.mainTabEnabled'),
      ).toBeNull(),
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-skill-key="skill:system:21"]'),
      ).toBeTruthy(),
    );
  });
});
