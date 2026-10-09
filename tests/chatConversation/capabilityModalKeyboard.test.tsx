/**
 * 能力弹窗·键盘导航契约（Tab 换区 + 方向键区内换项）：
 * - 快捷键提示区已移除（不再渲染 hintNav/hintSelect/hintClose）；
 * - Tab 焦点轮询（focus trap）只换区不操作：按「左侧类型导航 → 数据源
 *   页签 → 搜索 → 关闭 → 分类 pill → 列表容器」循环，Shift+Tab 反向；
 *   停靠时焦点落在各分组当前选中项（menu 选中项 / 激活 tab / 激活 pill），
 *   弹窗打开时初始聚焦列表容器；
 * - 区内切换走各分组方向键：分类 pill ←→ 循环切换 + Home/End 首末项
 *   （移动即激活，aria-pressed 跟随）；
 * - 列表导航仅在焦点位于列表区（弹窗根/列表容器）时生效（分类 pill 上
 *   ↑↓ 不联动列表）：方向键逐项切换（↓/→ 下一项、↑/← 上一项）+ Enter
 *   触发卡片主操作（免费技能直通 onSelect 并关闭弹窗）；Esc 任意位置关闭；
 *   弹窗打开默认聚焦弹窗根（无描边）。
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

/** 列表停靠容器（列表方向键导航的生效范围） */
const getListContainer = () =>
  document.querySelector<HTMLElement>('[data-capability-list]')!;

/** 从当前焦点出发按 Tab（focus trap 走弹窗根上的 onKeyDown，事件冒泡可达） */
const pressTab = (shift = false) => {
  fireEvent.keyDown(document.activeElement!, {
    key: 'Tab',
    ...(shift ? { shiftKey: true } : {}),
  });
};

describe('能力弹窗·快捷键提示移除', () => {
  it('侧栏不再渲染 方向键移动/回车选中/Esc 关闭 提示', async () => {
    await renderAndWaitRoot();
    expect(
      screen.queryByText('PC.Components.CapabilityModal.hintNav'),
    ).toBeNull();
    expect(
      screen.queryByText('PC.Components.CapabilityModal.hintSelect'),
    ).toBeNull();
    expect(
      screen.queryByText('PC.Components.CapabilityModal.hintClose'),
    ).toBeNull();
  });
});

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
});

describe('能力弹窗·内嵌列表键盘导航（技能维度）', () => {
  it('打开默认聚焦弹窗根（无描边）；↓ 逐项到首卡并高亮，再 ↓ 下一卡，Enter 触发选中并关闭', async () => {
    const root = await renderAndWaitRoot();

    // 弹窗打开默认聚焦弹窗根（outline:none 无描边），根同属列表区
    await waitFor(() => {
      expect(document.activeElement).toBe(root);
    });

    fireEvent.keyDown(root, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(
        document
          .querySelector('[data-skill-key="skill:system:21"]')
          ?.classList.contains('capability-embed-card-focus'),
      ).toBe(true);
    });

    // 逐项切换：↓ = 下一项（0 → 1）
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(
        document
          .querySelector('[data-skill-key="skill:system:22"]')
          ?.classList.contains('capability-embed-card-focus'),
      ).toBe(true);
    });

    // Enter 触发卡片原生 click（免费技能直通 onSelect），closeOnSelect 收口关闭
    fireEvent.keyDown(root, { key: 'Enter' });
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: '写作技能', resourceType: 'skill' }),
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('列表导航仅在列表区（弹窗根/列表容器）生效：pill 上 ↑↓ 不联动列表', async () => {
    await renderAndWaitRoot();
    const container = getListContainer();

    // 焦点停在分类 pill 上按 ↑↓：列表不联动、焦点不离开 pill
    const pills =
      document.querySelectorAll<HTMLButtonElement>('.category-pill');
    pills[0].focus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(
      document.querySelectorAll('.capability-embed-card-focus').length,
    ).toBe(0);
    expect(document.activeElement).toBe(pills[0]);

    // 聚焦列表容器后同一按键生效：首卡高亮
    container.focus();
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(
        document
          .querySelector('[data-skill-key="skill:system:21"]')
          ?.classList.contains('capability-embed-card-focus'),
      ).toBe(true);
    });
  });

  it('Esc 关闭弹窗（任意焦点位置）', async () => {
    const root = await renderAndWaitRoot();
    fireEvent.keyDown(root, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('能力弹窗·分类 pill ←→ 切换', () => {
  it('→ 从"全部"切到"写作"：移动即激活（aria-pressed 跟随）', async () => {
    await renderAndWaitRoot();

    const pills = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.category-pill'),
    );
    expect(pills.length).toBe(3);
    // roving tabindex：仅激活的"全部"可 Tab 停靠
    expect(pills[0].tabIndex).toBe(0);
    expect(pills[1].tabIndex).toBe(-1);

    pills[0].focus();
    fireEvent.keyDown(pills[0], { key: 'ArrowRight' });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('写作');
    });
    expect(document.activeElement?.getAttribute('aria-pressed')).toBe('true');
    // 原"全部"失活
    expect(pills[0].getAttribute('aria-pressed')).toBe('false');
    expect(pills[1].tabIndex).toBe(0);

    // ← 切回"全部"（循环切换）
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    await waitFor(() => {
      expect(pills[0].getAttribute('aria-pressed')).toBe('true');
    });

    // End 直达末项"翻译"，Home 回首项"全部"（均移动即激活）
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('翻译');
    });
    expect(pills[2].getAttribute('aria-pressed')).toBe('true');

    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe(
        'PC.Components.CapabilityModal.tabAll',
      );
    });
    expect(pills[0].getAttribute('aria-pressed')).toBe('true');
  });
});
