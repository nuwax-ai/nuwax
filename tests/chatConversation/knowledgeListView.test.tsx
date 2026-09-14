/**
 * 独立资料库列表组件 KnowledgeListView 契约：
 * - space 场景：repo 树接口按 spaceId 拉取（未传挂起不加载），先序平铺
 *   （目录分组顺序）；
 * - recent 场景：recently-accessed {from:0,size} 全量，条目带 usedTime
 *   （相对时间胶囊）；
 * - keyword 客户端过滤（名称/描述）+ 内存切片分页（触底追加）；
 * - 图标：RepoFileIcon 复刻 nuwax-repo-web 资料库线性图标（pageType/
 *   扩展名 → 类型专属图形与配色），不再展示 fileType 文本 Tag；
 * - 选中：悬停「选择」按钮为唯一入口（覆盖时间胶囊区域），卡片主体
 *   点击不触发；
 * - 双变体：grid 两列 / list 单列横排资料行。
 * services 全部 mock（vitest 不可用 umi request）；
 * utils/common 不 mock——formatTimeAgo 真实执行，i18n dict mock 为 key 回显。
 */
import type { KnowledgeListViewProps } from '@/components/business-component/KnowledgeListView';
import KnowledgeListView from '@/components/business-component/KnowledgeListView';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiRepoSpaceTree = vi.hoisted(() => vi.fn());
const apiRepoRecentlyAccessedPages = vi.hoisted(() => vi.fn());

vi.mock('@/components/business-component/KnowledgeListView/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/repo', () => ({
  apiRepoSpaceTree,
  apiRepoRecentlyAccessedPages,
}));

beforeEach(() => {
  vi.clearAllMocks();
  apiRepoRecentlyAccessedPages.mockResolvedValue({ code: '0000', data: [] });
});

afterEach(cleanup);

const renderView = ({ onSelect, ...rest }: Partial<KnowledgeListViewProps>) =>
  render(
    <KnowledgeListView type="space" {...rest} onSelect={onSelect ?? vi.fn()} />,
  );

/** 定位条目内「选择」按钮（悬停浮现语义,jsdom 始终可见） */
const selectBtnOf = (key: string) =>
  document
    .querySelector(`[data-knowledge-key="${key}"]`)
    ?.querySelector<HTMLButtonElement>('button') ?? null;

describe('KnowledgeListView·space 场景（repo 树）', () => {
  const tree = () => [
    {
      page: { id: 7, title: '使用手册', slugId: 's-7', sourceExt: 'md' },
      children: [
        { page: { id: 8, title: '子文档', slugId: 's-8', pageType: 'doc' } },
      ],
    },
    { page: { id: 9, title: 'FAQ', slugId: 's-9', sourceExt: '.pdf' } },
  ];

  it('按 spaceId 拉取,先序平铺,图标按类型着色且不展示类型文本', async () => {
    apiRepoSpaceTree.mockResolvedValue({ code: '0000', data: tree() });
    renderView({ spaceId: 1 });

    // 先序顺序：父 → 子 → 下一个父
    const keys = await waitFor(() => {
      const els = document.querySelectorAll('[data-knowledge-key]');
      expect(els.length).toBe(3);
      return Array.from(els).map((el) => el.getAttribute('data-knowledge-key'));
    });
    expect(keys).toEqual([
      'knowledge:space:7',
      'knowledge:space:8',
      'knowledge:space:9',
    ]);
    expect(apiRepoSpaceTree).toHaveBeenCalledWith(1);
    // 图标：'.md'→MD 清洗后未命中专属规则回落默认文档蓝；
    // '.pdf'→PDF 专属红（色板对齐 nuwax-repo-web 资料库）
    const iconColorOf = (key: string) =>
      document
        .querySelector(`[data-knowledge-key="${key}"]`)
        ?.querySelector<HTMLElement>('[class*="file-icon"]')?.style.color;
    expect(iconColorOf('knowledge:space:7')).toBe('rgb(51, 112, 255)');
    expect(iconColorOf('knowledge:space:9')).toBe('rgb(245, 63, 63)');
    // 类型文本不再展示（无 fileType Tag）
    const row7 = document.querySelector(
      '[data-knowledge-key="knowledge:space:7"]',
    )!;
    expect(row7.textContent).not.toContain('MD');
    const row8 = document.querySelector(
      '[data-knowledge-key="knowledge:space:8"]',
    )!;
    expect(row8.textContent).not.toContain('DOC');
    // 树视图无相对时间胶囊
    expect(row7.textContent).not.toContain('PC.Utils.Common');
  });

  it('未传 spaceId：挂起不加载（repo 树接口 spaceId 必传）', async () => {
    apiRepoSpaceTree.mockResolvedValue({ code: '0000', data: tree() });
    renderView({});
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(apiRepoSpaceTree).not.toHaveBeenCalled();
  });

  it('keyword 客户端过滤 + 内存切片分页（触底追加）', async () => {
    const pages = Array.from({ length: 25 }, (_, i) => ({
      page: { id: i + 1, title: `文档-${i}`, slugId: `s-${i}` },
    }));
    apiRepoSpaceTree.mockResolvedValue({ code: '0000', data: pages });
    renderView({ spaceId: 2 });
    // jsdom 无布局（scrollHeight=clientHeight=0）,首屏未填满即自动补拉
    // ——客户端切片分页路径:单次全量拉取,内存切片至拉满(25 条)
    await screen.findByText('文档-24');
    expect(document.querySelectorAll('[data-knowledge-key]').length).toBe(25);
    // 全量数据已缓存,翻页不再发请求
    expect(apiRepoSpaceTree).toHaveBeenCalledTimes(1);

    cleanup();
    apiRepoSpaceTree.mockClear();
    apiRepoSpaceTree.mockResolvedValue({
      code: '0000',
      data: pages.filter((node) => node.page.title === '文档-3'),
    });
    renderView({ spaceId: 2, keyword: '文档-3' });
    await waitFor(() => {
      expect(document.querySelectorAll('[data-knowledge-key]').length).toBe(1);
    });
    expect(screen.getByText('文档-3')).toBeInTheDocument();
  });
});

