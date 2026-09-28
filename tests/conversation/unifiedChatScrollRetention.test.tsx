import { useUnifiedChatScroll } from '@/components/business-component/UnifiedChatSession/hooks/useUnifiedChatScroll';
import { MessageStatusEnum } from '@/types/enums/common';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const resizeObservers: {
  callback: ResizeObserverCallback;
  targets: Set<Element>;
}[] = [];

function notifyResize() {
  resizeObservers.forEach((observer) => {
    if (observer.targets.size) {
      observer.callback([], observer as unknown as ResizeObserver);
    }
  });
}

function createViewport() {
  let hidden = false;
  let height = 1600;
  let top = 0;
  const element = document.createElement('div');
  const content = document.createElement('div');
  content.append(document.createElement('div'));
  element.append(content);
  Object.defineProperties(element, {
    clientHeight: { get: () => (hidden ? 0 : 300) },
    scrollHeight: { get: () => (hidden ? 0 : height) },
    scrollTop: {
      get: () => (hidden ? 0 : top),
      set: (value: number) => {
        top = value;
      },
    },
  });
  element.scrollTo = vi.fn((options?: ScrollToOptions | number, y?: number) => {
    const target = typeof options === 'number' ? y : options?.top;
    top = hidden ? 0 : Math.min(target ?? 0, height - 300);
    element.dispatchEvent(new Event('scroll'));
  });
  const ref = { current: element };
  return {
    element,
    content,
    ref,
    hide: () => {
      hidden = true;
    },
    show: () => {
      hidden = false;
    },
    resize: (next: number) => {
      height = next;
    },
    scroll: (next: number) => {
      top = next;
      element.dispatchEvent(new Event('scroll'));
    },
  };
}

const streamingMessage = (text: string) => [
  { id: 'assistant-1', text, status: MessageStatusEnum.Loading },
];

