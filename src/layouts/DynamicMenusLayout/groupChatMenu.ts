import { SpaceTypeEnum } from '@/types/enums/space';
import type { MenuItemDto } from '@/types/interfaces/menu';
import {
  MenuBindTypeEnum,
  MenuEnabledEnum,
} from '@/types/menuPermission/menu-manage';

/** 本地注入的菜单 code，不来自后端菜单树，也不参与权限与路径缓存。 */
export const GROUP_CHAT_MENU_CODE = 'group_chat';

const GROUP_CHAT_PATHNAME = '/instant-message';

interface GroupChatMenuOptions {
  /** 仅 workCommercialEdition 授权时展示 */
  enabled: boolean;
  /** 当前空间；个人空间没有群聊，空间信息未就绪时也不展示，避免加载后闪退 */
  space?: { id: number | string; type: SpaceTypeEnum } | null;
  name: string;
}

/** 工作空间二级菜单首位注入「群里聊聊」，无需后端额外配置菜单。 */
export function withGroupChatMenu(
  menus: MenuItemDto[],
  { enabled, space, name }: GroupChatMenuOptions,
): MenuItemDto[] {
  if (
    !enabled ||
    !space?.id ||
    space.type === SpaceTypeEnum.Personal ||
    !menus.length
  ) {
    return menus;
  }
  return [
    {
      id: -1,
      code: GROUP_CHAT_MENU_CODE,
      name,
      path: `${GROUP_CHAT_PATHNAME}?spaceId=${encodeURIComponent(
        String(space.id),
      )}`,
      icon: 'icons-nav-message',
      status: MenuEnabledEnum.Enabled,
      menuBindType: MenuBindTypeEnum.Unbound,
      children: [],
    },
    ...menus,
  ];
}

/** 仅当前正处于同一空间的群聊页时高亮，避免伙伴页（同路径不同参数）误亮。 */
export function isGroupChatMenuActive(
  menuPath: string | undefined,
  pathname: string,
  search: string,
): boolean {
  if (!menuPath || pathname.replace(/\/+$/, '') !== GROUP_CHAT_PATHNAME) {
    return false;
  }
  const expected = new URLSearchParams(menuPath.split('?')[1] || '').get(
    'spaceId',
  );
  return !!expected && new URLSearchParams(search).get('spaceId') === expected;
}
