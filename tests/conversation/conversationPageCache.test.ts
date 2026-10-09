import { EVENT_TYPE } from '@/constants/event.constants';
import {
  DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY,
  EMPTY_DRAFT_SUMMARY,
  EMPTY_RESOURCE_STATE,
  selectConversationPageCacheEvictionKey,
  type ConversationPageCacheEntry,
} from '@/features/conversation/domain/conversationPageCache';
import { conversationPageCacheManager } from '@/features/conversation/runtime/conversationPageCacheManager';
import { fullPageInstanceCacheManager } from '@/features/conversation/runtime/fullPageInstanceCacheManager';
import { TaskStatus } from '@/types/enums/agent';
import eventBus from '@/utils/eventBus';
import { afterEach, describe, expect, it, vi } from 'vitest';

const entry = (
  key: string,
  lastAccessAt: number,
): ConversationPageCacheEntry => ({
  key,
  surface: 'chat',
  conversationId: key,
  view: 'closed',
  lifecycle: 'cached',
  executing: false,
  executingSince: null,
  createdAt: lastAccessAt,
  lastAccessAt,
  revision: 1,
  draft: { ...EMPTY_DRAFT_SUMMARY },
  resources: { ...EMPTY_RESOURCE_STATE },
});

describe('conversationPageCache', () => {
  afterEach(() => {
    fullPageInstanceCacheManager.invalidateAll('test-cleanup');
    conversationPageCacheManager.invalidateAll('test-cleanup');
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('LRU 不淘汰当前实例', () => {
    const entries = [entry('old-active', 1), entry('next-old', 2)];
    expect(selectConversationPageCacheEvictionKey(entries, 'old-active')).toBe(
      'next-old',
    );
  });

  it(`默认最多保留 ${DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY} 个条目并用新的淘汰最旧条目`, () => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(3)
      .mockReturnValueOnce(4)
      .mockReturnValueOnce(5)
      .mockReturnValueOnce(6);
    for (let id = 1; id <= 6; id += 1) {
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: id,
      });
    }
    const snapshot = conversationPageCacheManager.getSnapshot();
    expect(snapshot.entries).toHaveLength(
      DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY,
    );
    expect(snapshot.entries.map((item) => item.key)).not.toContain('chat:1');
    expect(snapshot.activeKey).toBe('chat:6');
  });

  it('容量已满时后台草稿只持久化，不挤掉当前页面实例', () => {
    for (let id = 1; id <= DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY; id += 1) {
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: id,
      });
    }
    conversationPageCacheManager.saveDraft('agent:2', {
      version: 1,
      text: 'background draft',
    });

    expect(conversationPageCacheManager.getSnapshot().entries).toHaveLength(
      DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY,
    );
    expect(conversationPageCacheManager.getSnapshot().activeKey).toBe(
      `chat:${DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY}`,
    );
    expect(conversationPageCacheManager.loadDraft('agent:2')?.text).toBe(
      'background draft',
    );
  });

  it('面板更新持久化，LRU 失效不删除意图', () => {
    const current = conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 101,
    });
    conversationPageCacheManager.update(current.key, { view: 'terminal' });
    conversationPageCacheManager.invalidate(current.key, 'lru');
    const restored = conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 101,
    });
    expect(restored.view).toBe('terminal');
  });

  it('隐藏会话确认结束后释放实例，保留面板偏好和草稿', () => {
    const first = conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 201,
    });
    conversationPageCacheManager.update(first.key, { view: 'terminal' });
    conversationPageCacheManager.saveDraft(first.key, {
      version: 1,
      text: '继续编辑',
    });
    conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 202,
    });

    eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
      conversationId: 201,
      taskStatus: TaskStatus.COMPLETE,
    });

    expect(conversationPageCacheManager.getEntry(first.key)).toBeUndefined();
    expect(conversationPageCacheManager.getSnapshot().activeKey).toBe(
      'chat:202',
    );
    expect(conversationPageCacheManager.getPanelPreference(first.key)).toBe(
      'terminal',
    );
    expect(conversationPageCacheManager.loadDraft(first.key)?.text).toBe(
      '继续编辑',
    );
  });

  it('当前会话终态仍显示，离开后可按终态释放', () => {
    conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 203,
    });
    eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
      conversationId: 203,
      taskStatus: TaskStatus.COMPLETE,
    });
    expect(conversationPageCacheManager.getEntry('chat:203')).toBeDefined();

    conversationPageCacheManager.deactivate('chat:203');
    expect(conversationPageCacheManager.getEntry('chat:203')).toBeUndefined();
  });

  it('整页仍在终态宽限期时保留右侧工作区，整页释放后同步释放', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T00:00:00.000Z'));
    fullPageInstanceCacheManager.activate({
      key: 'conversation:205',
      kind: 'conversation',
      conversationId: 205,
      executing: true,
    });
    conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 205,
    });
    conversationPageCacheManager.deactivate('chat:205');
    fullPageInstanceCacheManager.deactivate('conversation:205');

    eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
      conversationId: 205,
      taskStatus: TaskStatus.COMPLETE,
    });
    expect(conversationPageCacheManager.getEntry('chat:205')).toBeDefined();
    vi.advanceTimersByTime(59_999);
    expect(conversationPageCacheManager.getEntry('chat:205')).toBeDefined();
    vi.advanceTimersByTime(1);
    expect(
      fullPageInstanceCacheManager.getEntry('conversation:205'),
    ).toBeUndefined();
    expect(conversationPageCacheManager.getEntry('chat:205')).toBeUndefined();
  });

  it('终态后同会话重新执行，离开时继续保活', () => {
    conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 204,
    });
    conversationPageCacheManager.markConversationTaskStatus(
      204,
      TaskStatus.COMPLETE,
    );
    conversationPageCacheManager.markConversationTaskStatus(
      204,
      TaskStatus.EXECUTING,
    );

    conversationPageCacheManager.deactivate('chat:204');

    expect(conversationPageCacheManager.getEntry('chat:204')).toBeDefined();
  });

  it('执行中（EXECUTING）条目在快照标记 executing，终态后清除', () => {
    conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 301,
    });
    conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 302,
    });
    conversationPageCacheManager.markConversationTaskStatus(
      301,
      TaskStatus.EXECUTING,
    );
    conversationPageCacheManager.markConversationTaskStatus(
      302,
      TaskStatus.EXECUTING,
    );

    let snapshot = conversationPageCacheManager.getSnapshot();
    expect(
      snapshot.entries.find((item) => item.key === 'chat:301')?.executing,
    ).toBe(true);
    expect(
      snapshot.entries.find((item) => item.key === 'chat:301')?.executingSince,
    ).not.toBeNull();
    expect(
      snapshot.entries.find((item) => item.key === 'chat:302')?.executing,
    ).toBe(true);

    conversationPageCacheManager.markConversationTaskStatus(
      302,
      TaskStatus.COMPLETE,
    );
    snapshot = conversationPageCacheManager.getSnapshot();
    // 当前会话终态仍显示，仅清除执行标记
    expect(
      snapshot.entries.find((item) => item.key === 'chat:302')?.executing,
    ).toBe(false);
    expect(
      snapshot.entries.find((item) => item.key === 'chat:302')?.executingSince,
    ).toBeNull();
    expect(
      snapshot.entries.find((item) => item.key === 'chat:301')?.executing,
    ).toBe(true);
  });

  it('执行事件先于页面激活到达时，新建条目仍带执行标记', () => {
    conversationPageCacheManager.markConversationTaskStatus(
      401,
      TaskStatus.CREATE,
    );
    const created = conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 401,
    });
    expect(created.executing).toBe(true);
    expect(created.executingSince).not.toBeNull();
  });

  it('草稿快照只暴露长度，不暴露正文', () => {
    const current = conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 102,
    });
    conversationPageCacheManager.saveDraft(current.key, {
      version: 1,
      text: '不能出现在调试面板里的正文',
      skillIds: [1, 2],
    });
    const snapshotText = JSON.stringify(
      conversationPageCacheManager.getSnapshot(),
    );
    expect(snapshotText).not.toContain('不能出现在调试面板里的正文');
    expect(
      conversationPageCacheManager.getSnapshot().entries[0].draft,
    ).toMatchObject({
      hasContent: true,
      textLength: 13,
      skillCount: 2,
    });
  });

  it('尚未激活页面时保存草稿也由统一 manager 创建受限条目', () => {
    conversationPageCacheManager.saveDraft('agent:202', {
      version: 1,
      text: 'agent surface draft',
      skillIds: [9],
    });

    expect(conversationPageCacheManager.getSnapshot().entries[0]).toMatchObject(
      {
        key: 'agent:202',
        surface: 'agent',
        conversationId: '202',
        lifecycle: 'cached',
        draft: { hasContent: true, textLength: 19, skillCount: 1 },
      },
    );
  });

  it('删除会话统一清除各路由面的实例、面板意图和草稿', () => {
    const chatEntry = conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 103,
    });
    conversationPageCacheManager.update(chatEntry.key, { view: 'terminal' });
    conversationPageCacheManager.saveDraft(chatEntry.key, {
      version: 1,
      text: 'chat draft',
    });
    const agentEntry = conversationPageCacheManager.activate({
      surface: 'agent',
      conversationId: 103,
    });
    conversationPageCacheManager.update(agentEntry.key, {
      view: 'pagePreview',
    });
    conversationPageCacheManager.saveDraft(agentEntry.key, {
      version: 1,
      text: 'agent draft',
    });

    window.dispatchEvent(
      new CustomEvent('conversation-deleted', { detail: { id: 103 } }),
    );

    expect(conversationPageCacheManager.getSnapshot().entries).toHaveLength(0);
    expect(localStorage.getItem('chat_draft:chat:103')).toBeNull();
    expect(localStorage.getItem('chat_draft:agent:103')).toBeNull();
    const restored = conversationPageCacheManager.activate({
      surface: 'chat',
      conversationId: 103,
    });
    expect(restored.view).toBe('closed');
  });
});
