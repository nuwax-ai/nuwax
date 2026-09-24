import { EVENT_TYPE } from '@/constants/event.constants';
import type { ConversationChangedEvent } from '@/types/directorySync';
import { TaskStatus } from '@/types/enums/agent';
import eventBus from '@/utils/eventBus';
import {
  DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY,
  EMPTY_DRAFT_SUMMARY,
  EMPTY_RESOURCE_STATE,
  createConversationPageCacheKey,
  selectConversationPageCacheEvictionKey,
  type ConversationDraftData,
  type ConversationPageCacheEntry,
  type ConversationPageCacheSnapshot,
  type ConversationPageResourceState,
  type ConversationWorkspaceView,
} from '../domain/conversationPageCache';
import { isTerminalTaskStatus } from '../domain/taskStatus';
import { fullPageInstanceCacheManager } from './fullPageInstanceCacheManager';

const PANEL_STORAGE_KEY = 'conversation_page_panel_state:v1';
const DRAFT_STORAGE_PREFIX = 'chat_draft:';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

type Listener = () => void;
type DisposeListener = (
  entry: ConversationPageCacheEntry,
  reason: string,
) => void;

interface ActivateInput {
  surface: string;
  conversationId: number | string;
  agentId?: number | string | null;
}

interface InvalidateOptions {
  clearPanelPreference?: boolean;
  clearDraft?: boolean;
}

const canUseStorage = () => typeof localStorage !== 'undefined';

const parsePanelPreferences = (): Record<string, ConversationWorkspaceView> => {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(PANEL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const validViews = new Set<ConversationWorkspaceView>([
      'closed',
      'filePreview',
      'terminal',
      'desktop',
      'pagePreview',
    ]);
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        validViews.has(value as ConversationWorkspaceView),
      ),
    ) as Record<string, ConversationWorkspaceView>;
  } catch {
    return {};
  }
};

const writePanelPreferences = (
  preferences: Record<string, ConversationWorkspaceView>,
) => {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // 存储不可用时保留本次内存状态。
  }
};

const isValidDraft = (value: unknown): value is ConversationDraftData =>
  !!value &&
  typeof value === 'object' &&
  (value as ConversationDraftData).version === 1 &&
  typeof (value as ConversationDraftData).text === 'string' &&
  typeof (value as ConversationDraftData).savedAt === 'number';

class ConversationPageCacheManager {
  private entries = new Map<string, ConversationPageCacheEntry>();
  private listeners = new Set<Listener>();
  private disposeListeners = new Set<DisposeListener>();
  private activeKey: string | null = null;
  private endedConversationIds = new Set<string>();
  /** 执行中（CREATE/EXECUTING）的会话 id → 进入执行态的时间戳。 */
  private executingConversations = new Map<string, number>();
  private sharedVncOwnerConversationId: string | null = null;
  private capacity = DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY;
  private snapshot: ConversationPageCacheSnapshot = {
    activeKey: null,
    sharedVncOwnerConversationId: null,
    entries: [],
  };

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeDispose = (listener: DisposeListener) => {
    this.disposeListeners.add(listener);
    return () => this.disposeListeners.delete(listener);
  };

  getSnapshot = (): ConversationPageCacheSnapshot => this.snapshot;

  private emit() {
    this.snapshot = {
      activeKey: this.activeKey,
      sharedVncOwnerConversationId: this.sharedVncOwnerConversationId,
      entries: [...this.entries.values()]
        .map((entry) => {
          const executingSince =
            this.executingConversations.get(entry.conversationId) ?? null;
          return {
            ...entry,
            executing: executingSince !== null,
            executingSince,
            draft: { ...entry.draft },
            resources: { ...entry.resources },
          };
        })
        .sort((left, right) => right.lastAccessAt - left.lastAccessAt),
    };
    this.listeners.forEach((listener) => listener());
  }

  getEntry(key: string) {
    return this.entries.get(key);
  }

  getPanelPreference(key: string): ConversationWorkspaceView | undefined {
    return parsePanelPreferences()[key];
  }

  private readDraftSummary(key: string) {
    const draft = this.loadDraft(key);
    return draft
      ? {
          hasContent: true,
          textLength: draft.text.length,
          skillCount: draft.skillIds?.length ?? 0,
          savedAt: draft.savedAt,
        }
      : { ...EMPTY_DRAFT_SUMMARY };
  }

