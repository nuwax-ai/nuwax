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
 * 打开URL
 * @param path 路径
 * @param openType 打开方式
 * @param parentCode 父级菜单的 code, 如果存在，则将当前路径保存到本地缓存中
 */
export const handleOpenUrl = (menu: MenuItemDto, parentCode?: string) => {
  const { openType = OpenTypeEnum.CurrentTab, path = '', code } = menu;
  if (openType === OpenTypeEnum.NewTab) {
    window.open(path, '_blank');
    return;
  }
  // 处理路径
  const resolvedPath = `/open-iframe-page/${code}?url=${encodeURIComponent(
    path,
  )}`;
  if (parentCode) {
    updatePathUrlToLocalStorage(parentCode, resolvedPath);
  }
  history.push(resolvedPath, {
    _t: Date.now(),
  });
};

/**
 * 规范化/归一化子路由路径，以处理特定详情/编辑子路由高亮对应列表菜单的需求
 * @param pathname 当前路径
 * @returns 规范化后的路径
 */
export const normalizeMenuPathname = (pathname: string): string => {
  return MENU_PATH_NORMALIZATION_MAP[pathname] || pathname;
};
