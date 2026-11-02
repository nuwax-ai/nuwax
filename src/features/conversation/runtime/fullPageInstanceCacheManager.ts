import { EVENT_TYPE } from '@/constants/event.constants';
import type { ConversationChangedEvent } from '@/types/directorySync';
import { TaskStatus } from '@/types/enums/agent';
import eventBus from '@/utils/eventBus';
import {
  FULL_PAGE_IDE_CAPACITY,
  FULL_PAGE_INSTANCE_CAPACITY,
  FULL_PAGE_TERMINAL_GRACE_MS,
  selectFullPageEvictionKey,
  type FullPageInstanceEntry,
  type FullPageInstanceKind,
  type FullPageInstanceSnapshot,
} from '../domain/fullPageInstanceCache';

type Listener = () => void;
type DisposeListener = (entry: FullPageInstanceEntry, reason: string) => void;

export interface FullPageActivateInput {
  /** 页面类型 + 项目或会话 ID；同一页面再次进入必须使用同一个 key。 */
  key: string;
  kind: FullPageInstanceKind;
  conversationId?: number | string | null;
  /** 首次进入时可传入已知执行状态；未知时省略。 */
  executing?: boolean;
  /** 已知任务终态时传入，可启动隐藏后的 60 秒释放计时。 */
  status?: TaskStatus;
}

const isRunning = (status: TaskStatus) =>
  status === TaskStatus.CREATE || status === TaskStatus.EXECUTING;
const isTerminal = (status: TaskStatus) =>
  status === TaskStatus.COMPLETE ||
  status === TaskStatus.CANCEL ||
  status === TaskStatus.FAILED;

/**
 * 整页实例的独立生命周期；右侧工作区缓存仍由 conversationPageCacheManager 管理。
 * 这里仅管理挂载资格，页面宿主收到快照后负责隐藏或卸载真实子树。
 */
