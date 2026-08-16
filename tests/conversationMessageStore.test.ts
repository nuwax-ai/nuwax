/**
 * 新线消息状态仓合同测试（双线方案 R1）。
 * Interface 即测试 Surface：写入 API 全集、不可变通知、引用稳定（useSyncExternalStore 兼容）。
 */
import { createConversationMessageStore } from '@/features/conversation/runtime/conversationMessageStore';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it, vi } from 'vitest';

const userRound = {
  role: AssistantRoleEnum.USER,
  text: '问',
  id: 'u1',
} as MessageInfo;
const assistantRound = {
  role: AssistantRoleEnum.ASSISTANT,
  text: '',
  id: 'a1',
  status: MessageStatusEnum.Loading,
} as MessageInfo;

describe('conversationMessageStore', () => {
  it('写入产出新数组并通知订阅者；快照引用稳定', () => {
    const store = createConversationMessageStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.applyOptimisticRound(userRound, assistantRound);

    expect(store.getSnapshot()).toHaveLength(2);
    expect(listener).toHaveBeenCalledTimes(1);

    const ref1 = store.getSnapshot();
    expect(store.getSnapshot()).toBe(ref1); // 未写入时同引用
    unsubscribe();
  });

  it('取消订阅后不再通知', () => {
    const store = createConversationMessageStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.applyOptimisticRound(userRound, assistantRound);
    expect(listener).not.toHaveBeenCalled();
  });

  it('applyStreamReduction：投影写入，同引用跳过通知', () => {
    const store = createConversationMessageStore();
    store.applyOptimisticRound(userRound, assistantRound);
    const listener = vi.fn();
    store.subscribe(listener);

    const current = store.getSnapshot();
    store.applyStreamReduction(current); // 引用相同
    expect(listener).not.toHaveBeenCalled();

    store.applyStreamReduction([
      ...current,
      { role: AssistantRoleEnum.USER, text: '新', id: 'u2' } as MessageInfo,
    ]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toHaveLength(3);
  });

  it('mergeSnapshot：提交 reconcile 结果并通知（纯函数总产出新数组）', () => {
    const store = createConversationMessageStore();
    store.applyOptimisticRound(userRound, assistantRound);
    const listener = vi.fn();
    store.subscribe(listener);

    store.mergeSnapshot(store.getSnapshot());
    expect(listener).toHaveBeenCalledTimes(1); // 内容等价也会通知一次（与旧线一致）
    expect(store.getSnapshot()).toHaveLength(2);

    store.mergeSnapshot([
      userRound,
      { ...assistantRound, text: '答', status: MessageStatusEnum.Complete },
    ]);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()[1].text).toBe('答');
  });

  it('finalizeOnClose：Loading → Stopped', () => {
    const store = createConversationMessageStore();
    store.applyOptimisticRound(userRound, assistantRound);

    store.finalizeOnClose();

    const tail = store.getSnapshot()[1];
    expect(tail.status).toBe(MessageStatusEnum.Stopped);
  });

  it('markStreamError：owner 消息 → Error', () => {
    const store = createConversationMessageStore();
    store.applyOptimisticRound(userRound, assistantRound);

    store.markStreamError('a1');

    expect(store.getSnapshot()[1].status).toBe(MessageStatusEnum.Error);
  });

  it('finalizeOwnedOnStaleClose：只清理 owner 自己的消息', () => {
    const store = createConversationMessageStore();
    store.applyOptimisticRound(userRound, assistantRound);
    store.applyOptimisticRound(
      { role: AssistantRoleEnum.USER, text: '二', id: 'u2' } as MessageInfo,
      {
        role: AssistantRoleEnum.ASSISTANT,
        text: '',
        id: 'a2',
        status: MessageStatusEnum.Loading,
      } as MessageInfo,
    );

    store.finalizeOwnedOnStaleClose('a1');

    const messages = store.getSnapshot();
    expect(messages[1].status).toBe(MessageStatusEnum.Stopped);
    expect(messages[3].status).toBe(MessageStatusEnum.Loading);
  });

  it('patchMessage：定点补丁，未命中不动', () => {
    const store = createConversationMessageStore();
    store.applyOptimisticRound(userRound, assistantRound);
    const listener = vi.fn();
    store.subscribe(listener);

    store.patchMessage('不存在', { text: 'x' });
    expect(listener).not.toHaveBeenCalled();

    store.patchMessage('a1', { mcpAskInteractions: [] as never });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()[1].mcpAskInteractions).toEqual([]);
  });

  it('reset：清空并通知', () => {
    const store = createConversationMessageStore();
    store.applyOptimisticRound(userRound, assistantRound);
    store.reset();
    expect(store.getSnapshot()).toEqual([]);
  });
});