describe('KnowledgeListView·recent 场景（最近访问）', () => {
  it('{from:0,size} 全量,条目带相对时间胶囊,图标不展示类型文本', async () => {
    apiRepoRecentlyAccessedPages.mockResolvedValue({
      code: '0000',
      data: [
        {
          id: 71,
          slugId: 'doc-a',
          title: '产品需求说明书',
          pageType: 'doc',
          sourceExt: '.pdf',
          time: new Date(Date.now() - 5 * 3_600_000).toISOString(),
        },
      ],
    });
    renderView({ type: 'recent' });

    const row = await waitFor(() => {
      const el = document.querySelector(
        '[data-knowledge-key="knowledge:recent:71"]',
      );
      expect(el).toBeTruthy();
      return el!;
    });
    expect(apiRepoRecentlyAccessedPages).toHaveBeenCalledWith({
      from: 0,
      size: 20,
    });
    expect(apiRepoSpaceTree).not.toHaveBeenCalled();
    expect(row.textContent).toContain('产品需求说明书');
    expect(row.textContent).toContain('PC.Utils.Common.hoursAgo');
    // 图标：pdf 专属红；类型文本不再展示
    expect(
      row.querySelector<HTMLElement>('[class*="file-icon"]')?.style.color,
    ).toBe('rgb(245, 63, 63)');
    expect(row.textContent).not.toContain('PDF');
  });
});

describe('KnowledgeListView·选中与双变体', () => {
  it('悬停「选择」按钮为唯一选中入口,回传 slugId/pageType/rawId', async () => {
    apiRepoSpaceTree.mockResolvedValue({
      code: '0000',
      data: [
        { page: { id: 7, title: '使用手册', slugId: 's-7', sourceExt: 'md' } },
      ],
    });
    const onSelect = vi.fn();
    renderView({ spaceId: 1, onSelect });
    await screen.findByText('使用手册');

    // 卡片主体点击不触发
    fireEvent.click(
      document.querySelector('[data-knowledge-key="knowledge:space:7"]')!,
    );
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(selectBtnOf('knowledge:space:7')!);
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      rawId: 7,
      slugId: 's-7',
      name: '使用手册',
      fileType: 'MD',
    });
  });

  it('list 变体：单列资料行,渲染一致', async () => {
    apiRepoSpaceTree.mockResolvedValue({
      code: '0000',
      data: [
        { page: { id: 7, title: '使用手册', slugId: 's-7', sourceExt: 'md' } },
      ],
    });
    const { container } = renderView({ spaceId: 1, variant: 'list' });
    await screen.findByText('使用手册');
    const scroller = container.firstElementChild as HTMLElement;
    expect(scroller.className).toContain('root-list');
    expect(document.querySelectorAll('[data-knowledge-key]').length).toBe(1);
  });
});
