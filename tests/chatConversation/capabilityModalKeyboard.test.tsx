/**
 * 能力弹窗·键盘焦点陷阱契约：
 * - Tab 焦点轮询（focus trap）只换区不操作：按「左侧类型导航 → 数据源
 *   页签 → 搜索 → 关闭 → 分类 pill → 列表容器」循环，Shift+Tab 反向；
 * - Esc 任意位置关闭弹窗。
 * 列表内 ↑↓/Enter 与分类 pill ←→ 属列表层交互，由页面走查与列表层覆盖；
 * 不在此重复断言外观与逐卡导航。
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
const apiPublishedCategoryList = vi.hoisted(() => vi.fn());

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
  apiPublishedCategoryList,
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
  // 系统广场技能分类：根节点 Skill 下两个二级分类（pill 行 = 全部 + 写作 + 翻译）
  apiPublishedCategoryList.mockResolvedValue({
    code: '0000',
    data: [
      {
        type: 'Skill',
        key: 'Skill',
        children: [
          { key: 'write', label: '写作' },
          { key: 'translate', label: '翻译' },
        ],
      },
    ],
  });
  // 已启用列表缺省：空（页签不显示）
  apiPublishedSkillEnableList.mockResolvedValue({ code: '0000', data: [] });
  apiPublishedSkillEnable.mockResolvedValue({ code: '0000', data: null });
  apiPublishedSkillUnEnable.mockResolvedValue({ code: '0000', data: null });
});

afterEach(cleanup);

const onSelect = vi.fn();
const onClose = vi.fn();

const renderSkillModal = () =>
  render(
    <CapabilityModal
      open
      onClose={onClose}
      onSelect={onSelect}
      defaultResourceType="skill"
    />,
  );

/** 等待技能卡就绪后取弹窗根节点（键盘事件挂载点） */
const renderAndWaitRoot = async () => {
  renderSkillModal();
  await screen.findByText('翻译技能');
  await waitFor(() => {
    expect(document.querySelector('[data-skill-key]')).toBeTruthy();
  });
  return document.querySelector<HTMLElement>('.root')!;
};

/** 从当前焦点出发按 Tab（focus trap 走弹窗根上的 onKeyDown，事件冒泡可达） */
const pressTab = (shift = false) => {
  fireEvent.keyDown(document.activeElement!, {
    key: 'Tab',
    ...(shift ? { shiftKey: true } : {}),
  });
};

describe('能力弹窗·Tab 焦点轮询（focus trap）', () => {
  it('正向循环：左侧导航 → 页签 → 搜索 → 关闭 → 激活 pill → 列表容器 → 回左侧导航', async () => {
    await renderAndWaitRoot();

    // 列表停靠点出发 → 左侧类型导航（技能选中项）
    pressTab();
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    expect(
      document.activeElement?.classList.contains('ant-menu-item-selected'),
    ).toBe(true);

    // → 数据源页签（系统广场激活）
    pressTab();
    expect(document.activeElement?.getAttribute('role')).toBe('tab');
    expect(document.activeElement?.getAttribute('aria-selected')).toBe('true');

    // → 搜索按钮（收起态）
    pressTab();
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'PC.Components.CapabilityModal.searchPlaceholder',
    );

    // → 关闭按钮
    pressTab();
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'PC.Components.CapabilityModal.close',
    );

    // → 分类 pill 分组：停靠当前激活的"全部"（Tab 只换区，组内 ←→ 切换）
    pressTab();
    expect(document.activeElement?.className).toContain('category-pill');
    expect(document.activeElement?.className).toContain('category-pill-active');
    expect(document.activeElement?.textContent).toBe(
      'PC.Components.CapabilityModal.tabAll',
    );

    // → 列表容器（内嵌列表外层停靠容器）
    pressTab();
    expect(document.activeElement?.hasAttribute('data-capability-list')).toBe(
      true,
    );

    // → 轮询回左侧导航
    pressTab();
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');

    // Shift+Tab 反向逐区返回：导航 → 列表容器 → 激活 pill
    pressTab(true);
    expect(document.activeElement?.hasAttribute('data-capability-list')).toBe(
      true,
    );
    pressTab(true);
    expect(document.activeElement?.className).toContain('category-pill-active');
  });

  it('Shift+Tab 反向：列表停靠点 → 激活 pill（组首再反向出组）→ 关闭 → 搜索', async () => {
    const root = await renderAndWaitRoot();

    // 初始激活"全部"（组首）：反向停靠后继续反向出组到关闭
    pressTab(true);
    expect(document.activeElement?.className).toContain('category-pill-active');

    pressTab(true);
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'PC.Components.CapabilityModal.close',
    );

    // 从关闭继续反向应到搜索，且焦点始终不出弹窗
    pressTab(true);
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'PC.Components.CapabilityModal.searchPlaceholder',
    );
    expect(root.contains(document.activeElement)).toBe(true);
  });

  it('Esc 关闭弹窗（任意焦点位置）', async () => {
    const root = await renderAndWaitRoot();
    fireEvent.keyDown(root, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
