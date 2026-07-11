import { useLoadMoreHistory } from '@/components/business-component/UnifiedChatSession/hooks/useLoadMoreHistory';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseIntersectionObserver, intersectionState } = vi.hoisted(() => ({
  mockUseIntersectionObserver: vi.fn(),
  intersectionState: {
    inView: false,
    ref: vi.fn(),
  },
}));

vi.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (...args: unknown[]) =>
    mockUseIntersectionObserver(...args),
}));

describe('useLoadMoreHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    intersectionState.inView = false;
    intersectionState.ref = vi.fn();
    mockUseIntersectionObserver.mockReturnValue(intersectionState);
  });

  it('sentinel 首次进入视口且具备更多历史时触发加载', () => {
    const onLoadMoreMessage = vi.fn();
    const { rerender, result } = renderHook(
      (props) => useLoadMoreHistory(props),
      {
        initialProps: {
          conversationId: 1001,
          messageList: [{ id: 'm1' }],
          isMoreMessage: true,
          loadingMore: false,
          onLoadMoreMessage,
        },
      },
    );

    expect(result.current.loadMoreRef).toBe(intersectionState.ref);
    expect(onLoadMoreMessage).not.toHaveBeenCalled();

    intersectionState.inView = true;
    rerender({
      conversationId: 1001,
      messageList: [{ id: 'm1' }],
      isMoreMessage: true,
      loadingMore: false,
      onLoadMoreMessage,
    });

    expect(onLoadMoreMessage).toHaveBeenCalledTimes(1);
    expect(onLoadMoreMessage).toHaveBeenCalledWith(1001);
  });

  it('停留在视口内时不会重复触发，离开后再次进入才会重新触发', () => {
    const onLoadMoreMessage = vi.fn();
    const props = {
      conversationId: 1001,
      messageList: [{ id: 'm1' }],
      isMoreMessage: true,
      loadingMore: false,
      onLoadMoreMessage,
    };
    const { rerender } = renderHook(() => useLoadMoreHistory(props));

    intersectionState.inView = true;
    rerender();
    rerender();
    expect(onLoadMoreMessage).toHaveBeenCalledTimes(1);

    intersectionState.inView = false;
    rerender();
    intersectionState.inView = true;
    rerender();

    expect(onLoadMoreMessage).toHaveBeenCalledTimes(2);
  });

  it('缺少会话、消息、更多历史或正在加载时不触发', () => {
    const onLoadMoreMessage = vi.fn();
    const { rerender } = renderHook((props) => useLoadMoreHistory(props), {
      initialProps: {
        conversationId: undefined,
        messageList: [{ id: 'm1' }],
        isMoreMessage: true,
        loadingMore: false,
        onLoadMoreMessage,
      },
    });

    intersectionState.inView = true;
    rerender({
      conversationId: undefined,
      messageList: [{ id: 'm1' }],
      isMoreMessage: true,
      loadingMore: false,
      onLoadMoreMessage,
    });
    expect(onLoadMoreMessage).not.toHaveBeenCalled();

    intersectionState.inView = false;
    rerender({
      conversationId: 1001,
      messageList: [],
      isMoreMessage: true,
      loadingMore: false,
      onLoadMoreMessage,
    });
    intersectionState.inView = true;
    rerender({
      conversationId: 1001,
      messageList: [],
      isMoreMessage: true,
      loadingMore: false,
      onLoadMoreMessage,
    });
    expect(onLoadMoreMessage).not.toHaveBeenCalled();

    intersectionState.inView = false;
    rerender({
      conversationId: 1001,
      messageList: [{ id: 'm1' }],
      isMoreMessage: false,
      loadingMore: false,
      onLoadMoreMessage,
    });
    intersectionState.inView = true;
    rerender({
      conversationId: 1001,
      messageList: [{ id: 'm1' }],
      isMoreMessage: false,
      loadingMore: false,
      onLoadMoreMessage,
    });
    expect(onLoadMoreMessage).not.toHaveBeenCalled();

    intersectionState.inView = false;
    rerender({
      conversationId: 1001,
      messageList: [{ id: 'm1' }],
      isMoreMessage: true,
      loadingMore: true,
      onLoadMoreMessage,
    });
    intersectionState.inView = true;
    rerender({
      conversationId: 1001,
      messageList: [{ id: 'm1' }],
      isMoreMessage: true,
      loadingMore: true,
      onLoadMoreMessage,
    });

    expect(onLoadMoreMessage).not.toHaveBeenCalled();
  });
});