  private createCachedEntry(
    key: string,
    draft: ConversationPageCacheEntry['draft'],
  ): boolean {
    if (this.entries.size >= this.capacity) {
      const evictionKey = selectConversationPageCacheEvictionKey(
        this.entries.values(),
        this.activeKey,
      );
      if (!evictionKey) return false;
      this.invalidate(evictionKey, 'lru');
    }
    const separatorIndex = key.indexOf(':');
    const surface = separatorIndex > 0 ? key.slice(0, separatorIndex) : 'page';
    const conversationId =
      separatorIndex > 0 ? key.slice(separatorIndex + 1) : key;
    const now = Date.now();
    const preferences = parsePanelPreferences();
    const entry: ConversationPageCacheEntry = {
      key,
      surface,
      conversationId,
      view: preferences[key] ?? 'closed',
      lifecycle: key === this.activeKey ? 'active' : 'cached',
      executing: this.executingConversations.has(conversationId),
      executingSince: this.executingConversations.get(conversationId) ?? null,
      createdAt: now,
      lastAccessAt: now,
      revision: 1,
      draft,
      resources: { ...EMPTY_RESOURCE_STATE },
    };
    this.entries.set(key, entry);
    this.emit();
    return true;
  }

  activate(input: ActivateInput): ConversationPageCacheEntry {
    const key = createConversationPageCacheKey(
      input.surface,
      input.conversationId,
    );
    const now = Date.now();
    let entry = this.entries.get(key);

    this.entries.forEach((item, itemKey) => {
      if (itemKey !== key && item.lifecycle === 'active') {
        this.entries.set(itemKey, {
          ...item,
          lifecycle: 'cached',
          resources: { ...item.resources, desktopVisible: false },
        });
      }
    });

    if (!entry) {
      if (this.entries.size >= this.capacity) {
        const evictionKey = selectConversationPageCacheEvictionKey(
          this.entries.values(),
          null,
        );
        if (evictionKey) this.invalidate(evictionKey, 'lru');
      }
      const preferences = parsePanelPreferences();
      entry = {
        key,
        surface: input.surface,
        conversationId: String(input.conversationId),
        agentId:
          input.agentId === null || input.agentId === undefined
            ? undefined
            : String(input.agentId),
        view: preferences[key] ?? 'closed',
        lifecycle: 'active',
        executing: this.executingConversations.has(
          String(input.conversationId),
        ),
        executingSince:
          this.executingConversations.get(String(input.conversationId)) ?? null,
        createdAt: now,
        lastAccessAt: now,
        revision: 1,
        draft: this.readDraftSummary(key),
        resources: { ...EMPTY_RESOURCE_STATE },
      };
    } else {
      entry = {
        ...entry,
        agentId:
          input.agentId === null || input.agentId === undefined
            ? entry.agentId
            : String(input.agentId),
        lifecycle: 'active',
        lastAccessAt: now,
        revision: entry.revision + 1,
        draft: this.readDraftSummary(key),
      };
    }

    this.entries.set(key, entry);
    this.activeKey = key;
    this.emit();
    return entry;
  }

  deactivate(key: string) {
    if (this.activeKey !== key) return;
    this.activeKey = null;
    const entry = this.entries.get(key);
    if (entry) {
      this.entries.set(key, {
        ...entry,
        lifecycle: 'cached',
        resources: { ...entry.resources, desktopVisible: false },
      });
    }
    this.emit();
    if (entry && this.endedConversationIds.has(entry.conversationId)) {
      this.releaseEndedHidden(entry.conversationId);
    }
  }

  markConversationTaskStatus(
    conversationId: number | string,
    taskStatus: TaskStatus | undefined,
  ) {
    const normalizedId = String(conversationId);
    if (
      taskStatus === TaskStatus.CREATE ||
      taskStatus === TaskStatus.EXECUTING
    ) {
      this.endedConversationIds.delete(normalizedId);
      if (!this.executingConversations.has(normalizedId)) {
        this.executingConversations.set(normalizedId, Date.now());
        this.emit();
      }
      return;
    }
    if (!isTerminalTaskStatus(taskStatus)) return;
    const wasExecuting = this.executingConversations.delete(normalizedId);
    if (
      [...this.entries.values()].some(
        (entry) => entry.conversationId === normalizedId,
      )
    ) {
      this.endedConversationIds.add(normalizedId);
    }
    this.releaseEndedHidden(normalizedId);
    if (wasExecuting) this.emit();
  }

