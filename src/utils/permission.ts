import type { MenuItemDto } from '@/types/interfaces/menu';

/**
 * 从菜单树中提取所有权限码
 */
export const extractAllPermissions = (menus: MenuItemDto[]): string[] => {
  const codes: string[] = [];
  const traverse = (items: MenuItemDto[]) => {
    items.forEach((item) => {
      // 提取功能权限
      item.permissions?.forEach((p) => codes.push(p.code));
      // 递归处理子菜单
      if (item.children?.length) {
        traverse(item.children);
      }
    });
  };
  traverse(menus);
  return codes;
};

/**
 * 从菜单树中提取所有菜单码
 */
export const extractAllMenuCodes = (menus: MenuItemDto[]): string[] => {
  const codes: string[] = [];
  const traverse = (items: MenuItemDto[]) => {
    items.forEach((item) => {
      codes.push(item.code);
      if (item.children?.length) {
        traverse(item.children);
      }
    });
  };
  traverse(menus);
  return codes;
};
