import { describe, expect, it } from 'vitest';

import {
  applyConversationFlagOverrides,
  CONVERSATION_FLAG_OVERRIDE_TTL_MS,
  recordConversationFlagOverride,
} from './conversationFlagOverrides';

const T0 = 1_800_000_000_000;

describe('recordConversationFlagOverride', () => {
  it('非法 id 不记录', () => {
    const overrides = new Map();
    recordConversationFlagOverride(overrides, undefined, 'archived', true);
    recordConversationFlagOverride(overrides, null, 'pinned', true);
    expect(overrides.size).toBe(0);
  });

  it('同 id 同 kind 重复 toggle 覆盖旧值，不同 kind 互不干扰', () => {
    const overrides = new Map();
    recordConversationFlagOverride(overrides, 1, 'archived', true, T0);
    recordConversationFlagOverride(overrides, 1, 'pinned', true, T0);
    recordConversationFlagOverride(overrides, 1, 'archived', false, T0 + 1);
    expect(overrides.size).toBe(2);
    expect(overrides.get('archived:1')).toEqual({
      kind: 'archived',
      enabled: false,
      at: T0 + 1,
    });
    expect(overrides.get('pinned:1')?.enabled).toBe(true);
  });
});

describe('applyConversationFlagOverrides', () => {
  it('滞后回包不能复活刚归档的会话', () => {
    const overrides = new Map();
    recordConversationFlagOverride(overrides, 7, 'archived', true, T0);
    const result = applyConversationFlagOverrides(
      [{ id: 7, archived: false, topic: '方案' }],
      overrides,
      T0 + 1_000,
    );
    expect(result[0].archived).toBe(true);
  });

  it('服务端追平后清除覆盖并原样返回（同引用）', () => {
    const overrides = new Map();
    recordConversationFlagOverride(overrides, 7, 'archived', true, T0);
    const list = [{ id: 7, archived: true }];
    const result = applyConversationFlagOverrides(list, overrides, T0 + 1_000);
    expect(result).toBe(list);
    expect(overrides.size).toBe(0);
  });

  it('超出 TTL 后回归服务端数据并清理覆盖', () => {
    const overrides = new Map();
    recordConversationFlagOverride(overrides, 7, 'archived', true, T0);
    const list = [{ id: 7, archived: false }];
    const result = applyConversationFlagOverrides(
      list,
      overrides,
      T0 + CONVERSATION_FLAG_OVERRIDE_TTL_MS + 1,
    );
    expect(result).toBe(list);
    expect(result[0].archived).toBe(false);
    expect(overrides.size).toBe(0);
  });

  it('置顶与归档覆盖同时生效', () => {
    const overrides = new Map();
    recordConversationFlagOverride(overrides, '9', 'pinned', true, T0);
    recordConversationFlagOverride(overrides, '9', 'archived', true, T0);
    const result = applyConversationFlagOverrides(
      [{ id: 9, pinned: false, archived: false }],
      overrides,
      T0 + 1_000,
    );
    expect(result[0].pinned).toBe(true);
    expect(result[0].archived).toBe(true);
  });

  it('无覆盖或目标不在回包中时原样返回，且不误伤空 id 条目', () => {
    const empty = new Map();
    const list = [{ id: 1 }, { id: null }];
    expect(applyConversationFlagOverrides(list, empty, T0)).toBe(list);

    const overrides = new Map();
    recordConversationFlagOverride(overrides, 42, 'archived', true, T0);
    // 回包已不含 42（如服务端直接过滤归档行）：覆盖保留待后续回包或过期
    const result = applyConversationFlagOverrides(
      [{ id: 1 }],
      overrides,
      T0 + 1_000,
    );
    expect(result).toHaveLength(1);
    expect(overrides.size).toBe(1);
  });
});
