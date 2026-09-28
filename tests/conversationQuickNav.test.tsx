/**
 * 会话快捷导航（ConversationQuickNav）合同测试：
 * 块构建纯函数（一问一答一块/空消息过滤/锚点/悬停卡片标题与正文）+
 * 所有入口统一两个及以上导航项显示、点击在容器内滚动定位。
 */
import {
  buildQuickNavBlocks,
  QUICK_NAV_BODY_MAX_LENGTH,
  QUICK_NAV_TITLE_MAX_LENGTH,
} from '@/components/business-component/ConversationQuickNav/blocks';
import ConversationQuickNav from '@/components/business-component/ConversationQuickNav/index';
import { AssistantRoleEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  ({ role, text, id, think, index: id ?? 0 } as unknown as MessageInfo);

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

const mockLineRects = (lines: HTMLElement[]) => {
  lines.forEach((line, index) => {
    const top = index * 10;
    vi.spyOn(line, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: top,
      left: 0,
      top,
      right: 12,
      bottom: top + 8,
      width: 12,
      height: 8,
    } as DOMRect);
  });
};

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

  it('普通会话只有一个导航项时不渲染', () => {
    const container = buildContainer();
    renderNav(container, longMessageList().slice(0, 2));
    expect(
      screen.queryByTestId('conversation-quick-nav'),
    ).not.toBeInTheDocument();
  });

  it('两个导航项在内容不可滚动时仍显示', () => {
    const container = buildContainer();
    Object.defineProperty(container, 'scrollHeight', {
      value: 800,
      configurable: true,
    });
    renderNav(container, longMessageList().slice(0, 4));
    expect(screen.getAllByTestId('conversation-quick-nav-line')).toHaveLength(
      2,
    );
  });

  it.each([399, 240])(
    '两个导航项在不可滚动且宽度只有 %ipx 时仍显示',
    (width) => {
      const container = buildContainer();
      Object.defineProperty(container, 'clientWidth', {
        value: width,
        configurable: true,
      });
      Object.defineProperty(container, 'scrollHeight', {
        value: 800,
        configurable: true,
      });
      renderNav(container, longMessageList().slice(0, 4));
      expect(screen.getAllByTestId('conversation-quick-nav-line')).toHaveLength(
        2,
      );
    },
  );

  it('普通会话出现第二个导航项时按轮次渲染导航行', () => {
    const container = buildContainer();
    renderNav(container, longMessageList().slice(0, 4));
    expect(screen.getByTestId('conversation-quick-nav')).toBeInTheDocument();
    expect(screen.getAllByTestId('conversation-quick-nav-line')).toHaveLength(
      2,
    );
  });

  it('两个导航项随保活页零尺寸隐藏，恢复正布局后重新显示', async () => {
    // 真实 rAF 异步执行；同步桩会在回调完成后把节流标记重新置为 1。
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      window.setTimeout(() => cb(performance.now()), 0),
    );
    vi.stubGlobal('cancelAnimationFrame', window.clearTimeout);
    const container = buildContainer();
    const scrollContainerRef = { current: container };
    const messageList = longMessageList().slice(0, 4);
    Object.defineProperty(container, 'clientWidth', {
      value: 399,
      configurable: true,
    });
    Object.defineProperty(container, 'scrollHeight', {
      value: 800,
      configurable: true,
    });
    render(
      <ConversationQuickNav
        scrollContainerRef={scrollContainerRef}
        messageList={messageList}
      />,
    );
    expect(
      await screen.findAllByTestId('conversation-quick-nav-line'),
    ).toHaveLength(2);

    Object.defineProperty(container, 'clientWidth', {
      value: 0,
      configurable: true,
    });
    Object.defineProperty(container, 'clientHeight', {
      value: 0,
      configurable: true,
    });
    fireEvent.scroll(container);
    await waitFor(() =>
      expect(
        screen.queryByTestId('conversation-quick-nav'),
      ).not.toBeInTheDocument(),
    );

    Object.defineProperty(container, 'clientWidth', {
      value: 399,
      configurable: true,
    });
    Object.defineProperty(container, 'clientHeight', {
      value: 800,
      configurable: true,
    });
    fireEvent.scroll(container);
    expect(
      await screen.findAllByTestId('conversation-quick-nav-line'),
    ).toHaveLength(2);
  });

  describe('统一至少两轮的显示门槛', () => {
    const singleTurnMessages = () => [
      msg(USER, '开发一个应用', 1),
      msg(ASSISTANT, '开发过程输出\n'.repeat(100), 2),
    ];

    const buildNarrowContainer = () => {
      const container = buildContainer();
      Object.defineProperty(container, 'clientWidth', {
        value: 463,
        configurable: true,
      });
      return container;
    };

    beforeEach(() => {
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
        window.setTimeout(() => cb(performance.now()), 0),
      );
      vi.stubGlobal('cancelAnimationFrame', window.clearTimeout);
    });

    it.each([
      { width: 1200, height: 800, scrollHeight: 2400 },
      { width: 240, height: 800, scrollHeight: 800 },
      { width: 463, height: 400, scrollHeight: 10000 },
    ])(
      '单轮长回复在宽 $width、高 $height、内容高 $scrollHeight 的布局中也隐藏',
      async ({ width, height, scrollHeight }) => {
        const container = buildContainer();
        Object.entries({
          clientWidth: width,
          clientHeight: height,
          scrollHeight,
        }).forEach(([key, value]) => {
          Object.defineProperty(container, key, { value, configurable: true });
        });
        render(
          <ConversationQuickNav
            scrollContainerRef={{ current: container }}
            messageList={singleTurnMessages()}
          />,
        );
        // 等初次测量完成，防止隐藏断言在测量前就通过。
        await act(async () => {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 0);
          });
        });
        expect(
          screen.queryByTestId('conversation-quick-nav'),
        ).not.toBeInTheDocument();
      },
    );

    it('两轮长开发回复点击导航只定位消息区，外层容器保持原位置', async () => {
      const container = buildNarrowContainer();
      const messageList = [
        ...singleTurnMessages(),
        msg(USER, '继续完善应用', 3),
        msg(ASSISTANT, '完善过程输出\n'.repeat(100), 4),
      ];
      container.innerHTML = messageList
        .map(
          (message) =>
            `<div data-server-message-id="${message.id}">${message.text}</div>`,
        )
        .join('');
      Object.defineProperty(container, 'scrollTop', {
        value: 1000,
        configurable: true,
      });
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(0, 100, 463, 800),
      );
      const anchor = container.querySelector('[data-server-message-id="1"]')!;
      vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(0, -900, 463, 40),
      );
      const scrollTo = vi.fn();
      container.scrollTo = scrollTo;
      const outer = document.createElement('div');
      document.body.appendChild(outer);
      outer.appendChild(container);
      outer.scrollTop = 50;
      outer.scrollTo = vi.fn();

      render(
        <ConversationQuickNav
          scrollContainerRef={{ current: container }}
          messageList={messageList}
        />,
      );
      const lines = await screen.findAllByTestId('conversation-quick-nav-line');
      expect(lines).toHaveLength(2);

      fireEvent.click(lines[0]);

      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
      expect(outer.scrollTo).not.toHaveBeenCalled();
      expect(outer.scrollTop).toBe(50);
    });

    it.each([
      { name: '消息为空', sizes: {}, empty: true },
      { name: '消息区宽度为零', sizes: { clientWidth: 0 } },
      { name: '消息区高度为零', sizes: { clientHeight: 0 } },
    ])('$name 时收起已显示的导航', async ({ sizes, empty }) => {
      const container = buildNarrowContainer();
      const scrollContainerRef = { current: container };
      const messageList = longMessageList().slice(0, 4);
      const { rerender } = render(
        <ConversationQuickNav
          scrollContainerRef={scrollContainerRef}
          messageList={messageList}
        />,
      );
      expect(
        await screen.findByTestId('conversation-quick-nav'),
      ).toBeInTheDocument();

      Object.entries(sizes).forEach(([key, value]) => {
        Object.defineProperty(container, key, { value, configurable: true });
      });
      if (empty) {
        rerender(
          <ConversationQuickNav
            scrollContainerRef={scrollContainerRef}
            messageList={[]}
          />,
        );
      } else {
        fireEvent.scroll(container);
      }

      await waitFor(() =>
        expect(
          screen.queryByTestId('conversation-quick-nav'),
        ).not.toBeInTheDocument(),
      );
    });

    it('消息从一轮变两轮时显示、回到一轮时隐藏，滚动容器 ref 保持不变', async () => {
      const container = buildNarrowContainer();
      const scrollContainerRef = { current: container };
      const oneTurnMessages = singleTurnMessages();
      const twoTurnMessages = [
        ...oneTurnMessages,
        msg(USER, '继续完善应用', 3),
        msg(ASSISTANT, '完善过程输出\n'.repeat(100), 4),
      ];
      const { rerender } = render(
        <ConversationQuickNav
          scrollContainerRef={scrollContainerRef}
          messageList={oneTurnMessages}
        />,
      );
      // 等初次异步测量完成，避免隐藏断言在测量前就通过。
      await act(async () => {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 0);
        });
      });
      expect(
        screen.queryByTestId('conversation-quick-nav'),
      ).not.toBeInTheDocument();

      rerender(
        <ConversationQuickNav
          scrollContainerRef={scrollContainerRef}
          messageList={twoTurnMessages}
        />,
      );
      expect(
        await screen.findAllByTestId('conversation-quick-nav-line'),
      ).toHaveLength(2);

      rerender(
        <ConversationQuickNav
          scrollContainerRef={scrollContainerRef}
          messageList={oneTurnMessages}
        />,
      );
      await waitFor(() =>
        expect(
          screen.queryByTestId('conversation-quick-nav'),
        ).not.toBeInTheDocument(),
      );
    });
  });

  it('fixed 定位：左缘=定位上下文左缘左移 10px、顶=滚动容器视口垂直中心', () => {
    const container = buildContainer();
    const sessionEl = document.createElement('div');
    vi.spyOn(sessionEl, 'getBoundingClientRect').mockReturnValue({
      left: 300,
    } as DOMRect);
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 300,
      top: 100,
    } as DOMRect);
    Object.defineProperty(container, 'offsetParent', {
      value: sessionEl,
      configurable: true,
    });

    renderNav(container, longMessageList());
    const nav = screen.getByTestId('conversation-quick-nav');
    // top = 容器视口顶 100 + clientHeight 800 / 2；left = 定位上下文 300 - 10
    expect(nav.style.top).toBe('500px');
    expect(nav.style.left).toBe('290px');
  });

  it('鼠标进入即形成 12→16→24px 波浪，离开后复位（不依赖 rAF）', () => {
    const container = buildContainer();
    renderNav(container, longMessageList());
    const nav = screen.getByTestId('conversation-quick-nav');
    const lines = screen.getAllByTestId('conversation-quick-nav-line');
    mockLineRects(lines);
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);

    fireEvent.mouseEnter(nav, { clientY: 4 });
    expect(lines[0].style.transform).toBe('scaleX(2)');
    const neighborScale = Number(
      lines[1].style.transform.match(/scaleX\(([^)]+)\)/)?.[1],
    );
    expect(neighborScale).toBeGreaterThan(1.3);
    expect(neighborScale).toBeLessThan(1.4);
    const distantScale = Number(
      lines[2].style.transform.match(/scaleX\(([^)]+)\)/)?.[1],
    );
    expect(distantScale).toBeLessThan(1.05);
    expect(raf).not.toHaveBeenCalled();

    fireEvent.mouseMove(lines[2], { clientY: 24 });
    expect(lines[2].style.transform).toBe('scaleX(2)');
    expect(lines[0].style.transform).not.toBe('scaleX(2)');

    fireEvent.mouseLeave(nav);
    expect(lines[0].style.transform).toBe('');
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

  it('悬停当前黑色线条时，该线条必须成为波峰', () => {
    const container = buildContainer();
    Object.defineProperty(container, 'scrollTop', {
      value: 1600,
      configurable: true,
    });
    renderNav(container, longMessageList());
    const lines = screen.getAllByTestId('conversation-quick-nav-line');
    mockLineRects(lines);
    const activeLine = lines[lines.length - 1];
    expect(activeLine.className).toContain('active');

    fireEvent.mouseEnter(activeLine, { clientY: 0 });
    expect(activeLine.style.transform).toBe('scaleX(2)');
    expect(lines[0].style.transform).not.toBe('scaleX(2)');

    fireEvent.mouseMove(activeLine, { clientY: 0 });
    expect(activeLine.style.transform).toBe('scaleX(2)');
    expect(lines[0].style.transform).not.toBe('scaleX(2)');
  });

  it('切换波峰时预览只对应新的最长线条', async () => {
    const container = buildContainer();
    renderNav(container, longMessageList());
    const lines = screen.getAllByTestId('conversation-quick-nav-line');
    mockLineRects(lines);

    fireEvent.mouseEnter(lines[4], { clientY: 44 });
    expect(await screen.findByText('消息内容 9')).toBeInTheDocument();
    fireEvent.mouseMove(lines[1], { clientY: 14 });
    expect(lines[1].style.transform).toBe('scaleX(2)');
    expect(screen.queryByText('消息内容 9')).not.toBeInTheDocument();
    expect(await screen.findByText('消息内容 3')).toBeInTheDocument();
  });

  it('容器 mousemove 命中路径按 data-nav-index 对位（悬停哪条线预览哪一块）', async () => {
    const container = buildContainer();
    renderNav(container, longMessageList());
    const lines = screen.getAllByTestId('conversation-quick-nav-line');
    mockLineRects(lines);

    // 走导航容器的 move 处理（原 linesRef.indexOf 路径）：逐条悬停断言预览内容
    for (const [index, expectText] of [
      [0, '消息内容 1'],
      [2, '消息内容 5'],
      [4, '消息内容 9'],
    ] as const) {
      fireEvent.mouseMove(lines[index], { clientY: index * 10 + 4 });
      expect(await screen.findByText(expectText)).toBeInTheDocument();
    }
  });

  it('预览浮层锚定命中线条：悬停第 N 条只打开第 N 条的浮层', async () => {
    const container = buildContainer();
    renderNav(container, longMessageList());
    const lines = screen.getAllByTestId('conversation-quick-nav-line');
    mockLineRects(lines);

    fireEvent.mouseEnter(lines[2], { clientY: 24 });
    await screen.findByText('消息内容 5');
    // 受控 Tooltip 只允许命中那条线的浮层带内容（各线一块、内容互斥）
    fireEvent.mouseEnter(lines[0], { clientY: 4 });
    expect(await screen.findByText('消息内容 1')).toBeInTheDocument();
    expect(screen.queryByText('消息内容 5')).not.toBeInTheDocument();
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
