/**
 * 动态菜单项组件
 * @description 支持二级和三级菜单的展开/收起
 */
import SvgIcon from '@/components/base/SvgIcon';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface DynamicMenuItemProps {
  /** 菜单数据 */
  menu: MenuItemDto;
  /** 是否为第一个菜单项 */
  isFirst?: boolean;
  /** 是否激活状态 */
  isActive?: boolean;
  /** 是否展开（针对有子菜单的项） */
  isExpanded?: boolean;
  /** 切换展开状态 */
  onToggle?: () => void;
  /** 点击菜单项 */
  onClick: () => void;
  /** 子菜单内容（三级菜单） */
  children?: React.ReactNode;
}

/**
 * 动态菜单项组件
 */
const DynamicMenuItem: React.FC<DynamicMenuItemProps> = ({
  menu,
  isFirst = false,
  isActive = false,
  isExpanded = false,
  onToggle,
  onClick,
  children,
}) => {
  const hasChildren = menu.children && menu.children.length > 0;

  return (
    <div className={cx(styles.menuItemWrapper)}>
      {/* 菜单项主体 */}
      <div
        className={cx(styles.menuItem, 'flex', 'items-center', {
          [styles.active]: isActive,
          [styles.first]: isFirst,
          [styles.expanded]: isExpanded,
        })}
        onClick={onClick}
      >
        {/* 图标 */}
        {menu.icon && (
          <span
            className={cx(
              styles.iconBox,
              'flex',
              'items-center',
              'content-center',
            )}
          >
            <SvgIcon name={menu.icon} />
          </span>
        )}

        {/* 菜单名称 */}
        <Typography.Text className={cx('flex-1', styles.name)}>
          {menu.name}
        </Typography.Text>

        {/* 展开/收起箭头 */}
        {hasChildren && (
          <SvgIcon
            name="icons-common-caret_down"
            className={cx(styles.arrow, {
              [styles.rotated]: isExpanded,
            })}
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
          />
        )}
      </div>

      {/* 三级子菜单容器 */}
      {hasChildren && isExpanded && (
        <div className={cx(styles.subMenuContainer)}>{children}</div>
      )}
    </div>
  );
};

// ==================== 子菜单项组件 ====================

export interface SubItemProps {
  /** 菜单数据 */
  menu: MenuItemDto;
  /** 是否激活状态 */
  isActive?: boolean;
  /** 点击事件 */
  onClick: () => void;
}

/**
 * 三级子菜单项组件
 */
const SubItem: React.FC<SubItemProps> = ({
  menu,
  isActive = false,
  onClick,
}) => {
  return (
    <div
      className={cx(styles.subItem, 'flex', 'items-center', {
        [styles.active]: isActive,
      })}
      onClick={onClick}
    >
      {menu.icon && <SvgIcon name={menu.icon} className={cx(styles.subIcon)} />}
      <span className={cx(styles.subName)}>{menu.name}</span>
    </div>
  );
};

// ==================== 类型扩展 ====================

interface DynamicMenuItemComponent extends React.FC<DynamicMenuItemProps> {
  SubItem: typeof SubItem;
}

const DynamicMenuItemWithSub = DynamicMenuItem as DynamicMenuItemComponent;
DynamicMenuItemWithSub.SubItem = SubItem;

export default DynamicMenuItemWithSub;
