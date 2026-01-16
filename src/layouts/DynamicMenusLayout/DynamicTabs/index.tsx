/**
 * 动态一级菜单组件
 * @description 直接复用现有 TabItem 组件，保持样式一致
 */
import SvgIcon from '@/components/base/SvgIcon';
import type { TabType } from '@/types/interfaces/layouts';
import type { MenuItemDto } from '@/types/interfaces/menu';
import React, { useMemo } from 'react';
import { useModel } from 'umi';
import TabItem from '../../MenusLayout/Tabs/TabItem';

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
  const { isSecondMenuCollapsed } = useModel('layout');

  // 将 MenuItemDto 转换为 TabItem 所需的格式
  const tabItems = useMemo(() => {
    return menus.map((menu) => ({
      menu,
      type: menu.code as TabType,
      icon: menu.icon ? <SvgIcon name={menu.icon} /> : null,
      text: menu.name,
      active: activeTab === menu.code,
    }));
  }, [menus, activeTab]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        padding: '8px 0',
        overflowY: 'auto',
      }}
    >
      {tabItems.map((item) => (
        <TabItem
          key={item.type}
          type={item.type}
          icon={item.icon}
          text={item.text}
          active={item.active}
          onClick={() => onClick(item.menu)}
          isSecondMenuCollapsed={isSecondMenuCollapsed}
        />
      ))}
    </div>
  );
};

export default DynamicTabs;
