/**
 * @ 资源弹层 AtResourcePopup 契约：
 * - 双模式 tab：home=专家(convenient/list)+资料库(recent/list)、
 *   session=上下文文件+资料库；keyword 实时透传内嵌列表；
 * - 键盘导航（DOM 卡片代理）：打开默认高亮首项（含列表数据后到时经
 *   MutationObserver 重注入）、↑↓ 移动、Enter 按高亮类寻址触发选中、
 *   ←→ 循环切 tab；
 * - 「更多」仅专家/资料库 tab 展示并回调当前 tab；
 * - 文件行为（取数/过滤/空切 tab）见 mentionCommands.test.tsx。
 * 内嵌列表组件（ExpertListView/KnowledgeListView）依赖 services/umi，
 * 以渲染可点卡片的桩替换（vitest 不可用 umi request）。
 */
import AtResourcePopup from '@/components/ChatInputHome/AtResourcePopup';
import type {
  AtResourcePopupHandle,
  AtResourcePopupProps,
} from '@/components/ChatInputHome/AtResourcePopup/types';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ChatInputHome/AtResourcePopup/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

/** 内嵌列表桩：捕获 props + 渲染可点卡片（data-*-key 供键盘导航代理） */
const embedLists = vi.hoisted(() => ({
  props: {
    expert: {} as Record<string, any>,
    knowledge: {} as Record<string, any>,
    skill: {} as Record<string, any>,
  },
  expertCards: [
    { key: 'expert:used:1', name: '专家一' },
    { key: 'expert:used:2', name: '专家二' },
  ],
  knowledgeCards: [
    { key: 'knowledge:recent:1', name: '文档一' },
    { key: 'knowledge:recent:2', name: '文档二' },
  ],
  skillCards: [
    { key: 'skill:convenient:1', name: '技能一' },
    { key: 'skill:convenient:2', name: '技能二' },
  ],
}));
vi.mock('@/components/business-component/ExpertListView', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, any>) => {
      Object.assign(embedLists.props.expert, props);
      return React.createElement(
        'div',
        { 'data-testid': 'at-expert-list' },
        embedLists.expertCards.map((card) =>
          React.createElement(
            'div',
            {
              key: card.key,
              'data-expert-key': card.key,
              onClick: () =>
                props.onSelect({
                  key: card.key,
                  rawId: 1,
                  targetId: 1,
                  name: card.name,
                }),
            },
            card.name,
          ),
        ),
      );
    },
  };
});
vi.mock('@/components/business-component/KnowledgeListView', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, any>) => {
      Object.assign(embedLists.props.knowledge, props);
      return React.createElement(
        'div',
        { 'data-testid': 'at-knowledge-list' },
        embedLists.knowledgeCards.map((card) =>
          React.createElement(
            'div',
            {
              key: card.key,
              'data-knowledge-key': card.key,
              onClick: () =>
                props.onSelect({
                  key: card.key,
                  rawId: 1,
                  slugId: `slug-${card.name}`,
                  name: card.name,
                }),
            },
            card.name,
          ),
        ),
      );
    },
  };
});
vi.mock('@/components/business-component/SkillListView', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, any>) => {
      Object.assign(embedLists.props.skill, props);
      return React.createElement(
        'div',
        { 'data-testid': 'at-skill-list' },
        embedLists.skillCards.map((card) =>
          React.createElement(
            'div',
            {
              key: card.key,
              'data-skill-key': card.key,
              onClick: () =>
                props.onSelect({
                  key: card.key,
                  rawId: 1,
                  targetId: 1,
                  name: card.name,
                }),
            },
            card.name,
          ),
        ),
      );
    },
  };
});

const FOCUS_CLASS = 'at-popup-card-focus';
const file = {
  kind: 'file' as const,
  name: '报告.md',
  relativePath: 'output/报告.md',
};

