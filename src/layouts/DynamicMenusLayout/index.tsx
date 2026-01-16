/**
 * 动态菜单布局组件
 * @description 完全独立于原有 MenusLayout，使用后端返回的菜单数据渲染
 *
 * 特点：
 * 1. 从 menuModel 获取动态菜单数据
 * 2. 支持一级、二级、三级菜单
 * 3. 复用现有的 Header、User、UserOperateArea 等组件
 * 4. 可通过配置在动态/静态菜单之间切换
 */
import HoverScrollbar from '@/components/base/HoverScrollbar';
import ConditionRender from '@/components/ConditionRender';
import { SITE_DOCUMENT_URL } from '@/constants/common.constants';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { UserOperatorAreaEnum } from '@/types/enums/menus';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { theme, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
import DynamicSecondMenu from './DynamicSecondMenu';
import DynamicTabs from './DynamicTabs';
// 复用原有组件
import CollapseButton from '../MenusLayout/CollapseButton';
import Header from '../MenusLayout/Header';
import User from '../MenusLayout/User';
import UserOperateArea from '../MenusLayout/UserOperateArea';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface DynamicMenusLayoutProps {
  /** 覆盖容器样式 */
  overrideContainerStyle?: React.CSSProperties;
  /** 是否为移动端 */
  isMobile?: boolean;
}

/**
 * 动态菜单布局组件
 */
const DynamicMenusLayout: React.FC<DynamicMenusLayoutProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  overrideContainerStyle: _overrideContainerStyle,
  isMobile = false,
}) => {
  const location = useLocation();
  const { token } = theme.useToken();
  const { navigationStyle, layoutStyle } = useUnifiedTheme();
  const { isSecondMenuCollapsed, setOpenMessage, handleCloseMobileMenu } =
    useModel('layout');
  const { loadMenus, firstLevelMenus } = useModel('menuModel');

  // 当前激活的一级菜单 code
  const [activeTab, setActiveTab] = useState<string>('');

  // 初始化加载菜单数据
  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  // 根据路径匹配当前激活的一级菜单
  useEffect(() => {
    if (!firstLevelMenus.length) return;

    // 查找匹配当前路径的菜单
    const matchedMenu = firstLevelMenus.find((menu) => {
      if (!menu.path) return false;
      // 首页特殊处理
      if (menu.path === '/' || menu.path === '') {
        return location.pathname === '/' || location.pathname === '';
      }
      return location.pathname.startsWith(menu.path);
    });

    if (matchedMenu) {
      setActiveTab(matchedMenu.code);
    } else if (location.pathname === '/' || location.pathname === '') {
      // 默认选中首页
      const homeMenu = firstLevelMenus.find(
        (m) => m.code === 'home' || m.path === '/',
      );
      if (homeMenu) {
        setActiveTab(homeMenu.code);
      }
    }
  }, [location.pathname, firstLevelMenus]);

  /**
   * 点击一级菜单
   */
  const handleTabClick = useCallback(
    (menu: MenuItemDto) => {
      // 关闭移动端菜单
      handleCloseMobileMenu();

      setActiveTab(menu.code);
      if (menu.path) {
        history.push(menu.path);
      }
    },
    [handleCloseMobileMenu],
  );

  /**
   * 用户区域操作
   */
  const handleUserClick = useCallback(
    (type: UserOperatorAreaEnum) => {
      switch (type) {
        case UserOperatorAreaEnum.Document:
          window.open(SITE_DOCUMENT_URL);
          break;
        case UserOperatorAreaEnum.Message:
          setOpenMessage(true);
          break;
      }
    },
    [setOpenMessage],
  );

  /**
   * 获取当前一级菜单的标题
   */
  const currentTitle = useMemo(() => {
    const current = firstLevelMenus.find((m) => m.code === activeTab);
    return current?.name || '';
  }, [activeTab, firstLevelMenus]);

  /**
   * 是否显示标题
   */
  const isShowTitle = useMemo(() => {
    // 工作空间不显示标题（因为有自己的标题组件）
    return activeTab !== 'space';
  }, [activeTab]);

  /**
   * 计算一级导航宽度
   */
  const firstMenuWidth = useMemo(() => {
    if (isMobile) {
      return NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1;
    }
    return navigationStyle === 'style2'
      ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE2
      : NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1;
  }, [navigationStyle, isMobile]);

  /**
   * 一级导航背景
   */
  const firstMenuBackground = useMemo(() => {
    if (isMobile) {
      return `var(--xagi-background-image) ${token.colorBgContainer}`;
    }
    return 'transparent';
  }, [isMobile, token.colorBgContainer]);

  /**
   * 二级导航背景
   */
  const secondaryBackgroundColor = useMemo(() => {
    if (isMobile) {
      return token.colorBgContainer;
    }
    return navigationStyle === 'style2'
      ? 'var(--xagi-layout-bg-container, rgba(255, 255, 255, 0.95))'
      : 'transparent';
  }, [isMobile, navigationStyle, token.colorBgContainer]);

  /**
   * 导航容器样式类名
   */
  const navigationClassName = useMemo(() => {
    return cx(
      styles.container,
      'flex',
      `xagi-layout-${layoutStyle}`,
      `xagi-nav-${navigationStyle}`,
      isMobile && styles['mobile-container'],
    );
  }, [layoutStyle, navigationStyle, isMobile]);

  return (
    <div className={navigationClassName}>
      {/* 一级导航菜单栏 */}
      <div
        className={cx(
          styles['first-menus'],
          'flex',
          'flex-col',
          'items-center',
        )}
        style={{
          width: firstMenuWidth,
          background: firstMenuBackground,
        }}
      >
        <Header />
        {/* 动态一级菜单 */}
        <DynamicTabs
          menus={firstLevelMenus}
          activeTab={activeTab}
          onClick={handleTabClick}
        />
        {/* 用户操作区域 */}
        <UserOperateArea onClick={handleUserClick} />
        {/* 用户头像 */}
        <User />
      </div>

      {/* 二级导航菜单栏 */}
      <div
        className={cx(styles['nav-menus'], 'noselect')}
        style={{
          width: isSecondMenuCollapsed
            ? 0
            : NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH,
          paddingLeft: isSecondMenuCollapsed ? 0 : token.padding,
          opacity: isSecondMenuCollapsed ? 0 : 1,
          backgroundColor: secondaryBackgroundColor,
        }}
      >
        <HoverScrollbar
          className={cx('h-full')}
          bodyWidth={
            NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH - token.padding * 2
          }
          style={{
            width: '100%',
            padding: `${token.paddingSM} 0`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
            }}
          >
            {/* 标题 */}
            <ConditionRender condition={isShowTitle && !!currentTitle}>
              <div style={{ padding: '12px 12px' }}>
                <Typography.Title
                  level={5}
                  style={{ marginBottom: 0 }}
                  className={cx(styles['menu-title'])}
                >
                  {currentTitle}
                </Typography.Title>
              </div>
            </ConditionRender>

            {/* 二级/三级菜单 */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <DynamicSecondMenu parentCode={activeTab} />
            </div>
          </div>
        </HoverScrollbar>
      </div>

      {/* 收起/展开按钮 */}
      <CollapseButton />
    </div>
  );
};

export default DynamicMenusLayout;
