export const FULL_PAGE_INSTANCE_CAPACITY = 5;
export const FULL_PAGE_IDE_CAPACITY = 2;
export const FULL_PAGE_TERMINAL_GRACE_MS = 60_000;

export type FullPageInstanceKind =
  | 'conversation'
  | 'agent-workspace'
  | 'ide-workspace';

export type FullPageInstanceLifecycle = 'active' | 'cached';

export interface FullPageInstanceEntry {
  key: string;
  kind: FullPageInstanceKind;
  conversationId: string | null;
  lifecycle: FullPageInstanceLifecycle;
  running: boolean;
  terminalAt: number | null;
  hiddenSince: number | null;
  createdAt: number;
  lastAccessAt: number;
  /** 同一毫秒连续切换时仍能稳定按最近访问顺序淘汰。 */
  lastAccessOrder: number;
}

export interface FullPageInstanceSnapshot {
  activeKey: string | null;
  sharedVncOwnerConversationId: string | null;
  capacity: number;
  ideCapacity: number;
  terminalGraceMs: number;
  entries: FullPageInstanceEntry[];
}

/** 先释放隐藏的非运行页，再按最近访问顺序释放隐藏的运行页。 */
export function selectFullPageEvictionKey(
  entries: Iterable<FullPageInstanceEntry>,
  activeKey: string | null,
  kind?: FullPageInstanceKind,
): string | null {
  const candidate = [...entries]
    .filter(
      (entry) =>
        entry.key !== activeKey &&
        entry.lifecycle === 'cached' &&
        (kind === undefined || entry.kind === kind),
    )
    .sort(
      (left, right) =>
        Number(left.running) - Number(right.running) ||
        left.lastAccessOrder - right.lastAccessOrder ||
        left.createdAt - right.createdAt ||
        left.key.localeCompare(right.key),
    )[0];
  return candidate?.key ?? null;
}
