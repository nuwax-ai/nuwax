import { EVENT_TYPE } from '@/constants/event.constants';
import type {
  ConversationChangedEvent,
  ConversationChangedInput,
  DirectoryProjectRef,
  ProjectChangedEvent,
  ProjectChangedInput,
} from '@/types/directorySync';
import type { TaskStatus } from '@/types/enums/agent';
import eventBus from '@/utils/eventBus';

type EntityWithId = { id?: number | string };

let eventSequence = 0;
let bridgeCleanup: (() => void) | undefined;
let bridgeUsers = 0;

const createEventId = () =>
  `directory-${Date.now().toString(36)}-${(eventSequence += 1).toString(36)}`;

export function normalizeProjectRef(
  project: DirectoryProjectRef,
): DirectoryProjectRef {
  return {
    ...project,
    projectId: String(project.projectId),
    ...(project.spaceId !== undefined
      ? { spaceId: String(project.spaceId) }
      : {}),
  };
}

export function emitConversationChanged(
  input: ConversationChangedInput,
): ConversationChangedEvent {
  const event: ConversationChangedEvent = {
    ...input,
    type: 'conversation.changed',
    eventId: input.eventId ?? createEventId(),
    conversationId: String(input.conversationId),
  };
  eventBus.emit(EVENT_TYPE.ConversationChanged, event);
  return event;
}

export function emitProjectChanged(
  input: ProjectChangedInput,
): ProjectChangedEvent {
  const event: ProjectChangedEvent = {
    ...input,
    type: 'project.changed',
    eventId: input.eventId ?? createEventId(),
    project: normalizeProjectRef(input.project),
  };
  eventBus.emit(EVENT_TYPE.ProjectChanged, event);
  return event;
}

export function subscribeConversationChanged(
  handler: (event: ConversationChangedEvent) => void,
): () => void {
  eventBus.on(EVENT_TYPE.ConversationChanged, handler);
  return () => eventBus.off(EVENT_TYPE.ConversationChanged, handler);
}

export function subscribeProjectChanged(
  handler: (event: ProjectChangedEvent) => void,
): () => void {
  eventBus.on(EVENT_TYPE.ProjectChanged, handler);
  return () => eventBus.off(EVENT_TYPE.ProjectChanged, handler);
}

export function matchesProjectRef(
  project: {
    id?: number | string;
    projectType?: DirectoryProjectRef['projectType'];
    spaceId?: number | string;
  },
  target: DirectoryProjectRef,
): boolean {
  if (
    String(project.id) !== target.projectId ||
    project.projectType !== target.projectType
  ) {
    return false;
  }
  return (
    target.spaceId === undefined ||
    project.spaceId === undefined ||
    String(project.spaceId) === target.spaceId
  );
}

/**
 * 状态观察独立于60秒回放保存：同值轮询不重插已确认字段，也不续期。
 * 调用方同时用实际接受的列表快照更新 observed，新的执行态才能重新开一轮。
 * 其它字段仍按原事件回放；不能把状态去重当作主题/标记等操作的去重。
 */
export function deduplicateConversationTaskStatusEvent(
  event: ConversationChangedEvent,
  observed: Map<string, TaskStatus>,
): ConversationChangedEvent | undefined {
  const status = event.patch?.taskStatus;
  if (event.operation !== 'updated' || status === undefined) return event;
  if (observed.get(event.conversationId) !== status) {
    observed.set(event.conversationId, status);
    return event;
  }
  const patch = { ...event.patch };
  delete patch.taskStatus;
  return Object.values(patch).some((value) => value !== undefined)
    ? { ...event, patch }
    : undefined;
}

/** 只记录已通过回放和请求版本检查、会实际写入列表的快照状态。 */
export function observeConversationTaskStatuses(
  rows: Array<EntityWithId & { taskStatus?: TaskStatus }>,
  observed: Map<string, TaskStatus>,
): void {
  for (const row of rows) {
    if (row.taskStatus !== undefined) {
      observed.set(String(row.id), row.taskStatus);
    }
  }
}

/**
 * 服务端确认请求开始前的最新状态补丁后，仅消费该字段的回放。
 * modified 不是执行代次，事件也没有 runId；未经确认的终态仍保护落库滞后回包。
 * 请求期间的新事件不在 requestEvents 内，不能被在途旧快照确认/消费。
 */
export function acknowledgeConversationTaskStatusEvents<
  T extends { event: ConversationChangedEvent },
>(
  recent: T[],
  requestEvents: readonly ConversationChangedEvent[],
  rows: Array<EntityWithId & { taskStatus?: TaskStatus }>,
): T[] {
  const eligible = new Set(requestEvents);
  const latest = new Map<string, TaskStatus>();
  for (const event of requestEvents) {
    if (
      event.operation === 'updated' &&
      event.patch?.taskStatus !== undefined
    ) {
      latest.set(event.conversationId, event.patch.taskStatus);
    }
  }
  const acknowledged = new Set<string>();
  for (const row of rows) {
    const id = String(row.id);
    if (row.taskStatus !== undefined && latest.get(id) === row.taskStatus) {
      acknowledged.add(id);
    }
  }
  return recent.map((entry) => {
    const { event } = entry;
    if (
      !eligible.has(event) ||
      !acknowledged.has(event.conversationId) ||
      event.patch?.taskStatus === undefined
    ) {
      return entry;
    }
    // 同一次状态确认也消费更早的状态，防止留下的旧 FAILED 覆盖已确认 COMPLETE。
    // topic/icon/flags/deleted 继续沿用各自既有回放契约。
    const patch = { ...event.patch };
    delete patch.taskStatus;
    return { ...entry, event: { ...event, patch } };
  });
}

