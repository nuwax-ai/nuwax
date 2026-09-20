/**
 * 动态一级菜单组件
 * @description 直接复用现有 TabItem 组件，保持样式一致；
 * 女娲应用菜单项正下方挂载多开标签（AppTabItem，内存态刷新即失）
 */
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import type { OpenedAppTabInfo } from '@/models/openedAppTabs';
import { getAppTabNavPath, pickNextActiveTab } from '@/models/openedAppTabs';
import type { MenuItemDto } from '@/types/interfaces/menu';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { history, useLocation, useModel } from 'umi';
import { isNuwaAppsMenu, NUWA_APPS_MENU_PATH } from '../menuMatching';
import AppTabItem from './AppTabItem';
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
  // 女娲应用多开标签（内存态，刷新即失；由女娲应用页点击应用时注册）
  const { openedAppTabs, openApp, closeApp } = useModel('openedAppTabs');
  const location = useLocation();

  /** 标签点击：跳对应应用（三方应用带 homepageUrl query 直载），并刷新
   * 「最近打开」（原位保留，位置不变） */
  const handleAppTabClick = (tab: OpenedAppTabInfo) => {
    openApp(tab);
    history.push(getAppTabNavPath(tab));
  };

  /**
   * 关闭标签：关闭的是当前激活应用时，先从关闭前快照算出剩余中最近打开
   * 的一个并跳转（无剩余回女娲应用页），再移除标签；关闭非激活标签只移
   * 除不跳转。stopPropagation 防止触发行点击跳转。
   */
  const handleCloseAppTab = (e: React.MouseEvent, tab: OpenedAppTabInfo) => {
    e.stopPropagation();
    if (tab.routePath === location.pathname) {
      const next = pickNextActiveTab(openedAppTabs, tab.routePath);
      history.push(next ? getAppTabNavPath(next) : NUWA_APPS_MENU_PATH);
    }
    closeApp(tab.routePath);
  };

  /**
   * 经典滚动条浏览器（Safari / Firefox）
   * 不支持稳定的 scrollbar-gutter，滚动条会挤占布局宽度导致图标偏左
   */
  const needsClassicScrollbarFix = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent.toLowerCase();
    const isFirefox = ua.includes('firefox') || ua.includes('fxios');
    const isSafari = ua.includes('safari');
    const isOtherWebkitBrowser =
      ua.includes('chrome') ||
      ua.includes('crios') ||
      ua.includes('android') ||
      ua.includes('edg');
    return isFirefox || (isSafari && !isOtherWebkitBrowser);
  }, []);

  // 将 MenuItemDto 转换为 TabItem 所需的格式
  const tabItems = useMemo(() => {
    return menus
      .map((menu) => ({
        menu,
        type: menu.code,
        icon: menu.icon,
        text: menu.name,
        active: activeTab === menu.code,
      }))
      .filter((item) => item.type !== 'new_conversation');
  }, [menus, activeTab]);

  /** 一级栏固定宽度：Style1 60px，Style2 80px（与父级 first-menus 一致） */
  const railWidthPx = isStyleOne
    ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1
    : NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE2;

  /** 经典滚动条：列表收窄 8px 并左移 4px 保持整栏居中，滚动条贴栏右缘 */
  const classicScrollbarListStyle = useMemo(() => {
    if (!needsClassicScrollbarFix) return undefined;
    const scrollbarSize = 8;
    return {
      width: railWidthPx - scrollbarSize,
      minWidth: railWidthPx - scrollbarSize,
      marginLeft: scrollbarSize / 2,
    };
  }, [needsClassicScrollbarFix, railWidthPx]);

  /**
   * 滚动与横向对齐：
   * - Chromium：内层 `scroll-container` + flex-end，Style1 再补 2px。
   * - Safari / Firefox：浮动滚动条 hover 显示；列表预留 8px 空间并居中。
   */
  const chromeTabsPaddingClass =
    !needsClassicScrollbarFix && isStyleOne
      ? styles['tabs-padding-chrome-compact']
      : null;

  return (
    <div className={cx(styles['tabs-rail'], 'py-8')}>
      <div
        className={cx(
          styles['tabs-scroll'],
          needsClassicScrollbarFix
            ? styles['tabs-scroll-classic']
            : cx('scroll-container', styles['tabs-scroll-chrome']),
          chromeTabsPaddingClass,
        )}
      >
        <div
          className={cx(
            styles['tabs-list'],
            'flex',
            'flex-col',
            needsClassicScrollbarFix && styles['tabs-list-classic'],
            needsClassicScrollbarFix
              ? styles['flex-center']
              : styles['flex-end'],
          )}
          style={classicScrollbarListStyle}
        >
          {tabItems.map((item) => (
            <React.Fragment key={item.type}>
              <TabItem
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
              {/* 女娲应用多开标签：挂在女娲应用菜单正下方（锚点按归一化
                  path 识别；菜单未配置该锚点时不渲染，同单栏布局决策） */}
              {isNuwaAppsMenu(item.menu) &&
                openedAppTabs.map((tab: OpenedAppTabInfo) => (
                  <AppTabItem
                    key={`app-tab-${tab.routePath}`}
                    tab={tab}
                    active={tab.routePath === location.pathname}
                    onClick={() => handleAppTabClick(tab)}
                    onClose={(e) => handleCloseAppTab(e, tab)}
                    isSecondMenuCollapsed={isSecondMenuCollapsed}
                  />
                ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicTabs;
