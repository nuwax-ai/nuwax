/**
 * 动态一级菜单组件
 * @description 直接复用现有 TabItem 组件，保持样式一致
 */
import type { MenuItemDto } from '@/types/interfaces/menu';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useModel } from 'umi';
import TabItem from './TabItem';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface DynamicTabsProps {
  isStyleOne?: boolean;
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
  isStyleOne = false,
  menus,
  activeTab,
  onClick,
}) => {
  const { handleShowHoverMenu, handleHideHoverMenu, isSecondMenuCollapsed } =
    useModel('layout');

  /**
   * 判断是否是Safari浏览器
   * 因为Safari浏览器不支持scrollbar-gutter: stable，所以需要特殊处理
   */
  const isSafariBrowser = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent.toLowerCase();
    const isSafari = ua.includes('safari');
    const isOtherWebkitBrowser =
      ua.includes('chrome') ||
      ua.includes('crios') ||
      ua.includes('android') ||
      ua.includes('edg') ||
      ua.includes('fxios');
    return isSafari && !isOtherWebkitBrowser;
  }, []);

  // 将 MenuItemDto 转换为 TabItem 所需的格式
  const tabItems = useMemo(() => {
    return menus.map((menu) => ({
      menu,
      type: menu.code,
      icon: menu.icon,
      text: menu.name,
      active: activeTab === menu.code,
    }));
  }, [menus, activeTab]);

  return (
    <div
      className={cx(
        isStyleOne ? styles['dynamic-tabs-container'] : styles['style-two'],
        'flex',
        'flex-col',
        'flex-1',
        'overflow-y',
        'w-full',
        'py-8',
        !isSafariBrowser && 'scroll-container',
      )}
    >
      {tabItems.map((item) => (
        <TabItem
          key={item.type}
          icon={item.icon || ''}
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
