import { useUnifiedChatScroll } from '@/components/business-component/UnifiedChatSession/hooks/useUnifiedChatScroll';
import { MessageStatusEnum } from '@/types/enums/common';
import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
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

describe('useUnifiedChatScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('发送消息时恢复自动滚动并立即置底', () => {
    const element = createScrollElement({ scrollHeight: 1200 });
    const messageViewRef = createRef<HTMLDivElement>();
    const allowAutoScrollRef = { current: false };
    const onScrollBtnVisibleChange = vi.fn();
    messageViewRef.current = element;

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
      vi.advanceTimersByTime(100);
    });

    expect((element as any).__isProgrammaticScroll).toBe(false);
  });

  it('点击回到底部时平滑滚动并隐藏按钮', () => {
    const element = createScrollElement({ scrollHeight: 1600 });
    const messageViewRef = createRef<HTMLDivElement>();
    const allowAutoScrollRef = { current: false };
    const onScrollBtnVisibleChange = vi.fn();
    messageViewRef.current = element;

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
    const messageViewRef = createRef<HTMLDivElement>();
    const allowAutoScrollRef = { current: true };
    messageViewRef.current = element;

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
    const messageViewRef = createRef<HTMLDivElement>();
    const allowAutoScrollRef = { current: true };
    messageViewRef.current = element;

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
    const messageViewRef = createRef<HTMLDivElement>();
    messageViewRef.current = element;

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

  it('hover 到可滚动且未到底部的聊天区时显示回到底部按钮', () => {
    const element = createScrollElement({
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 100,
    });
    const messageViewRef = createRef<HTMLDivElement>();
    const onScrollBtnVisibleChange = vi.fn();
    messageViewRef.current = element;

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
