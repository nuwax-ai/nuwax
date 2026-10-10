import type { MenuItemDto } from '@/types/interfaces/menu';
import { describe, expect, it } from 'vitest';
import {
  GROUP_CHAT_MENU_CODE,
  isGroupChatMenuActive,
  withGroupChatMenu,
} from './groupChatMenu';

const base = [
  { id: 1, code: 'xiangmu_yingyong', name: '项目&应用' },
] as MenuItemDto[];
const options = { enabled: true, spaceId: 53259458, name: '群里聊聊' };

describe('withGroupChatMenu', () => {
  it('work 授权时在首位注入带 spaceId 的群聊入口', () => {
    const [first, ...rest] = withGroupChatMenu(base, options);
    expect(first).toMatchObject({
      code: GROUP_CHAT_MENU_CODE,
      name: '群里聊聊',
      path: '/instant-message?spaceId=53259458',
      icon: 'icons-nav-message',
    });
    expect(rest).toEqual(base);
  });

  it('未授权、缺少空间或菜单尚未加载时原样返回', () => {
    expect(withGroupChatMenu(base, { ...options, enabled: false })).toBe(base);
    expect(withGroupChatMenu(base, { ...options, spaceId: undefined })).toBe(
      base,
    );
    expect(withGroupChatMenu([], options)).toEqual([]);
  });
});

describe('isGroupChatMenuActive', () => {
  const path = '/instant-message?spaceId=53259458';

  it('同一空间的群聊页高亮', () => {
    expect(
      isGroupChatMenuActive(path, '/instant-message', '?spaceId=53259458'),
    ).toBe(true);
  });

  it('伙伴页或其他空间不高亮', () => {
    expect(isGroupChatMenuActive(path, '/instant-message', '')).toBe(false);
    expect(isGroupChatMenuActive(path, '/instant-message', '?spaceId=1')).toBe(
      false,
    );
    expect(
      isGroupChatMenuActive(path, '/space/1/develop', '?spaceId=53259458'),
    ).toBe(false);
  });
});
