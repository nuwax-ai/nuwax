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
