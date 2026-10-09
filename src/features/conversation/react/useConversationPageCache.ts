import { useSyncExternalStore } from 'react';
import { conversationPageCacheManager } from '../runtime/conversationPageCacheManager';

export const useConversationPageCache = () =>
  useSyncExternalStore(
    conversationPageCacheManager.subscribe,
    conversationPageCacheManager.getSnapshot,
    conversationPageCacheManager.getSnapshot,
  );

export { createConversationPageCacheKey } from '../domain/conversationPageCache';
export type {
  ConversationPageCacheEntry,
  ConversationPageCacheSnapshot,
  ConversationWorkspaceView,
} from '../domain/conversationPageCache';
export { conversationPageCacheManager } from '../runtime/conversationPageCacheManager';
