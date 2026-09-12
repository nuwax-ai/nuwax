/**
 * 经典布局（style1 紧凑 / style2 展开，改版前形态）
 * @description 一级 icon 竖栏 + 二级菜单列 + 顶栏 Header；自改版前提交恢复
 *   （db2fbc62b^），由 DynamicMenusLayout 分发器按 effectiveNavigationStyle 挂载。
 *   CollapseButton 为本布局专属，随恢复落在本地目录。
 */
import HoverScrollbar from '@/components/base/HoverScrollbar';
import ConditionRender from '@/components/ConditionRender';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import { initNuwaClawHostEvents } from '@/services/nuwaClawHostEvents';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { isImmersiveShell, shellAvoid } from '@/utils/nuwaClawBridge';
import { jumpTo } from '@/utils/router';
import { theme, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo } from 'react';
import { history, useModel } from 'umi';
import DynamicSecondMenu from '../DynamicSecondMenu';
import DynamicTabs from '../DynamicTabs';
// 复用原有组件
import CreditsBalance from '@/components/business-component/CreditsBalance';
import Header from '../Header';
import User from '../User';
import UserOperateArea from '../UserOperateArea';
import CollapseButton from './CollapseButton';
// 复用原有样式
import {
  MENU_CODE_DOCUMENTS,
  MENU_CODE_MORE_PAGE,
  MENU_CODE_MY_COMPUTER,
  MENU_CODE_NOTIFICATION,
} from '@/constants/menus.constants';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import NewHomeSection from '../NewHomeSection';
import {
  resolveCurrentTitle,
  resolveIsShowTitle,
  resolveSecondaryBackgroundColor,
  resolveSecondMenuVisibility,
} from '../secondMenuPolicy';
import SpaceSection from '../SpaceSection';
import SquareSection from '../SquareSection';
import { useMenuNavigation } from '../useMenuNavigation';
import { useSecondMenuShellSync } from '../useSecondMenuShellSync';
import { handleOpenUrl } from '../utils';
import styles from './index.less';

const cx = classNames.bind(styles);
/** 桌面端沉浸式：顶部下移避让 nuwaclaw 工具栏（macOS 红绿灯在其左；Win/Linux 左侧自绘按钮组）。
 *  仅一级/二级菜单列使用。注意：走 @/layouts 的主内容区（page-container）不加避让——
 *  列表页内容会被整体压低（曾误伤）；layout:false 全屏页不做内嵌避让，走新开窗口打开。
 *  尺寸单一来源在 nuwaClawBridge 的 shellAvoid.TOP（与右上角三键避让同源管理），
 *  NUWA_CLAW_PADDING_TOP 保留为兼容导出别名（外部导入点仍引用此名）。 */
export const NUWA_CLAW_PADDING_TOP = shellAvoid.TOP;
/** 使用自定义 Section 的一级菜单，始终展示二级菜单栏 */
const SECOND_MENU_SECTION_TABS = new Set([
  'homepage',
  'space',
  'workspace',
  'system_square',
]);

export interface DynamicMenusLayoutProps {
  /** 覆盖容器样式 */
  overrideContainerStyle?: React.CSSProperties;
  /** 是否为移动端 */
  isMobile?: boolean;
}

/**
 * 经典布局组件
 */
