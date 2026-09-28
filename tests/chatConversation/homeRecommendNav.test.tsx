import ChatBoxRecommendNav from '@/pages/Home/components/ChatBoxRecommendNav';
import { GuidQuestionSetTypeEnum } from '@/types/enums/agent';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({ useModel: () => ({ showPagePreview: vi.fn() }) }));
vi.mock('@/utils', () => ({
  checkPathParams: vi.fn(),
  fillPathParams: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/pages/Home/components/ChatBoxRecommendNav/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/RecommendList/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

let scrollWidth = 300;
const resizeCallbacks = new Set<() => void>();
const items = [{ id: 1, targetId: 71, label: '普通对话' }] as any;
const leftLabel = 'PC.Pages.Home.previousQuestions';
const rightLabel = 'PC.Pages.Home.moreQuestions';

beforeEach(() => {
  scrollWidth = 300;
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
    () => scrollWidth,
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: () => void) {
        resizeCallbacks.add(callback);
      }
      observe() {}
      disconnect() {
        resizeCallbacks.delete(this.callback);
      }
    },
  );
});

afterEach(() => {
  cleanup();
  resizeCallbacks.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('有效提示替换小分类，点击回填；空提示恢复小分类', () => {
  const onQuestionClick = vi.fn();
  const onSelect = vi.fn();
  const { rerender } = render(
    <ChatBoxRecommendNav
      items={items}
      onSelect={onSelect}
      guidQuestions={[{ type: 'Question', info: '如何开始？' }]}
      onQuestionClick={onQuestionClick}
    />,
  );
  expect(screen.queryByRole('button', { name: '普通对话' })).toBeNull();
  fireEvent.click(screen.getByText('如何开始？'));
  expect(onQuestionClick).toHaveBeenCalledWith('如何开始？');
  expect(onSelect).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: leftLabel })).toBeNull();
  expect(screen.queryByRole('button', { name: rightLabel })).toBeNull();

  rerender(
    <ChatBoxRecommendNav
      items={items}
      onSelect={onSelect}
      guidQuestions={[{ type: 'Question', info: '   ' }]}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '普通对话' }));
  expect(onSelect).toHaveBeenCalledWith(items[0]);
});

it('提示优先展示 title，未配置时展示描述；点击仍填入描述', () => {
  const onQuestionClick = vi.fn();
  render(
    <ChatBoxRecommendNav
      items={items}
      onSelect={vi.fn()}
      guidQuestions={[
        { type: 'Question', title: '提问标题', info: '完整的问题描述' },
        { type: 'Question', info: '旧配置描述' },
        { type: 'Question', title: '   ', info: '空标题回退描述' },
      ]}
      onQuestionClick={onQuestionClick}
    />,
  );

  expect(screen.getByText('提问标题')).toBeInTheDocument();
  expect(screen.queryByText('完整的问题描述')).toBeNull();
  expect(screen.getByText('旧配置描述')).toBeInTheDocument();
  expect(screen.getByText('空标题回退描述')).toBeInTheDocument();

  fireEvent.click(screen.getByText('提问标题'));
  expect(onQuestionClick).toHaveBeenCalledWith('完整的问题描述');
});

