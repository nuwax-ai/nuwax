/**
 * 动态菜单布局组件
 * @description 完全独立于原有 MenusLayout，使用后端返回的菜单数据渲染
 *
 * 特点：
 * 1. 从 menuModel 获取动态菜单数据
 * 2. 支持一级、二级、三级菜单
 * 3. 复用现有的 Header、User、UserOperateArea、TabItem、SecondMenuItem 等组件
 * 4. 样式与原有 MenusLayout 完全一致
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
// 复用原有样式
import MenuListItem from '@/components/base/MenuListItem';
import { AgentInfo } from '@/types/interfaces/agent';
import DevCollect from '../MenusLayout/SpaceSection/DevCollect';
import SpaceTitle from '../MenusLayout/SpaceSection/SpaceTitle';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface DynamicMenusLayoutProps {
  /** 覆盖容器样式 */
  // overrideContainerStyle?: React.CSSProperties;
  /** 是否为移动端 */
  isMobile?: boolean;
}

/**
 * 动态菜单布局组件
 */
const DynamicMenusLayout: React.FC<DynamicMenusLayoutProps> = ({
  // overrideContainerStyle: _overrideContainerStyle,
  isMobile = false,
}) => {
  const location = useLocation();
  const { token } = theme.useToken();
  const { navigationStyle, layoutStyle } = useUnifiedTheme();
  const { isSecondMenuCollapsed, setOpenMessage, handleCloseMobileMenu } =
    useModel('layout');
  const { loadMenus, firstLevelMenus } = useModel('menuModel');

  const { currentSpaceInfo } = useModel('spaceModel');
  // 工作空间下的最近编辑和开发收藏
  const { editAgentList, runEdit, runDevCollect } = useModel('devCollectAgent');

  // 当前激活的一级菜单 code
  const [activeTab, setActiveTab] = useState<string>('');

  // 初始化加载菜单数据
  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  /**
   * 递归检查菜单是否匹配当前路径
   */
  const isMenuMatch = (menu: MenuItemDto, pathname: string): boolean => {
    // 检查当前菜单路径
    if (menu.path) {
      // 移除查询参数（? 及后面的部分），因为 pathname 不包含查询参数
      const menuPathWithoutQuery = menu.path.split('?')[0];

      // 首页特殊处理 homepage 是动态菜单的编码，/home 是前端路由
      if (menuPathWithoutQuery === '/homepage' || menuPathWithoutQuery === '') {
        if (pathname === '/home' || pathname === '') return true;
      }
      // 工作空间特殊处理，menu.path为/space 是工作空间的编码，pathname为/space/:spaceId/develop 是前端路由
      else if (
        menuPathWithoutQuery === '/space' ||
        menuPathWithoutQuery === '/workspace'
      ) {
        return pathname.startsWith(menuPathWithoutQuery);
      } else if (pathname.includes('ecosystem')) {
        // 生态市场特殊处理，pathname为/ecosystem/plugin 是前端路由
        return menuPathWithoutQuery.startsWith('/ecosystem');
      } else if (menuPathWithoutQuery.startsWith(pathname)) {
        return true;
      }
    }

    // 递归检查子菜单
    // if (menu.children?.length) {
    //   return menu.children.some((child) => isMenuMatch(child, pathname));
    // }

    return false;
  };

  // 根据路径匹配当前激活的一级菜单
  useEffect(() => {
    if (!firstLevelMenus.length) return;

    // 查找匹配当前路径的菜单
    const matchedMenu = firstLevelMenus.find((menu: MenuItemDto) =>
      isMenuMatch(menu, location.pathname),
    );

    if (matchedMenu) {
      setActiveTab(matchedMenu.code);
    } else if (location.pathname === '/' || location.pathname === '') {
      // 默认选中首页
      const homeMenu = firstLevelMenus.find(
        (m: MenuItemDto) => m.code === 'homepage' || m.path === '/',
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

      setActiveTab(menu.code as string);

      console.log('menu:点击一级菜单:', menu);
      if (menu.code === 'workspace') {
        // 最近编辑
        runEdit({
          size: 5,
        });
        // 开发收藏
        runDevCollect({
          page: 1,
          size: 5,
        });

        // 防止系统设置中工作空间没有设置路径，导致跳转失败
        const url = menu.path || '/space';
        history.push(url);
      }

      if (menu.path) {
        history.push(menu.path);
      } else if (menu.children?.length) {
        // 查找第一个存在 path 的子菜单
        const firstChildWithPath = menu.children.find((child) => child.path);
        if (firstChildWithPath?.path) {
          history.push(firstChildWithPath.path);
        }
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
    const current = firstLevelMenus.find(
      (m: MenuItemDto) => m.code === activeTab,
    );
    return current?.name;
  }, [activeTab, firstLevelMenus]);

  /**
   * 是否显示标题
   */
  const isShowTitle = useMemo(() => {
    // 工作空间不显示标题（因为有自己的标题组件）
    // 支持静态菜单的 'space' 和 动态菜单的 'workspace'
    return activeTab !== 'space' && activeTab !== 'workspace';
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

  // 点击进入"工作空间智能体"
  const handleClick = (info: AgentInfo) => {
    const { agentId, spaceId } = info;
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

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
            padding: `${token.paddingSM}px 0`,
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
            {
              // 非工作空间一级菜单
              isShowTitle ? (
                <>
                  {/* 标题 */}
                  <ConditionRender condition={currentTitle}>
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
                  <DynamicSecondMenu parentCode={activeTab} />
                </>
              ) : (
                <div className={cx('h-full', 'overflow-y', styles.container)}>
                  <div style={{ padding: '14px 12px' }}>
                    <SpaceTitle name={currentSpaceInfo?.name} />
                  </div>

                  <DynamicSecondMenu parentCode={activeTab} />
                  {/* <div>
                  {getSpaceApplicationList(tenantConfigInfo?.enabledSandbox).map(
                    (item: SpaceApplicationList, index: number) => {
                      // 个人空间时，不显示"成员与设置", 普通用户也不显示"成员与设置"
                      if (
                        (currentSpaceInfo?.type === SpaceTypeEnum.Personal ||
                          currentSpaceInfo?.currentUserRole === RoleEnum.User) &&
                        item.type === SpaceApplicationListEnum.Team_Setting
                      ) {
                        return null;
                      }
                      // “开发者功能”【tips：关闭后，用户将无法看见“智能体开发”和“组件库”，创建者和管理员不受影响】
                      if (
                        currentSpaceInfo?.currentUserRole === RoleEnum.User &&
                        currentSpaceInfo?.allowDevelop === AllowDevelopEnum.Not_Allow &&
                        [
                          SpaceApplicationListEnum.Application_Develop,
                          SpaceApplicationListEnum.Component_Library,
                        ].includes(item.type)
                      ) {
                        return null;
                      }
                      return (
                        <SecondMenuItem
                          key={item.type}
                          isFirst={index === 0}
                          name={item.text}
                          isActive={handleActive(item.type)}
                          icon={item.icon}
                          onClick={() => handlerApplication(item.type)}
                        />
                      );
                    },
                  )}
                </div> */}
                  <ConditionRender condition={editAgentList?.length}>
                    <h3 className={cx(styles['collection-title'])}>最近编辑</h3>
                    <div className="flex flex-col gap-4">
                      {editAgentList?.map((item: AgentInfo) => (
                        <MenuListItem
                          key={item.id}
                          onClick={() => handleClick(item)}
                          icon={item.icon}
                          name={item.name}
                        />
                      ))}
                    </div>
                  </ConditionRender>
                  <h3 className={cx(styles['collection-title'])}>开发收藏</h3>
                  <DevCollect />
                </div>
              )
            }
          </div>
        </HoverScrollbar>
      </div>

      {/* 收起/展开按钮 */}
      <CollapseButton />
    </div>
  );
};

export default DynamicMenusLayout;
