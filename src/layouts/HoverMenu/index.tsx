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
// import EcosystemMarketSection from '../MenusLayout/EcosystemMarketSection';
import HomeSection from '../DynamicMenusLayout/HomeSection';
import SpaceSection from '../DynamicMenusLayout/SpaceSection';
import SquareSection from '../DynamicMenusLayout/SquareSection';
// import SystemSection from '../DynamicMenusLayout/SystemSection';

import DynamicSecondMenu from '../DynamicMenusLayout/DynamicSecondMenu';
import EcosystemMarketSection from '../DynamicMenusLayout/EcosystemMarketSection';
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

  /**
   * 渲染二级菜单
   */
  const renderSecondMenu = useMemo(() => {
    /**
     * 渲染特殊内容区域
     */
    // 主页、系统广场、生态市场特殊处理：直接渲染对应的 Section 组件
    // 主页 homepage: 最近使用 + 会话记录
    if (
      hoverMenuType === 'homepage' ||
      hoverMenuType === 'new_conversation' ||
      hoverMenuType === 'my_computer'
    ) {
      return <HomeSection />;
    }

    // 工作空间
    if (hoverMenuType === 'space' || hoverMenuType === 'workspace') {
      return <SpaceSection activeTab={hoverMenuType} />;
    }

    // 系统广场
    if (hoverMenuType === 'system_square') {
      return <SquareSection />;
    }

    // 生态市场
    if (hoverMenuType === 'eco_market') {
      return <EcosystemMarketSection />;
    }
    return <DynamicSecondMenu parentCode={hoverMenuType} />;
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
          <div style={{ padding: '14px 12px' }}>
            <Typography.Title
              level={4}
              className={cx(styles['menu-title'])}
              style={{ marginBottom: 0 }}
            >
              {menuTitle}
            </Typography.Title>
          </div>
        </ConditionRender>
        <div style={{ flex: 1, minHeight: 0 }}>{renderSecondMenu}</div>
      </HoverScrollbar>
    </div>
  );
};

export default HoverMenu;
