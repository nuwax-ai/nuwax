import { SpaceTypeEnum } from '@/types/enums/space';
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
const teamSpace = { id: 53259458, type: SpaceTypeEnum.Team };
const options = { enabled: true, space: teamSpace, name: '群里聊聊' };

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

  it('团队空间与班级空间都展示', () => {
    for (const type of [SpaceTypeEnum.Team, SpaceTypeEnum.Class]) {
      const menus = withGroupChatMenu(base, {
        ...options,
        space: { id: 7, type },
      });
      expect(menus[0]).toMatchObject({
        code: GROUP_CHAT_MENU_CODE,
        path: '/instant-message?spaceId=7',
      });
    }
  });

  it('个人空间不展示', () => {
    const space = { id: 1, type: SpaceTypeEnum.Personal };
    expect(withGroupChatMenu(base, { ...options, space })).toBe(base);
  });

  it('未授权、空间信息未就绪或菜单尚未加载时原样返回', () => {
    expect(withGroupChatMenu(base, { ...options, enabled: false })).toBe(base);
    expect(withGroupChatMenu(base, { ...options, space: undefined })).toBe(
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
