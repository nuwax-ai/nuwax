import { ResourceTreeNode } from '@/pages/SystemManagement/MenuPermission/types/permission-resources';
import routes from '@/routes';
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

/**
 * 路由过滤控制配置
 * key: 路由节点路径名（可以是相对路径或包含该路径名的完整段，如 'subscription-credits'）
 * shouldHide: 自定义判定函数，接收租户配置并返回布尔值。为真时则隐藏该路由分组。这提供了极大的灵活性，支持任意字段、任意类型与复杂的匹配逻辑。
 * excludePaths: 需要排除过滤的子路由路径名，即便在该分组下也始终不被隐藏
 */
export const ROUTE_CONTROL_CONFIG: Record<
  string,
  {
    shouldHide: (tenantConfig: any) => boolean;
    excludePaths?: string[];
  }
> = {
  // 订阅/积分套餐增购相关菜单分组
  'subscription-credits': {
    // 当租户未开启订阅业务（enableSubscription 为数字 0）时，隐藏本增购功能组
    shouldHide: (config) => config?.enableSubscription === 0,
    // “基础设置”作为底层核心入口需始终保留公开展示，不受订阅状态控制而隐藏
    excludePaths: ['basic-config'],
  },
  // 支付与收益相关菜单分组
  'payment-earnings': {
    // 租户未开启订阅时隐藏该分组。由于无保留排除项且子路由全被隐藏，父级空菜单亦会被过滤清除
    shouldHide: (config) => config?.enableSubscription === 0,
    excludePaths: [],
  },
  // 系统更多页面菜单分组
  'more-page': {
    // 租户未开启订阅时隐藏该多级菜单组
    shouldHide: (config) => config?.enableSubscription === 0,
    // 始终保留并允许用户正常访问“API Key/密钥设置”子页面
    excludePaths: ['api-key'],
  },
};

/**
 * 根据租户配置和路由控制规则，动态解析出当前需要被隐藏的所有路由完整绝对路径
 * @param tenantConfig 租户配置对象
 * @returns 隐藏的路由完整绝对路径数组
 */
export const getFilteredHiddenRoutePaths = (tenantConfig: any): string[] => {
  const hiddenPaths: string[] = [];
  if (!tenantConfig) return hiddenPaths;

  // 1. 识别并提取所有当前由于配置关闭而需要隐藏的规则定义
  const activeControlGroups = Object.entries(ROUTE_CONTROL_CONFIG).filter(
    ([, rule]) => rule.shouldHide(tenantConfig),
  );

  if (activeControlGroups.length === 0) return hiddenPaths;

  // 2. 递归遍历 Umi 路由树，根据激活的过滤规则匹配子路由
  const traverse = (routeList: any[], parentPath: string = '') => {
    for (const route of routeList) {
      let currentPath = route.path || '';
      if (currentPath && !currentPath.startsWith('/')) {
        currentPath = parentPath
          ? `${parentPath}/${currentPath}`
          : `/${currentPath}`;
      } else if (!currentPath) {
        currentPath = parentPath;
      }

      // 检查当前路由是否匹配任何一个激活的控制节点
      for (const [controlNode, rule] of activeControlGroups) {
        const isMatchNode =
          route.path === controlNode || currentPath.endsWith(`/${controlNode}`);
        if (isMatchNode && route.routes) {
          // 如果排除的路由为空，说明整个父级菜单也需要隐藏，直接将父路径加入隐藏列表
          if (!rule.excludePaths || rule.excludePaths.length === 0) {
            hiddenPaths.push(currentPath);
          }

          for (const subRoute of route.routes) {
            const isExcluded = rule.excludePaths?.includes(subRoute.path || '');
            if (subRoute.path && !isExcluded) {
              let subPath = subRoute.path;
              if (!subPath.startsWith('/')) {
                subPath = `${currentPath}/${subPath}`;
              }
              hiddenPaths.push(subPath);
            }
          }
        }
      }

      if (route.routes) {
        traverse(route.routes, currentPath);
      }
    }
  };

  traverse(routes);
  return hiddenPaths;
};

/**
 * 校验指定路径是否由于租户配置限制而被隐藏/禁用访问
 * @param pathname 当前访问的路由路径
 * @param tenantConfig 租户配置对象
 * @returns 是否需要隐藏/禁用该路径
 */
export const isRoutePathHidden = (
  pathname: string,
  tenantConfig: any,
): boolean => {
  if (!pathname || !tenantConfig) return false;
  const hiddenPaths = getFilteredHiddenRoutePaths(tenantConfig);
  if (hiddenPaths.length === 0) return false;

  const normalizedPath = pathname.replace(/\/$/, '');
  return hiddenPaths.some((hiddenPath) => {
    return (
      normalizedPath === hiddenPath ||
      normalizedPath.startsWith(hiddenPath + '/')
    );
  });
};
