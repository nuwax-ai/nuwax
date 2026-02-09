/**
 * 动态二级/三级菜单组件
 * @description 直接复用现有 SecondMenuItem 组件，保持样式一致
 * 支持特殊菜单（主页、工作空间）注入默认内容
 */
import SecondMenuItem from '@/components/base/SecondMenuItem';
import SvgIcon from '@/components/base/SvgIcon';
import type { MenuItemDto } from '@/types/interfaces/menu';
import React, { useCallback, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
// 导入特殊内容组件
import EcosystemMarketSection from '@/layouts/MenusLayout/EcosystemMarketSection';
import HomeSection from '@/layouts/MenusLayout/HomeSection';
import SquareSection from '@/layouts/MenusLayout/SquareSection';

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
  const { getSecondLevelMenus } = useModel('menuModel');
  // 展开的菜单 code 列表
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // 获取二级菜单
  const secondMenus: MenuItemDto[] = getSecondLevelMenus(parentCode);

  /**
   * 切换展开状态
   */
  const toggleExpand = useCallback((code: string) => {
    setExpandedMenus((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }, []);

  /**
   * 处理动态路径，从当前路由参数中提取值并替换路径中的动态参数
   * @param path 包含动态参数的路径，如 /space/:spaceId/develop
   * @returns 替换后的路径，如 /space/123/develop
   */
  const resolveDynamicPath = useCallback(
    (path: string): string => {
      if (!path.includes(':')) {
        // 没有动态参数，直接返回
        return path;
      }

      let resolvedPath = path;

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
          resolvedPath = resolvedPath.replace(
            `:${paramName}`,
            String(paramValue),
          );
        } else {
          // 如果找不到对应的参数值，保持原样或返回原路径
          console.warn(
            `[DynamicSecondMenu] 无法从路由参数中找到 ${paramName}，路径: ${path}`,
          );
        }
      });

      return resolvedPath;
    },
    [params],
  );

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
      } else if (menu.path) {
        // 处理动态路径
        const resolvedPath = resolveDynamicPath(menu.path);
        // 无子菜单，直接路由跳转
        history.push(resolvedPath);
      }
    },
    [toggleExpand, resolveDynamicPath],
  );

  /**
   * 判断菜单是否激活
   */
  const isActive = useCallback(
    (path?: string) => {
      if (!path) return false;
      // 精确匹配或前缀匹配
      return (
        location.pathname === path || location.pathname.startsWith(path + '/')
      );
    },
    [location.pathname],
  );

  /**
   * 判断是否有任何子菜单激活
   */
  const hasActiveChild = useCallback(
    (menu: MenuItemDto): boolean => {
      if (!menu.children?.length) return false;
      return menu.children.some(
        (child) =>
          isActive(child.path) ||
          (child.children?.length && hasActiveChild(child)),
      );
    },
    [isActive],
  );

  /**
   * 渲染特殊内容区域
   */
  // 主页、系统广场、生态市场特殊处理：直接渲染对应的 Section 组件
  if (
    parentCode === 'homepage' ||
    parentCode === 'system_square' ||
    parentCode === 'eco_market'
  ) {
    // 主页 homepage: 最近使用 + 会话记录
    if (parentCode === 'homepage') {
      return <HomeSection />;
    }

    // 系统广场
    if (parentCode === 'system_square') {
      return <SquareSection />;
    }

    // 生态市场
    if (parentCode === 'eco_market') {
      return <EcosystemMarketSection />;
    }
  }

  // 如果没有二级菜单，不渲染
  if (!secondMenus.length) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {secondMenus.map((menu: MenuItemDto, index: number) => {
        const isExpanded = expandedMenus.includes(menu.code || '');
        const menuActive = isActive(menu.path) || hasActiveChild(menu);
        const hasChildren = menu.children && menu.children.length > 0;

        return (
          <div key={menu.code}>
            {/* 二级菜单项 */}
            <SecondMenuItem
              icon={menu.icon ? <SvgIcon name={menu.icon} /> : undefined}
              name={menu.name}
              isFirst={index === 0}
              isActive={menuActive}
              isDown={hasChildren}
              isOpen={isExpanded}
              onClick={() => handleMenuClick(menu)}
              onToggle={() => toggleExpand(menu.code || '')}
            />

            {/* 三级菜单 */}
            {hasChildren && isExpanded && (
              <div style={{ marginLeft: 0 }}>
                {menu.children?.map((child, childIndex) => (
                  <SecondMenuItem.SubItem
                    key={child.code}
                    icon={
                      child.icon ? <SvgIcon name={child.icon} /> : undefined
                    }
                    name={child.name}
                    isFirst={childIndex === 0}
                    isActive={isActive(child.path)}
                    onClick={() => {
                      if (child.path) {
                        // 处理动态路径
                        const resolvedPath = resolveDynamicPath(child.path);
                        history.push(resolvedPath);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DynamicSecondMenu;
