import { describe, expect, it } from 'vitest';

import { pickMineConversations } from './projectConversationOwnership';

interface Row {
  id: number;
  userId?: number;
}

const row = (id: number, userId?: number): Row =>
  userId === undefined ? { id } : { id, userId };

describe('pickMineConversations 项目会话归属过滤', () => {
  it('只保留当前用户自己的会话', () => {
    const list = [row(1, 7), row(2, 99), row(3, 7)];
    expect(pickMineConversations(list, 7).map((item) => item.id)).toEqual([
      1, 3,
    ]);
  });

  it('他人会话一条不剩时返回空数组', () => {
    expect(pickMineConversations([row(1, 99)], 7)).toEqual([]);
  });

  it('混合 id 类型（后端可能回字符串）也能对上', () => {
    const list = [
      { id: 1, userId: '7' },
      { id: 2, userId: 9 },
    ];
    expect(pickMineConversations(list, 7).map((item) => item.id)).toEqual([1]);
  });

  it('行本身没有 userId 时不过滤也不误杀', () => {
    const list = [row(1), row(2, 7)];
    // 缺 userId 的行被剔除（无法证明是自己的），但保留自己的行
    expect(pickMineConversations(list, 7).map((item) => item.id)).toEqual([2]);
  });

  it('没有行被过滤掉时返回原数组引用（防下游 effect 抖动）', () => {
    const list = [row(1, 7), row(2, 7)];
    expect(pickMineConversations(list, 7)).toBe(list);
  });

  it('取不到当前用户 id 时原样返回（不清空列表）', () => {
    const list = [row(1, 7), row(2, 99)];
    expect(pickMineConversations(list, undefined)).toBe(list);
    expect(pickMineConversations(list, null)).toBe(list);
    expect(pickMineConversations(list, '')).toBe(list);
  });

  it('空列表安全', () => {
    expect(pickMineConversations([], 7)).toEqual([]);
  });
});
