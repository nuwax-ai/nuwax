/**
 * 动态一级菜单组件
 * @description 直接复用现有 TabItem 组件，保持样式一致
 */
import SvgIcon from '@/components/base/SvgIcon';
import type { MenuItemDto } from '@/types/interfaces/menu';
import React, { useMemo } from 'react';
import { useModel } from 'umi';
import TabItem from './TabItem';

export interface DynamicTabsProps {
  /** 一级菜单列表 */
  menus: MenuItemDto[];
  /** 当前激活的菜单 code */
  activeTab: string;
  /** 点击菜单项 */
  onClick: (menu: MenuItemDto) => void;
}

/**
 * 动态一级菜单组件
 * 复用现有的 TabItem 组件实现，保持 UI 样式一致
 */
const DynamicTabs: React.FC<DynamicTabsProps> = ({
  menus,
  activeTab,
  onClick,
}) => {
  const { handleShowHoverMenu, handleHideHoverMenu, isSecondMenuCollapsed } =
    useModel('layout');

  // 将 MenuItemDto 转换为 TabItem 所需的格式
  const tabItems = useMemo(() => {
    return menus.map((menu) => ({
      menu,
      type: menu.code,
      icon: menu.icon ? <SvgIcon name={menu.icon} /> : null,
      text: menu.name,
      active: activeTab === menu.code,
    }));
  }, [menus, activeTab]);

  return (
    <div
      className="flex flex-col items-center flex-1 overflow-y w-full"
      style={{
        padding: '8px 0',
      }}
    >
      {tabItems.map((item) => (
        <TabItem
          key={item.type}
          // 动态菜单中这里不需要，待删除
          type={item.type as any}
          icon={item.icon}
          text={item.text}
          active={item.active}
          onClick={() => onClick(item.menu)}
          onMouseEnter={() => {
            if (item.menu?.code !== 'new_conversation') {
              handleShowHoverMenu(item.menu?.code || '');
            }
          }}
          onMouseLeave={handleHideHoverMenu}
          isSecondMenuCollapsed={isSecondMenuCollapsed}
        />
      ))}
    </div>
  );
};

export default DynamicTabs;
