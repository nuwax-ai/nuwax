/**
 * 动态一级菜单组件
 * @description 根据后端返回的菜单数据渲染一级导航
 */
import SvgIcon from '@/components/base/SvgIcon';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import type { MenuItemDto } from '@/types/interfaces/menu';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

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
 */
const DynamicTabs: React.FC<DynamicTabsProps> = ({
  menus,
  activeTab,
  onClick,
}) => {
  const { navigationStyle } = useUnifiedTheme();

  return (
    <div
      className={cx(styles.tabs, 'flex', 'flex-col', 'items-center', {
        [styles.style2]: navigationStyle === 'style2',
      })}
    >
      {menus.map((menu) => (
        <div
          key={menu.code}
          className={cx(styles.tabItem, 'flex', 'flex-col', 'items-center', {
            [styles.active]: activeTab === menu.code,
          })}
          onClick={() => onClick(menu)}
          title={menu.name}
        >
          {/* 图标 */}
          <div className={cx(styles.iconWrapper)}>
            {menu.icon && <SvgIcon name={menu.icon} />}
          </div>

          {/* 文字（在 style2 导航风格下显示） */}
          {navigationStyle === 'style2' && (
            <span className={cx(styles.text)}>{menu.name}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicTabs;
