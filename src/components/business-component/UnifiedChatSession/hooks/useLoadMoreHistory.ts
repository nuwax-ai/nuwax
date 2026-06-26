import { useEffect, useRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

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
