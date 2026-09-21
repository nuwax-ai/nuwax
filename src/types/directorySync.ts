import type { AgentComponentTypeEnum, TaskStatus } from './enums/agent';

export type DirectoryEntityId = string;

export interface DirectoryProjectRef {
  projectId: DirectoryEntityId;
  projectType: AgentComponentTypeEnum;
  spaceId?: DirectoryEntityId;
}

interface DirectoryEventBase {
  eventId: string;
  origin: string;
  reason: string;
}

export interface ConversationChangedEvent extends DirectoryEventBase {
  type: 'conversation.changed';
  operation: 'created' | 'updated' | 'deleted';
  conversationId: DirectoryEntityId;
  project?: DirectoryProjectRef;
  patch?: {
    topic?: string;
    icon?: string;
    taskStatus?: TaskStatus;
    /** 置顶/归档标记切换（bug 2475）：历史页等入口操作成功后广播，侧栏本地补丁即时收敛 */
    pinned?: boolean;
    archived?: boolean;
  };
}

export interface ProjectChangedEvent extends DirectoryEventBase {
  type: 'project.changed';
  operation: 'created' | 'updated' | 'deleted';
  project: DirectoryProjectRef;
  patch?: {
    name?: string;
    description?: string;
    icon?: string | null;
    /** 置顶/归档标记切换（bug 2475）：ProjectPanel 标记集合按补丁即时增删 */
    pinned?: boolean;
    archived?: boolean;
  };
}

export type DirectorySyncEvent = ConversationChangedEvent | ProjectChangedEvent;

export type ConversationChangedInput = Omit<
  ConversationChangedEvent,
  'type' | 'eventId'
> & {
  eventId?: string;
};

export type ProjectChangedInput = Omit<
  ProjectChangedEvent,
  'type' | 'eventId'
> & {
  eventId?: string;
};
