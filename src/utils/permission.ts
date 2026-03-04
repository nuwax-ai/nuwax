import { ResourceTreeNode } from '@/pages/SystemManagement/MenuPermission/types/permission-resources';
import type { MenuItemDto } from '@/types/interfaces/menu';

/**
 * 从菜单树中提取所有权限码
 * 返回一个 Map，key 为菜单 code，value 为该菜单下所有 resourceTree 的 code 数组
 */
export const extractAllPermissions = (
  menus: MenuItemDto[],
): Map<string, string[]> => {
  const permissionMap = new Map<string, string[]>();

  /**
   * 递归提取资源树中的所有 code
   */
  const extractResourceCodes = (resources: ResourceTreeNode[]): string[] => {
    const codes: string[] = [];
    if (!resources) return codes;

    const traverse = (items: ResourceTreeNode[]) => {
      if (!items) return;
      items.forEach((resource) => {
        if (resource.code) {
          codes.push(resource.code);
        }
        // 递归处理子资源
        if (resource.children?.length) {
          traverse(resource.children);
        }
      });
    };

    traverse(resources);
    return codes;
  };

  /**
   * 遍历菜单树
   */
  const traverseMenus = (items: MenuItemDto[]) => {
    items.forEach((item) => {
      // 如果菜单有 code，则提取其资源码
      if (item.code) {
        const resourceCodes = extractResourceCodes(item.resourceTree || []);
        if (resourceCodes.length > 0) {
          permissionMap.set(item.code, resourceCodes);
        }
      }
      // 递归处理子菜单
      if (item.children?.length) {
        traverseMenus(item.children);
      }
    });
  };

  traverseMenus(menus);

  return permissionMap;
};

/**
 * 从菜单树中提取所有菜单码
 */
export const extractAllMenuCodes = (menus: MenuItemDto[]): string[] => {
  const codes: string[] = [];
  const traverse = (items: MenuItemDto[]) => {
    items.forEach((item) => {
      codes.push(item.code || '');
      if (item.children?.length) {
        traverse(item.children);
      }
    });
  };
  traverse(menus);
  return codes;
};
