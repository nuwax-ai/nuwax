/**
 * 会话快捷导航（ConversationQuickNav）合同测试：
 * 块构建纯函数（一问一答一块/空消息过滤/锚点/悬停卡片标题与正文）+
 * 组件渲染门控（块数/可滚动/容器宽度）、点击在容器内滚动定位。
 */
import {
  buildQuickNavBlocks,
  QUICK_NAV_BODY_MAX_LENGTH,
  QUICK_NAV_TITLE_MAX_LENGTH,
} from '@/components/business-component/ConversationQuickNav/blocks';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConversationQuickNav from '@/components/business-component/ConversationQuickNav/index';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));

const msg = (
  role: MessageInfo['role'],
  text: string,
  id?: number,
  think?: string,
): MessageInfo =>
  ({ role, text, id, think, index: id ?? 0 }) as unknown as MessageInfo;

const USER = AssistantRoleEnum.USER;
const ASSISTANT = AssistantRoleEnum.ASSISTANT;

describe('buildQuickNavBlocks', () => {
  it('空列表与无可读文本消息产出为空', () => {
    expect(buildQuickNavBlocks([])).toEqual([]);
    expect(buildQuickNavBlocks([msg(USER, '   ', 1)])).toEqual([]);
    expect(buildQuickNavBlocks([msg(USER, '正文', undefined)])).toEqual([]);
  });

  it('一问一答折叠为一块：锚点取用户消息、标题=问题、正文=回复开头', () => {
    const blocks = buildQuickNavBlocks([
      msg(USER, '问题一', 1),
      msg(ASSISTANT, '回答第一段', 2),
      msg(ASSISTANT, '回答第二段', 3),
      msg(USER, '问题二', 4),
      msg(ASSISTANT, '回答二', 5),
    ]);
    expect(blocks).toEqual([
      {
        key: 'turn-1',
        anchorId: '1',
        title: '问题一',
        body: '回答第一段',
      },
      {
        key: 'turn-4',
        anchorId: '4',
        title: '问题二',
        body: '回答二',
      },
    ]);
  });

  it('会话以助手回复开头时单独成块兜底（标题为空）', () => {
    const blocks = buildQuickNavBlocks([
      msg(ASSISTANT, '开场回复', 2),
      msg(USER, '问题', 3),
    ]);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      key: 'turn-2',
      anchorId: '2',
      title: '',
      body: '开场回复',
    });
    expect(blocks[1].title).toBe('问题');
  });

  it('SYSTEM 角色不参与导航', () => {
    const blocks = buildQuickNavBlocks([
      msg('SYSTEM' as MessageInfo['role'], '系统消息', 9),
      msg(USER, '问题', 1),
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].anchorId).toBe('1');
  });

  it('正文无文本时回落思考内容并剥离协议标签与富文本标签', () => {
    const blocks = buildQuickNavBlocks([
      msg(USER, '问题', 1),
      msg(
        ASSISTANT,
        '',
        2,
        '<markdown-custom-process x="1">思考开头</markdown-custom-process><div>尾巴</div>',
      ),
    ]);
    expect(blocks[0].body).toBe('思考开头尾巴');
  });

  it('标题与正文超长截断', () => {
    const blocks = buildQuickNavBlocks([
      msg(USER, '问'.repeat(200), 1),
      msg(ASSISTANT, '答'.repeat(200), 2),
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].title).toHaveLength(QUICK_NAV_TITLE_MAX_LENGTH);
    expect(blocks[0].body).toHaveLength(QUICK_NAV_BODY_MAX_LENGTH);
  });
});

// ---- 组件测试 ----

const buildContainer = (): HTMLDivElement => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  Object.defineProperty(container, 'scrollHeight', {
    value: 2400,
    configurable: true,
  });
  Object.defineProperty(container, 'clientHeight', {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(container, 'clientWidth', {
    value: 1200,
    configurable: true,
  });
  Object.defineProperty(container, 'scrollTop', {
    value: 0,
    configurable: true,
  });
  return container;
};

const longMessageList = (): MessageInfo[] =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) =>
    msg(i % 2 === 1 ? USER : ASSISTANT, `消息内容 ${i}`, i),
  );

describe('ConversationQuickNav 组件', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const renderNav = (container: HTMLDivElement, list: MessageInfo[]) =>
    render(
      <ConversationQuickNav
        scrollContainerRef={{ current: container }}
        messageList={list}
      />,
    );

  it('块数不足时不渲染', () => {
    const container = buildContainer();
    renderNav(container, [msg(USER, '一', 1), msg(ASSISTANT, '二', 2)]);
    expect(
      screen.queryByTestId('conversation-quick-nav'),
    ).not.toBeInTheDocument();
  });

  it('内容不可滚动时不渲染', () => {
    const container = buildContainer();
    Object.defineProperty(container, 'scrollHeight', {
      value: 900,
      configurable: true,
    });
    renderNav(container, longMessageList());
    expect(
      screen.queryByTestId('conversation-quick-nav'),
    ).not.toBeInTheDocument();
  });

  it('容器过窄时不渲染（窄屏/移动）', () => {
    const container = buildContainer();
    Object.defineProperty(container, 'clientWidth', {
      value: 480,
      configurable: true,
    });
    renderNav(container, longMessageList());
    expect(
      screen.queryByTestId('conversation-quick-nav'),
    ).not.toBeInTheDocument();
  });

  it('门控满足时按轮次渲染导航行', () => {
    const container = buildContainer();
    renderNav(container, longMessageList());
    expect(screen.getByTestId('conversation-quick-nav')).toBeInTheDocument();
    expect(screen.getAllByTestId('conversation-quick-nav-line')).toHaveLength(5);
  });

  it('容器滚到底时点亮最后一块', () => {
    const container = buildContainer();
    Object.defineProperty(container, 'scrollTop', {
      value: 1600,
      configurable: true,
    });
    renderNav(container, longMessageList());
    const lines = screen.getAllByTestId('conversation-quick-nav-line');
    expect(lines[lines.length - 1].className).toContain('active');
  });

  it('点击导航行在容器内滚动定位到目标块', () => {
    const container = buildContainer();
    container.innerHTML = longMessageList()
      .map(
        (item) =>
          `<div data-server-message-id="${item.id}" data-message-id="${item.id}"></div>`,
      )
      .join('');
    const scrollTo = vi.fn();
    (container as HTMLDivElement).scrollTo = scrollTo;

    renderNav(container, longMessageList());
    const lines = screen.getAllByTestId('conversation-quick-nav-line');
    fireEvent.click(lines[2]);

    expect(scrollTo).toHaveBeenCalledTimes(1);
    const arg = scrollTo.mock.calls[0][0];
    expect(arg.behavior).toBe('smooth');
    expect(typeof arg.top).toBe('number');
    expect(arg.top).toBeGreaterThanOrEqual(0);
  });

  it('锚点元素缺失时点击不抛错', () => {
    const container = buildContainer();
    const scrollTo = vi.fn();
    (container as HTMLDivElement).scrollTo = scrollTo;

    renderNav(container, longMessageList());
    const lines = screen.getAllByTestId('conversation-quick-nav-line');
    expect(() => fireEvent.click(lines[0])).not.toThrow();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
