/**
 * 队列持久化（queueStorage）测试
 *
 * 覆盖：按会话分键 round-trip、空队列删键、TTL 过期过滤、
 * 结构非法 / 损坏数据安全降级、conversationId 为空时不读写。
 */
import {
  loadQueue,
  saveQueue,
} from '@/components/business-component/MessageQueue/queueStorage';
import type { QueuedMessage } from '@/components/business-component/MessageQueue/types';
import { beforeEach, describe, expect, it } from 'vitest';

const makeMsg = (over: Partial<QueuedMessage> = {}): QueuedMessage => ({
  id: 'q1',
  text: 'hello',
  queuedAt: new Date(),
  ...over,
});

describe('queueStorage 队列持久化', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('save 后 load 还原队列：queuedAt 还原为 Date，保留 skillIds/modelId/agentMode 快照', () => {
    saveQueue('c1', [
      makeMsg({ skillIds: [7], modelId: 3, selectedAgentMode: 'ask' }),
    ]);
    const loaded = loadQueue('c1');
    expect(loaded).toHaveLength(1);
    expect(loaded[0].text).toBe('hello');
    expect(loaded[0].skillIds).toEqual([7]);
    expect(loaded[0].modelId).toBe(3);
    expect(loaded[0].selectedAgentMode).toBe('ask');
    expect(loaded[0].queuedAt).toBeInstanceOf(Date);
  });

  it('保存空队列会删除存储键', () => {
    saveQueue('c1', [makeMsg()]);
    expect(localStorage.getItem('msg_queue:c1')).not.toBeNull();
    saveQueue('c1', []);
    expect(localStorage.getItem('msg_queue:c1')).toBeNull();
  });

  it('按会话分键隔离，不同会话互不影响', () => {
    saveQueue('a', [makeMsg({ id: 'a1', text: 'A' })]);
    saveQueue('b', [makeMsg({ id: 'b1', text: 'B' })]);
    expect(loadQueue('a')[0].text).toBe('A');
    expect(loadQueue('b')[0].text).toBe('B');
  });

  it('丢弃超过 TTL（24h）的陈旧项，保留新鲜项', () => {
    const stale = makeMsg({
      id: 'old',
      queuedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    const fresh = makeMsg({ id: 'new', queuedAt: new Date() });
    saveQueue('c1', [stale, fresh]);
    expect(loadQueue('c1').map((m) => m.id)).toEqual(['new']);
  });

  it('存储内容损坏 / 非数组时安全降级为空队列', () => {
    localStorage.setItem('msg_queue:c1', '{bad json');
    expect(loadQueue('c1')).toEqual([]);
    localStorage.setItem('msg_queue:c2', '{"not":"array"}');
    expect(loadQueue('c2')).toEqual([]);
  });

  it('过滤结构非法项（缺 id 或 text）', () => {
    localStorage.setItem(
      'msg_queue:c1',
      JSON.stringify([
        { id: 'ok', text: 'ok', queuedAt: new Date().toISOString() },
        { text: 'no-id', queuedAt: new Date().toISOString() },
        { id: 'no-text', queuedAt: new Date().toISOString() },
      ]),
    );
    expect(loadQueue('c1').map((m) => m.id)).toEqual(['ok']);
  });

  it('conversationId 为空时不读写', () => {
    expect(loadQueue(undefined)).toEqual([]);
    expect(loadQueue(null)).toEqual([]);
    saveQueue(null, [makeMsg()]);
    expect(localStorage.length).toBe(0);
  });
});
