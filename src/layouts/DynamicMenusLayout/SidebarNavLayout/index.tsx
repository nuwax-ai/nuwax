/**
 * 单栏模式布局（style3，主导航改造形态）
 * @description 会话侧栏常驻主列（顶栏+新建任务+会话列表+底部栏）+ 右侧并列二级菜单列；
 *   由 DynamicMenusLayout 分发器按 effectiveNavigationStyle 挂载，桌面端锁定此形态
 */
import HoverScrollbar from '@/components/base/HoverScrollbar';
import ConditionRender from '@/components/ConditionRender';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import { initNuwaClawHostEvents } from '@/services/nuwaClawHostEvents';
import type { MenuItemDto } from '@/types/interfaces/menu';
import {
  isImmersiveShell,
  nuwaClawHost,
  shellAvoid,
} from '@/utils/nuwaClawBridge';
import { jumpTo } from '@/utils/router';
import { EllipsisOutlined } from '@ant-design/icons';
import { theme, Tooltip, Typography } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { history, useModel } from 'umi';
import DynamicSecondMenu from '../DynamicSecondMenu';
// 复用原有组件
import SvgIcon from '@/components/base/SvgIcon';
import { resolveSidebarCollapsePolicy } from '../sidebarCollapsePolicy';
import SidebarNavHeader, { PanelToggleSvg } from '../SidebarNavHeader';
import SidebarSearchModal from '../SidebarSearchModal';
import User from '../User';
import UserAvatar from '../User/UserAvatar';
// 复用原有样式
import {
  MENU_CODE_DOCUMENTS,
  MENU_CODE_MORE_PAGE,
  MENU_CODE_MY_COMPUTER,
  MENU_CODE_NOTIFICATION,
} from '@/constants/menus.constants';
import NewHomeSection from '../NewHomeSection';
import SpaceSection from '../SpaceSection';
import SquareSection from '../SquareSection';
import { useSidebarCollapse } from '../useSidebarCollapse';
import { useMenuNavigation } from '../useMenuNavigation';
import { handleOpenUrl } from '../utils';
import styles from './index.less';

const cx = classNames.bind(styles);
/** 桌面端沉浸式：顶部下移避让 nuwaclaw 工具栏（macOS 红绿灯在其左；Win/Linux 左侧自绘按钮组）。
 *  仅一级/二级菜单列使用。注意：走 @/layouts 的主内容区（page-container）不加避让——
 *  列表页内容会被整体压低（曾误伤）；layout:false 全屏页不做内嵌避让，走新开窗口打开。
 *  尺寸单一来源在 nuwaClawBridge 的 shellAvoid.TOP（与右上角三键避让同源管理），
 *  NUWA_CLAW_PADDING_TOP 保留为兼容导出别名（外部导入点仍引用此名）。 */
export const NUWA_CLAW_PADDING_TOP = shellAvoid.TOP;
/** 展示二级菜单列的 Section 域（主页=会话域，无二级列；工作空间/系统广场固定有） */
const SECOND_MENU_SECTION_TABS = new Set([
  'space',
  'workspace',
  'system_square',
]);
/** 二级菜单列宽度（原型窄列形态，非原二级导航的 240） */
const SECOND_COLUMN_WIDTH = 200;
/** 折叠态展开按钮（主站页形态）：贴屏幕最左侧、与收起按钮同一水平线，
 *  样式/大小/图标与 SidebarNavHeader 的收起按钮完全一致（34×34 图标钮 +
 *  PanelToggleSvg 面板图标）。left: 0 贴死左缘；
 *  top = 侧栏 padding-top 15 + header-bar 顶 padding 5 + 36px 内容行居中偏移 1。
 *  全屏工作台页宿主不用此形态：页面自带头部（返回/标题/状态标签）占据左上角，
 *  原位会压住头部内容，改走 less 的左缘把手变体 sidebar-expand-btn-edge。
 *  定位数值在 TSX 内联注入（避免与 less 双源漂移）。 */
