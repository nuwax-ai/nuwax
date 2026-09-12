/**
 * 能力弹窗·资料库「最近访问」页签契约（门户最近访问接口 recently-accessed）：
 * - 无最近访问记录：不显示「最近访问」pill，默认回落首空间（repo 树接口加载）；
 * - 有记录：pill 置于空间 pill 最前且默认选中，聚合视图不触发 repo 树接口；
 * - 资料卡为横向新样式：文件格式 tinted 图标 + 名称 + 右端相对时间/格式胶囊；
 *   卡片主体点击不选中，「选择」按钮（悬停浮现）按 slugId/pageType 选中回传；
 * - 点击空间 pill 退出聚合视图，切回该空间 repo 树列表。
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

const apiRepoRecentlyAccessedPages = vi.hoisted(() => vi.fn());
const apiRepoSpaceTree = vi.hoisted(() => vi.fn());
const apiSpaceList = vi.hoisted(() => vi.fn());

vi.mock('@/components/ChatInputHome/CapabilityModal/index.less', () => ({
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

// 资料卡类型图标（FileTypeIcon）自带 less 也需 mock,否则 styles 为
// undefined 渲染崩溃（vitest 不走 less 编译管线）
vi.mock('@/components/base/FileTypeIcon/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: { enableSubscription: 1 } }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/repo', () => ({
  apiRepoSpaceTree,
  apiRepoRecentlyAccessedPages,
}));

vi.mock('@/services/workspace', () => ({ apiSpaceList }));

vi.mock('@/services/agentDev', () => ({
  apiUserUsedAgentList: vi.fn(),
  apiPublishedAgentInfo: vi.fn(),
  apiCollectAgent: vi.fn(),
  apiUnCollectAgent: vi.fn(),
}));

vi.mock('@/services/square', () => ({
  apiPublishedAgentList: vi.fn(),
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

/** 最近访问时间（N 小时前，ISO 串） */
const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  // 空间字典：个人空间优先（分类 pill 顺序判定用）
  apiSpaceList.mockResolvedValue({
    data: [
      { id: 1, name: '个人空间', type: 'Personal' },
      { id: 2, name: '团队空间', type: 'Team' },
    ],
  });
  // 首空间 repo 树（回落/切回空间视图的兜底数据）
  apiRepoSpaceTree.mockResolvedValue({
    code: '0000',
    data: [{ page: { id: 11, title: '空间文档', slugId: 'doc-tree' } }],
  });
  // 最近访问缺省：无记录（pill 不显示）
  apiRepoRecentlyAccessedPages.mockResolvedValue({ code: '0000', data: [] });
});

afterEach(cleanup);

const renderKnowledgeModal = (onSelect: ReturnType<typeof vi.fn>) =>
  render(
    <CapabilityModal
      open
      onClose={vi.fn()}
      onSelect={onSelect}
      defaultResourceType="knowledge"
    />,
  );

describe('能力弹窗·资料库「最近访问」页签（门户最近访问接口）', () => {
  it('无最近访问记录：不显示「最近访问」pill，回落首空间 repo 树', async () => {
    renderKnowledgeModal(vi.fn());

    await screen.findByText('空间文档');
    expect(
      screen.queryByText('PC.Components.CapabilityModal.mainTabRecent'),
    ).toBeNull();
    // 回落首空间（个人空间优先）
    expect(apiRepoSpaceTree).toHaveBeenCalledWith(1);
  });

  it('有记录：pill 置于空间 pill 最前且默认选中；卡片横向样式并可整卡选中', async () => {
    apiRepoRecentlyAccessedPages.mockResolvedValue({
      code: '0000',
      data: [
        {
          id: 71,
          slugId: 'doc-a',
          title: '产品需求说明书',
          pageType: 'doc',
          sourceExt: '.pdf',
          time: hoursAgo(5),
          spaceId: 1,
          spaceName: '个人空间',
        },
      ],
    });
    const onSelect = vi.fn();
    renderKnowledgeModal(onSelect);

    // pill 出现且位于分类行最前（「个人空间」之前）
    const pill = await screen.findByText(
      'PC.Components.CapabilityModal.mainTabRecent',
    );
    const categoriesRow = pill.closest('.categories')!;
    expect(categoriesRow.firstElementChild).toBe(pill.closest('button'));
    // 默认进入聚合视图
    expect(pill.closest('button')?.getAttribute('aria-pressed')).toBe('true');
    // 聚合视图不触发首空间 repo 树加载
    expect(apiRepoSpaceTree).not.toHaveBeenCalled();

    // 聚合视图卡片：key 按聚合态 recent 标识，横向卡（相对时间胶囊 + 格式胶囊）
    const card = await waitFor(() => {
      const el = document.querySelector(
        '[data-capability-key="knowledge:recent:71"]',
      );
      expect(el).toBeTruthy();
      return el!;
    });
    expect(card.textContent).toContain('产品需求说明书');
    expect(card.textContent).toContain('PDF');
    expect(card.textContent).toContain('PC.Utils.Common.hoursAgo');
    // 选择按钮：挂 .card-hire 悬停浮现类（按钮为唯一选中入口）
    const selectBtn = Array.from(card.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'PC.Components.CapabilityModal.select',
    );
    expect(selectBtn).toBeTruthy();
    expect(selectBtn?.className).toContain('card-hire');

    // 卡片主体点击不触发选中，「选择」按钮按 slugId/pageType/rawId 选中回传
    fireEvent.click(card);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(selectBtn!);
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      resourceType: 'knowledge',
      source: 'recent',
      rawId: 71,
      slugId: 'doc-a',
      pageType: 'doc',
    });
  });

  it('点击空间 pill 退出聚合视图，切回该空间 repo 树列表', async () => {
    apiRepoRecentlyAccessedPages.mockResolvedValue({
      code: '0000',
      data: [
        {
          id: 71,
          slugId: 'doc-a',
          title: '产品需求说明书',
          sourceExt: 'pdf',
          time: hoursAgo(5),
        },
      ],
    });
    renderKnowledgeModal(vi.fn());

    await screen.findByText('产品需求说明书');
    fireEvent.click(screen.getByText('个人空间'));

    await screen.findByText('空间文档');
    expect(apiRepoSpaceTree).toHaveBeenCalledWith(1);
    expect(
      document.querySelector('[data-capability-key="knowledge:recent:71"]'),
    ).toBeNull();
    // 「最近访问」pill 仍保留在最前（未被销毁），选中态让位空间 pill
    const pill = screen.getByText(
      'PC.Components.CapabilityModal.mainTabRecent',
    );
    expect(pill.closest('button')?.getAttribute('aria-pressed')).toBe('false');
  });
});