  releaseEndedHidden(conversationId: number | string) {
    const normalizedId = String(conversationId);
    // 商业客户端整页仍在宽限期时，右侧工作区也要跟随保留；否则整页切回
    // 只剩消息区，预览/终端子树已被旧缓存 manager 提前卸载。
    if (fullPageInstanceCacheManager.hasConversation(normalizedId)) {
      return;
    }
    [...this.entries.values()]
      .filter(
        (entry) =>
          entry.conversationId === normalizedId && entry.key !== this.activeKey,
      )
      .forEach((entry) => this.invalidate(entry.key, 'terminal'));
    if (
      ![...this.entries.values()].some(
        (entry) => entry.conversationId === normalizedId,
      )
    ) {
      this.endedConversationIds.delete(normalizedId);
    }
  }

  update(
    key: string,
    patch: Partial<
      Pick<ConversationPageCacheEntry, 'view' | 'draft' | 'resources'>
    >,
  ) {
    const current = this.entries.get(key);
    if (!current) {
      if (patch.view) {
        const preferences = parsePanelPreferences();
        preferences[key] = patch.view;
        writePanelPreferences(preferences);
      }
      if (!this.createCachedEntry(key, { ...EMPTY_DRAFT_SUMMARY })) return;
      this.update(key, patch);
      return;
    }
    const nextDraft = patch.draft ? { ...patch.draft } : current.draft;
    const nextResources = patch.resources
      ? { ...current.resources, ...patch.resources }
      : current.resources;
    const unchanged =
      (patch.view === undefined || patch.view === current.view) &&
      Object.keys(nextDraft).every(
        (draftKey) =>
          nextDraft[draftKey as keyof typeof nextDraft] ===
          current.draft[draftKey as keyof typeof current.draft],
      ) &&
      Object.keys(nextResources).every(
        (resourceKey) =>
          nextResources[resourceKey as keyof typeof nextResources] ===
          current.resources[resourceKey as keyof typeof current.resources],
      );
    if (unchanged) return;
    const next: ConversationPageCacheEntry = {
      ...current,
      ...patch,
      draft: nextDraft,
      resources: nextResources,
      lastAccessAt: Date.now(),
      revision: current.revision + 1,
    };
    this.entries.set(key, next);
    if (patch.view) {
      const preferences = parsePanelPreferences();
      preferences[key] = patch.view;
      writePanelPreferences(preferences);
    }
    this.emit();
  }

  updateResources(key: string, patch: Partial<ConversationPageResourceState>) {
    const current = this.entries.get(key);
    if (!current) return;
    this.update(key, { resources: { ...current.resources, ...patch } });
  }

  invalidate(key: string, reason = 'manual', options: InvalidateOptions = {}) {
    const current = this.entries.get(key);
    if (current) {
      const disposing = { ...current, lifecycle: 'disposing' as const };
      this.disposeListeners.forEach((listener) => listener(disposing, reason));
      this.entries.delete(key);
      if (
        ![...this.entries.values()].some(
          (entry) => entry.conversationId === current.conversationId,
        )
      ) {
        this.endedConversationIds.delete(current.conversationId);
      }
    }
    if (this.activeKey === key) this.activeKey = null;
    if (options.clearPanelPreference) {
      const preferences = parsePanelPreferences();
      delete preferences[key];
      writePanelPreferences(preferences);
    }
    if (options.clearDraft) this.clearDraft(key);
    this.emit();
  }

  invalidateAll(reason = 'manual') {
    [...this.entries.keys()].forEach((key) => this.invalidate(key, reason));
  }

  invalidateConversation(conversationId: number | string, reason = 'manual') {
    const normalizedId = String(conversationId);
    this.executingConversations.delete(normalizedId);
    [...this.entries.values()]
      .filter((entry) => entry.conversationId === normalizedId)
      .forEach((entry) => this.invalidate(entry.key, reason));

    const preferences = parsePanelPreferences();
    Object.keys(preferences).forEach((key) => {
      if (key === normalizedId || key.endsWith(`:${normalizedId}`)) {
        delete preferences[key];
      }
    });
    writePanelPreferences(preferences);

    if (canUseStorage()) {
      try {
        const storageKeys = Array.from(
          { length: localStorage.length },
          (_, index) => localStorage.key(index),
        );
        storageKeys.forEach((storageKey) => {
          if (
            storageKey &&
            storageKey.startsWith(DRAFT_STORAGE_PREFIX) &&
            (storageKey === `${DRAFT_STORAGE_PREFIX}${normalizedId}` ||
              storageKey.endsWith(`:${normalizedId}`))
          ) {
            localStorage.removeItem(storageKey);
          }
        });
      } catch {
        // 存储不可用时，内存实例仍已失效。
      }
    }
    if (this.sharedVncOwnerConversationId === normalizedId) {
      this.sharedVncOwnerConversationId = null;
    }
    this.emit();
  }

