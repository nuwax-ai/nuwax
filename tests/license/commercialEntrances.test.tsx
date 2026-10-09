import ClassicHomeSection from '@/layouts/DynamicMenusLayout/NewHomeSection/ClassicHomeSection';
import KnowledgeHeader from '@/pages/SpaceKnowledge/KnowledgeHeader';
import CreateSet from '@/pages/SpaceKnowledge/LocalCustomDocModal/CreateSet';
import { KnowledgeDocTypeEnum } from '@/types/enums/library';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ enabled: false }));
vi.mock('@/hooks/useCommercialEdition', () => ({
  default: () => ({ aiOSCommercialEdition: state.enabled }),
}));
vi.mock('umi', () => ({
  useParams: () => ({ spaceId: '93' }),
  useModel: () => ({ firstLevelMenus: [], handleCloseMobileMenu: vi.fn() }),
  history: { push: vi.fn() },
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/router', () => ({ jumpBack: vi.fn() }));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/custom/SelectList', () => ({ default: () => null }));
vi.mock(
  '@/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel',
  () => ({ default: () => <div>项目内容</div> }),
);
vi.mock(
  '@/layouts/DynamicMenusLayout/NewHomeSection/components/SearchHeader',
  () => ({ default: () => null }),
);
vi.mock('@/layouts/DynamicMenusLayout/NewHomeSection/TaskListSection', () => ({
  default: () => <div>任务内容</div>,
}));
vi.mock('@/layouts/DynamicMenusLayout/NewHomeSection/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/pages/SpaceKnowledge/KnowledgeHeader/index.less', () => ({
  default: {},
}));
vi.mock(
  '@/pages/SpaceKnowledge/LocalCustomDocModal/CreateSet/index.less',
  () => ({ default: {} }),
);
beforeEach(() => {
  state.enabled = false;
  localStorage.clear();
});
afterEach(cleanup);
const graphLabel = 'PC.Pages.SpaceKnowledge.KnowledgeHeader.graph';
it('图谱选项随授权显隐；撤销时回到文档', () => {
  const onChangeDocType = vi.fn();
  const props = {
    docCount: 0,
    docType: KnowledgeDocTypeEnum.DOC,
    onChangeDocType,
    onEdit: vi.fn(),
    onPopover: vi.fn(),
    onQaPopover: vi.fn(),
    onViewAllGraphs: vi.fn(),
  };
  const view = render(<KnowledgeHeader {...props} />);
  expect(screen.queryByText(graphLabel)).toBeNull();
  state.enabled = true;
  view.rerender(
    <KnowledgeHeader {...props} docType={KnowledgeDocTypeEnum.GRAPH} />,
  );
  expect(screen.getAllByText(graphLabel).length).toBeGreaterThan(0);
  state.enabled = false;
  view.rerender(
    <KnowledgeHeader {...props} docType={KnowledgeDocTypeEnum.GRAPH} />,
  );
  expect(onChangeDocType).toHaveBeenCalledWith(KnowledgeDocTypeEnum.DOC);
});
it('智能分段随授权显隐，普通自动分段和自定义入口保持', () => {
  const props = {
    form: undefined as any,
    autoSegmentConfigFlag: true,
    onChoose: vi.fn(),
    onAiSegmentChoose: vi.fn(),
  };
  const view = render(<CreateSet {...props} />);
  const smart = 'PC.Pages.SpaceKnowledge.CreateSet.isAiSegment';
  expect(screen.queryByText(smart)).toBeNull();
  expect(
    screen.getByText('PC.Pages.SpaceKnowledge.CreateSet.autoSegmentClean'),
  ).toBeTruthy();
  expect(
    screen.getByText('PC.Pages.SpaceKnowledge.CreateSet.custom'),
  ).toBeTruthy();
  state.enabled = true;
  view.rerender(<CreateSet {...props} />);
  expect(screen.getByText(smart)).toBeTruthy();
  state.enabled = false;
  view.rerender(<CreateSet {...props} />);
  expect(screen.queryByText(smart)).toBeNull();
});
it('经典侧栏不会恢复未授权的项目缓存；撤销授权回到任务', () => {
  localStorage.setItem('PC_HOME_SECTION_ACTIVE_TAB', 'project');
  const shell = {
    initialLoad: vi.fn(),
    resetSearchAndRefresh: vi.fn(),
    scrollContainerRef: { current: null },
    scrollShowRef: vi.fn(),
    visibleConversationList: [],
    hasMore: false,
    refreshList: vi.fn(),
  } as any;
  const view = render(<ClassicHomeSection shell={shell} />);
  const project = 'PC.Layouts.DynamicMenusLayout.HomeSection.projectTab';
  expect(screen.queryByText(project)).toBeNull();
  expect(screen.queryByText('项目内容')).toBeNull();
  expect(screen.getByText('任务内容')).toBeTruthy();
  state.enabled = true;
  view.rerender(<ClassicHomeSection shell={shell} />);
  act(() => screen.getByText(project).click());
  expect(screen.getByText('项目内容')).toBeTruthy();
  state.enabled = false;
  view.rerender(<ClassicHomeSection shell={shell} />);
  expect(screen.queryByText(project)).toBeNull();
  expect(screen.getByText('任务内容')).toBeTruthy();
  expect(localStorage.getItem('PC_HOME_SECTION_ACTIVE_TAB')).toBe(
    'conversation',
  );
});
vi.mock('@/components/CustomPopover', () => ({
  default: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/components/LabelStar', () => ({
  default: ({ label }: any) => <span>{label}</span>,
}));
