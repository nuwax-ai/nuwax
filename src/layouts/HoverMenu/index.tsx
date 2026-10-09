import ConditionRender from '@/components/ConditionRender';
import HoverScrollbar from '@/components/base/HoverScrollbar';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { MenuItemDto } from '@/types/interfaces/menu';
import { isImmersiveShell, shellAvoid } from '@/utils/hostBridge';
import { theme, Typography } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useRef } from 'react';
import { useModel } from 'umi';
import DynamicSecondMenu from '../DynamicMenusLayout/DynamicSecondMenu';
import NewHomeSection from '../DynamicMenusLayout/NewHomeSection';
import SpaceSection from '../DynamicMenusLayout/SpaceSection';
import SquareSection from '../DynamicMenusLayout/SquareSection';
import styles from './index.less';
const cx = classNames.bind(styles);

// 悬浮场景的 Section 样式常量（bug 2348）：模块级固定引用，配合保持挂载
// 避免逐渲染新对象打断子组件 memo
const HOME_SECTION_HOVER_STYLE: React.CSSProperties = {
  marginTop: 7,
  height: 'calc(100% - 7px)',
};
const SPACE_SECTION_HOVER_STYLE: React.CSSProperties = { paddingTop: '12px' };

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

  // 保持挂载（bug 2348，参考 fa8facf938 二级列同款思路）：二级菜单收起期间
  // 常驻挂载（含 SpaceSection 等带请求的重内容），悬浮显隐只走 .visible/.hidden
  // 类切换（less 已带 opacity 0.2s 过渡），避免「悬浮→隐藏→再悬浮」反复
  // 卸载重挂载并重发空间详情请求；隐藏时 model 会清空 hoverMenuType，用
  // 「最近一次非空类型」保持内容树不卸载；展开二级菜单时仍整体卸载，
  // 避免与经典布局内联二级菜单双挂载 SpaceSection
  const lastHoverTypeRef = useRef(hoverMenuType);
  if (hoverMenuType) {
    lastHoverTypeRef.current = hoverMenuType;
  }
  const contentHoverType = hoverMenuType || lastHoverTypeRef.current;

  /**
   * 渲染二级菜单
   */
  const renderSecondMenu = useMemo(() => {
    /**
     * 渲染特殊内容区域
     */
    // 主页、系统广场特殊处理：直接渲染对应的 Section 组件
    // 主页 homepage: 最近使用 + 会话记录
    if (
      contentHoverType === 'homepage' ||
      contentHoverType === 'new_conversation'
    ) {
      return <NewHomeSection style={HOME_SECTION_HOVER_STYLE} />;
    }

    // 工作空间
    if (contentHoverType === 'space' || contentHoverType === 'workspace') {
      return (
        <SpaceSection
          activeTab={contentHoverType}
          style={SPACE_SECTION_HOVER_STYLE}
        />
      );
    }

    // 系统广场
    if (contentHoverType === 'system_square') {
      return <SquareSection />;
    }

    return <DynamicSecondMenu parentCode={contentHoverType} />;
  }, [contentHoverType]);

  /**
   * 获取当前一级菜单的标题
   */
  const currentTitle = useMemo(() => {
    const current = firstLevelMenus.find(
      (m: MenuItemDto) => m.code === contentHoverType,
    );
    return current?.name;
  }, [contentHoverType, firstLevelMenus]);

  /**
   * 是否显示标题
   */
  const isShowTitle = useMemo(() => {
    // 工作空间不显示标题（因为有自己的标题组件）
    // 支持静态菜单的 'space' 和 动态菜单的 'workspace'
    return contentHoverType !== 'space' && contentHoverType !== 'workspace';
  }, [contentHoverType]);

  // 二级菜单展开时悬浮面板整体卸载（见上：避免与内联二级菜单双挂载）
  if (!isSecondMenuCollapsed) {
    return null;
  }
  // 显隐只切类：hover 且有目标类型才可见，隐藏期常驻挂载仅降低透明度
  const menuVisible = showHoverMenu && !!hoverMenuType;

  // 计算动态导航宽度
  const firstMenuWidth =
    navigationStyle === ThemeNavigationStyleType.STYLE2
      ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE2
      : NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1;

  return (
    <div
      className={cx(
        styles['hover-menu'],
        menuVisible ? styles.visible : styles.hidden,
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
        // 桌面端沉浸式：悬浮二级菜单顶部避让 nuwaclaw 工具栏浮层
        //（mac 左侧红绿灯+icon 组 / Win·Linux 左侧自绘按钮组，悬浮面板恰在其下方）。
        // top 下移 + height 收缩对应量，底部不溢出；浏览器/独立窗口不受影响。
        ...(isImmersiveShell()
          ? { top: shellAvoid.TOP, height: `calc(100% - ${shellAvoid.TOP}px)` }
          : {}),
      }}
    >
      {contentHoverType === 'homepage' ||
      contentHoverType === 'new_conversation' ? (
        renderSecondMenu
      ) : (
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
          {/* 收起后从未悬浮（无最近类型）时不渲染内容，防 DynamicSecondMenu 空参挂载 */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {contentHoverType ? renderSecondMenu : null}
          </div>
        </HoverScrollbar>
      )}
    </div>
  );
};

export default HoverMenu;
