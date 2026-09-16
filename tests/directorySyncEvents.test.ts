import { EVENT_TYPE } from '@/constants/event.constants';
import { AgentComponentTypeEnum, TaskStatus } from '@/types/enums/agent';
import {
  applyConversationChangedToList,
  applyProjectChangedToList,
  emitConversationChanged,
  installDirectorySyncLegacyBridge,
  subscribeConversationChanged,
} from '@/utils/directorySyncEvents';
import eventBus from '@/utils/eventBus';
import { afterEach, describe, expect, it, vi } from 'vitest';

const disposers: Array<() => void> = [];

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  eventBus.clear();
});

describe('directorySyncEvents', () => {
  it('发送标准化的会话事件并支持退订', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeConversationChanged(handler);
    const event = emitConversationChanged({
      operation: 'updated',
      conversationId: 12 as never,
      patch: { topic: '新标题' },
      origin: 'test',
      reason: 'rename',
    });

    expect(event.conversationId).toBe('12');
    expect(event.eventId).toBeTruthy();
    expect(handler).toHaveBeenCalledWith(event);
    unsubscribe();
    emitConversationChanged({
      operation: 'deleted',
      conversationId: '12',
      origin: 'test',
      reason: 'delete',
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('桥接旧改名、删除和状态事件且只安装一次', () => {
    const handler = vi.fn();
    disposers.push(installDirectorySyncLegacyBridge());
    disposers.push(installDirectorySyncLegacyBridge());
    disposers.push(subscribeConversationChanged(handler));

    window.dispatchEvent(
      new CustomEvent('conversation-updated', {
        detail: { id: 7, topic: '桥接标题' },
      }),
    );
    eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
      conversationId: 7,
      taskStatus: TaskStatus.COMPLETE,
    });
    window.dispatchEvent(
      new CustomEvent('conversation-deleted', { detail: { id: 7 } }),
    );

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler.mock.calls[0][0].patch.topic).toBe('桥接标题');
    expect(handler.mock.calls[1][0].patch.taskStatus).toBe(TaskStatus.COMPLETE);
    expect(handler.mock.calls[2][0].operation).toBe('deleted');
  });

  it('会话列表补丁保持幂等和引用相等', () => {
    const list = [{ id: 1, name: '旧标题', taskStatus: TaskStatus.EXECUTING }];
    const event = emitConversationChanged({
      operation: 'updated',
      conversationId: '1',
      patch: { topic: '新标题', taskStatus: TaskStatus.COMPLETE },
      origin: 'test',
      reason: 'rename',
    });
    const next = applyConversationChangedToList(list, event, {
      topicField: 'name',
    });
    expect(next).not.toBe(list);
    expect(next[0]).toMatchObject({
      name: '新标题',
      taskStatus: TaskStatus.COMPLETE,
    });
    expect(
      applyConversationChangedToList(next, event, { topicField: 'name' }),
    ).toBe(next);
  });

  it('项目补丁按项目类型和空间匹配', () => {
    const list = [
      {
        id: 3,
        projectType: AgentComponentTypeEnum.UserApp,
        spaceId: 9,
        name: '旧名称',
      },
    ];
    const event = {
      type: 'project.changed' as const,
      operation: 'updated' as const,
      project: {
        projectId: '3',
        projectType: AgentComponentTypeEnum.UserApp,
        spaceId: '9',
      },
      patch: { name: '新名称' },
      origin: 'test',
      reason: 'rename',
      eventId: 'event-1',
    };
    expect(applyProjectChangedToList(list, event)[0].name).toBe('新名称');
    expect(
      applyProjectChangedToList(list, {
        ...event,
        project: { ...event.project, spaceId: '10' },
      }),
    ).toBe(list);
  });
});
