import { useUnifiedChatScroll } from '@/components/business-component/UnifiedChatSession/hooks/useUnifiedChatScroll';
import { MessageStatusEnum } from '@/types/enums/common';
import { act, renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseConversationScrollDetection } = vi.hoisted(() => ({
  mockUseConversationScrollDetection: vi.fn(),
}));

vi.mock('@/hooks/useConversationScrollDetection', () => ({
  useConversationScrollDetection: (...args: unknown[]) =>
    mockUseConversationScrollDetection(...args),
}));

function createScrollElement({
  scrollHeight = 1000,
  clientHeight = 300,
  scrollTop: initialScrollTop = 0,
}: {
  scrollHeight?: number;
  clientHeight?: number;
  scrollTop?: number;
}) {
  const scrollTopState = { current: initialScrollTop };
  const element = document.createElement('div');
  element.scrollTo = vi.fn();
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  });
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => scrollTopState.current,
    set: (value) => {
      scrollTopState.current = value;
    },
  });
  return element;
}

/**
 * 带锚点子元素的滚动容器（NW-062 复现专用）：
 * container > content > anchor，锚点 rect.top 随 anchorDocTop 与容器 scrollTop 动态变化，
 * 模拟真实浏览器中「内容块在文档中的绝对位置」与滚动偏移的关系。
 */
function createAnchoredScrollElement({
  scrollHeight: initialScrollHeight = 1000,
  clientHeight = 300,
  scrollTop: initialScrollTop = 120,
  anchorDocTop: initialAnchorDocTop = 200,
}: {
  scrollHeight?: number;
  clientHeight?: number;
  scrollTop?: number;
  anchorDocTop?: number;
} = {}) {
  const scrollTopState = { current: initialScrollTop };
  const scrollHeightState = { current: initialScrollHeight };
  const anchorDocTop = { current: initialAnchorDocTop };
  const element = document.createElement('div');
  element.scrollTo = vi.fn();
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeightState.current,
  });
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  });
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => scrollTopState.current,
    set: (value) => {
      scrollTopState.current = value;
    },
  });
  element.getBoundingClientRect = () =>
    ({ top: 0, bottom: clientHeight, height: clientHeight }) as DOMRect;

  const content = document.createElement('div');
  const anchor = document.createElement('div');
  Object.defineProperty(anchor, 'offsetHeight', {
    configurable: true,
    get: () => 50,
  });
  anchor.getBoundingClientRect = () => {
    const top = anchorDocTop.current - scrollTopState.current;
    return { top, bottom: top + 50, height: 50 } as DOMRect;
  };
  content.appendChild(anchor);
  element.appendChild(content);

  const setScrollHeight = (value: number) => {
    scrollHeightState.current = value;
  };
  const setUserScrollTop = (value: number) => {
    scrollTopState.current = value;
    element.dispatchEvent(new Event('scroll'));
  };
  return {
    element,
    anchor,
    anchorDocTop,
    setScrollHeight,
    setUserScrollTop,
  };
}

/** 可手动触发回调的 ResizeObserver 桩（jsdom 未实现） */
function stubResizeObserver() {
  const instances: { callback: () => void; observe: ReturnType<typeof vi.fn> }[] =
    [];
  class ResizeObserverStub {
    callback: () => void;
    observe = vi.fn();
    constructor(callback: () => void) {
      this.callback = callback;
      instances.push(this as any);
    }
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub as any);
  return {
    /** 触发最近创建的安置窗口观察者回调（模拟图片加载等撑高内容） */
    fireLatest: () => {
      const latest = instances[instances.length - 1];
      latest?.callback();
    },
  };
}