it('提示只在对应方向有溢出时显示箭头，尺寸变化和切换提示后重新判断', () => {
  const { container, rerender } = render(
    <ChatBoxRecommendNav
      items={items}
      onSelect={vi.fn()}
      guidQuestions={[{ type: 'Question', info: '提示一' }]}
    />,
  );
  const list = container.querySelector('.recommend-list') as HTMLDivElement;
  const scrollBy = vi.fn();
  list.scrollBy = scrollBy;
  expect(screen.queryByRole('button', { name: rightLabel })).toBeNull();

  act(() => {
    scrollWidth = 900;
    resizeCallbacks.forEach((callback) => callback());
  });
  expect(screen.queryByRole('button', { name: leftLabel })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: rightLabel }));
  expect(scrollBy).toHaveBeenCalledWith({ left: 225, behavior: 'smooth' });

  list.scrollLeft = 200;
  fireEvent.scroll(list);
  expect(screen.getByRole('button', { name: leftLabel })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: rightLabel })).toBeInTheDocument();

  list.scrollLeft = 600;
  fireEvent.scroll(list);
  expect(screen.queryByRole('button', { name: rightLabel })).toBeNull();
  expect(screen.getByRole('button', { name: leftLabel })).toBeInTheDocument();

  rerender(
    <ChatBoxRecommendNav
      items={items}
      onSelect={vi.fn()}
      guidQuestions={[{ type: 'Question', info: '提示二' }]}
    />,
  );
  expect(list.scrollLeft).toBe(0);
  expect(screen.queryByRole('button', { name: leftLabel })).toBeNull();
  expect(screen.getByRole('button', { name: rightLabel })).toBeInTheDocument();

  act(() => {
    scrollWidth = 300;
    resizeCallbacks.forEach((callback) => callback());
  });
  expect(screen.queryByRole('button', { name: leftLabel })).toBeNull();
  expect(screen.queryByRole('button', { name: rightLabel })).toBeNull();
});

it('推荐提示词优先展示标题和图标，点击填入内容；空数组回退智能体提示', () => {
  const onQuestionClick = vi.fn();
  const props = {
    items,
    onSelect: vi.fn(),
    onQuestionClick,
    guidQuestions: [
      { type: GuidQuestionSetTypeEnum.Question, info: '智能体原有提示' },
    ],
  };
  const { container, rerender } = render(
    <ChatBoxRecommendNav
      {...props}
      recommendPrompts={[
        {
          title: '推荐标题',
          content: '完整提示词\n保留换行',
          icon: '/prompt.png',
        },
        { title: '   ', content: '无标题内容', icon: '' },
        { title: '无效提示', content: '   ', icon: '' },
      ]}
    />,
  );
  expect(screen.queryByText('智能体原有提示')).toBeNull();
  expect(screen.queryByText('无效提示')).toBeNull();
  expect(
    screen.getByRole('button', { name: '无标题内容' }),
  ).toBeInTheDocument();
  expect(container.querySelector('img')?.getAttribute('src')).toBe(
    '/prompt.png',
  );
  fireEvent.click(screen.getByRole('button', { name: '推荐标题' }));
  expect(onQuestionClick).toHaveBeenCalledWith('完整提示词\n保留换行');
  rerender(<ChatBoxRecommendNav {...props} recommendPrompts={[]} />);
  expect(screen.getByText('智能体原有提示')).toBeInTheDocument();
});

it('重复目标按推荐记录独立选中，切换记录显示各自提示词', () => {
  const duplicates = [
    { id: 1, targetId: 71, label: '推荐一' },
    { id: 2, targetId: 71, label: '推荐二' },
  ] as any;
  const onSelect = vi.fn();
  const { rerender } = render(
    <ChatBoxRecommendNav
      items={duplicates}
      selectedId={1}
      onSelect={onSelect}
    />,
  );
  expect(screen.getByRole('button', { name: '推荐一' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('button', { name: '推荐二' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  fireEvent.click(screen.getByRole('button', { name: '推荐二' }));
  expect(onSelect).toHaveBeenCalledWith(duplicates[1]);
  rerender(
    <ChatBoxRecommendNav
      items={duplicates}
      selectedId={2}
      onSelect={onSelect}
      recommendPrompts={[
        { title: '第二条配置', content: '第二条内容', icon: '' },
      ]}
    />,
  );
  expect(
    screen.getByRole('button', { name: '第二条配置' }),
  ).toBeInTheDocument();
  rerender(
    <ChatBoxRecommendNav
      items={duplicates}
      selectedId={1}
      onSelect={onSelect}
      recommendPrompts={[
        { title: '第一条配置', content: '第一条内容', icon: '' },
      ]}
    />,
  );
  expect(screen.queryByRole('button', { name: '第二条配置' })).toBeNull();
  expect(
    screen.getByRole('button', { name: '第一条配置' }),
  ).toBeInTheDocument();
});
