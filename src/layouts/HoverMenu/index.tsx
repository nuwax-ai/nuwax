import ConditionRender from '@/components/ConditionRender';
import HoverScrollbar from '@/components/base/HoverScrollbar';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { MenuItemDto } from '@/types/interfaces/menu';
import { theme, Typography } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useModel } from 'umi';
import DynamicSecondMenu from '../DynamicMenusLayout/DynamicSecondMenu';
import EcosystemMarketSection from '../DynamicMenusLayout/EcosystemMarketSection';
import HomeSection from '../DynamicMenusLayout/HomeSection';
import SpaceSection from '../DynamicMenusLayout/SpaceSection';
import SquareSection from '../DynamicMenusLayout/SquareSection';
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
  const { firstLevelMenus } = useModel('menuModel');

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
      return (
        <SpaceSection
          activeTab={hoverMenuType}
          style={{ paddingTop: '12px' }}
        />
      );
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

  /**
   * 获取当前一级菜单的标题
   */
  const currentTitle = useMemo(() => {
    const current = firstLevelMenus.find(
      (m: MenuItemDto) => m.code === hoverMenuType,
    );
    return current?.name;
  }, [hoverMenuType, firstLevelMenus]);

  /**
   * 是否显示标题
   */
  const isShowTitle = useMemo(() => {
    // 工作空间不显示标题（因为有自己的标题组件）
    // 支持静态菜单的 'space' 和 动态菜单的 'workspace'
    return hoverMenuType !== 'space' && hoverMenuType !== 'workspace';
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
        {/* 标题 */}
        <ConditionRender condition={isShowTitle && currentTitle}>
          <div style={{ padding: '12px 12px 12px' }}>
            <Typography.Title
              level={5}
              style={{ marginBottom: 0 }}
              className={cx(styles['menu-title'])}
            >
              {currentTitle}
            </Typography.Title>
          </div>
        </ConditionRender>
        <div style={{ flex: 1, minHeight: 0 }}>{renderSecondMenu}</div>
      </HoverScrollbar>
    </div>
  );
};

export default HoverMenu;
