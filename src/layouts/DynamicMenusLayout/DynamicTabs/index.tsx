/**
 * 动态一级菜单组件
 * @description 直接复用现有 TabItem 组件，保持样式一致
 */
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
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
   * Safari 不支持稳定的 scrollbar-gutter，经典滚动条会挤占布局宽度
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

  /** 一级栏固定宽度：Style1 60px，Style2 80px（与父级 first-menus 一致） */
  const railWidthPx = isStyleOne
    ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1
    : NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE2;

  /** Safari：列表收窄 8px 并左移 4px 保持整栏居中，滚动条贴栏右缘 */
  const safariListStyle = useMemo(() => {
    if (!isSafariBrowser) return undefined;
    const scrollbarSize = 8;
    return {
      width: railWidthPx - scrollbarSize,
      minWidth: railWidthPx - scrollbarSize,
      marginLeft: scrollbarSize / 2,
    };
  }, [isSafariBrowser, railWidthPx]);

  /**
   * 滚动与横向对齐：
   * - 非 Safari：内层 `scroll-container` + flex-end，Style1 再补 2px。
   * - Safari：浮动滚动条 hover 显示；列表预留 8px 空间。
   */
  const chromeTabsPaddingClass =
    !isSafariBrowser && isStyleOne
      ? styles['tabs-padding-chrome-compact']
      : null;

  return (
    <div className={cx(styles['tabs-rail'], 'py-8')}>
      <div
        className={cx(
          styles['tabs-scroll'],
          isSafariBrowser
            ? styles['tabs-scroll-safari']
            : cx('scroll-container', styles['tabs-scroll-chrome']),
          chromeTabsPaddingClass,
        )}
      >
        <div
          className={cx(
            styles['tabs-list'],
            'flex',
            'flex-col',
            isSafariBrowser && styles['tabs-list-safari'],
            isSafariBrowser ? styles['flex-center'] : styles['flex-end'],
          )}
          style={safariListStyle}
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
      </div>
    </div>
  );
};

export default DynamicTabs;
