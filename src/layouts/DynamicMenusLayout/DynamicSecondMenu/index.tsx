/**
 * 动态二级/三级菜单组件
 * @description 直接复用现有 SecondMenuItem 组件，保持样式一致
 * 支持特殊菜单（主页、工作空间）注入默认内容
 */
import SecondMenuItem from '@/components/base/SecondMenuItem';
import { dict } from '@/services/i18nRuntime';
import type { MenuItemDto } from '@/types/interfaces/menu';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
// 导入特殊内容组件
import { PATH_URL } from '@/constants/home.constants';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum, SpaceTypeEnum } from '@/types/enums/space';
import { message } from 'antd';
import {
  handleOpenUrl,
  isOpenIframePath,
  navigateOpenIframePath,
  normalizeMenuPathname,
  updatePathUrlToLocalStorage,
} from '../utils';

export interface DynamicSecondMenuProps {
  /** 父级菜单的 code */
  parentCode: string;
}

/**
 * 动态二级/三级菜单组件
 * 复用现有的 SecondMenuItem 组件实现，保持 UI 样式一致
 * 特殊处理：主页显示最近使用+会话记录，工作空间显示最近编辑+开发收藏
 */
const DynamicSecondMenu: React.FC<DynamicSecondMenuProps> = ({
  parentCode,
}) => {
  const location = useLocation();
  const params = useParams();

  // 展开的菜单 code 列表
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  // 记录用户手动折叠的菜单（用于防止自动展开覆盖用户操作）
  const manuallyCollapsedRef = useRef<Set<string>>(new Set());
  // 记录上一次的路径，用于判断路径是否真正变化
  const lastPathnameRef = useRef<string>('');
  // 标记是否已经初始化
  const isInitializedRef = useRef<boolean>(false);

  // ================================ Model数据 ================================

  // 获取空间信息
  const { currentSpaceInfo, spaceList } = useModel('spaceModel');

  // 关闭移动端菜单, 用于关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  // 获取二级菜单方法
  const { getSecondLevelMenus } = useModel('menuModel');

  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 获取二级菜单, 用于渲染菜单
  const secondMenus: MenuItemDto[] = getSecondLevelMenus(parentCode);

  // 是否开启订阅功能
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;

  /**
   * 查找菜单的父菜单和同级菜单
   * @param menus 菜单列表
   * @param targetCode 目标菜单的 code
   * @param parentMenu 父菜单（用于递归传递）
   * @returns 返回父菜单和同级菜单列表，如果没找到返回 null
   */
  const findMenuSiblings = useCallback(
    (
      menus: MenuItemDto[],
      targetCode: string,
      parentMenu: MenuItemDto | null = null,
    ): { parentMenu: MenuItemDto | null; siblings: MenuItemDto[] } | null => {
      for (const menu of menus) {
        if (menu.code === targetCode) {
          // 找到目标菜单，返回父菜单和同级菜单
          return {
            parentMenu,
            siblings: parentMenu ? parentMenu.children || [] : menus,
          };
        }
        // 递归查找子菜单
        if (menu.children && menu.children.length > 0) {
          const found = findMenuSiblings(menu.children, targetCode, menu);
          if (found) {
            return found;
          }
        }
      }
      return null;
    },
    [],
  );

  /**
   * 递归收集所有拥有子菜单的菜单 code（用于初始化时默认展开）
   */
  const collectParentCodes = useCallback((menus: MenuItemDto[]): string[] => {
    const codes: string[] = [];
    for (const menu of menus) {
      if (menu.children && menu.children.length > 0 && menu.code) {
        codes.push(menu.code);
        codes.push(...collectParentCodes(menu.children));
      }
    }
    return codes;
  }, []);

  /**
   * 递归收集菜单及其所有子菜单的 code
   */
  const getAllDescendantCodes = useCallback((menu: MenuItemDto): string[] => {
    const codes: string[] = [];
    if (menu.code) {
      codes.push(menu.code);
    }
    if (menu.children && menu.children.length > 0) {
      menu.children.forEach((child) => {
        codes.push(...getAllDescendantCodes(child));
      });
    }
    return codes;
  }, []);

  /**
   * 切换展开状态
   * workspace 下独立控制，其他场景保持手风琴互斥
   */
  const toggleExpand = useCallback(
    (code: string) => {
      setExpandedMenus((prev) => {
        const isExpanded = prev.includes(code);
        if (isExpanded) {
          manuallyCollapsedRef.current.add(code);
          return prev.filter((c) => c !== code);
        } else {
          manuallyCollapsedRef.current.delete(code);

          // workspace：独立展开，不折叠其他菜单
          if (parentCode === 'workspace') {
            if (prev.includes(code)) return prev;
            return [...prev, code];
          }

          // 其他场景：手风琴互斥，折叠同级菜单
          const menuInfo = findMenuSiblings(secondMenus, code);
          if (menuInfo) {
            const codesToCollapse: string[] = [];
            menuInfo.siblings.forEach((sibling) => {
              if (sibling.code !== code) {
                codesToCollapse.push(...getAllDescendantCodes(sibling));
              }
            });
            codesToCollapse.forEach((c) => {
              manuallyCollapsedRef.current.delete(c);
            });
            const newExpanded = prev.filter(
              (c) => !codesToCollapse.includes(c),
            );
            if (!newExpanded.includes(code)) {
              newExpanded.push(code);
            }
            return newExpanded;
          }

          return [...prev, code];
        }
      });
    },
    [parentCode, secondMenus, findMenuSiblings, getAllDescendantCodes],
  );

  /**
   * 从路径中提取 spaceId
   * 例如：从 /space/42/develop 中提取 42
   */
  const extractSpaceIdFromPath = useCallback((path: string): string | null => {
    if (!path) return null;
    // 去掉查询参数
    const cleanPath = path.split('?')[0];
    // 匹配 /space/{spaceId}/... 格式
    const match = cleanPath.match(/\/space\/([^/]+)/);
    return match ? match[1] : null;
  }, []);

  /**
   * 处理动态路径，从当前路由参数中提取值并替换路径中的动态参数
   * @param path 包含动态参数的路径，如 /space/:spaceId/develop
   * @returns 替换后的路径，如 /space/123/develop
   */
  const resolveDynamicPath = useCallback(
    (path: string): string => {
      if (!path || !path.includes(':')) {
        // 没有动态参数，直接返回
        return path;
      }

      // 如果 parentCode 是 workspace (工作空间)
      if (parentCode === 'workspace') {
        let spaceId: string | null = null;

        try {
          // 从缓存中获取 workspace 的路径
          const pathUrl = localStorage.getItem(PATH_URL);
          if (pathUrl) {
            const pathUrlObj = JSON.parse(pathUrl) as Record<string, string>;
            const workspacePath = pathUrlObj['workspace'];
            if (workspacePath) {
              spaceId = extractSpaceIdFromPath(workspacePath);
            }
          } else {
            spaceId = params?.spaceId;
          }
        } catch {
          // 忽略缓存解析错误
        }

        // 如果缓存中没有找到 spaceId，从空间列表中获取第一个空间的 id
        if (!spaceId && spaceList && spaceList.length > 0) {
          spaceId = String(spaceList[0].id);
        }

        // 如果找到了 spaceId，替换 path 中的 :spaceId
        if (spaceId) {
          return path.replace(/:spaceId/g, spaceId);
        }
      }

      let resolvedPath: string = '';

      // 提取路径中的所有动态参数（如 :spaceId, :agentId）
      // 使用 match 方法获取所有匹配项
      const paramMatches = path.matchAll(/:(\w+)/g);
      const matchesArray = Array.from(paramMatches);

      // 遍历所有匹配的动态参数
      matchesArray.forEach((match) => {
        const paramName = match[1]; // 参数名，如 spaceId
        const paramValue = params[paramName]; // 从当前路由参数中获取值

        if (paramValue) {
          // 替换路径中的动态参数
          resolvedPath = path.replace(`:${paramName}`, String(paramValue));
        }
      });

      return resolvedPath;
    },
    [params, parentCode, spaceList, extractSpaceIdFromPath],
  );

  // 处理路径URL路径跳转
  const handlePathUrl = (menu: MenuItemDto) => {
    const { path = '' } = menu;
    // http开头的路径，直接打开
    if (path?.includes('http')) {
      handleOpenUrl(menu, parentCode);
      return;
    }
    // 关闭移动端菜单
    handleCloseMobileMenu();
    // 处理动态路径
    const resolvedPath = resolveDynamicPath(path);

    if (!resolvedPath) {
      message.warning(
        dict(
          'PC.Layouts.DynamicMenusLayout.DynamicSecondMenu.pathResolveFailed',
        ),
      );
      return;
    }

    // 修改或保存当前路径到本地缓存
    updatePathUrlToLocalStorage(parentCode, resolvedPath);

    // 无子菜单，直接路由跳转（应用内 iframe 重复点击时刷新）
    if (isOpenIframePath(resolvedPath)) {
      navigateOpenIframePath(resolvedPath, { menuCode: menu.code });
      return;
    }
    history.push(resolvedPath, { _t: Date.now(), menuCode: menu.code });
  };

  /**
   * 点击菜单项
   * - 有子菜单：仅展开/折叠，不导航
   * - 无子菜单：直接路由跳转
   */
  const handleMenuClick = useCallback(
    (menu: MenuItemDto) => {
      const hasChildren = menu.children && menu.children.length > 0;

      if (hasChildren) {
        // 有子菜单，仅切换展开状态
        toggleExpand(menu.code as string);
      }
      if (menu?.path) {
        // 无子菜单，处理路径URL路径跳转
        handlePathUrl(menu);
      }
    },
    [toggleExpand, handlePathUrl],
  );

  /**
   * 判断菜单是否激活
   * 支持动态路径匹配，如果路径包含动态参数或查询参数，会先解析并去掉查询串再比较
   *
   * 例如：
   * - 配置路径：/space/:spaceId/space-square?activeKey=Agent
   * - 解析后： /space/42/space-square?activeKey=Agent
   * - 实际 pathname：/space/42/space-square
   * 需要在比较前去掉 ? 及其后的查询参数
   */
  const isActive = useCallback(
    (path?: string) => {
      if (!path) return false;

      let targetPath = path;

      // 如果路径包含 ?url=，则直接比较路径,说明是应用内打开的外部链接
      if (location.search?.includes('?url=')) {
        let activePath = location.search.split('?url=')[1];
        return targetPath === decodeURIComponent(activePath);
      }

      const pathname = normalizeMenuPathname(location.pathname);

      // 如果路径包含动态参数，先解析路径
      if (targetPath.includes(':')) {
        const resolvedPath = resolveDynamicPath(targetPath);

        if (!resolvedPath) return false;

        // 如果解析后仍然包含 ':'，说明有参数未找到，使用正则表达式匹配
        if (resolvedPath.includes(':')) {
          // 只取路径部分（去掉查询参数），例如 /space/:spaceId/develop
          const rawPattern = targetPath.split('?')[0];
          // 将动态路径转换为正则表达式进行匹配
          const pattern = rawPattern.replace(/:(\w+)/g, '[^/]+');
          const regex = new RegExp(`^${pattern}(/.*)?$`);
          return regex.test(pathname);
        }

        // 使用解析后的路径进行匹配
        targetPath = resolvedPath;
      }

      // 去掉查询参数，只保留路径部分
      const [pathWithoutQuery] = targetPath.split('?');

      // 特殊处理：进入个人积分明细页面 (/more-page/credit-records) 时，让“我的订阅”菜单项保持高亮
      if (
        pathname === '/more-page/credit-records' &&
        pathWithoutQuery === '/more-page/my-subscriptions'
      ) {
        return true;
      }

      // 特殊处理：进入 API 日志页面 (/more-page/api-key-logs) 时，让“API KEY”菜单项保持高亮
      if (
        pathname === '/more-page/api-key-logs' &&
        pathWithoutQuery === '/more-page/api-key'
      ) {
        return true;
      }

      // 精确匹配或前缀匹配
      return (
        pathname === pathWithoutQuery ||
        pathname.startsWith(pathWithoutQuery + '/')
      );
    },
    [location.pathname, resolveDynamicPath],
  );

  /**
   * 递归查找匹配的菜单及其所有上级菜单的 code
   * @param menus 菜单列表
   * @param pathname 当前路径
   * @param parentCodes 上级菜单的 code 列表（用于递归传递）
   * @returns 匹配的菜单及其所有上级菜单的 code 列表
   */
  const findActiveMenuAndParents = useCallback(
    (
      menus: MenuItemDto[],
      pathname: string,
      parentCodes: string[] = [],
    ): string[] | null => {
      const normalizedPathname = normalizeMenuPathname(pathname);

      const stripQueryAndHash = (value: string): string => {
        // 只用于“匹配判断”，不做业务跳转，因此直接去掉 ? 和 #
        return value.split('#')[0].split('?')[0];
      };

      const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

      const safeGetUrlPathname = (value: string): string | null => {
        try {
          return new URL(value).pathname;
        } catch {
          return null;
        }
      };

      /**
       * 将传入 of the pathname 归一化成：
       * - 若是完整 URL：同时保留 full（去 query/hash 后）和 path（URL.pathname）
       * - 若不是 URL：直接将 cleaned 作为 path
       */
      const normalizeTarget = (
        value: string,
      ): {
        cleaned: string;
        path: string;
        isUrl: boolean;
      } => {
        const cleaned = stripQueryAndHash(value);
        const targetIsUrl = isHttpUrl(cleaned);
        if (targetIsUrl) {
          const path = safeGetUrlPathname(cleaned) ?? cleaned;
          return { cleaned, path, isUrl: true };
        }
        return { cleaned, path: cleaned, isUrl: false };
      };

      const target = normalizeTarget(normalizedPathname);

      const appendCodeIfNeeded = (codes: string[], code?: string) => {
        if (!code) return codes;
        return [...codes, code];
      };

      for (const menu of menus) {
        const currentPath = menu.path;
        const nextParentCodes = appendCodeIfNeeded(parentCodes, menu.code);

        if (!currentPath) {
          // 如果没有路径，继续检查子菜单
          if (menu.children && menu.children.length > 0) {
            const found = findActiveMenuAndParents(
              menu.children,
              pathname,
              nextParentCodes,
            );
            if (found) return found;
          }
          continue;
        }

        const rawMenuPath = stripQueryAndHash(currentPath);

        // 1) menu.path 是完整 URL：做“完全匹配”（如果 target 也是 URL）
        if (isHttpUrl(rawMenuPath)) {
          if (target.isUrl) {
            if (target.cleaned === rawMenuPath) return nextParentCodes;
          } else {
            // target 不是 URL，但 menu 是 URL：比较 pathname 部分
            const menuUrlPath = safeGetUrlPathname(rawMenuPath);
            if (menuUrlPath && menuUrlPath === target.path)
              return nextParentCodes;
          }
          // URL 未匹配，继续检查子菜单
          if (menu.children && menu.children.length > 0) {
            const found = findActiveMenuAndParents(
              menu.children,
              pathname,
              nextParentCodes,
            );
            if (found) return found;
          }
          continue;
        }

        // 2) menu.path 不是 URL：支持动态占位符（只识别 /:param 这种占位符）
        const hasDynamicPlaceholder = /(^|\/):\w+/.test(rawMenuPath);
        if (hasDynamicPlaceholder) {
          // 将 :param 替换成 [^/]+，并支持 /xxx/... 前缀扩展
          const escaped = rawMenuPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regexStr =
            '^' + escaped.replace(/:(\w+)/g, '[^/]+') + '(/.*)?$';
          const regex = new RegExp(regexStr);

          if (regex.test(target.path)) return nextParentCodes;

          if (menu.children && menu.children.length > 0) {
            const found = findActiveMenuAndParents(
              menu.children,
              pathname,
              nextParentCodes,
            );
            if (found) return found;
          }
          continue;
        }

        // 3) menu.path 普通路径：支持精确匹配或前缀匹配
        if (
          (target.path === '/more-page/credit-records' &&
            rawMenuPath === '/more-page/my-subscriptions') ||
          (target.path === '/more-page/api-key-logs' &&
            rawMenuPath === '/more-page/api-key') ||
          target.path === rawMenuPath ||
          target.path.startsWith(rawMenuPath + '/')
        ) {
          return nextParentCodes;
        }

        // 继续检查子菜单
        if (menu.children && menu.children.length > 0) {
          const found = findActiveMenuAndParents(
            menu.children,
            pathname,
            nextParentCodes,
          );
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  /**
   * 当路径变化时，自动展开匹配菜单的所有上级菜单
   * 但不会覆盖用户手动折叠的菜单
   * 同时遵循同一层级只能展开一个的规则
   * 只在路径真正变化时才执行，避免频繁执行覆盖用户操作
   */
  useEffect(() => {
    // 如果菜单数据还没有加载完成，不执行自动展开
    if (!secondMenus || secondMenus.length === 0) {
      return;
    }

    const isFirstInit = !isInitializedRef.current;

    // 只在路径真正变化时才执行自动展开（首次加载和菜单数据刚加载完成除外）
    if (
      isInitializedRef.current &&
      location.pathname === lastPathnameRef.current
    ) {
      return;
    }
    isInitializedRef.current = true;
    lastPathnameRef.current = location.pathname;

    // workspace：首次初始化时，默认展开所有有子菜单的菜单项
    if (isFirstInit && parentCode === 'workspace') {
      const allParentCodes = collectParentCodes(secondMenus).filter(
        (code) => !manuallyCollapsedRef.current.has(code),
      );
      setExpandedMenus((prev) => {
        const newExpanded = [...prev];
        allParentCodes.forEach((code) => {
          if (!newExpanded.includes(code)) {
            newExpanded.push(code);
          }
        });
        return newExpanded;
      });
    }

    // 是否是应用内打开的iframe页面
    const isIframePage = location.pathname?.includes('/open-iframe-page');

    // 当前路径, 用于匹配菜单
    let targetPath = normalizeMenuPathname(location.pathname);
    // 如果当前页面是应用内打开 of the iframe页面，且路径包含 ?url=，则直接比较路径（应用内打开的外部链接），则获取iframe页面的路径
    if (isIframePage && location.search?.includes('?url=')) {
      const activePath = location.search.split('?url=')[1];
      targetPath = decodeURIComponent(activePath);
    }
    // 查找匹配的菜单及其所有上级菜单的 code
    const parentCodes = findActiveMenuAndParents(secondMenus, targetPath);

    if (parentCodes && parentCodes.length > 0) {
      setExpandedMenus((prev) => {
        const newExpanded = [...prev];
        parentCodes.forEach((code) => {
          if (
            !newExpanded.includes(code) &&
            !manuallyCollapsedRef.current.has(code)
          ) {
            // workspace：只追加展开，不折叠其他菜单
            if (parentCode === 'workspace') {
              newExpanded.push(code);
            } else {
              // 其他场景：手风琴互斥，折叠同级菜单
              const menuInfo = findMenuSiblings(secondMenus, code);
              if (menuInfo) {
                const siblingsCodesToCollapse: string[] = [];
                menuInfo.siblings.forEach((sibling) => {
                  if (sibling.code !== code) {
                    siblingsCodesToCollapse.push(
                      ...getAllDescendantCodes(sibling),
                    );
                  }
                });
                siblingsCodesToCollapse.forEach((siblingCode) => {
                  const index = newExpanded.indexOf(siblingCode);
                  if (index > -1) {
                    newExpanded.splice(index, 1);
                  }
                });
              }
              newExpanded.push(code);
            }
          }
        });
        return newExpanded;
      });
    }
  }, [
    location.pathname,
    secondMenus,
    findActiveMenuAndParents,
    findMenuSiblings,
    getAllDescendantCodes,
    collectParentCodes,
  ]);

  /**
   * 递归渲染菜单项
   * @param menu 菜单项数据
   * @param level 菜单层级（从0开始，用于缩进）
   * @param isFirst 是否是同级第一个
   * @returns 渲染的菜单项
   */
  const renderMenuItem = useCallback(
    (menu: MenuItemDto, level: number = 0): React.ReactNode => {
      const hasChildren = menu.children && menu.children.length > 0;
      const menuCode = menu.code || '';
      const isExpanded = expandedMenus.includes(menuCode);
      let menuActive = false;

      // iframe 场景：根据 URL 上的 menuCode，在「当前菜单及其子菜单」中递归查找是否存在
      if (
        location.pathname.includes('/open-iframe-page') &&
        !!params?.menuCode
      ) {
        menuActive = params.menuCode === menu.code;
      } else {
        // 普通场景：根据路径判断是否激活
        menuActive = isActive(menu.path);
      }
      // 根据层级计算缩进
      // 如果没有上级（level === 0），indent 不变
      // 如果有上级（level > 0 且 level < 4），indent = level * 16 + 10
      // 如果层级为第4级及以上（level >= 4），不缩进，使用第3级的缩进值
      const indent =
        level === 0
          ? 0
          : level >= 4
          ? 3 * 16 + 10 // 第3级的缩进值：58
          : level * 16 + 11;

      // 个人空间时，不显示"成员与设置"(编码：member_setting) , 普通用户也不显示"成员与设置"
      if (
        (currentSpaceInfo?.type === SpaceTypeEnum.Personal ||
          currentSpaceInfo?.currentUserRole === RoleEnum.User) &&
        menuCode === 'member_setting'
      ) {
        return null;
      }

      // “开发者功能”【tips：关闭后，用户将无法看见“智能体开发”和“组件库”(编码：agent_dev, component_lib_dev)，创建者和管理员不受影响】
      if (
        currentSpaceInfo?.currentUserRole === RoleEnum.User &&
        currentSpaceInfo?.allowDevelop === AllowDevelopEnum.Not_Allow &&
        (menuCode === 'agent_dev' || menuCode === 'component_lib_dev')
      ) {
        return null;
      }

      // 如果没有子菜单，使用 SubItem 组件
      if (!hasChildren) {
        return (
          <SecondMenuItem.SubItem
            key={menuCode}
            icon={level === 0 ? menu.icon : undefined}
            name={menu.name}
            style={{ marginLeft: indent }}
            isActive={menuActive}
            onClick={() => {
              // 处理路径URL路径跳转
              handlePathUrl(menu);
            }}
          />
        );
      }

      // 如果有子菜单，使用 SecondMenuItem 组件，并递归渲染子菜单
      return (
        <div key={menuCode} className="flex flex-col gap-4">
          <SecondMenuItem
            icon={level === 0 ? menu.icon : undefined}
            name={menu.name}
            style={{ marginLeft: indent }}
            isActive={menuActive}
            isDown={true} // 有子菜单时显示折叠展开图标
            isOpen={isExpanded}
            onClick={() => handleMenuClick(menu)}
            onToggle={() => toggleExpand(menuCode)}
          />
          {/* 递归渲染子菜单 */}
          {isExpanded &&
            menu.children?.map((child) => renderMenuItem(child, level + 1))}
        </div>
      );
    },
    [
      expandedMenus,
      isActive,
      handleMenuClick,
      handlePathUrl,
      toggleExpand,
      currentSpaceInfo,
      location,
    ],
  );

  // 如果没有二级菜单，不渲染
  if (!secondMenus.length) {
    return null;
  }

  // 如果未开启订阅功能，则不渲染订阅相关的菜单
  if (parentCode === 'workspace' && !isEnableSubscription) {
    return (
      <div className={'flex flex-col gap-4 overflow-hide'}>
        {secondMenus
          ?.filter((menu: MenuItemDto) => menu.code !== 'resource_pricing')
          ?.map((menu: MenuItemDto) => renderMenuItem(menu))}
      </div>
    );
  }

  return (
    <div className={'flex flex-col gap-4 overflow-hide'}>
      {secondMenus.map((menu: MenuItemDto) => renderMenuItem(menu))}
    </div>
  );
};

export default DynamicSecondMenu;
