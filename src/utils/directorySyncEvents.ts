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
