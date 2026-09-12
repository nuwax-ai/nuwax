import {
  CONVERSATION_FAVORITES_EVENT,
  isFavoriteConversation,
  loadFavoriteConversationIds,
  removeFavoriteConversation,
  toggleFavoriteConversation,
} from '@/utils/conversationFavorites';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = 'conversation_favorite_ids';
const LEGACY_KEY = 'conversation_local_flags';

describe('会话收藏本地存储', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('空存储时读取为空数组', () => {
    expect(loadFavoriteConversationIds()).toEqual([]);
    expect(isFavoriteConversation(1)).toBe(false);
  });

  it('toggle 写入存储并派发全局事件', () => {
    const handler = vi.fn();
    window.addEventListener(CONVERSATION_FAVORITES_EVENT, handler);
    try {
      expect(toggleFavoriteConversation(7)).toBe(true);
      expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([7]);
      expect(handler).toHaveBeenCalledTimes(1);

      expect(toggleFavoriteConversation(7)).toBe(false);
      expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([]);
      expect(handler).toHaveBeenCalledTimes(2);
    } finally {
      window.removeEventListener(CONVERSATION_FAVORITES_EVENT, handler);
    }
  });

  it('显式传入目标状态生效，且 id 去重', () => {
    toggleFavoriteConversation(3, true);
    toggleFavoriteConversation(3, true);
    expect(loadFavoriteConversationIds()).toEqual([3]);
    toggleFavoriteConversation(3, false);
    expect(loadFavoriteConversationIds()).toEqual([]);
  });

  it('删除会话时清理收藏残留', () => {
    toggleFavoriteConversation(5);
    toggleFavoriteConversation(6);
    removeFavoriteConversation(5);
    expect(loadFavoriteConversationIds()).toEqual([6]);
  });

  it('首读迁移旧方案 collected 数据并落入新键', () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        version: 1,
        pinned: [1],
        archived: [2],
        collected: [8, 8, 9],
      }),
    );
    expect(loadFavoriteConversationIds()).toEqual([8, 9]);
    // 迁移后新键生效，旧键不再参与读取
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([8, 9]);
    removeFavoriteConversation(8);
    expect(loadFavoriteConversationIds()).toEqual([9]);
  });

  it('旧键版本不符时不迁移', () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({ version: 2, collected: [8] }),
    );
    expect(loadFavoriteConversationIds()).toEqual([]);
  });

  it('存储内容损坏时读取为空且不抛错', () => {
    localStorage.setItem(KEY, 'not-json');
    expect(loadFavoriteConversationIds()).toEqual([]);
  });
});
