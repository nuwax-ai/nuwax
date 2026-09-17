/**
 * 「会话结束未读」蓝点 store 单测（纯逻辑，零 umi 依赖）+ ChatFinished 接线行为。
 *
 * 覆盖契约：结束不在场记点 / 进入即清除（number/string 归一）/ 24h TTL 写路径
 * 清理 / 再次结束时间戳刷新 / 活跃会话基准归一 / 订阅退订；
 * 接线层：结束时在场清除、不在场记点（模块级订阅，随导入生效）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EVENT_TYPE } from '@/constants/event.constants';
import { TaskStatus } from '@/types/enums/agent';
import eventBus from '@/utils/eventBus';

import {
  __resetFinishedConversationUnreadForTest,
  getActiveConversation,
  getFinishedConversationUnreadSnapshot,
  markConversationFinished,
  markConversationVisited,
  setActiveConversation,
  subscribeFinishedConversationUnread,
  UNREAD_DOT_TTL_MS,
} from './finishedConversationUnread';

// vi.hoisted：mock 工厂先于静态 import 执行，捕获模块级接线注册的 handler
const chatFinishedHandlers = vi.hoisted(
  () => [] as Array<(payload: { conversationId: string }) => void>,
);

vi.mock('@/utils/conversationTaskStatusSync', () => ({
  subscribeChatFinished: (
    handler: (payload: { conversationId: string }) => void,
  ) => {
    chatFinishedHandlers.push(handler);
    return () => {};
  },
  isTerminalTaskStatus: (status?: TaskStatus) =>
    status === TaskStatus.CANCEL ||
    status === TaskStatus.COMPLETE ||
    status === TaskStatus.FAILED,
}));

// 导入即接线：useFinishedConversationUnread 模块级订阅 ChatFinished
import './useFinishedConversationUnread';

const emitChatFinished = (conversationId: string) => {
  expect(chatFinishedHandlers.length).toBeGreaterThan(0);
  chatFinishedHandlers.forEach((handler) => handler({ conversationId }));
};

describe('finishedConversationUnread 蓝点 store', () => {
  beforeEach(() => {
    __resetFinishedConversationUnreadForTest();
  });

  it('结束不在场记蓝点：number/string 归一同键', () => {
    markConversationFinished(101);
    markConversationFinished('202'); // 事件 payload 为字符串
    const snapshot = getFinishedConversationUnreadSnapshot();
    expect(snapshot.has('101')).toBe(true);
    expect(snapshot.has('202')).toBe(true);
    expect(snapshot.size).toBe(2);
  });

  it('进入即清除：跨类型命中；未命中静默不通知', () => {
    markConversationFinished('101');
    const listener = vi.fn();
    subscribeFinishedConversationUnread(listener);
    markConversationVisited(101); // number 清 string 键
    expect(getFinishedConversationUnreadSnapshot().has('101')).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    markConversationVisited(999); // 未命中不触发
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('24h TTL：写入路径顺手清理过期项', () => {
    const base = 1_700_000_000_000;
    markConversationFinished('stale', base);
    // 23h 后又一条结束：stale 未过期保留
    markConversationFinished('fresh', base + UNREAD_DOT_TTL_MS - 3_600_000);
    expect(getFinishedConversationUnreadSnapshot().has('stale')).toBe(true);
    // 25h 后再一条结束：stale 过期清除、fresh 按自身时间戳保留
    markConversationFinished('late', base + UNREAD_DOT_TTL_MS + 3_600_000);
    const snapshot = getFinishedConversationUnreadSnapshot();
    expect(snapshot.has('stale')).toBe(false);
    expect(snapshot.has('fresh')).toBe(true);
    expect(snapshot.has('late')).toBe(true);
  });

  it('再次结束时间戳刷新：旧记录不按首次时间过期', () => {
    const base = 1_700_000_000_000;
    markConversationFinished('101', base);
    markConversationFinished('101', base + UNREAD_DOT_TTL_MS / 2);
    // 首次记点满 24h 时触发清理：按刷新后的时间戳仍在
    markConversationFinished(
      '202',
      base + UNREAD_DOT_TTL_MS + 3_600_000,
    );
    expect(getFinishedConversationUnreadSnapshot().has('101')).toBe(true);
  });

  it('活跃会话基准：空值归一为 null', () => {
    setActiveConversation('123');
    expect(getActiveConversation()).toBe('123');
    setActiveConversation(undefined);
    expect(getActiveConversation()).toBe(null);
    setActiveConversation('');
    expect(getActiveConversation()).toBe(null);
  });

  it('订阅退订后不再通知', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeFinishedConversationUnread(listener);
    markConversationFinished(1);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    markConversationFinished(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ChatFinished 接线：结束时在场清除、不在场记点', () => {
    setActiveConversation('9');
    emitChatFinished('9'); // 结束那一刻就在该会话里
    expect(getFinishedConversationUnreadSnapshot().has('9')).toBe(false);

    emitChatFinished('8'); // 不在场
    expect(getFinishedConversationUnreadSnapshot().has('8')).toBe(true);
  });

  it('终态补丁接线（UpdateConversationListTaskStatus）：不在场记点、在场清除、非终态不记', () => {
    // 不在场 + 终态 → 记
    eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
      conversationId: '31',
      taskStatus: TaskStatus.COMPLETE,
    });
    expect(getFinishedConversationUnreadSnapshot().has('31')).toBe(true);

    // 在场 + 终态 → 清除
    setActiveConversation('32');
    eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
      conversationId: '32',
      taskStatus: TaskStatus.FAILED,
    });
    expect(getFinishedConversationUnreadSnapshot().has('32')).toBe(false);

    // 非终态（EXECUTING 乐观补丁）→ 不记
    eventBus.emit(EVENT_TYPE.UpdateConversationListTaskStatus, {
      conversationId: '33',
      taskStatus: TaskStatus.EXECUTING,
    });
    expect(getFinishedConversationUnreadSnapshot().has('33')).toBe(false);
  });
});
