/**
 * 动态二级/三级菜单组件
 * @description 直接复用现有 SecondMenuItem 组件，保持样式一致
 */
import SecondMenuItem from '@/components/base/SecondMenuItem';
import SvgIcon from '@/components/base/SvgIcon';
import type { MenuItemDto } from '@/types/interfaces/menu';
import React, { useCallback, useState } from 'react';
import { history, useLocation, useModel } from 'umi';

export interface DynamicSecondMenuProps {
  /** 父级菜单的 code */
  parentCode: string;
}

/**
 * 动态二级/三级菜单组件
 * 复用现有的 SecondMenuItem 组件实现，保持 UI 样式一致
 */
const DynamicSecondMenu: React.FC<DynamicSecondMenuProps> = ({
  parentCode,
}) => {
  const location = useLocation();
  const { getSecondLevelMenus } = useModel('menuModel');
  // 展开的菜单 code 列表
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // 获取二级菜单
  const secondMenus = getSecondLevelMenus(parentCode);

  /**
   * 切换展开状态
   */
  const toggleExpand = useCallback((code: string) => {
    setExpandedMenus((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }, []);

  /**
   * 点击菜单项
   */
  const handleMenuClick = useCallback(
    (menu: MenuItemDto) => {
      if (menu.path) {
        history.push(menu.path);
      }
      // 如果有子菜单，也切换展开状态
      if (menu.children?.length) {
        toggleExpand(menu.code);
      }
    },
    [toggleExpand],
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

  // 如果没有二级菜单，不渲染
  if (!secondMenus.length) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {secondMenus.map((menu, index) => {
        const isExpanded = expandedMenus.includes(menu.code);
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
              onToggle={() => toggleExpand(menu.code)}
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
                        history.push(child.path);
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