describe('useUnifiedChatScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('发送消息时恢复自动滚动并立即置底', () => {
    const element = createScrollElement({ scrollHeight: 1200 });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };
    const allowAutoScrollRef = { current: false };
    const onScrollBtnVisibleChange = vi.fn();

    const { result } = renderHook(() =>
      useUnifiedChatScroll({
        externalMessageViewRef: messageViewRef,
        externalAllowAutoScrollRef: allowAutoScrollRef,
        showScrollBtn: true,
        onScrollBtnVisibleChange,
      }),
    );

    act(() => {
      result.current.handleSendScrollReset();
    });

    expect(allowAutoScrollRef.current).toBe(true);
    expect(onScrollBtnVisibleChange).toHaveBeenLastCalledWith(false);
    expect(element.scrollTo).toHaveBeenCalledWith({
      top: 1200,
      behavior: 'instant',
    });
    expect((element as any).__isProgrammaticScroll).toBe(true);

    act(() => {
      // 多级延迟置底最后一次在 800ms，程序滚动标记于其后 100ms 复位。
      vi.advanceTimersByTime(901);
    });

    expect((element as any).__isProgrammaticScroll).toBe(false);
  });

  it('点击回到底部时平滑滚动并隐藏按钮', () => {
    const element = createScrollElement({ scrollHeight: 1600 });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };
    const allowAutoScrollRef = { current: false };
    const onScrollBtnVisibleChange = vi.fn();

    const { result } = renderHook(() =>
      useUnifiedChatScroll({
        externalMessageViewRef: messageViewRef,
        externalAllowAutoScrollRef: allowAutoScrollRef,
        onScrollBtnVisibleChange,
      }),
    );

    act(() => {
      result.current.onScrollBottom();
    });

    expect(allowAutoScrollRef.current).toBe(true);
    expect(element.scrollTo).toHaveBeenCalledWith({
      top: 1600,
      behavior: 'smooth',
    });
    expect(onScrollBtnVisibleChange).toHaveBeenLastCalledWith(false);
  });

  it('新增消息且允许自动滚动时置底，关闭自动滚动时不打断用户位置', () => {
    const element = createScrollElement({ scrollHeight: 900 });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };
    const allowAutoScrollRef = { current: true };

    const { rerender } = renderHook(
      ({ messageList }) =>
        useUnifiedChatScroll({
          externalMessageViewRef: messageViewRef,
          externalAllowAutoScrollRef: allowAutoScrollRef,
          messageList,
        }),
      { initialProps: { messageList: [] as any[] } },
    );

    rerender({ messageList: [{ id: 'm1', text: 'hello' }] });
    expect(element.scrollTo).toHaveBeenCalledWith({
      top: 900,
      behavior: 'instant',
    });

    allowAutoScrollRef.current = false;
    vi.mocked(element.scrollTo).mockClear();
    rerender({
      messageList: [
        { id: 'm1', text: 'hello' },
        { id: 'm2', text: 'do not jump' },
      ],
    });

    expect(element.scrollTo).not.toHaveBeenCalled();
  });

  it('流式结束下降沿会补一次置底，覆盖 markdown 渲染后撑高的场景', () => {
    const element = createScrollElement({ scrollHeight: 1000 });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };
    const allowAutoScrollRef = { current: true };

    const { rerender } = renderHook(
      ({ messageList, isConversationActive }) =>
        useUnifiedChatScroll({
          externalMessageViewRef: messageViewRef,
          externalAllowAutoScrollRef: allowAutoScrollRef,
          messageList,
          isConversationActive,
        }),
      {
        initialProps: {
          isConversationActive: true,
          messageList: [
            {
              id: 'assistant-1',
              text: 'streaming',
              status: MessageStatusEnum.Loading,
            },
          ],
        },
      },
    );

    vi.mocked(element.scrollTo).mockClear();
    rerender({
      isConversationActive: false,
      messageList: [
        {
          id: 'assistant-1',
          text: 'streaming',
          status: MessageStatusEnum.Complete,
        },
      ],
    });

    expect(element.scrollTo).toHaveBeenCalledWith({
      top: 1000,
      behavior: 'instant',
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(element.scrollTo).toHaveBeenCalled();
  });

  it('加载更多历史完成后按新增高度修正 scrollTop，避免视口跳动', () => {
    let scrollHeight = 1000;
    const element = createScrollElement({ scrollHeight, scrollTop: 120 });
    Object.defineProperty(element, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeight,
    });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };

    const { rerender } = renderHook(
      ({ loadingMore, messageList }) =>
        useUnifiedChatScroll({
          externalMessageViewRef: messageViewRef,
          loadingMore,
          messageList,
        }),
      {
        initialProps: {
          loadingMore: true,
          messageList: [{ id: 'old-2' }],
        },
      },
    );

    scrollHeight = 1300;
    rerender({
      loadingMore: false,
      messageList: [{ id: 'old-1' }, { id: 'old-2' }],
    });

    expect(element.scrollTop).toBe(420);
  });

  // ---- NW-062：上滑加载历史时旧消息「弹出」与滚动失锚 ----

  it('NW-062 加载期间用户继续上滚：落地补偿锚定最新阅读位置而非触发时刻（旧实现会拽回 420）', () => {
    const { element, anchorDocTop, setScrollHeight, setUserScrollTop } =
      createAnchoredScrollElement({ scrollTop: 120, anchorDocTop: 200 });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };
    const allowAutoScrollRef = { current: false };

    const { rerender } = renderHook(
      ({ loadingMore, messageList }) =>
        useUnifiedChatScroll({
          externalMessageViewRef: messageViewRef,
          externalAllowAutoScrollRef: allowAutoScrollRef,
          loadingMore,
          messageList,
        }),
      {
        initialProps: {
          loadingMore: false,
          messageList: [{ id: 'old-2' }],
        },
      },
    );

    // 触发上滑加载（记录锚点），随后用户在 fetch 期间惯性上滚 120 → 60
    rerender({ loadingMore: true, messageList: [{ id: 'old-2' }] });
    setUserScrollTop(60);

    // 历史页落地：上方插入 300px，锚点被推下去
    anchorDocTop.current = 500;
    setScrollHeight(1300);
    rerender({
      loadingMore: false,
      messageList: [{ id: 'old-1' }, { id: 'old-2' }],
    });

    // 正确锚定 = 用户最新位置 60 + 插入高度 300 = 360（旧实现按触发时刻 120 补成 420）
    expect(element.scrollTop).toBe(360);
  });

  it('NW-062 落地后异步撑高（图片/mermaid）与收缩（用户气泡折叠）在安置窗口内持续补偿', () => {
    const { fireLatest } = stubResizeObserver();
    const { element, anchorDocTop, setScrollHeight, setUserScrollTop } =
      createAnchoredScrollElement({ scrollTop: 120, anchorDocTop: 200 });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };
    const allowAutoScrollRef = { current: false };

    const { rerender } = renderHook(
      ({ loadingMore, messageList }) =>
        useUnifiedChatScroll({
          externalMessageViewRef: messageViewRef,
          externalAllowAutoScrollRef: allowAutoScrollRef,
          loadingMore,
          messageList,
        }),
      {
        initialProps: {
          loadingMore: false,
          messageList: [{ id: 'old-2' }],
        },
      },
    );

    rerender({ loadingMore: true, messageList: [{ id: 'old-2' }] });
    setUserScrollTop(60);
    anchorDocTop.current = 500;
    setScrollHeight(1300);
    rerender({
      loadingMore: false,
      messageList: [{ id: 'old-1' }, { id: 'old-2' }],
    });
    expect(element.scrollTop).toBe(360);

    // 落地帧之后图片加载再撑高 200：旧实现一次性补偿罩不住 → 视口漂移旧消息「弹出」
    anchorDocTop.current = 700;
    setScrollHeight(1500);
    act(() => {
      fireLatest();
    });
    expect(element.scrollTop).toBe(560);

    // V2 用户气泡先全量挂载再折叠（收缩 150）也要回推
    anchorDocTop.current = 550;
    setScrollHeight(1350);
    act(() => {
      fireLatest();
    });
    expect(element.scrollTop).toBe(410);
  });

  it('NW-062 安置窗口内用户主动滚动不与补偿互打：以用户最新位置为新基准', () => {
    const { fireLatest } = stubResizeObserver();
    const { element, anchorDocTop, setScrollHeight, setUserScrollTop } =
      createAnchoredScrollElement({ scrollTop: 120, anchorDocTop: 200 });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };
    const allowAutoScrollRef = { current: false };

    const { rerender } = renderHook(
      ({ loadingMore, messageList }) =>
        useUnifiedChatScroll({
          externalMessageViewRef: messageViewRef,
          externalAllowAutoScrollRef: allowAutoScrollRef,
          loadingMore,
          messageList,
        }),
      {
        initialProps: {
          loadingMore: false,
          messageList: [{ id: 'old-2' }],
        },
      },
    );

    rerender({ loadingMore: true, messageList: [{ id: 'old-2' }] });
    setUserScrollTop(60);
    anchorDocTop.current = 500;
    setScrollHeight(1300);
    rerender({
      loadingMore: false,
      messageList: [{ id: 'old-1' }, { id: 'old-2' }],
    });
    expect(element.scrollTop).toBe(360);

    // 用户在安置窗口内继续上滚到 300：无内容变化时补偿必须为 0（不能拽回）
    setUserScrollTop(300);
    act(() => {
      fireLatest();
    });
    expect(element.scrollTop).toBe(300);

    // 其后的内容撑高以用户最新位置为基准补偿（+100 → 400），而非旧基准
    anchorDocTop.current = 600;
    setScrollHeight(1400);
    act(() => {
      fireLatest();
    });
    expect(element.scrollTop).toBe(400);
  });

  it('NW-062 旧线 adjustScrollPositionAfterDOMUpdate 窗口活动时整体让位，不叠加补偿', () => {
    const { element, setScrollHeight, setUserScrollTop } =
      createAnchoredScrollElement({ scrollTop: 120, anchorDocTop: 200 });
    (element as any).__legacyScrollAnchorWindow = true;
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };

    const { rerender } = renderHook(
      ({ loadingMore, messageList }) =>
        useUnifiedChatScroll({
          externalMessageViewRef: messageViewRef,
          loadingMore,
          messageList,
        }),
      {
        initialProps: {
          loadingMore: false,
          messageList: [{ id: 'old-2' }],
        },
      },
    );

    rerender({ loadingMore: true, messageList: [{ id: 'old-2' }] });
    setUserScrollTop(60);
    setScrollHeight(1300);
    rerender({
      loadingMore: false,
      messageList: [{ id: 'old-1' }, { id: 'old-2' }],
    });

    // 旧线自己的 ResizeObserver 窗口负责补偿，本钩子不介入（位置保持 fetch 后的原值）
    expect(element.scrollTop).toBe(60);
  });

  it('NW-062 贴底跟随模式（allowAutoScroll）下安置窗口不干预，置底交给尾部跟随逻辑', () => {
    const { fireLatest } = stubResizeObserver();
    const { element, anchorDocTop, setScrollHeight, setUserScrollTop } =
      createAnchoredScrollElement({ scrollTop: 120, anchorDocTop: 200 });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };
    const allowAutoScrollRef = { current: false };

    const { rerender } = renderHook(
      ({ loadingMore, messageList }) =>
        useUnifiedChatScroll({
          externalMessageViewRef: messageViewRef,
          externalAllowAutoScrollRef: allowAutoScrollRef,
          loadingMore,
          messageList,
        }),
      {
        initialProps: {
          loadingMore: false,
          messageList: [{ id: 'old-2' }],
        },
      },
    );

    rerender({ loadingMore: true, messageList: [{ id: 'old-2' }] });
    setUserScrollTop(60);
    anchorDocTop.current = 500;
    setScrollHeight(1300);
    rerender({
      loadingMore: false,
      messageList: [{ id: 'old-1' }, { id: 'old-2' }],
    });
    const landedScrollTop = element.scrollTop;
    expect(landedScrollTop).toBe(360);

    // 用户滚回底部进入贴底跟随：后续撑高不由安置窗口拉扯
    allowAutoScrollRef.current = true;
    anchorDocTop.current = 700;
    setScrollHeight(1500);
    act(() => {
      fireLatest();
    });
    expect(element.scrollTop).toBe(360);
  });

  it('hover 到可滚动且未到底部的聊天区时显示回到底部按钮', () => {
    const element = createScrollElement({
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 100,
    });
    const messageViewRef: MutableRefObject<HTMLDivElement | null> = {
      current: element,
    };
    const onScrollBtnVisibleChange = vi.fn();

    const { result } = renderHook(() =>
      useUnifiedChatScroll({
        externalMessageViewRef: messageViewRef,
        onScrollBtnVisibleChange,
      }),
    );

    act(() => {
      result.current.handleMouseEnter();
    });

    expect(result.current.isHoveringChat).toBe(true);
    expect(onScrollBtnVisibleChange).toHaveBeenLastCalledWith(true);
  });
});
