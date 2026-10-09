import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OAUTH2_SCOPE,
  diffScopes,
  draftScopesOf,
  normalizeScopes,
  scopesChanged,
} from './oauth2Scope';

describe('normalizeScopes', () => {
  it('空数组 / 空值视为平台默认 profile', () => {
    expect(normalizeScopes([])).toEqual([DEFAULT_OAUTH2_SCOPE]);
    expect(normalizeScopes(undefined)).toEqual([DEFAULT_OAUTH2_SCOPE]);
    expect(normalizeScopes(null)).toEqual([DEFAULT_OAUTH2_SCOPE]);
  });

  it('去重并保持顺序', () => {
    expect(normalizeScopes(['profile', 'chat:read', 'profile'])).toEqual([
      'profile',
      'chat:read',
    ]);
  });
});

describe('scopesChanged', () => {
  it('忽略顺序与重复', () => {
    expect(scopesChanged(['a', 'b'], ['b', 'a', 'a'])).toBe(false);
  });

  it('空数组与 [profile] 等价', () => {
    expect(scopesChanged([], ['profile'])).toBe(false);
  });

  it('增删任一项即为变化', () => {
    expect(scopesChanged(['profile'], ['profile', 'im:read'])).toBe(true);
    expect(scopesChanged(['profile', 'im:read'], ['profile'])).toBe(true);
  });
});

describe('draftScopesOf', () => {
  it('审核中取待审目标，否则取生效值', () => {
    expect(
      draftScopesOf({
        scopes: ['profile'],
        pendingScopes: ['profile', 'im:read'],
        scopeApplyStatus: 'Pending',
      }),
    ).toEqual(['profile', 'im:read']);
    expect(
      draftScopesOf({
        scopes: ['profile', 'chat:read'],
        pendingScopes: undefined,
        scopeApplyStatus: 'Rejected',
      }),
    ).toEqual(['profile', 'chat:read']);
  });

  it('从未申请、待审清空时都落到 [profile]', () => {
    expect(draftScopesOf(undefined)).toEqual(['profile']);
    expect(
      draftScopesOf({
        scopes: ['profile', 'x'],
        pendingScopes: [],
        scopeApplyStatus: 'Pending',
      }),
    ).toEqual(['profile']);
  });
});

describe('diffScopes', () => {
  it('给出新增与移除', () => {
    expect(
      diffScopes(['profile', 'chat:read'], ['profile', 'im:read', 'im:push']),
    ).toEqual({ added: ['im:read', 'im:push'], removed: ['chat:read'] });
  });

  it('空数组按 profile 计', () => {
    expect(diffScopes([], ['profile', 'tool:exec'])).toEqual({
      added: ['tool:exec'],
      removed: [],
    });
    expect(diffScopes(['profile', 'tool:exec'], [])).toEqual({
      added: [],
      removed: ['tool:exec'],
    });
  });
});