beforeEach(() => {
  vi.useFakeTimers();
  resizeObservers.length = 0;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      targets = new Set<Element>();
      constructor(public callback: ResizeObserverCallback) {
        resizeObservers.push(this);
      }
      observe(target: Element) {
        this.targets.add(target);
      }
      disconnect() {
        this.targets.clear();
      }
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('保活会话滚动位置', () => {
  it('隐藏期间流式输出和结束均不滚动，切回后继续跟随最新底部', () => {
    const viewport = createViewport();
    const allowAutoScrollRef = { current: true };
    const { rerender } = renderHook(
      ({ active, messageList, isConversationActive }) =>
        useUnifiedChatScroll({
          active,
          externalMessageViewRef: viewport.ref,
          externalAllowAutoScrollRef: allowAutoScrollRef,
          messageList,
          isConversationActive,
        }),
      {
        initialProps: {
          active: true,
          messageList: streamingMessage('开始'),
          isConversationActive: true,
        },
      },
    );
    expect(viewport.element.scrollTop).toBe(1300);
    vi.mocked(viewport.element.scrollTo).mockClear();

    viewport.hide();
    rerender({
      active: false,
      messageList: streamingMessage('后台继续执行'),
      isConversationActive: true,
    });
    expect(allowAutoScrollRef.current).toBe(false);
    rerender({
      active: false,
      messageList: [
        {
          id: 'assistant-1',
          text: '执行结束',
          status: MessageStatusEnum.Complete,
        },
      ],
      isConversationActive: false,
    });
    act(() => vi.advanceTimersByTime(2000));
    expect(viewport.element.scrollTo).not.toHaveBeenCalled();

    viewport.resize(2400);
    viewport.show();
    rerender({
      active: true,
      messageList: [
        {
          id: 'assistant-1',
          text: '执行结束',
          status: MessageStatusEnum.Complete,
        },
      ],
      isConversationActive: false,
    });
    expect(viewport.element.scrollTop).toBe(2100);
    expect(allowAutoScrollRef.current).toBe(true);
  });

  it('反复切换恢复最后一次手动阅读位置，不被隐藏期间零尺寸或消息更新覆盖', () => {
    const viewport = createViewport();
    const allowAutoScrollRef = { current: true };
    const { rerender } = renderHook(
      ({ active, messageList }) =>
        useUnifiedChatScroll({
          active,
          externalMessageViewRef: viewport.ref,
          externalAllowAutoScrollRef: allowAutoScrollRef,
          messageList,
          isConversationActive: true,
        }),
      { initialProps: { active: true, messageList: streamingMessage('开始') } },
    );
    act(() => vi.advanceTimersByTime(1000));

    for (const latestTop of [180, 440]) {
      act(() => viewport.scroll(latestTop));
      expect(allowAutoScrollRef.current).toBe(false);
      viewport.hide();
      rerender({ active: false, messageList: streamingMessage('后台输出') });
      // 模拟隐藏期间内容重排后浏览器保留了更早的位置；隐藏读值始终为零。
      act(() => viewport.scroll(60));
      act(() => vi.advanceTimersByTime(2000));
      viewport.resize(2200);
      viewport.show();
      rerender({ active: true, messageList: streamingMessage('新的输出') });
      expect(viewport.element.scrollTop).toBe(latestTop);
      expect(allowAutoScrollRef.current).toBe(false);
      act(() => vi.advanceTimersByTime(2000));
      expect(viewport.element.scrollTop).toBe(latestTop);
    }
  });

  it('切走前排队的向下滚动检测不能把手动阅读改为自动跟随', () => {
    const viewport = createViewport();
    const allowAutoScrollRef = { current: false };
    const { rerender } = renderHook(
      ({ active }) =>
        useUnifiedChatScroll({
          active,
          externalMessageViewRef: viewport.ref,
          externalAllowAutoScrollRef: allowAutoScrollRef,
          messageList: streamingMessage('执行中'),
          isConversationActive: true,
        }),
      { initialProps: { active: true } },
    );
    act(() => viewport.scroll(200));
    act(() => viewport.scroll(240));
    viewport.hide();
    rerender({ active: false });
    act(() => vi.advanceTimersByTime(2000));
    expect(allowAutoScrollRef.current).toBe(false);
    viewport.show();
    rerender({ active: true });
    expect(viewport.element.scrollTop).toBe(240);
    expect(allowAutoScrollRef.current).toBe(false);
  });
});

describe('历史会话首次展示最新消息', () => {
  const history = [
    { id: 'history-1', text: '最新回答', status: MessageStatusEnum.Complete },
  ];

  it('正文晚于固定延迟才增高，消息引用不变时仍到最新底部', () => {
    const viewport = createViewport();
    viewport.resize(300);
    renderHook(() =>
      useUnifiedChatScroll({
        externalMessageViewRef: viewport.ref,
        messageList: history,
      }),
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(viewport.element.scrollTop).toBe(0);

    act(() => {
      viewport.resize(2400);
      notifyResize();
    });
    expect(viewport.element.scrollTop).toBe(2100);
  });

  it('首次视口没有尺寸，布局就绪后仍展示最新消息', () => {
    const viewport = createViewport();
    viewport.hide();
    renderHook(() =>
      useUnifiedChatScroll({
        externalMessageViewRef: viewport.ref,
        messageList: history,
      }),
    );
    act(() => vi.advanceTimersByTime(3000));

    act(() => {
      viewport.show();
      notifyResize();
    });
    expect(viewport.element.scrollTop).toBe(1300);
  });

  it('用户主动上滑后，后续正文高度变化不会打断阅读', () => {
    const viewport = createViewport();
    const allowAutoScrollRef = { current: true };
    renderHook(() =>
      useUnifiedChatScroll({
        externalMessageViewRef: viewport.ref,
        externalAllowAutoScrollRef: allowAutoScrollRef,
        messageList: history,
      }),
    );
    act(() => vi.advanceTimersByTime(3000));
    act(() => {
      viewport.element.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
      viewport.scroll(400);
    });
    expect(allowAutoScrollRef.current).toBe(false);

    act(() => {
      viewport.resize(2400);
      notifyResize();
    });
    expect(viewport.element.scrollTop).toBe(400);
  });

  it('首次数据到达时分页未完成，分页结束后仍到最新消息', () => {
    const viewport = createViewport();
    const { rerender } = renderHook(
      ({ loadingMore }) =>
        useUnifiedChatScroll({
          externalMessageViewRef: viewport.ref,
          messageList: history,
          loadingMore,
        }),
      { initialProps: { loadingMore: true } },
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(viewport.element.scrollTop).toBe(0);
    rerender({ loadingMore: false });
    act(() => notifyResize());
    expect(viewport.element.scrollTop).toBe(1300);
  });

  it('正文收缩引起的浏览器滚动修正不关闭后续自动跟随', () => {
    const viewport = createViewport();
    const allowAutoScrollRef = { current: true };
    renderHook(() =>
      useUnifiedChatScroll({
        externalMessageViewRef: viewport.ref,
        externalAllowAutoScrollRef: allowAutoScrollRef,
        messageList: history,
      }),
    );
    act(() => vi.advanceTimersByTime(3000));
    act(() => {
      viewport.resize(1200);
      viewport.scroll(900);
      notifyResize();
    });
    expect(allowAutoScrollRef.current).toBe(true);
    act(() => {
      viewport.resize(2400);
      notifyResize();
    });
    expect(viewport.element.scrollTop).toBe(2100);
  });

  it('正文增高同期通过键盘或滚动条上滑，仍关闭自动跟随', () => {
    const viewport = createViewport();
    const allowAutoScrollRef = { current: true };
    renderHook(() =>
      useUnifiedChatScroll({
        externalMessageViewRef: viewport.ref,
        externalAllowAutoScrollRef: allowAutoScrollRef,
        messageList: history,
      }),
    );
    act(() => vi.advanceTimersByTime(3000));
    act(() => {
      viewport.resize(2400);
      // 键盘和拖动滚动条没有 wheel 事件，不能被正文变高误判为排版修正。
      viewport.scroll(1200);
      notifyResize();
    });
    expect(allowAutoScrollRef.current).toBe(false);
    expect(viewport.element.scrollTop).toBe(1200);
  });

  it('懒加载替换内容后贴底，卸载时释放观察器', async () => {
    const viewport = createViewport();
    const { unmount } = renderHook(() =>
      useUnifiedChatScroll({
        externalMessageViewRef: viewport.ref,
        messageList: history,
      }),
    );
    act(() => vi.advanceTimersByTime(3000));
    await act(async () => {
      viewport.resize(2400);
      viewport.content.replaceChildren(document.createElement('div'));
    });
    expect(viewport.element.scrollTop).toBe(2100);
    unmount();
    expect(resizeObservers.every((observer) => !observer.targets.size)).toBe(
      true,
    );
  });
});
