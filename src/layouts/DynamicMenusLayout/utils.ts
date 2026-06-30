import { PATH_URL } from '@/constants/home.constants';
import { MENU_PATH_NORMALIZATION_MAP } from '@/constants/menus.constants';
import { OpenTypeEnum } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import { MenuItemDto } from '@/types/interfaces/menu';
import { history } from 'umi';

/**
 * 修改或保存当前路径到本地缓存
 * @param parentCode 父级菜单的 code
 * @param resolvedPath 处理后的路径
 */
export const updatePathUrlToLocalStorage = (
  parentCode: string,
  resolvedPath: string,
) => {
  try {
    const pathUrl = localStorage.getItem(PATH_URL);
    if (pathUrl) {
      const pathUrlObj = JSON.parse(pathUrl);
      pathUrlObj[parentCode] = resolvedPath;

      // 存储当前路径
      localStorage.setItem(PATH_URL, JSON.stringify(pathUrlObj));
    } else {
      const pathUrlObj = {
        [parentCode]: resolvedPath,
      };
      // 存储当前路径
      localStorage.setItem(PATH_URL, JSON.stringify(pathUrlObj));
    }
  } catch {}
};

/**
 * 从本地缓存中删除指定一级菜单的路径记录
 * @param parentCode 父级菜单的 code
 */
export const removePathUrlFromLocalStorage = (parentCode: string) => {
  try {
    const pathUrl = localStorage.getItem(PATH_URL);
    if (!pathUrl) return;

    const pathUrlObj = JSON.parse(pathUrl);
    if (!(parentCode in pathUrlObj)) return;

    delete pathUrlObj[parentCode];
    localStorage.setItem(PATH_URL, JSON.stringify(pathUrlObj));
  } catch {}
};

/**
 * 是否为应用内 iframe 菜单（http 链接且非新标签页打开）
 */
export const isInAppIframeMenu = (menu: MenuItemDto): boolean => {
  const { openType = OpenTypeEnum.CurrentTab, path = '' } = menu;
  return !!path && path.includes('http') && openType !== OpenTypeEnum.NewTab;
};

/**
 * 构建 open-iframe-page 路由路径
 */
export const buildOpenIframePath = (menu: MenuItemDto): string => {
  const { path = '', code } = menu;
  return `/open-iframe-page/${code}?url=${encodeURIComponent(path)}`;
};

/**
 * 解析 open-iframe-page 路由中的 menuCode 与目标 url
 */
export const parseOpenIframeLocation = (
  pathname: string,
  search: string,
): { menuCode: string; url: string } | null => {
  const match = pathname.match(/\/open-iframe-page\/([^/?]+)/);
  if (!match) return null;
  const urlParam = new URLSearchParams(search).get('url');
  if (!urlParam) return null;
  return {
    menuCode: match[1],
    url: decodeURIComponent(urlParam),
  };
};

/** 是否为 open-iframe-page 路由路径 */
export const isOpenIframePath = (path: string): boolean =>
  path.includes('/open-iframe-page/');

/** 当前页面是否已打开指定菜单的应用内 iframe */
export const isCurrentOpenIframePage = (menu: MenuItemDto): boolean => {
  if (!isInAppIframeMenu(menu)) return false;
  const parsed = parseOpenIframeLocation(
    history.location.pathname,
    history.location.search,
  );
  if (!parsed) return false;
  return parsed.menuCode === menu.code && parsed.url === menu.path;
};

/** 当前页面是否已打开指定 open-iframe-page 路径 */
export const isCurrentOpenIframePath = (path: string): boolean => {
  if (!isOpenIframePath(path)) return false;
  const [pathname, query = ''] = path.split('?');
  const target = parseOpenIframeLocation(pathname, query ? `?${query}` : '');
  const current = parseOpenIframeLocation(
    history.location.pathname,
    history.location.search,
  );
  if (!target || !current) return false;
  return target.menuCode === current.menuCode && target.url === current.url;
};

/** 追加刷新参数，用于重复点击时强制 iframe 重载 */
const appendRefreshParam = (path: string): string => {
  const [basePath, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.delete('_refresh');
  params.set('_refresh', String(Date.now()));
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

/** 刷新 open-iframe-page（不新增历史记录） */
export const refreshOpenIframePath = (path: string): void => {
  history.replace(appendRefreshParam(path));
};

/**
 * 跳转或刷新 open-iframe-page
 * 已在同一 iframe 页面时仅刷新
 */
export const navigateOpenIframePath = (
  path: string,
  state?: Record<string, unknown>,
): void => {
  if (isCurrentOpenIframePath(path)) {
    refreshOpenIframePath(path);
    return;
  }
  history.push(path, { _t: Date.now(), ...state });
};

/**
 * 打开URL
 * @param path 路径
 * @param openType 打开方式
 * @param parentCode 父级菜单的 code, 如果存在，则将当前路径保存到本地缓存中
 */
export const handleOpenUrl = (menu: MenuItemDto, parentCode?: string) => {
  const { openType = OpenTypeEnum.CurrentTab, path = '' } = menu;
  if (openType === OpenTypeEnum.NewTab) {
    window.open(path, '_blank');
    return;
  }
  const resolvedPath = buildOpenIframePath(menu);
  if (parentCode) {
    updatePathUrlToLocalStorage(parentCode, resolvedPath);
  }
  if (isCurrentOpenIframePage(menu)) {
    refreshOpenIframePath(resolvedPath);
    return;
  }
  history.push(resolvedPath, {
    _t: Date.now(),
  });
};

export const normalizeMenuPathname = (pathname: string): string => {
  // 1. 优先进行静态精确匹配
  if (MENU_PATH_NORMALIZATION_MAP[pathname]) {
    return MENU_PATH_NORMALIZATION_MAP[pathname];
  }

  // 2. 支持通过动态正则配置进行替换（key 以 ^ 开头的项）
  for (const [pattern, replacement] of Object.entries(
    MENU_PATH_NORMALIZATION_MAP,
  )) {
    if (pattern.startsWith('^')) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(pathname)) {
          return pathname.replace(regex, replacement);
        }
      } catch (error) {
        console.error(
          `Invalid regexp pattern in MENU_PATH_NORMALIZATION_MAP: ${pattern}`,
          error,
        );
      }
    }
  }

  return pathname;
};