export class FullPageInstanceCacheManager {
  private entries = new Map<string, FullPageInstanceEntry>();
  private listeners = new Set<Listener>();
  private disposeListeners = new Set<DisposeListener>();
  private terminalTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private activeKey: string | null = null;
  private sharedVncOwnerConversationId: string | null = null;
  private accessOrder = 0;
  private snapshot: FullPageInstanceSnapshot = {
    activeKey: null,
    sharedVncOwnerConversationId: null,
    capacity: FULL_PAGE_INSTANCE_CAPACITY,
    ideCapacity: FULL_PAGE_IDE_CAPACITY,
    terminalGraceMs: FULL_PAGE_TERMINAL_GRACE_MS,
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

  getSnapshot = () => this.snapshot;

  getEntry(key: string) {
    return this.entries.get(key);
  }

  hasConversation(conversationId: number | string) {
    const normalizedId = String(conversationId);
    return [...this.entries.values()].some(
      (entry) => entry.conversationId === normalizedId,
    );
  }

  private emit() {
    this.snapshot = {
      activeKey: this.activeKey,
      sharedVncOwnerConversationId: this.sharedVncOwnerConversationId,
      capacity: FULL_PAGE_INSTANCE_CAPACITY,
      ideCapacity: FULL_PAGE_IDE_CAPACITY,
      terminalGraceMs: FULL_PAGE_TERMINAL_GRACE_MS,
      entries: [...this.entries.values()]
        .map((entry) => ({ ...entry }))
        .sort((left, right) => right.lastAccessOrder - left.lastAccessOrder),
    };
    this.listeners.forEach((listener) => listener());
  }

  private clearTimer(key: string) {
    const timer = this.terminalTimers.get(key);
    if (timer !== undefined) clearTimeout(timer);
    this.terminalTimers.delete(key);
  }

  private scheduleTerminalRelease(entry: FullPageInstanceEntry) {
    this.clearTimer(entry.key);
    if (
      entry.lifecycle !== 'cached' ||
      entry.terminalAt === null ||
      entry.hiddenSince === null
    ) {
      return;
    }
    const expiresAt =
      Math.max(entry.terminalAt, entry.hiddenSince) +
      FULL_PAGE_TERMINAL_GRACE_MS;
    const delay = Math.max(0, expiresAt - Date.now());
    const timer = setTimeout(() => {
      this.terminalTimers.delete(entry.key);
      const current = this.entries.get(entry.key);
      if (
        current?.lifecycle !== 'cached' ||
        current.terminalAt === null ||
        current.hiddenSince === null
      ) {
        return;
      }
      const currentExpiry =
        Math.max(current.terminalAt, current.hiddenSince) +
        FULL_PAGE_TERMINAL_GRACE_MS;
      if (Date.now() < currentExpiry) {
        this.scheduleTerminalRelease(current);
        return;
      }
      this.remove(entry.key, 'terminal-grace-expired');
      this.emit();
    }, delay);
    this.terminalTimers.set(entry.key, timer);
  }

  private remove(key: string, reason: string) {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.clearTimer(key);
    this.entries.delete(key);
    if (this.activeKey === key) this.activeKey = null;
    if (
      this.sharedVncOwnerConversationId === entry.conversationId &&
      ![...this.entries.values()].some(
        (other) => other.conversationId === this.sharedVncOwnerConversationId,
      )
    ) {
      this.sharedVncOwnerConversationId = null;
    }
    this.disposeListeners.forEach((listener) => listener({ ...entry }, reason));
  }

  private enforceLimits() {
    while (
      [...this.entries.values()].filter(
        (entry) => entry.kind === 'ide-workspace',
      ).length > FULL_PAGE_IDE_CAPACITY
    ) {
      const key = selectFullPageEvictionKey(
        this.entries.values(),
        this.activeKey,
        'ide-workspace',
      );
      if (!key) break;
      this.remove(key, 'ide-capacity');
    }
    while (this.entries.size > FULL_PAGE_INSTANCE_CAPACITY) {
      const key = selectFullPageEvictionKey(
        this.entries.values(),
        this.activeKey,
      );
      if (!key) break;
      this.remove(key, 'capacity');
    }
  }

  activate(input: FullPageActivateInput): FullPageInstanceEntry {
    const now = Date.now();
    const current = this.entries.get(input.key);
    if (this.activeKey && this.activeKey !== input.key) {
      const previous = this.entries.get(this.activeKey);
      if (previous) {
        const hidden = {
          ...previous,
          lifecycle: 'cached' as const,
          hiddenSince: now,
        };
        this.entries.set(previous.key, hidden);
        this.scheduleTerminalRelease(hidden);
      }
    }

    const statusRunning =
      input.status === undefined ? undefined : isRunning(input.status);
    const statusTerminal =
      input.status !== undefined && isTerminal(input.status);
    const running =
      statusRunning ?? input.executing ?? current?.running ?? false;
    const terminalAt = running
      ? null
      : statusTerminal
      ? current?.terminalAt ?? now
      : current?.terminalAt ?? null;
    const entry: FullPageInstanceEntry = {
      key: input.key,
      kind: input.kind,
      conversationId:
        input.conversationId === undefined
          ? current?.conversationId ?? null
          : input.conversationId === null
          ? null
          : String(input.conversationId),
      lifecycle: 'active',
      running,
      terminalAt,
      hiddenSince: null,
      createdAt: current?.createdAt ?? now,
      lastAccessAt: now,
      lastAccessOrder: ++this.accessOrder,
    };
    this.clearTimer(input.key);
    this.entries.set(input.key, entry);
    this.activeKey = input.key;
    this.enforceLimits();
    this.emit();
    return { ...entry };
  }

  deactivate(key: string) {
    if (this.activeKey !== key) return;
    const entry = this.entries.get(key);
    this.activeKey = null;
    if (entry) {
      const hidden = {
        ...entry,
        lifecycle: 'cached' as const,
        hiddenSince: Date.now(),
      };
      this.entries.set(key, hidden);
      this.scheduleTerminalRelease(hidden);
    }
    this.emit();
  }

  markStatus(conversationId: number | string, status: TaskStatus | undefined) {
    if (status === undefined || (!isRunning(status) && !isTerminal(status))) {
      return;
    }
    const normalizedId = String(conversationId);
    const now = Date.now();
    let changed = false;
    this.entries.forEach((entry, key) => {
      if (entry.conversationId !== normalizedId) return;
      const running = isRunning(status);
      const terminalAt = running ? null : entry.terminalAt ?? now;
      if (entry.running === running && entry.terminalAt === terminalAt) return;
      const next = { ...entry, running, terminalAt };
      this.entries.set(key, next);
      this.scheduleTerminalRelease(next);
      changed = true;
    });
    if (changed) this.emit();
  }

  invalidate(key: string, reason = 'manual') {
    if (!this.entries.has(key)) return;
    this.remove(key, reason);
    this.emit();
  }

  invalidateConversation(conversationId: number | string, reason = 'manual') {
    const normalizedId = String(conversationId);
    const keys = [...this.entries.values()]
      .filter((entry) => entry.conversationId === normalizedId)
      .map((entry) => entry.key);
    keys.forEach((key) => this.remove(key, reason));
    const ownedVnc = this.sharedVncOwnerConversationId === normalizedId;
    if (this.sharedVncOwnerConversationId === normalizedId) {
      this.sharedVncOwnerConversationId = null;
    }
    if (keys.length || ownedVnc) this.emit();
  }

  invalidateAll(reason = 'manual') {
    [...this.entries.keys()].forEach((key) => this.remove(key, reason));
    this.activeKey = null;
    this.sharedVncOwnerConversationId = null;
    this.emit();
  }

  /** 同时刻只有一个会话能占有桌面连接；真实 VNC 仍由页面卸载逻辑清理。 */
  setSharedVncOwner(conversationId: number | string | null) {
    const next = conversationId === null ? null : String(conversationId);
    if (next === this.sharedVncOwnerConversationId) return;
    this.sharedVncOwnerConversationId = next;
    this.emit();
  }
}

export const fullPageInstanceCacheManager = new FullPageInstanceCacheManager();

eventBus.on(
  EVENT_TYPE.UpdateConversationListTaskStatus,
  (payload: { conversationId: number | string; taskStatus?: TaskStatus }) => {
    if (payload?.conversationId !== undefined) {
      fullPageInstanceCacheManager.markStatus(
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
      fullPageInstanceCacheManager.markStatus(
        event.conversationId,
        event.patch.taskStatus,
      );
    }
  },
);

if (typeof window !== 'undefined') {
  const registry = window as Window & {
    __fullPageInstanceCacheDeleteListener?: EventListener;
  };
  if (registry.__fullPageInstanceCacheDeleteListener) {
    window.removeEventListener(
      'conversation-deleted',
      registry.__fullPageInstanceCacheDeleteListener,
    );
  }
  registry.__fullPageInstanceCacheDeleteListener = ((event: CustomEvent) => {
    const conversationId = event.detail?.id;
    if (conversationId !== null && conversationId !== undefined) {
      fullPageInstanceCacheManager.invalidateConversation(
        conversationId,
        'conversation-deleted',
      );
    }
  }) as EventListener;
  window.addEventListener(
    'conversation-deleted',
    registry.__fullPageInstanceCacheDeleteListener,
  );
}
