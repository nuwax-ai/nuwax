/**
 * 左侧分类菜单
 * @description 优先渲染菜单接口中 ESC_MENU_PARENT_CODE 下的子菜单（按 code 匹配资源类型），
 * 菜单接口未配置该模块前使用本地兜底配置，结构与接口数据同构
 */

import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import type { MenuItemDto } from '@/types/interfaces/menu';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { history, useModel } from 'umi';
import {
  DEFAULT_CATEGORY_MENUS,
  ESC_MENU_PARENT_CODE,
  RESOURCE_TYPES,
} from '../../constants';
import type { CategoryMenuItem, ResourceTypeEnum } from '../../types';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface CategorySidebarProps {
  /** 当前激活的资源类型 */
  activeKey: ResourceTypeEnum;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ activeKey }) => {
  const { getSecondLevelMenus } = useModel('menuModel');

  /**
   * 菜单数据：接口配置了父级菜单时取其子菜单（code 必须是资源类型），
   * 否则使用本地兜底配置
   */
  const menuItems = useMemo<CategoryMenuItem[]>(() => {
    const menuChildren: MenuItemDto[] =
      getSecondLevelMenus(ESC_MENU_PARENT_CODE) || [];
    const mapped = menuChildren
      .filter((item) => RESOURCE_TYPES.includes(item.code as ResourceTypeEnum))
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
      .map((item): CategoryMenuItem => {
        const code = item.code as ResourceTypeEnum;
        const fallback = DEFAULT_CATEGORY_MENUS.find(
          (menu) => menu.code === code,
        );
        return {
          code,
          label: item.name || fallback?.label || code,
          // 菜单接口下发的 path 优先，且必须仍是框架页内路径，防止越权跳转
          path: item.path?.startsWith('/expert-skill-connector/')
            ? item.path
            : fallback?.path || '',
          icon: item.icon || fallback?.icon || '',
        };
      })
      .filter((item) => !!item.path);
    return mapped.length > 0 ? mapped : DEFAULT_CATEGORY_MENUS;
  }, [getSecondLevelMenus]);

  const handleMenuClick = (item: CategoryMenuItem) => {
    if (item.code === activeKey) {
      return;
    }
    history.push(item.path);
  };

  return (
    <aside className={cx(styles.sidebar)}>
      <div className={cx(styles.title)}>
        {dict('PC.Pages.ExpertSkillConnector.pageTitle')}
      </div>
      <div className={cx(styles['menu-list'])}>
        {menuItems.map((item) => (
          <div
            key={item.code}
            className={cx(styles['menu-item'], {
              [styles['menu-item-active']]: item.code === activeKey,
            })}
            onClick={() => handleMenuClick(item)}
          >
            {item.icon ? (
              <SvgIcon name={item.icon} className={cx(styles['menu-icon'])} />
            ) : null}
            <span className={cx('text-ellipsis', 'flex-1')}>{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default CategorySidebar;
