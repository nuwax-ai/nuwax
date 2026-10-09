import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useEffect, useRef } from 'react';

interface UseLoadMoreHistoryProps {
  conversationId?: number;
  messageList?: any[];
  isMoreMessage?: boolean;
  loadingMore?: boolean;
  onLoadMoreMessage?: (id: number) => void;
}

export function useLoadMoreHistory({
  conversationId,
  messageList = [],
  isMoreMessage = false,
  loadingMore = false,
  onLoadMoreMessage,
}: UseLoadMoreHistoryProps) {
  const { ref: loadMoreRef, inView: loadMoreInView } = useIntersectionObserver({
    rootMargin: '10px 0px 0px 0px',
    threshold: 0,
  });

  const prevLoadMoreInViewRef = useRef<boolean>(false);

  // 切换会话时复位进入沿记忆：新会话哨兵若挂载即在视口内（短会话），
  // 也能立即触发一次加载确认，不会被上一会话的可见状态卡住
  useEffect(() => {
    prevLoadMoreInViewRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    const isEntering = loadMoreInView && !prevLoadMoreInViewRef.current;
    prevLoadMoreInViewRef.current = loadMoreInView;

    if (
      isEntering &&
      isMoreMessage &&
      !loadingMore &&
      messageList?.length > 0 &&
      conversationId
    ) {
      onLoadMoreMessage?.(conversationId);
    }
  }, [
    loadMoreInView,
    isMoreMessage,
    loadingMore,
    messageList?.length,
    conversationId,
    onLoadMoreMessage,
  ]);

  return { loadMoreRef };
}