beforeEach(() => {
  vi.clearAllMocks();
  embedLists.props.expert = {};
  embedLists.props.knowledge = {};
  embedLists.props.skill = {};
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(cleanup);

const renderPopup = (
  props: Partial<AtResourcePopupProps> & {
    ref?: React.RefObject<AtResourcePopupHandle>;
  },
) => {
  const { ref, ...rest } = props;
  return render(
    <AtResourcePopup
      ref={ref ?? createRef<AtResourcePopupHandle>()}
      mode="home"
      visible
      position={{ left: 0, top: 0 }}
      onSelectFile={vi.fn()}
      onSelectDoc={vi.fn()}
      onSelectExpert={vi.fn()}
      onSelectSkill={vi.fn()}
      onMore={vi.fn()}
      onClose={vi.fn()}
      {...rest}
    />,
  );
};

const focusedCard = () =>
  document.querySelector(`.${FOCUS_CLASS}`) as HTMLElement | null;

describe('AtResourcePopup·双模式 tab 结构', () => {
  it('home：专家（便捷视图 list 变体）默认激活，keyword 实时透传', async () => {
    renderPopup({ mode: 'home', searchText: '架构' });
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    expect(embedLists.props.expert).toMatchObject({
      type: 'convenient',
      variant: 'list',
      keyword: '架构',
    });
    expect(screen.queryByTestId('at-knowledge-list')).toBeNull();
    expect(
      screen.getByText('PC.Components.AtResourcePopup.tabExpert'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.AtResourcePopup.tabKnowledge'),
    ).toBeInTheDocument();
    // 文件 tab 仅会话页模式
    expect(
      screen.queryByText('PC.Components.AtResourcePopup.tabFile'),
    ).toBeNull();
  });

  it('session：文件 tab 无「更多」（高度让渡列表区），切资料库后出现', async () => {
    const ref = createRef<AtResourcePopupHandle>();
    renderPopup({
      mode: 'session',
      ref,
      onFetchMentionFiles: async () => [file],
    });
    expect(await screen.findByText('报告.md')).toBeInTheDocument();
    // 文件 tab：更多区不渲染（高度让渡给列表区，弹层总高不变）
    expect(screen.queryByText('PC.Components.AtResourcePopup.more')).toBeNull();
    expect(document.querySelector('[data-at-more]')).toBeNull();
    const content = document.querySelector('.content');
    expect(content).toHaveClass('content-multi-tabs');
    expect(document.querySelector('[data-at-popup]')).toHaveClass(
      'popup-no-more',
    );
    // → 切资料库：列表挂载（recent/list）+「更多」出现
    act(() => ref.current?.handleArrowRight());
    await waitFor(() =>
      expect(screen.getByTestId('at-knowledge-list')).toBeInTheDocument(),
    );
    expect(embedLists.props.knowledge).toMatchObject({
      type: 'recent',
      variant: 'list',
    });
    expect(document.querySelector('[data-at-more]')).toBeTruthy();
    expect(content).toHaveClass('content-multi-tabs');
    expect(document.querySelector('[data-at-popup]')).not.toHaveClass(
      'popup-no-more',
    );
  });

  it('home 且专家未开放（expertAvailable=false）：收敛为纯资料库，无切换器无专家列表', async () => {
    renderPopup({ mode: 'home', expertAvailable: false });
    await waitFor(() =>
      expect(screen.getByTestId('at-knowledge-list')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('at-expert-list')).toBeNull();
    expect(
      screen.queryByText('PC.Components.AtResourcePopup.tabExpert'),
    ).toBeNull();
    // 资料库 tab 仍有「更多」入口
    expect(
      screen.getByText('PC.Components.AtResourcePopup.more'),
    ).toBeInTheDocument();
  });

  it('slash：技能便捷视图单列表——无切换器，有「更多」，键盘 Enter 选中', async () => {
    const onSelectSkill = vi.fn();
    const onMore = vi.fn();
    const ref = createRef<AtResourcePopupHandle>();
    render(
      <AtResourcePopup
        ref={ref}
        mode="slash"
        visible
        position={{ left: 0, top: 0 }}
        searchText="写作"
        onSelectFile={vi.fn()}
        onSelectDoc={vi.fn()}
        onSelectExpert={vi.fn()}
        onSelectSkill={onSelectSkill}
        onMore={onMore}
        onClose={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('at-skill-list')).toBeInTheDocument(),
    );
    expect(embedLists.props.skill).toMatchObject({
      type: 'convenient',
      variant: 'list',
      keyword: '写作',
    });
    // 单 tab：切换器隐藏，其他列表不渲染
    expect(
      screen.queryByText('PC.Components.AtResourcePopup.tabSkill'),
    ).toBeNull();
    expect(screen.queryByTestId('at-expert-list')).toBeNull();
    // 更多入口：回调携带 skill
    fireEvent.click(screen.getByText('PC.Components.AtResourcePopup.more'));
    expect(onMore).toHaveBeenCalledWith('skill');
    // 键盘：默认高亮首项 + Enter 选中
    await waitFor(() =>
      expect(focusedCard()?.getAttribute('data-skill-key')).toBe(
        'skill:convenient:1',
      ),
    );
    act(() => ref.current?.handleSelectCurrentItem());
    expect(onSelectSkill).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '技能一' }),
    );
  });
});

describe('AtResourcePopup·键盘导航（DOM 卡片代理）', () => {
  it('打开默认高亮首项；Enter 按高亮类寻址选中；↑↓ 移动高亮', async () => {
    const onSelectExpert = vi.fn();
    const ref = createRef<AtResourcePopupHandle>();
    renderPopup({ mode: 'home', ref, onSelectExpert });
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    // 默认预亮首项（MutationObserver 异步注入）
    await waitFor(() =>
      expect(focusedCard()?.getAttribute('data-expert-key')).toBe(
        'expert:used:1',
      ),
    );
    // Enter：等价点击高亮卡片 → 专家选中回调
    act(() => ref.current?.handleSelectCurrentItem());
    expect(onSelectExpert).toHaveBeenCalledTimes(1);
    expect(onSelectExpert).toHaveBeenLastCalledWith(
      expect.objectContaining({ targetId: 1, name: '专家一' }),
    );
    // ↓ 移到第二项并 Enter
    act(() => ref.current?.handleArrowDown());
    await waitFor(() =>
      expect(focusedCard()?.getAttribute('data-expert-key')).toBe(
        'expert:used:2',
      ),
    );
    act(() => ref.current?.handleSelectCurrentItem());
    expect(onSelectExpert).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '专家二' }),
    );
    // ↑ 回首项（到顶停止）
    act(() => ref.current?.handleArrowUp());
    await waitFor(() =>
      expect(focusedCard()?.getAttribute('data-expert-key')).toBe(
        'expert:used:1',
      ),
    );
  });

  it('←→ 循环切 tab：切换后聚焦复位首项并选中资料条目', async () => {
    const onSelectDoc = vi.fn();
    const ref = createRef<AtResourcePopupHandle>();
    renderPopup({ mode: 'home', ref, onSelectDoc });
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    // → 切资料库：高亮复位首项
    act(() => ref.current?.handleArrowRight());
    await waitFor(() =>
      expect(focusedCard()?.getAttribute('data-knowledge-key')).toBe(
        'knowledge:recent:1',
      ),
    );
    act(() => ref.current?.handleSelectCurrentItem());
    expect(onSelectDoc).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '文档一' }),
    );
    // ← 再切回专家（两 tab 循环）
    act(() => ref.current?.handleArrowLeft());
    await waitFor(() =>
      expect(focusedCard()?.getAttribute('data-expert-key')).toBe(
        'expert:used:1',
      ),
    );
  });

  it('文件行同样纳入键盘导航：Enter 选中当前高亮文件', async () => {
    const onSelectFile = vi.fn();
    const ref = createRef<AtResourcePopupHandle>();
    renderPopup({
      mode: 'session',
      ref,
      onSelectFile,
      onFetchMentionFiles: async () => [file],
    });
    await screen.findByText('报告.md');
    await waitFor(() =>
      expect(focusedCard()?.getAttribute('data-at-file-key')).toBe(
        'output/报告.md',
      ),
    );
    act(() => ref.current?.handleSelectCurrentItem());
    expect(onSelectFile).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'file', relativePath: 'output/报告.md' }),
    );
  });

  it('鼠标 hover 委托同步聚焦（内嵌卡片无需注入回调）', async () => {
    const ref = createRef<AtResourcePopupHandle>();
    renderPopup({ mode: 'home', ref });
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    fireEvent.mouseMove(screen.getByText('专家二'));
    await waitFor(() =>
      expect(focusedCard()?.getAttribute('data-expert-key')).toBe(
        'expert:used:2',
      ),
    );
  });
});

describe('AtResourcePopup·更多入口', () => {
  it('仅专家/资料库 tab 展示，回调携带当前 tab', async () => {
    const onMore = vi.fn();
    const ref = createRef<AtResourcePopupHandle>();
    renderPopup({ mode: 'home', ref, onMore });
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText('PC.Components.AtResourcePopup.more'));
    expect(onMore).toHaveBeenCalledWith('expert');
    // 切资料库 tab 后回调携带 knowledge
    act(() => ref.current?.handleArrowRight());
    await waitFor(() =>
      expect(screen.getByTestId('at-knowledge-list')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText('PC.Components.AtResourcePopup.more'));
    expect(onMore).toHaveBeenLastCalledWith('knowledge');
  });
});
