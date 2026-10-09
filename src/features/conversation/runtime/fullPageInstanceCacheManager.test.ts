import { EVENT_TYPE } from '@/constants/event.constants';
import { TaskStatus } from '@/types/enums/agent';
import eventBus from '@/utils/eventBus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FullPageInstanceCacheManager,
  fullPageInstanceCacheManager,
} from './fullPageInstanceCacheManager';

let manager: FullPageInstanceCacheManager;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-23T00:00:00.000Z'));
  manager = new FullPageInstanceCacheManager();
});

afterEach(() => {
  manager.invalidateAll('test-cleanup');
  fullPageInstanceCacheManager.invalidateAll('test-cleanup');
  vi.useRealTimers();
});

describe('整页实例缓存', () => {
  it('最多保留 5 页，先淘汰最久未访问的隐藏非运行页', () => {
    manager.activate({ key: 'a', kind: 'conversation', executing: true });
    manager.activate({ key: 'b', kind: 'conversation', executing: true });
    manager.activate({ key: 'c', kind: 'conversation', executing: false });
    manager.activate({ key: 'd', kind: 'conversation', executing: false });
    manager.activate({ key: 'e', kind: 'conversation', executing: true });
    manager.activate({ key: 'c', kind: 'conversation' });

    manager.activate({ key: 'f', kind: 'conversation', executing: false });

    expect(manager.getSnapshot().entries).toHaveLength(5);
    expect(manager.getEntry('d')).toBeUndefined();
    expect(manager.getEntry('a')?.running).toBe(true);
    expect(manager.getSnapshot().activeKey).toBe('f');
  });

  it('都在运行时淘汰最久未访问的隐藏页，当前可见页始终保留', () => {
    const disposed: string[] = [];
    manager.subscribeDispose((entry, reason) => {
      disposed.push(`${entry.key}:${reason}`);
    });
    for (const key of ['a', 'b', 'c', 'd', 'e', 'f']) {
      manager.activate({ key, kind: 'conversation', executing: true });
    }

    expect(manager.getSnapshot().entries).toHaveLength(5);
    expect(manager.getEntry('a')).toBeUndefined();
    expect(manager.getEntry('f')?.lifecycle).toBe('active');
    expect(disposed).toEqual(['a:capacity']);
  });

  it('IDE 工作台最多保留 2 个，先释放非运行的隐藏 IDE', () => {
    manager.activate({ key: 'ide-a', kind: 'ide-workspace', executing: true });
    manager.activate({ key: 'ide-b', kind: 'ide-workspace', executing: false });
    manager.activate({ key: 'chat', kind: 'conversation', executing: false });
    manager.activate({ key: 'ide-c', kind: 'ide-workspace', executing: true });

    expect(manager.getEntry('ide-b')).toBeUndefined();
    expect(manager.getEntry('ide-a')).toBeDefined();
    expect(manager.getEntry('chat')).toBeDefined();
    expect(manager.getEntry('ide-c')?.lifecycle).toBe('active');

    manager.activate({ key: 'ide-d', kind: 'ide-workspace', executing: true });
    expect(manager.getEntry('ide-a')).toBeUndefined();
    expect(
      manager
        .getSnapshot()
        .entries.filter((entry) => entry.kind === 'ide-workspace'),
    ).toHaveLength(2);
  });

  it('隐藏页转为终态后保留 60 秒，切回会取消计时并重算隐藏宽限期', () => {
    manager.activate({
      key: 'chat-a',
      kind: 'conversation',
      conversationId: 10,
      executing: true,
    });
    manager.deactivate('chat-a');
    manager.markStatus(10, TaskStatus.COMPLETE);
    vi.advanceTimersByTime(59_000);
    expect(manager.getEntry('chat-a')).toBeDefined();

    manager.activate({
      key: 'chat-a',
      kind: 'conversation',
      conversationId: 10,
    });
    vi.advanceTimersByTime(2_000);
    expect(manager.getEntry('chat-a')?.lifecycle).toBe('active');

    manager.deactivate('chat-a');
    vi.advanceTimersByTime(59_999);
    expect(manager.getEntry('chat-a')).toBeDefined();
    vi.advanceTimersByTime(1);
    expect(manager.getEntry('chat-a')).toBeUndefined();
  });

  it('可见页终态不释放；离开后才开始 60 秒倒计时', () => {
    manager.activate({
      key: 'chat-a',
      kind: 'conversation',
      conversationId: 10,
      status: TaskStatus.COMPLETE,
    });
    vi.advanceTimersByTime(120_000);
    expect(manager.getEntry('chat-a')).toBeDefined();

    manager.activate({
      key: 'chat-b',
      kind: 'conversation',
      conversationId: 11,
    });
    vi.advanceTimersByTime(60_000);
    expect(manager.getEntry('chat-a')).toBeUndefined();
    expect(manager.getEntry('chat-b')).toBeDefined();
  });

  it('容量紧张时可提前释放终态页；删除按会话清除所有实例与 VNC 所有权', () => {
    manager.activate({
      key: 'chat-10',
      kind: 'conversation',
      conversationId: 10,
      status: TaskStatus.COMPLETE,
    });
    manager.activate({
      key: 'agent-10',
      kind: 'agent-workspace',
      conversationId: 10,
      executing: true,
    });
    manager.activate({
      key: 'chat-11',
      kind: 'conversation',
      conversationId: 11,
      executing: true,
    });
    manager.activate({
      key: 'chat-12',
      kind: 'conversation',
      conversationId: 12,
      executing: true,
    });
    manager.activate({
      key: 'chat-13',
      kind: 'conversation',
      conversationId: 13,
      executing: true,
    });
    manager.activate({
      key: 'chat-14',
      kind: 'conversation',
      conversationId: 14,
    });
    expect(manager.getEntry('chat-10')).toBeUndefined();

    manager.setSharedVncOwner(10);
    manager.invalidateConversation(10, 'conversation-deleted');
    expect(manager.getEntry('agent-10')).toBeUndefined();
    expect(manager.getSnapshot().sharedVncOwnerConversationId).toBeNull();
    expect(manager.getEntry('chat-14')).toBeDefined();
  });

  it('运行态重启取消终态释放计时', () => {
    manager.activate({
      key: 'chat-a',
      kind: 'conversation',
      conversationId: 10,
      status: TaskStatus.COMPLETE,
    });
    manager.deactivate('chat-a');
    vi.advanceTimersByTime(30_000);
    manager.markStatus(10, TaskStatus.EXECUTING);
    vi.advanceTimersByTime(90_000);
    expect(manager.getEntry('chat-a')?.running).toBe(true);
    expect(manager.getEntry('chat-a')?.terminalAt).toBeNull();
  });

  it('同步会话状态事件，并在会话删除时卸载关联的整页', () => {
    fullPageInstanceCacheManager.activate({
      key: 'chat-10',
      kind: 'conversation',
      conversationId: 10,
    });
    fullPageInstanceCacheManager.deactivate('chat-10');
    eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
      conversationId: 10,
      taskStatus: TaskStatus.EXECUTING,
    });
    expect(fullPageInstanceCacheManager.getEntry('chat-10')?.running).toBe(
      true,
    );

    eventBus.emit(EVENT_TYPE.ConversationChanged, {
      operation: 'updated',
      conversationId: 10,
      patch: { taskStatus: TaskStatus.COMPLETE },
    });
    vi.advanceTimersByTime(60_000);
    expect(fullPageInstanceCacheManager.getEntry('chat-10')).toBeUndefined();

    fullPageInstanceCacheManager.activate({
      key: 'chat-10',
      kind: 'conversation',
      conversationId: 10,
    });
    window.dispatchEvent(
      new CustomEvent('conversation-deleted', { detail: { id: 10 } }),
    );
    expect(fullPageInstanceCacheManager.getEntry('chat-10')).toBeUndefined();
  });
});
