import { AgentSubTypeEnum, AgentTypeEnum } from '@/types/enums/space';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { findMicroAppRoute, resolveMicroAppMenuPath } from './microAppRoutes';

type CommercialConfig = Pick<
  TenantConfigInfo,
  'aiOSCommercialEdition' | 'workCommercialEdition'
>;

/** 两项授权独立且只接受 boolean true，不兼容旧总开关或 truthy 值。 */
export function getCommercialEdition(config?: CommercialConfig | null) {
  return {
    aiOSCommercialEdition: config?.aiOSCommercialEdition === true,
    workCommercialEdition: config?.workCommercialEdition === true,
  };
}

export function isCommercialAgentType(type: string): boolean {
  return [
    AgentTypeEnum.AgentFlow,
    AgentTypeEnum.AgentGroup,
    AgentSubTypeEnum.Flow,
    AgentSubTypeEnum.Group,
  ].some((value) => value === type);
}

/** 仅收起项目&应用菜单，不参与页面访问权限判断。 */
export function isAiosCommercialMenu(menu: MenuItemDto): boolean {
  return (
    menu.code === 'xiangmu_yingyong' ||
    /^\/space\/[^/]+\/project-manage\/?$/.test(
      (menu.path || '').split(/[?#]/)[0],
    )
  );
}

export function filterAiosCommercialMenus(
  menus: MenuItemDto[],
  enabled: boolean,
): MenuItemDto[] {
  if (enabled) return menus;
  return menus
    .filter((menu) => !isAiosCommercialMenu(menu))
    .map((menu) =>
      menu.children?.length
        ? { ...menu, children: filterAiosCommercialMenus(menu.children, false) }
        : menu,
    )
    .filter(
      (menu) =>
        !menu.children ||
        menu.children.length > 0 ||
        (!!menu.path && menu.path !== '#'),
    );
}

const WORK_MENU_CODES = ['message', 'repo', 'ziliaoku'];
const WORK_APP_NAMES = ['nuwax-im-web', 'nuwax-repo-web'];

export function isWorkCommercialApp(name?: string): boolean {
  return !!name && WORK_APP_NAMES.includes(name);
}

export function isWorkCommercialMenu(menu: MenuItemDto): boolean {
  return (
    WORK_MENU_CODES.includes(menu.code || '') ||
    isWorkCommercialApp(
      findMicroAppRoute(resolveMicroAppMenuPath(menu) || menu.path || '')?.name,
    )
  );
}

/** 精确路径段匹配配置的站内菜单，动态段不跨层，避免误拦相似前缀。 */
function matchesMenuPath(path: string, pathname: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  const expected = path.split(/[?#]/)[0].split('/').filter(Boolean);
  const actual = pathname.split('/').filter(Boolean);
  return (
    expected.length > 0 &&
    actual.length >= expected.length &&
    expected.every((segment, i) =>
      segment.startsWith(':') ? !!actual[i] : segment === actual[i],
    )
  );
}

/** 主站路由和旧 iframe 包装共用；不依赖一次性的菜单点击事件。 */
export function isWorkCommercialRoute(
  pathname: string,
  menus: readonly MenuItemDto[],
): boolean {
  if (isWorkCommercialApp(findMicroAppRoute(pathname)?.name)) return true;
  const iframeCode = pathname.match(
    /(?:^|\/)open-iframe-page\/([^/]+)\/?$/,
  )?.[1];
  if (iframeCode && WORK_MENU_CODES.includes(iframeCode)) return true;
  return menus.some(
    (menu) =>
      (isWorkCommercialMenu(menu) &&
        ((!!iframeCode && menu.code === iframeCode) ||
          matchesMenuPath(
            resolveMicroAppMenuPath(menu) || menu.path || '',
            pathname,
          ))) ||
      isWorkCommercialRouteInChildren(pathname, menu.children),
  );
}

function isWorkCommercialRouteInChildren(
  pathname: string,
  children?: MenuItemDto[],
): boolean {
  return !!children?.length && isWorkCommercialRoute(pathname, children);
}