const EXPAND_BTN_SIZE = 34;
const EXPAND_BTN_STYLE: React.CSSProperties = {
  left: 0,
  top: 15 + 5 + 1,
  width: EXPAND_BTN_SIZE,
  height: EXPAND_BTN_SIZE,
};

export interface DynamicMenusLayoutProps {
  /** 覆盖容器样式 */
  overrideContainerStyle?: React.CSSProperties;
  /** 是否为移动端 */
  isMobile?: boolean;
  /** 抑制二级菜单列（全屏工作台页宿主：只保留主会话列，不并列二级列） */
  suppressSecondMenu?: boolean;
}

/**
 * 动态菜单布局组件
 */
const DynamicMenusLayout: React.FC<DynamicMenusLayoutProps> = ({
  overrideContainerStyle,
  isMobile = false,
  suppressSecondMenu = false,
}) => {
  const { token } = theme.useToken();
  const { effectiveNavigationStyle, layoutStyle } = useUnifiedTheme();
  const {
    isSecondMenuCollapsed,
    setIsSecondMenuCollapsed,
    setOpenMessage,
    setOpenAdmin,
  } = useModel('layout');

  // 判断指定一级菜单及其所有子菜单中，是否存在与传入路径匹配的菜单
  const { firstLevelMenus, otherMenus } = useModel('menuModel');

  const { refreshUserInfo, userInfo } = useModel('userInfo');

  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 折叠态展开按钮（原位复刻收起按钮位置，侧栏收起后顶栏不可点）
  const { toggleCollapse } = useSidebarCollapse();

  // 导航状态机（activeTab 路径同步/一级菜单点击等，与经典布局共用单源实现）
  const {
    activeTab,
    setActiveTab,
    isClickNewConversation,
    isClickMenu,
    handlerClick,
    handleTabClick,
  } = useMenuNavigation();

  // 新建任务入口（侧栏顶部操作区）：租户配置未就绪时兜底回首页
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

  // nuwaclaw 桌面端：注册宿主命令监听（工具栏「收起二级菜单」等经此通道下发）
  useEffect(() => {
    return initNuwaClawHostEvents({
      setSecondMenuCollapsed: setIsSecondMenuCollapsed,
    });
  }, [setIsSecondMenuCollapsed]);

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
   * 获取当前一级菜单的标题
   */
  const currentTitle = useMemo(() => {
    if (isClickNewConversation) {
      return dict('PC.Layouts.DynamicMenusLayout.newConversation');
    }
    // if (activeTab === 'my_computer' || activeTab === 'documents') {
    //   return dict('PC.Layouts.DynamicMenusLayout.home');
    // }
    if (activeTab === 'more_page') {
      return dict('PC.Layouts.DynamicMenusLayout.more');
    }
    const current = firstLevelMenus.find(
      (m: MenuItemDto) => m.code === activeTab,
    );
    return current?.name;
  }, [activeTab, firstLevelMenus, isClickNewConversation]);

  /**
   * 是否展示二级菜单列
   * 双列模式（主导航改造二轮）：会话列表常驻主列，选中「有子菜单/Section」的域时
   * 右侧并列展开原二级菜单列；主页=会话域无二级列
   */
  const shouldShowSecondMenu = useMemo(() => {
    // 全屏工作台页宿主：只保留主会话列，不并列二级菜单列
    if (suppressSecondMenu) return false;

    if (!activeTab) return false;

    if (SECOND_MENU_SECTION_TABS.has(activeTab)) {
      return true;
    }

    const currentMenu =
      firstLevelMenus.find((m: MenuItemDto) => m.code === activeTab) ||
      otherMenus.find((m: MenuItemDto) => m.code === activeTab);

    if (!currentMenu) {
      return false;
    }

    return !!currentMenu.children?.length;
  }, [activeTab, firstLevelMenus, otherMenus, suppressSecondMenu]);

  // 桌面端：把「当前页是否有二级菜单」同步给 nuwaclaw 壳，工具栏据此显隐收起按钮。
  // 布局卸载（如 /Login 等无布局页）时推 false。
  // 浏览器端接入层 no-op。路由切换间 cleanup→mount 的瞬时 false 会被新值立即覆盖。
  useEffect(() => {
    nuwaClawHost.layout.setSecondMenuAvailable(shouldShowSecondMenu);
    return () => nuwaClawHost.layout.setSecondMenuAvailable(false);
  }, [shouldShowSecondMenu]);

  // 桌面端：把二级菜单真实收起态同步给壳（壳工具栏 icon 以此为准）。
  // webview reload 后壳本地态不重置、且 reload 瞬间的 toggle 命令可能丢失——
  // 推送真实值可校正失同步（toggle 后本 effect 也会随状态变化即时回推）。
  useEffect(() => {
    nuwaClawHost.layout.setSecondMenuCollapsed(isSecondMenuCollapsed);
  }, [isSecondMenuCollapsed]);

  /**
   * 是否显示标题
   */
  const isShowTitle = useMemo(() => {
    // 工作空间不显示标题（因为有自己的标题组件）
    // 支持静态菜单的 'space' 和 动态菜单的 'workspace'
    return activeTab !== 'space' && activeTab !== 'workspace';
  }, [activeTab]);

  /**
   * 二级导航背景
   */
  const secondaryBackgroundColor = useMemo(() => {
    if (isMobile) {
      return token.colorBgContainer;
    }
    return effectiveNavigationStyle === 'style2'
      ? 'var(--xagi-layout-bg-container, rgba(255, 255, 255, 0.95))'
      : 'transparent';
  }, [isMobile, effectiveNavigationStyle, token.colorBgContainer]);

  /**
   * 导航容器样式类名
   */
  const navigationClassName = useMemo(() => {
    return cx(
      styles.container,
      'flex',
      `xagi-layout-${layoutStyle}`,
      `xagi-nav-${effectiveNavigationStyle}`,
      isMobile && styles['mobile-container'],
    );
  }, [layoutStyle, effectiveNavigationStyle, isMobile]);

  /**
   * 渲染二级菜单列内容
   * 双列模式：会话列表常驻主列，此处仅渲染选中域的原二级菜单（原二级菜单保留）
   */
  const renderSecondMenu = useMemo(() => {
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

  const { primarySidebarCollapsed, secondMenuVisible } =
    resolveSidebarCollapsePolicy({
      collapsed: isSecondMenuCollapsed,
      immersiveShell: isImmersiveShell(),
      secondMenuAvailable: shouldShowSecondMenu,
    });

  return (
    <div className={navigationClassName}>
      {/* 会话侧栏列（常驻）：顶栏(Logo+搜索+折叠) + 新建任务 + 导航行(接口) +
          会话列表(三tab) + 底部栏(用户+消息/设备/更多) */}
      <div
        className={cx(styles['nav-menus'], 'noselect')}
        style={{
          width: primarySidebarCollapsed
            ? 0
            : NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH,
          // 桌面端沉浸式：顶部留白避让 nuwaclaw 红绿灯工具栏；
          // 一级栏已移除，浏览器端也不再需要 border-left（侧栏即最左列）
          paddingTop: isImmersiveShell() ? shellAvoid.TOP : undefined,
          borderLeft: 'none',
          paddingLeft: 0,
          opacity: primarySidebarCollapsed ? 0 : 1,
          backgroundColor: secondaryBackgroundColor,
        }}
      >
        {/* 桌面端沉浸式：左缘竖线，从避让区下沿开始（保持原视觉分隔） */}
        {isImmersiveShell() && (
          <div
            style={{
              position: 'absolute',
              top: shellAvoid.TOP + 8,
              bottom: 0,
              left: 0,
              width: 'var(--xagi-line-width)', // 与 less @lineWidth 同源
              background: 'var(--xagi-layout-border-primary)',
            }}
          />
        )}
        <SidebarNavHeader
          menus={firstLevelMenus}
          activeTab={activeTab}
          onMenuClick={handleTabClick}
          onNewTask={handleNewTask}
        />
        <div className={cx(styles['nav-menus-scroll'])}>
          <NewHomeSection style={overrideContainerStyle} />
        </div>

        {/* 底部栏：用户行（左，弹层内含积分）+ 分离菜单 icon（右：消息/设备/更多/文档，走接口） */}
        <div className={cx(styles['sidebar-footer'])}>
          <User placement="rightTop">
            <div
              className={cx(styles['sidebar-user-row'])}
              onClick={() => setOpenAdmin(true)}
            >
              <UserAvatar
                avatar={userInfo?.avatar}
                onClick={() => setOpenAdmin(true)}
              />
              <span className={cx(styles['sidebar-user-name'])}>
                {userInfo?.nickName ||
                  userInfo?.userName ||
                  dict('PC.Components.UserMenu.defaultUserName')}
              </span>
            </div>
          </User>
          <div className={cx(styles['footer-actions'])}>
            {(otherMenus || []).map((menu: MenuItemDto) => (
              <Tooltip key={menu.code} title={menu.name} arrow={false}>
                <div
                  className={cx(styles['footer-action-btn'])}
                  onClick={() => handleUserClick(menu)}
                >
                  {menu.icon ? (
                    <SvgIcon name={menu.icon} />
                  ) : menu.code === MENU_CODE_MORE_PAGE ? (
                    /* 更多：后端未配图标，按原型以 "..." 呈现 */
                    <EllipsisOutlined />
                  ) : null}
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* 二级菜单列：选中「有子菜单/Section」的域时在会话列右侧并列展开（原二级菜单保留） */}
      {secondMenuVisible && (
        <div
          className={cx(styles['second-column'], 'noselect')}
          style={{
            width: SECOND_COLUMN_WIDTH,
            paddingTop: isImmersiveShell() ? shellAvoid.TOP : undefined,
            backgroundColor: secondaryBackgroundColor,
          }}
        >
          <div className={cx(styles['nav-menus-scroll'])}>
            {activeTab === 'space' || activeTab === 'workspace' ? (
              renderSecondMenu
            ) : (
              <HoverScrollbar
                className={cx('w-full', 'h-full')}
                bodyWidth={SECOND_COLUMN_WIDTH - token.padding * 2}
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
                  {/* 标题（选中导航项名称） */}
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
        </div>
      )}

      {/* 折叠态展开按钮。主站页：原位复刻收起按钮位置（顶栏随侧栏收起而不可点，
          按钮浮于页面内容上层同位复现）；全屏工作台页宿主：页面自带头部
          （返回/标题/状态标签）占据左上角，原位会压住头部内容，改用左缘居中
          把手形态（贴边半胶囊、hover 实显），不与页面 UI 抢位。
          沉浸式桌面壳不渲染：整条侧栏的收起/展开由壳顶栏 ☰ 承担，
          浮出钮在桌面上会与 ☰ 重复并压住内容区左上角 */}
      {primarySidebarCollapsed && !isImmersiveShell() && (
        <Tooltip
          title={dict(
            'PC.Layouts.DynamicMenusLayout.CollapseButton.expandMenu',
          )}
          placement={suppressSecondMenu ? 'right' : 'bottom'}
          arrow={false}
        >
          <div
            className={cx(
              styles['sidebar-expand-btn'],
              suppressSecondMenu && styles['sidebar-expand-btn-edge'],
            )}
            style={suppressSecondMenu ? undefined : EXPAND_BTN_STYLE}
            onClick={toggleCollapse}
          >
            {/* 与收起按钮同款面板图标（flip=展开方向镜像） */}
            <PanelToggleSvg flip />
          </div>
        </Tooltip>
      )}

      {/* 搜索弹窗（命令面板）：顶栏搜索 icon / ⌘K 触发 */}
      <SidebarSearchModal />
    </div>
  );
};

export default DynamicMenusLayout;
