export const DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY = 5;
export const MIN_CONVERSATION_PAGE_CACHE_CAPACITY = 1;
export const MAX_CONVERSATION_PAGE_CACHE_CAPACITY = 12;

export const normalizeConversationPageCacheCapacity = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY;
  return Math.min(
    MAX_CONVERSATION_PAGE_CACHE_CAPACITY,
    Math.max(MIN_CONVERSATION_PAGE_CACHE_CAPACITY, Math.floor(parsed)),
  );
};

export type ConversationWorkspaceView =
  | 'closed'
  | 'filePreview'
  | 'terminal'
  | 'desktop'
  | 'pagePreview';

export type ConversationPageCacheLifecycle = 'active' | 'cached' | 'disposing';

export interface ConversationDraftData {
  version: 1;
  text: string;
  skillIds?: number[];
  savedAt: number;
}

export interface ConversationDraftSummary {
  hasContent: boolean;
  textLength: number;
  skillCount: number;
  savedAt: number | null;
}

export interface ConversationPageResourceState {
  terminalMounted: boolean;
  terminalConnected: boolean;
  pageIframeMounted: boolean;
  fileWorkspaceDirty: boolean;
  desktopVisible: boolean;
}

export interface ConversationPageCacheEntry {
  key: string;
  surface: string;
  conversationId: string;
  agentId?: string;
  view: ConversationWorkspaceView;
  lifecycle: ConversationPageCacheLifecycle;
  /** 会话任务处于 CREATE/EXECUTING（执行中）时为 true。 */
  executing: boolean;
  /** 进入执行态的时间戳；非执行态为 null。 */
  executingSince: number | null;
  createdAt: number;
  lastAccessAt: number;
  revision: number;
  draft: ConversationDraftSummary;
  resources: ConversationPageResourceState;
}

export interface ConversationPageCacheSnapshot {
  capacity: number;
  activeKey: string | null;
  sharedVncOwnerConversationId: string | null;
  entries: ConversationPageCacheEntry[];
}

export const EMPTY_DRAFT_SUMMARY: ConversationDraftSummary = {
  hasContent: false,
  textLength: 0,
  skillCount: 0,
  savedAt: null,
};

export const EMPTY_RESOURCE_STATE: ConversationPageResourceState = {
  terminalMounted: false,
  terminalConnected: false,
  pageIframeMounted: false,
  fileWorkspaceDirty: false,
  desktopVisible: false,
};

export function selectConversationPageCacheEvictionKey(
  entries: Iterable<ConversationPageCacheEntry>,
  activeKey: string | null,
): string | null {
  const candidate = [...entries]
    .filter(
      (entry) => entry.key !== activeKey && entry.lifecycle !== 'disposing',
    )
    .sort(
      (left, right) =>
        left.lastAccessAt - right.lastAccessAt ||
        left.createdAt - right.createdAt ||
        left.key.localeCompare(right.key),
    )[0];
  return candidate?.key ?? null;
}

export const createConversationPageCacheKey = (
  surface: string,
  conversationId: number | string,
): string => `${surface}:${conversationId}`;
