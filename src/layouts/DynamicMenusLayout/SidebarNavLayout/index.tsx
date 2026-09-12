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
import { isImmersiveShell, shellAvoid } from '@/utils/nuwaClawBridge';
import { jumpTo } from '@/utils/router';
import { EllipsisOutlined } from '@ant-design/icons';
import { theme, Tooltip, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo } from 'react';
import { history, useLocation, useModel } from 'umi';
import DynamicSecondMenu from '../DynamicSecondMenu';
// 复用原有组件
import SvgIcon from '@/components/base/SvgIcon';
import {
  resolveCurrentTitle,
  resolveIsShowTitle,
  resolveSecondaryBackgroundColor,
  resolveSecondMenuVisibility,
} from '../secondMenuPolicy';
import { resolveSidebarCollapsePolicy } from '../sidebarCollapsePolicy';
import SidebarNavHeader, { PanelToggleSvg } from '../SidebarNavHeader';
import SidebarSearchModal from '../SidebarSearchModal';
import { resolveNavHighlightTab } from '../sidebarSelectionPolicy';
import User from '../User';
import UserAvatar from '../User/UserAvatar';
import { useSecondMenuShellSync } from '../useSecondMenuShellSync';
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
import { useMenuNavigation } from '../useMenuNavigation';
import { useSidebarCollapse } from '../useSidebarCollapse';
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
/**
 * 二级列滚动体宽扣算：两侧 10px 内缩 ×2 + 右描边 1px，与 .second-column 的
 * padding（原型 tm-side 10px）联动——改 CSS 须同步改这里，否则行 pill 左右不对称
 */
const SECOND_COLUMN_SCROLL_BODY_INSET = 21;
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

  const location = useLocation();

  // 导航行高亮决策走策略单源（sidebarSelectionPolicy）：会话详情路由下抑制
  // homepage 兜底高亮，选中关系收敛到会话列表行（2026-09-12 定调）。
  // activeTab 本体保持 homepage——单栏会话列表常驻、二级列判定不受影响；
  // 经典布局 renderSecondMenu 依赖 homepage 渲染会话列表，抑制只在单栏消费
  const navHighlightTab = useMemo(
    () => resolveNavHighlightTab(activeTab, location.pathname),
    [activeTab, location.pathname],
  );

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
   * 是否展示二级菜单列（策略单源：Section 域常显，其余看当前菜单有无 children）。
   * 双列模式（主导航改造二轮）：会话列表常驻主列，选中「有子菜单/Section」的域时
   * 右侧并列展开原二级菜单列；主页=会话域无二级列（Section 集合不含 homepage）。
   * suppressSecondMenu=全屏工作台页宿主：只保留主会话列，门控留在布局侧
   */
  const shouldShowSecondMenu = useMemo(() => {
    if (suppressSecondMenu) return false;
    return resolveSecondMenuVisibility({
      activeTab,
      sectionTabs: SECOND_MENU_SECTION_TABS,
      firstLevelMenus,
      otherMenus,
    });
  }, [activeTab, firstLevelMenus, otherMenus, suppressSecondMenu]);

  // 桌面端：二级菜单列可用/收起态 ↔ nuwaclaw 壳同步（双布局单源 hook，
  // 浏览器端接入层 no-op）
  useSecondMenuShellSync(shouldShowSecondMenu, isSecondMenuCollapsed);

  /**
   * 是否显示标题（策略单源：工作空间有自己的标题组件）
   */
  const isShowTitle = useMemo(() => resolveIsShowTitle(activeTab), [activeTab]);

  /**
   * 二级导航背景（策略单源：本布局仅 style3 挂载，实际恒走透明分支；
   * style2 半透明白分支服务经典布局）
   */
  const secondaryBackgroundColor = useMemo(
    () =>
      resolveSecondaryBackgroundColor({
        isMobile,
        navigationStyle: effectiveNavigationStyle,
        colorBgContainer: token.colorBgContainer,
      }),
    [isMobile, effectiveNavigationStyle, token.colorBgContainer],
  );

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
          activeTab={navHighlightTab}
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
            // 底色交给 less（原型 #fafafa，2026-09-12）：此处原内联 transparent
            // 会盖掉 less 背景，移除后单栏二级列按原型配色渲染
          }}
        >
          <div className={cx(styles['nav-menus-scroll'])}>
            {activeTab === 'space' || activeTab === 'workspace' ? (
              renderSecondMenu
            ) : (
              <HoverScrollbar
                className={cx('w-full', 'h-full')}
                // 扣算口径与联动说明见 SECOND_COLUMN_SCROLL_BODY_INSET 定义处；
                // 曾按 token.padding*2(32px) 扣宽，容器内缩改 10px 后右侧多出 11px 空隙
                bodyWidth={
                  SECOND_COLUMN_WIDTH - SECOND_COLUMN_SCROLL_BODY_INSET
                }
                // 滚动条贴列右缘（2026-09-12 需求）：外扩进右 padding 带，不叠压行内容
                scrollbarEdge
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
                    {/* 水平 10px 与行内容（容器 10 + 行 padding 10 = 20px）对齐 */}
                    <div style={{ padding: '0 10px 12px' }}>
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