const ClassicLayout: React.FC<DynamicMenusLayoutProps> = ({
  overrideContainerStyle,
  isMobile = false,
}) => {
  const { token } = theme.useToken();
  // 桌面端锁定 style3 时不会挂载本布局；仍统一读 effective 值保持口径一致
  const { effectiveNavigationStyle: navigationStyle, layoutStyle } =
    useUnifiedTheme();
  const { isSecondMenuCollapsed, setIsSecondMenuCollapsed, setOpenMessage } =
    useModel('layout');

  // 判断指定一级菜单及其所有子菜单中，是否存在与传入路径匹配的菜单
  const { firstLevelMenus, otherMenus } = useModel('menuModel');

  const { refreshUserInfo } = useModel('userInfo');

  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 导航状态机（activeTab 路径同步/一级菜单点击等，与单栏布局共用单源实现）
  const {
    activeTab,
    setActiveTab,
    isClickNewConversation,
    isClickMenu,
    handleTabClick,
    handlerClick,
  } = useMenuNavigation();

  // 新建任务（壳层 ⌘N 宿主命令用）：与单栏布局同款，租户配置未就绪时兜底回首页
  const handleNewTask = () => {
    if (tenantConfigInfo) {
      handlerClick();
    } else {
      history.push('/home');
    }
  };

  useEffect(() => {
    // 强制刷新获取用户信息
    refreshUserInfo();
  }, []);

  // nuwaclaw 桌面端：注册宿主命令监听（工具栏「收起二级菜单」、壳层 ⌘N 新建任务经此通道下发）
  useEffect(() => {
    return initNuwaClawHostEvents({
      setSecondMenuCollapsed: setIsSecondMenuCollapsed,
      createNewTask: handleNewTask,
    });
  }, [setIsSecondMenuCollapsed, handleNewTask]);

  /**
   * 用户区域操作
   */
  const handleUserClick = useCallback(
    (menu: MenuItemDto) => {
      const code = menu.code;
      // 是否点击了一级菜单
      isClickMenu.current = false;
      switch (code) {
        case MENU_CODE_DOCUMENTS:
          handleOpenUrl(menu);
          break;
        case MENU_CODE_NOTIFICATION:
          setOpenMessage(true);
          break;
        case MENU_CODE_MY_COMPUTER:
          {
            // setActiveTab(code || '');
            jumpTo({
              url: '/my-computer-manage',
              state: { _t: Date.now(), menuCode: menu.code },
            });
          }
          break;
        // 更多页面
        case MENU_CODE_MORE_PAGE:
          {
            if (!menu?.children?.length) {
              return;
            }
            const path = menu?.children[0]?.path;
            setActiveTab(code || '');
            // 需要定义更多菜单的路由
            history.push(path, {
              _t: Date.now(),
              menuCode: menu.code,
            });
          }
          break;
      }
    },
    [setOpenMessage],
  );

  /**
   * 获取当前一级菜单的标题（策略单源 secondMenuPolicy：dict 注入避开 umi 传递依赖）
   */
  const currentTitle = useMemo(
    () =>
      resolveCurrentTitle({
        activeTab,
        isClickNewConversation,
        firstLevelMenus,
        dict,
      }),
    [activeTab, isClickNewConversation, firstLevelMenus],
  );

  /**
   * 当前一级菜单是否需要展示二级菜单栏（策略单源：Section 域常显，其余看 children）。
   * Section 集合含 homepage——经典布局选中主页时二级列即会话列表（NewHomeSection）。
   */
  const shouldShowSecondMenu = useMemo(
    () =>
      resolveSecondMenuVisibility({
        activeTab,
        sectionTabs: SECOND_MENU_SECTION_TABS,
        firstLevelMenus,
        otherMenus,
      }),
    [activeTab, firstLevelMenus, otherMenus],
  );

  // 桌面端：二级菜单列可用/收起态 ↔ nuwaclaw 壳同步（双布局单源 hook，
  // 浏览器端接入层 no-op）
  useSecondMenuShellSync(shouldShowSecondMenu, isSecondMenuCollapsed);

  /**
   * 是否显示标题（策略单源：工作空间有自己的标题组件）
   */
  const isShowTitle = useMemo(() => resolveIsShowTitle(activeTab), [activeTab]);

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
   * 二级导航背景（策略单源；经典挂载于 style1/style2，style2 半透明白分支在此真实生效）
   */
  const secondaryBackgroundColor = useMemo(
    () =>
      resolveSecondaryBackgroundColor({
        isMobile,
        navigationStyle,
        colorBgContainer: token.colorBgContainer,
      }),
    [isMobile, navigationStyle, token.colorBgContainer],
  );

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

  /**
   * 渲染二级菜单
   */
  const renderSecondMenu = useMemo(() => {
    /**
     * 渲染特殊内容区域
     */
    // 主页、系统广场、生态市场特殊处理：直接渲染对应的 Section 组件
    // 主页 homepage: 最近使用 + 会话记录
    // 主页: 使用新版侧栏（会话历史 + 搜索 + 新建会话）
    if (
      activeTab === 'homepage' ||
      activeTab === 'new_conversation'
      // activeTab === 'my_computer' ||
      // activeTab === 'documents'
    ) {
      return <NewHomeSection style={overrideContainerStyle} showSearchHeader />;
    }

    // 工作空间
    if (activeTab === 'space' || activeTab === 'workspace') {
      return (
        <SpaceSection activeTab={activeTab} style={overrideContainerStyle} />
      );
    }

    // 系统广场
    if (activeTab === 'system_square') {
      return <SquareSection style={overrideContainerStyle} />;
    }

    return <DynamicSecondMenu parentCode={activeTab} />;
  }, [activeTab, overrideContainerStyle]);

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
          // 桌面端沉浸式：一级菜单顶部下移避让 macOS 红绿灯（trafficLightPosition {16,16}）
          ...(isImmersiveShell() ? { paddingTop: shellAvoid.TOP } : {}),
        }}
      >
        <Header />
        {/* 动态一级菜单 */}
        <DynamicTabs
          isStyleOne={
            navigationStyle === ThemeNavigationStyleType.STYLE1 || isMobile
          }
          menus={firstLevelMenus}
          activeTab={activeTab}
          onClick={handleTabClick}
        />
        {/* 用户操作区域 */}
        <UserOperateArea onClick={handleUserClick} menus={otherMenus} />
        {/* 用户头像 */}
        <User />
      </div>

      {/* 二级导航菜单栏：无子菜单的一级菜单不展示 */}
      {shouldShowSecondMenu && (
        <div
          className={cx(styles['nav-menus'], 'noselect')}
          style={{
            width: isSecondMenuCollapsed
              ? 0
              : NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH,
            // 桌面端沉浸式：顶部留白避让 nuwaclaw 红绿灯工具栏（与 first-menus 对齐）；
            // 左边框不贯穿避让区（改为下方内部竖线，顶端对齐搜索/新建会话栏）；
            // 浏览器端 undefined 走 less 默认 padding-top / border-left
            paddingTop: isImmersiveShell() ? shellAvoid.TOP : undefined,
            borderLeft: isImmersiveShell() ? 'none' : undefined,
            paddingLeft: isSecondMenuCollapsed ? 0 : token.padding,
            opacity: isSecondMenuCollapsed ? 0 : 1,
            backgroundColor: secondaryBackgroundColor,
          }}
        >
          {/* 桌面端沉浸式：替代 border-left 的竖线，从避让区下沿（搜索/新建会话栏顶部）开始 */}
          {isImmersiveShell() && (
            <div
              style={{
                position: 'absolute',
                top: shellAvoid.TOP + 8, // 与上方 paddingTop 避让高度一致
                bottom: 0,
                left: 0,
                width: 'var(--xagi-line-width)', // 与 less @lineWidth 同源
                background: 'var(--xagi-layout-border-primary)',
              }}
            />
          )}
          <div className={cx(styles['nav-menus-scroll'])}>
            {activeTab === 'homepage' ? (
              renderSecondMenu
            ) : (
              <HoverScrollbar
                className={cx('w-full', 'h-full')}
                bodyWidth={
                  NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH - token.padding * 2
                }
                style={{
                  padding: `${token.paddingSM}px 0`,
                }}
              >
                <div
                  className={cx('flex', 'flex-col', 'h-full')}
                  style={{
                    minHeight: 0,
                  }}
                >
                  {/* 标题 */}
                  <ConditionRender condition={isShowTitle && currentTitle}>
                    <div style={{ padding: '0 12px 12px' }}>
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
                  {renderSecondMenu}
                </div>
              </HoverScrollbar>
            )}
          </div>

          {/* 积分相关入口：放到二级导航栏底部固定展示 */}
          <div className={cx(styles['integral-footer'])}>
            <CreditsBalance />
          </div>
        </div>
      )}

      {/* 收起/展开按钮 */}
      {shouldShowSecondMenu && <CollapseButton />}
    </div>
  );
};

export default ClassicLayout;
