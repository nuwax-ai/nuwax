import ConditionRender from '@/components/ConditionRender';
import HoverScrollbar from '@/components/base/HoverScrollbar';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { TabsEnum } from '@/types/enums/menus';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { theme, Typography } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useModel } from 'umi';
import EcosystemMarketSection from '../MenusLayout/EcosystemMarketSection';
import HomeSection from '../MenusLayout/HomeSection';
import SpaceSection from '../MenusLayout/SpaceSection';
import SquareSection from '../MenusLayout/SquareSection';
import SystemSection from '../MenusLayout/SystemSection';

import styles from './index.less';
const cx = classNames.bind(styles);

/**
 * 悬浮菜单组件
 * 当二级菜单收起时，鼠标悬浮在一级菜单图标上显示对应的二级菜单内容
 */
const HoverMenu: React.FC = () => {
  const {
    showHoverMenu,
    hoverMenuType,
    isSecondMenuCollapsed,
    handleImmediateHideHoverMenu,
    handleCancelHideHoverMenu,
    setMouseInHoverMenu,
  } = useModel('layout');
  const { token } = theme.useToken();
  const { navigationStyle } = useUnifiedTheme();

  // 计算动态导航宽度
  const firstMenuWidth =
    navigationStyle === ThemeNavigationStyleType.STYLE2
      ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE2
      : NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1;
  // 根据菜单类型渲染对应的内容
  const MenuContent: React.FC = useMemo(() => {
    const menuStyle = { paddingTop: 0 }; // 去除移动端的 paddingTop

    switch (hoverMenuType) {
      case TabsEnum.Home:
        return () => <HomeSection style={menuStyle} />;
      case TabsEnum.Space:
        return () => <SpaceSection style={menuStyle} />;
      case TabsEnum.Square:
        return () => <SquareSection style={menuStyle} />;
      case TabsEnum.System_Manage:
        return () => <SystemSection style={menuStyle} />;
      case TabsEnum.Ecosystem_Market:
        return () => <EcosystemMarketSection style={menuStyle} />;
      default:
        return () => null;
    }
  }, [hoverMenuType]);

  // 获取菜单标题
  const menuTitle = useMemo(() => {
    switch (hoverMenuType) {
      case TabsEnum.Home:
        return '主页';
      case TabsEnum.Square:
        return '广场';
      case TabsEnum.Space:
        return '工作空间';
      case TabsEnum.System_Manage:
        return '系统管理';
      case TabsEnum.Ecosystem_Market:
        return '生态市场';
      default:
        return '';
    }
  }, [hoverMenuType]);

  // 是否显示标题
  const isShowTitle = useMemo(() => {
    return hoverMenuType !== TabsEnum.Space;
  }, [hoverMenuType]);

  // 只在二级菜单收起且有悬浮菜单类型时显示
  if (!isSecondMenuCollapsed || !hoverMenuType) {
    return null;
  }

  return (
    <div
      className={cx(
        styles['hover-menu'],
        showHoverMenu ? styles.visible : styles.hidden,
        isSecondMenuCollapsed && styles['hover-menu-container-collapsed'],
      )}
      onMouseEnter={() => {
        // 鼠标进入悬浮菜单区域时，设置状态并取消隐藏定时器
        setMouseInHoverMenu(true);
        handleCancelHideHoverMenu();
      }}
      onMouseLeave={() => {
        // 鼠标离开悬浮菜单区域时，设置状态并立即隐藏
        setMouseInHoverMenu(false);
        handleImmediateHideHoverMenu();
      }}
      style={{
        width: NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH,
        left: firstMenuWidth,
        paddingLeft: token.padding,
      }}
    >
      <HoverScrollbar
        className={cx('h-full')}
        bodyWidth={
          NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH - token.padding * 2
        }
        style={{
          width: '100%',
          padding: '12px 0',
          // 通过 style 设置 CSS 变量会导致类型报错，推荐通过 className + :root 或 styled 方案实现
          // 这里临时用 as any 绕过类型检查，实际项目建议将变量写到全局 less 或 css module
          ...({
            ['--xagi-layout-second-menu-text-color']: token.colorText, // 悬浮菜单文字颜色 覆写
            ['--xagi-layout-second-menu-text-color-secondary']:
              token.colorTextSecondary, // 悬浮菜单文字颜色 覆写
          } as React.CSSProperties),
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}
      >
        <ConditionRender condition={isShowTitle}>
          <div style={{ padding: '22px 12px' }}>
            <Typography.Title
              level={4}
              className={cx(styles['menu-title'])}
              style={{ marginBottom: 0 }}
            >
              {menuTitle}
            </Typography.Title>
          </div>
        </ConditionRender>
        <div style={{ flex: 1, minHeight: 0 }}>
          <MenuContent />
        </div>
      </HoverScrollbar>
    </div>
  );
};

export default HoverMenu;