export function applyConversationChangedToList<
  T extends EntityWithId & {
    topic?: string;
    name?: string;
    icon?: string;
    taskStatus?: TaskStatus;
  },
>(
  list: T[],
  event: ConversationChangedEvent,
  options: { topicField?: 'topic' | 'name' } = {},
): T[] {
  const targetIndex = list.findIndex(
    (item) => String(item.id) === event.conversationId,
  );
  if (targetIndex < 0) return list;
  if (event.operation === 'deleted') {
    return list.filter((_, index) => index !== targetIndex);
  }
  if (!event.patch) return list;

  const current = list[targetIndex];
  const topicField = options.topicField ?? 'topic';
  const patch: Partial<T> = {};
  let changed = false;
  const assign = (key: keyof T, value: unknown) => {
    if (value !== undefined && current[key] !== value) {
      patch[key] = value as T[keyof T];
      changed = true;
    }
  };
  assign(topicField as keyof T, event.patch.topic);
  assign('icon' as keyof T, event.patch.icon);
  assign('taskStatus' as keyof T, event.patch.taskStatus);
  // 置顶/归档标记补丁（bug 2475）：历史页等入口切换成功后广播，任务列表
  // 本地补丁即时排前/隐藏（可见列表由行内 pinned/archived 派生）
  assign('pinned' as keyof T, event.patch.pinned);
  assign('archived' as keyof T, event.patch.archived);
  if (!changed) return list;

  const next = [...list];
  next[targetIndex] = { ...current, ...patch };
  return next;
}

export function applyProjectChangedToList<
  T extends {
    id?: number | string;
    projectType?: DirectoryProjectRef['projectType'];
    spaceId?: number | string;
    name?: string;
    description?: string | null;
    icon?: string | null;
  },
>(list: T[], event: ProjectChangedEvent): T[] {
  const targetIndex = list.findIndex((item) =>
    matchesProjectRef(item, event.project),
  );
  if (targetIndex < 0) return list;
  if (event.operation === 'deleted') {
    return list.filter((_, index) => index !== targetIndex);
  }
  if (!event.patch) return list;

  const current = list[targetIndex];
  const patch: Partial<T> = {};
  let changed = false;
  (['name', 'description', 'icon'] as const).forEach((key) => {
    const value = event.patch?.[key];
    if (value !== undefined && current[key] !== value) {
      Object.assign(patch, { [key]: value });
      changed = true;
    }
  });
  if (!changed) return list;

  const next = [...list];
  next[targetIndex] = { ...current, ...patch };
  return next;
}

/** 安装一次旧事件到新协议的单向桥接；调用方卸载时按引用计数释放。 */
export function installDirectorySyncLegacyBridge(): () => void {
  bridgeUsers += 1;
  if (!bridgeCleanup && typeof window !== 'undefined') {
    const handleConversationUpdated = (rawEvent: Event) => {
      const detail = (
        rawEvent as CustomEvent<{
          id?: number | string;
          topic?: string;
          icon?: string;
        }>
      ).detail;
      if (detail?.id === undefined) return;
      emitConversationChanged({
        operation: 'updated',
        conversationId: String(detail.id),
        patch: { topic: detail.topic, icon: detail.icon },
        origin: 'legacy-window',
        reason: 'rename',
      });
    };
    const handleConversationDeleted = (rawEvent: Event) => {
      const detail = (rawEvent as CustomEvent<{ id?: number | string }>).detail;
      if (detail?.id === undefined) return;
      emitConversationChanged({
        operation: 'deleted',
        conversationId: String(detail.id),
        origin: 'legacy-window',
        reason: 'delete',
      });
    };
    const handleTaskStatus = (payload: {
      conversationId: number | string;
      taskStatus: TaskStatus;
    }) => {
      if (payload?.conversationId === undefined) return;
      emitConversationChanged({
        operation: 'updated',
        conversationId: String(payload.conversationId),
        patch: { taskStatus: payload.taskStatus },
        origin: 'legacy-event-bus',
        reason: 'task-status',
      });
    };

    window.addEventListener('conversation-updated', handleConversationUpdated);
    window.addEventListener('conversation-deleted', handleConversationDeleted);
    eventBus.on(EVENT_TYPE.UpdateConversationListTaskStatus, handleTaskStatus);
    bridgeCleanup = () => {
      window.removeEventListener(
        'conversation-updated',
        handleConversationUpdated,
      );
      window.removeEventListener(
        'conversation-deleted',
        handleConversationDeleted,
      );
      eventBus.off(
        EVENT_TYPE.UpdateConversationListTaskStatus,
        handleTaskStatus,
      );
      bridgeCleanup = undefined;
    };
  }

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    bridgeUsers = Math.max(0, bridgeUsers - 1);
    if (bridgeUsers === 0) bridgeCleanup?.();
  };
}
