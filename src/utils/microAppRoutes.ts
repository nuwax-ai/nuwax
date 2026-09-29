import type { HostAuthContext } from '@/types/interfaces/hostAuth';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { OpenTypeEnum } from '@/types/menuPermission/menu-manage';

/** 子应用真实仓库名、业务路由和独立资源入口的单一登记表。 */
export interface MicroAppRoute {
  name: string;
  path: string;
  stableEntry: string;
  entry: string;
  menuCodes: readonly string[];
}

export const MICRO_APP_ROUTES: readonly MicroAppRoute[] = [
  {
    name: 'nuwax-repo-web',
    path: '/repo',
    stableEntry: '/repo-entry',
    entry: '/micro-apps/repo/index.html',
    menuCodes: ['repo', 'ziliaoku'],
  },
  {
    name: 'nuwax-im-web',
    path: '/instant-message',
    stableEntry: '/message-entry',
    entry: '/micro-apps/message/index.html',
    menuCodes: ['message'],
  },
];

const currentOrigin = (): string =>
  typeof window === 'undefined' ? 'http://nuwax.local' : window.location.origin;

const configuredBusinessOrigin = (): string => process.env.BASE_URL || '';

/** 按完整路径段匹配，避免把 /repo-other 等主站页面识别为资料库。 */
export const findMicroAppRoute = (
  pathname: string,
): MicroAppRoute | undefined => {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return MICRO_APP_ROUTES.find(
    (app) =>
      path === app.path ||
      path.startsWith(`${app.path}/`) ||
      path === app.stableEntry,
  );
};

/** 仅解析同源地址；未确认的跨域部署不会因菜单 code 相同而被接管。 */
const parseSameOriginUrl = (path: string, origin: string): URL | null => {
  if (!path || !/^(\/|https?:\/\/|%siteUrl%\/)/i.test(path)) return null;
  try {
    const url = new URL(path.replace(/^%siteUrl%/, origin), origin);
    if (url.origin !== new URL(origin).origin || url.username || url.password)
      return null;
    return url;
  } catch {
    return null;
  }
};

/** 同源或已配置业务域菜单归一到宿主路由，保留深链、查询参数和锚点。 */
export const resolveMicroAppMenuPath = (
  menu: Pick<MenuItemDto, 'code' | 'path' | 'openType'>,
  origin: string = currentOrigin(),
  businessOrigin: string = configuredBusinessOrigin(),
): string | null => {
  if (
    menu.openType !== undefined &&
    menu.openType !== OpenTypeEnum.CurrentTab
  ) {
    return null;
  }
  const path = menu.path || '';
  // dev 菜单仍由后端返回其业务域绝对 URL；只对白名单域做按应用 code 的映射。
  const url =
    parseSameOriginUrl(path, origin) ||
    (businessOrigin ? parseSameOriginUrl(path, businessOrigin) : null);
  if (!url) return null;
  const app = findMicroAppRoute(url.pathname);
  if (!app) return null;
  // 旧外链仅接管已登记的应用菜单；显式站内路由不依赖后台 code 命名。
  const isExplicitLocalPath = /^\/(?!\/)/.test(path);
  if (!isExplicitLocalPath && !app.menuCodes.includes(menu.code || '')) {
    return null;
  }
  const pathname =
    url.pathname.replace(/\/+$/, '') === app.stableEntry
      ? app.path
      : url.pathname.replace(/\/+$/, '') || app.path;
  return `${pathname}${url.search}${url.hash}`;
};

/** 仅当前商业 loopback 业务域可跨 origin 归一；菜单渲染不依赖异步缓存。 */
export function normalizeHostMicroAppMenus(
  menus: MenuItemDto[],
  context: HostAuthContext | null,
  origin: string = currentOrigin(),
): MenuItemDto[] {
  if (!context || context.loadMode !== 'gateway' || !context.gatewayOrigin)
    return menus;
  let businessOrigin: string;
  try {
    const business = new URL(context.businessOrigin);
    const gateway = new URL(context.gatewayOrigin);
    if (
      !/^https?:$/.test(business.protocol) ||
      !/^https?:$/.test(gateway.protocol) ||
      business.username ||
      business.password ||
      gateway.username ||
      gateway.password ||
      gateway.origin !== origin
    )
      return menus;
    businessOrigin = business.origin;
  } catch {
    return menus;
  }
  const normalize = (items: MenuItemDto[]): MenuItemDto[] =>
    items.map((menu) => ({
      ...menu,
      path: resolveMicroAppMenuPath(menu, origin, businessOrigin) ?? menu.path,
      ...(menu.children ? { children: normalize(menu.children) } : {}),
    }));
  return normalize(menus);
}

/**
 * 兼容已缓存的 iframe 入口。只认已登记 code + 可信应用目标，
 * 参数由 URLSearchParams 解码一次，避免损坏文档 query 中的百分号。
 */
export const resolveMicroAppIframePath = (
  path: string,
  origin: string = currentOrigin(),
  businessOrigin: string = configuredBusinessOrigin(),
): string | null => {
  const location = parseSameOriginUrl(path, origin);
  if (!location) return null;
  const match = location.pathname.match(/^\/open-iframe-page\/([^/]+)\/?$/);
  if (!match) return null;
  const app = MICRO_APP_ROUTES.find((item) =>
    item.menuCodes.includes(match[1]),
  );
  if (!app) return null;
  const target = resolveMicroAppMenuPath(
    {
      code: match[1],
      path: location.searchParams.get('url') || '',
      openType: OpenTypeEnum.CurrentTab,
    },
    origin,
    businessOrigin,
  );
  if (!target || findMicroAppRoute(target)?.name !== app.name) return null;
  // 旧入口上的显式刷新标记继续作用于同一应用，锚点和业务 query 保持原样。
  const refresh = location.searchParams.get('_refresh');
  if (!refresh) return target;
  const targetUrl = new URL(target, origin);
  targetUrl.searchParams.set('_refresh', refresh);
  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
};
