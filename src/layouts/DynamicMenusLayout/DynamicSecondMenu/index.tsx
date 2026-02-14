/**
 * 动态二级/三级菜单组件
 * @description 直接复用现有 SecondMenuItem 组件，保持样式一致
 * 支持特殊菜单（主页、工作空间）注入默认内容
 */
import SecondMenuItem from '@/components/base/SecondMenuItem';
import type { MenuItemDto } from '@/types/interfaces/menu';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
// 导入特殊内容组件
import { PATH_URL } from '@/constants/home.constants';
import { OpenTypeEnum } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum, SpaceTypeEnum } from '@/types/enums/space';
import { message } from 'antd';

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
  // 记录用户手动切换的时间戳，用于防止自动展开立即覆盖手动操作
  const lastManualToggleRef = useRef<number>(0);
  // 记录上一次的路径，用于判断路径是否真正变化
  const lastPathnameRef = useRef<string>('');
  // 标记是否已经初始化
  const isInitializedRef = useRef<boolean>(false);
  // 记录上一次的菜单数据长度，用于判断菜单数据是否加载完成
  const lastMenusLengthRef = useRef<number>(0);

  const { getSecondLevelMenus } = useModel('menuModel');

  const { currentSpaceInfo, spaceList } = useModel('spaceModel');
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  // 获取二级菜单
  const secondMenus: MenuItemDto[] = getSecondLevelMenus(parentCode);

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
   * 同一层级的菜单只能展开一个（手风琴效果）
   */
  const toggleExpand = useCallback(
    (code: string) => {
      // 记录手动操作的时间戳
      lastManualToggleRef.current = Date.now();

      setExpandedMenus((prev) => {
        const isExpanded = prev.includes(code);
        if (isExpanded) {
          // 用户手动折叠，记录到 ref 中
          manuallyCollapsedRef.current.add(code);
          return prev.filter((c) => c !== code);
        } else {
          // 用户手动展开，从 ref 中移除（允许自动展开）
          manuallyCollapsedRef.current.delete(code);

          // 查找同一层级的其他菜单
          const menuInfo = findMenuSiblings(secondMenus, code);
          if (menuInfo) {
            // 收集所有同级菜单及其子菜单的 code（不包括当前菜单）
            const codesToCollapse: string[] = [];
            menuInfo.siblings.forEach((sibling) => {
              if (sibling.code !== code) {
                codesToCollapse.push(...getAllDescendantCodes(sibling));
              }
            });

            // 从手动折叠列表中移除所有需要折叠的菜单，允许它们被自动展开
            // 这样即使这些菜单的子菜单被选中，也能被强制折叠
            codesToCollapse.forEach((c) => {
              manuallyCollapsedRef.current.delete(c);
            });

            // 强制移除所有需要折叠的菜单（包括子菜单），即使它们的子菜单被选中
            const newExpanded = prev.filter(
              (c) => !codesToCollapse.includes(c),
            );
            // 展开当前菜单
            if (!newExpanded.includes(code)) {
              newExpanded.push(code);
            }
            return newExpanded;
          }

          // 如果找不到同级菜单，直接添加
          return [...prev, code];
        }
      });
    },
    [secondMenus, findMenuSiblings, getAllDescendantCodes],
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

      // 判断 params 是否为空对象
      const isParamsEmpty = Object.keys(params).length === 0;

      // 如果 params 为空对象，且 path 包含动态参数，且 parentCode 是 workspace
      if (isParamsEmpty && parentCode === 'workspace') {
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

  /**
   * 打开URL
   * @param path 路径
   * @param openType 打开方式
   */
  const handleOpenUrl = (
    path: string,
    openType: OpenTypeEnum = OpenTypeEnum.CurrentTab,
  ) => {
    if (openType === OpenTypeEnum.NewTab) {
      window.open(path, '_blank');
      return;
    }
    history.push(`/open-iframe-page?url=${encodeURIComponent(path)}`, {
      _t: Date.now(),
    });
  };

  // 处理路径URL路径跳转
  const handlePathUrl = (path: string, openType?: OpenTypeEnum) => {
    if (!path) return;
    // http开头的路径，直接打开
    if (path?.includes('http')) {
      handleOpenUrl(path, openType);
      return;
    }
    // 关闭移动端菜单
    handleCloseMobileMenu();
    // 处理动态路径
    const resolvedPath = resolveDynamicPath(path);

    if (!resolvedPath) {
      message.warning('处理路径URL路径跳转失败，请刷新页面重试');
      return;
    }

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
    // 无子菜单，直接路由跳转
    history.push(resolvedPath, { _t: Date.now() });
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
        handlePathUrl(menu?.path || '', menu?.openType);
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
          return regex.test(location.pathname);
        }

        // 使用解析后的路径进行匹配
        targetPath = resolvedPath;
      }

      // 去掉查询参数，只保留路径部分
      const [pathWithoutQuery] = targetPath.split('?');
      const pathname = location.pathname;

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
      for (const menu of menus) {
        const currentPath = menu.path;
        if (!currentPath) {
          // 如果没有路径，继续检查子菜单
          if (menu.children && menu.children.length > 0) {
            const found = findActiveMenuAndParents(menu.children, pathname, [
              ...parentCodes,
              menu.code || '',
            ]);
            if (found) {
              return found;
            }
          }
          continue;
        }

        // 检查当前菜单是否匹配
        let targetPath = currentPath;
        if (targetPath.includes(':')) {
          const resolvedPath = resolveDynamicPath(targetPath);
          if (resolvedPath && !resolvedPath.includes(':')) {
            targetPath = resolvedPath;
          } else if (resolvedPath && resolvedPath.includes(':')) {
            const rawPattern = targetPath.split('?')[0];
            const pattern = rawPattern.replace(/:(\w+)/g, '[^/]+');
            const regex = new RegExp(`^${pattern}(/.*)?$`);
            if (regex.test(pathname)) {
              // 匹配成功，返回所有上级菜单的 code
              return parentCodes;
            }
            // 继续检查子菜单
            if (menu.children && menu.children.length > 0) {
              const found = findActiveMenuAndParents(menu.children, pathname, [
                ...parentCodes,
                menu.code || '',
              ]);
              if (found) {
                return found;
              }
            }
            continue;
          } else {
            // 解析失败，继续检查子菜单
            if (menu.children && menu.children.length > 0) {
              const found = findActiveMenuAndParents(menu.children, pathname, [
                ...parentCodes,
                menu.code || '',
              ]);
              if (found) {
                return found;
              }
            }
            continue;
          }
        }

        const [pathWithoutQuery] = targetPath.split('?');
        if (
          pathname === pathWithoutQuery ||
          pathname.startsWith(pathWithoutQuery + '/')
        ) {
          // 匹配成功，返回所有上级菜单的 code
          return parentCodes;
        }

        // 继续检查子菜单
        if (menu.children && menu.children.length > 0) {
          const found = findActiveMenuAndParents(menu.children, pathname, [
            ...parentCodes,
            menu.code || '',
          ]);
          if (found) {
            return found;
          }
        }
      }
      return null;
    },
    [resolveDynamicPath],
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

    // 判断菜单数据是否刚刚加载完成（从空数组变为有数据）
    const menusJustLoaded =
      lastMenusLengthRef.current === 0 && secondMenus.length > 0;
    lastMenusLengthRef.current = secondMenus.length;

    // 首次初始化时，需要执行自动展开
    const isInitialLoad = !isInitializedRef.current;
    if (isInitialLoad) {
      isInitializedRef.current = true;
    }

    // 只在路径真正变化时才执行自动展开（首次加载和菜单数据刚加载完成除外）
    if (
      !isInitialLoad &&
      !menusJustLoaded &&
      location.pathname === lastPathnameRef.current
    ) {
      return;
    }
    lastPathnameRef.current = location.pathname;

    // 如果用户刚刚手动切换了菜单（500ms 内），延迟执行自动展开
    const timeSinceLastToggle = Date.now() - lastManualToggleRef.current;
    const delay = timeSinceLastToggle < 500 ? 500 - timeSinceLastToggle : 0;

    const timer = setTimeout(() => {
      const parentCodes = findActiveMenuAndParents(
        secondMenus,
        location.pathname,
      );
      if (parentCodes && parentCodes.length > 0) {
        setExpandedMenus((prev) => {
          const newExpanded = [...prev];
          parentCodes.forEach((code) => {
            // 只有当菜单不在手动折叠列表中时，才自动展开
            if (
              !newExpanded.includes(code) &&
              !manuallyCollapsedRef.current.has(code)
            ) {
              // 查找同一层级的其他菜单，先折叠它们
              const menuInfo = findMenuSiblings(secondMenus, code);
              if (menuInfo) {
                // 收集所有同级菜单及其子菜单的 code
                const siblingsCodesToCollapse: string[] = [];
                menuInfo.siblings.forEach((sibling) => {
                  if (sibling.code !== code) {
                    siblingsCodesToCollapse.push(
                      ...getAllDescendantCodes(sibling),
                    );
                  }
                });

                // 移除同一层级的其他菜单及其子菜单
                siblingsCodesToCollapse.forEach((siblingCode) => {
                  const index = newExpanded.indexOf(siblingCode);
                  if (index > -1) {
                    newExpanded.splice(index, 1);
                  }
                });
              }
              // 展开当前菜单
              newExpanded.push(code);
            }
          });
          return newExpanded;
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    location.pathname,
    secondMenus,
    findActiveMenuAndParents,
    findMenuSiblings,
    getAllDescendantCodes,
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
      const menuActive = isActive(menu.path);
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
            icon={menu.icon}
            name={menu.name}
            style={{ marginLeft: indent }}
            isActive={menuActive}
            onClick={() => {
              // 处理路径URL路径跳转
              handlePathUrl(menu?.path || '', menu?.openType);
            }}
          />
        );
      }

      // 如果有子菜单，使用 SecondMenuItem 组件，并递归渲染子菜单
      return (
        <div key={menuCode} className="flex flex-col gap-4">
          <SecondMenuItem
            icon={menu.icon}
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
    ],
  );

  // 如果没有二级菜单，不渲染
  if (!secondMenus.length) {
    return null;
  }

  return (
    <div className={'flex flex-col gap-4 overflow-hide'}>
      {secondMenus.map((menu: MenuItemDto) => renderMenuItem(menu))}
    </div>
  );
};

export default DynamicSecondMenu;