  setSharedVncOwner(conversationId: number | string | null) {
    const nextOwner = conversationId === null ? null : String(conversationId);
    if (nextOwner === this.sharedVncOwnerConversationId) return;
    this.sharedVncOwnerConversationId = nextOwner;
    this.emit();
  }

  loadDraft(
    key: string | number | null | undefined,
  ): ConversationDraftData | null {
    if (key === null || key === undefined || !canUseStorage()) return null;
    try {
      const raw = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (
        !isValidDraft(parsed) ||
        Date.now() - parsed.savedAt > DRAFT_TTL_MS ||
        (!parsed.text.trim() && !parsed.skillIds?.length)
      ) {
        localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${key}`);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  saveDraft(
    key: string | number | null | undefined,
    draft: Omit<ConversationDraftData, 'savedAt'>,
  ) {
    if (key === null || key === undefined) return;
    const cacheKey = String(key);
    const hasContent = !!draft.text.trim() || !!draft.skillIds?.length;
    const savedAt = Date.now();
    if (canUseStorage()) {
      try {
        const storageKey = `${DRAFT_STORAGE_PREFIX}${cacheKey}`;
        if (hasContent) {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              ...draft,
              savedAt,
            } satisfies ConversationDraftData),
          );
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        // 存储失败时仍更新调试快照。
      }
    }
    const current = this.entries.get(cacheKey);
    if (current) {
      this.update(cacheKey, {
        draft: hasContent
          ? {
              hasContent: true,
              textLength: draft.text.length,
              skillCount: draft.skillIds?.length ?? 0,
              savedAt,
            }
          : { ...EMPTY_DRAFT_SUMMARY },
      });
    } else if (hasContent) {
      this.createCachedEntry(cacheKey, {
        hasContent: true,
        textLength: draft.text.length,
        skillCount: draft.skillIds?.length ?? 0,
        savedAt,
      });
    }
  }

  clearDraft(key: string | number | null | undefined) {
    if (key === null || key === undefined) return;
    const cacheKey = String(key);
    if (canUseStorage()) {
      try {
        localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${cacheKey}`);
      } catch {
        // ignore
      }
    }
    const current = this.entries.get(cacheKey);
    if (current) {
      this.update(cacheKey, { draft: { ...EMPTY_DRAFT_SUMMARY } });
    }
  }
}

export const conversationPageCacheManager = new ConversationPageCacheManager();

fullPageInstanceCacheManager.subscribeDispose((entry) => {
  if (entry.conversationId !== null) {
    conversationPageCacheManager.releaseEndedHidden(entry.conversationId);
  }
});

eventBus.on(
  EVENT_TYPE.UpdateConversationListTaskStatus,
  (payload: { conversationId: number | string; taskStatus?: TaskStatus }) => {
    if (payload?.conversationId !== undefined) {
      conversationPageCacheManager.markConversationTaskStatus(
        payload.conversationId,
        payload.taskStatus,
      );
    }
  },
);

eventBus.on(
  EVENT_TYPE.ConversationChanged,
  (event: ConversationChangedEvent) => {
    if (
      event.operation === 'updated' &&
      event.patch?.taskStatus !== undefined
    ) {
      conversationPageCacheManager.markConversationTaskStatus(
        event.conversationId,
        event.patch.taskStatus,
      );
    }
  },
);

if (typeof window !== 'undefined') {
  const registry = window as Window & {
    __conversationPageCacheDeleteListener?: EventListener;
  };
  if (registry.__conversationPageCacheDeleteListener) {
    window.removeEventListener(
      'conversation-deleted',
      registry.__conversationPageCacheDeleteListener,
    );
  }
  registry.__conversationPageCacheDeleteListener = ((event: CustomEvent) => {
    const conversationId = event.detail?.id;
    if (conversationId !== null && conversationId !== undefined) {
      conversationPageCacheManager.invalidateConversation(
        conversationId,
        'conversation-deleted',
      );
    }
  }) as EventListener;
  window.addEventListener(
    'conversation-deleted',
    registry.__conversationPageCacheDeleteListener,
  );
}
