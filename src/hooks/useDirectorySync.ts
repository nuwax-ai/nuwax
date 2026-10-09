import type {
  ConversationChangedEvent,
  ProjectChangedEvent,
} from '@/types/directorySync';
import {
  installDirectorySyncLegacyBridge,
  subscribeConversationChanged,
  subscribeProjectChanged,
} from '@/utils/directorySyncEvents';
import { useEffect, useRef } from 'react';

function useStableSubscription<T>(
  subscribe: (handler: (event: T) => void) => () => void,
  handler: (event: T) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const disposeBridge = installDirectorySyncLegacyBridge();
    const unsubscribe = subscribe((event) => handlerRef.current(event));
    return () => {
      unsubscribe();
      disposeBridge();
    };
  }, [subscribe]);
}

export function useConversationChanged(
  handler: (event: ConversationChangedEvent) => void,
) {
  useStableSubscription(subscribeConversationChanged, handler);
}

export function useProjectChanged(
  handler: (event: ProjectChangedEvent) => void,
) {
  useStableSubscription(subscribeProjectChanged, handler);
}
