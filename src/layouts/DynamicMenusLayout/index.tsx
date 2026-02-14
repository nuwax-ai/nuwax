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
import type { MenuItemDto } from '@/types/interfaces/menu';
import { theme, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
import DynamicSecondMenu from './DynamicSecondMenu';
import DynamicTabs from './DynamicTabs';
// 复用原有组件
import CollapseButton from './CollapseButton';
import Header from './Header';
import User from './User';
import UserOperateArea from './UserOperateArea';
// 复用原有样式
import { PATH_URL } from '@/constants/home.constants';
import useConversation from '@/hooks/useConversation';
import { OpenTypeEnum } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import EcosystemMarketSection from './EcosystemMarketSection';
import HomeSection from './HomeSection';
import styles from './index.less';
import SpaceSection from './SpaceSection';
import SquareSection from './SquareSection';

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
  overrideContainerStyle,
  isMobile = false,
}) => {
  const location = useLocation();
  const { token } = theme.useToken();
  const { navigationStyle, layoutStyle } = useUnifiedTheme();
  const {
    // showHoverMenu,
    isSecondMenuCollapsed,
    setOpenMessage,
    handleCloseMobileMenu,
  } = useModel('layout');
  const { loadMenus, firstLevelMenus, otherMenus } = useModel('menuModel');

  const { refreshUserInfo } = useModel('userInfo');

  // 工作空间下的最近编辑和开发收藏
  const { runEdit, runDevCollect } = useModel('devCollectAgent');

  // 当前激活的一级菜单 code
  const [activeTab, setActiveTab] = useState<string>('');

  // 是否点击了新对话菜单，特殊处理，用于显示title时使用
  const [isClickNewConversation, setIsClickNewConversation] =
    useState<boolean>(false);

  // 创建智能体会话
  const { handleCreateConversation } = useConversation();
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 是否点击菜单
  // const isClickMenu = useRef<boolean>(false);

  const handlerClick = async () => {
    if (tenantConfigInfo) {
      // 创建智能体会话
      await handleCreateConversation(tenantConfigInfo.defaultAgentId);
    }
  };

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
      } else {
        // 通用处理：取第一个斜杠后的路径段进行匹配
        // 例如 pathname 为 /system/demo，menuPathWithoutQuery 为 /system/menu/xxx
        // 则都取第一个非空段 system 进行比较
        const getFirstSegment = (p: string) =>
          p.split('?')[0].split('/').filter(Boolean)[0] || '';

        const pathFirstSegment = getFirstSegment(pathname);
        const menuFirstSegment = getFirstSegment(menuPathWithoutQuery);

        if (menuFirstSegment && menuFirstSegment === pathFirstSegment) {
          return true;
        }
      }
    }

    return false;
  };

  /**
   * 检查路径是否匹配（用于子菜单的精确匹配）
   * @param menuPath 菜单路径
   * @param pathname 当前路径
   * @returns 是否匹配
   */
  const isPathMatch = useCallback(
    (menuPath: string, pathname: string): boolean => {
      if (!menuPath) return false;

      // 移除查询参数
      const menuPathWithoutQuery = menuPath.split('?')[0];

      // 精确匹配
      if (pathname === menuPathWithoutQuery) {
        return true;
      }

      // 前缀匹配（例如 /system/menu 匹配 /system/menu/xxx）
      if (pathname.startsWith(menuPathWithoutQuery + '/')) {
        return true;
      }

      // 处理动态路径（例如 /space/:spaceId/develop）
      if (menuPathWithoutQuery.includes(':')) {
        // 将动态路径转换为正则表达式
        const pattern = menuPathWithoutQuery.replace(/:(\w+)/g, '[^/]+');
        const regex = new RegExp(`^${pattern}(/.*)?$`);
        return regex.test(pathname);
      }

      return false;
    },
    [],
  );

  /**
   * 递归查找匹配路径的菜单，并返回其第一级父菜单的 code
   * @param menus 菜单列表
   * @param pathname 当前路径
   * @param firstLevelCode 第一级菜单的 code（用于递归时传递）
   * @returns 匹配菜单的第一级父菜单的 code，如果未找到则返回 null
   */
  const findFirstLevelCodeByPath = useCallback(
    (
      menus: MenuItemDto[],
      pathname: string,
      firstLevelCode?: string,
    ): string | null => {
      for (const menu of menus) {
        // 如果是第一级菜单，记录其 code
        const currentFirstLevelCode = firstLevelCode || menu.code;

        // 检查当前菜单是否匹配（一级菜单使用 isMenuMatch，子菜单使用 isPathMatch）
        const isMatch = firstLevelCode
          ? isPathMatch(menu.path || '', pathname)
          : isMenuMatch(menu, pathname);

        if (isMatch) {
          return currentFirstLevelCode || null;
        }

        // 如果有子菜单，递归查找
        if (menu.children && menu.children.length > 0) {
          const foundCode = findFirstLevelCodeByPath(
            menu.children,
            pathname,
            currentFirstLevelCode,
          );
          if (foundCode) {
            return foundCode;
          }
        }
      }
      return null;
    },
    [isMenuMatch, isPathMatch],
  );

  // 初始化加载菜单数据
  useEffect(() => {
    loadMenus();

    // 获取用户信息
    refreshUserInfo();
  }, []);

  // 新对话菜单特殊处理
  const handleNewConversation = useCallback(() => {
    // 找到新对话菜单在同级别菜单中的位置，然后设置 activeTab 为下一个菜单
    const currentIndex = firstLevelMenus.findIndex(
      (m: MenuItemDto) => m.code === 'new_conversation',
    );
    if (currentIndex !== -1 && currentIndex < firstLevelMenus.length - 1) {
      // 如果存在下一个菜单，设置为下一个菜单
      const nextMenu = firstLevelMenus[currentIndex + 1];
      setActiveTab(nextMenu.code as string);
    }
  }, [firstLevelMenus]);

  // 刷新的时候触发，如果点击了一级菜单，则不触发
  // 根据路径匹配当前激活的一级菜单
  useEffect(() => {
    // if (isClickMenu.current) {
    //   return;
    // }

    if (!firstLevelMenus.length) return;

    // 查找匹配当前路径的菜单
    const matchedMenu = firstLevelMenus.find((menu: MenuItemDto) =>
      isMenuMatch(menu, location.pathname),
    );

    if (matchedMenu && matchedMenu.code !== 'new_conversation') {
      setActiveTab(matchedMenu.code);
    }
    // 根路径如果是新对话菜单,新对话菜单不显示
    else if (location.pathname === '' || location.pathname === '/') {
      if (firstLevelMenus[0].code !== 'new_conversation') {
        setActiveTab(firstLevelMenus[0].code);
      } else {
        // 新对话菜单特殊处理
        handleNewConversation();
      }
    }
    // 首页
    else if (location.pathname === '/home') {
      // 默认选中首页
      setActiveTab('homepage');
    }
    // 我的电脑管理
    else if (location.pathname === '/my-computer-manage') {
      setActiveTab('my_computer');
    } else {
      // 递归查找匹配的子菜单，并获取其第一级父菜单的 code
      const firstLevelCode = findFirstLevelCodeByPath(
        firstLevelMenus,
        location.pathname,
      );

      if (firstLevelCode && firstLevelCode !== 'new_conversation') {
        setActiveTab(firstLevelCode);
      } else if (firstLevelCode === 'new_conversation') {
        handleNewConversation();
      } else {
        // 如果第一级菜单没有匹配到，则获取除新对话菜单外的第一个菜单
        const filteredNewConversationFirstLevelMenus = firstLevelMenus.filter(
          (menu: MenuItemDto) => menu.code !== 'new_conversation',
        );
        setActiveTab(filteredNewConversationFirstLevelMenus[0]?.code || '');
      }
    }
  }, [location.pathname, firstLevelMenus, handleNewConversation]);

  const handleRefreshEditAndCollect = useCallback(() => {
    // 最近编辑
    runEdit({
      size: 5,
    });
    // 开发收藏
    runDevCollect({
      page: 1,
      size: 5,
    });
  }, [runEdit, runDevCollect]);

  /**
   * 递归查找第一个有 path 的子菜单
   * 如果第一个子菜单没有 path 但有 children，继续递归查找
   */
  const findFirstChildWithPath = useCallback(
    (menu: MenuItemDto): MenuItemDto | null => {
      // 如果当前菜单有 path，直接返回
      if (menu.path) {
        return menu;
      }

      // 如果没有子菜单，返回 null
      if (!menu.children?.length) {
        return null;
      }

      // 获取第一个子菜单
      const firstChild = menu.children[0];

      // 递归查找第一个子菜单的 path
      return findFirstChildWithPath(firstChild);
    },
    [],
  );

  /**
   * 打开URL
   * @param path 路径
   * @param openType 打开方式
   */
  const handleOpenUrl = (
    path: string,
    openType: OpenTypeEnum = OpenTypeEnum.CurrentTab,
  ) => {
    if (openType === OpenTypeEnum.NewTab) {
      window.open(path, '_blank');
      return;
    }
    history.push(`/open-iframe-page?url=${encodeURIComponent(path)}`);
  };

  /**
   * 点击一级菜单
   */
  const handleTabClick = useCallback(
    (menu: MenuItemDto) => {
      if (menu.path?.includes('http')) {
        handleOpenUrl(menu.path, menu?.openType);
        return;
      }

      // 是否点击了一级菜单
      // isClickMenu.current = true;
      // 关闭移动端菜单
      handleCloseMobileMenu();

      // 新对话,特殊处理，因为新对话时，不能选中新对话的菜单，需要跳转到下一个菜单
      if (menu.code === 'new_conversation') {
        // 如果用户匹配了路径，则处理路径，否则按照原逻辑创建智能体会话
        if (menu.path) {
          if (menu.path.includes('http')) {
            handleOpenUrl(menu.path, menu?.openType);
          } else {
            history.push(menu.path);
          }
        } else {
          handlerClick();

          setIsClickNewConversation(true);

          // 新对话菜单特殊处理
          handleNewConversation();
        }
        return;
      }

      // 点击其他菜单，则设置为 false
      setIsClickNewConversation(false);

      setActiveTab(menu.code || '');

      if (menu.code === 'workspace') {
        handleRefreshEditAndCollect();

        // 防止系统设置中工作空间没有设置路径，导致跳转失败
        const url = menu.path || '/space';
        history.push(url, { _t: Date.now() });
        return;
      }

      try {
        // 从缓存中获取当前路径，如果存在且匹配当前菜单，则直接跳转
        const pathUrl = localStorage.getItem(PATH_URL);
        if (pathUrl && menu.code) {
          const pathUrlObj = JSON.parse(pathUrl);
          const pathUrlValue = pathUrlObj[menu.code];
          if (pathUrlValue && !pathUrlValue.includes(':')) {
            history.push(pathUrlValue, { _t: Date.now() });
            return;
          }
        }
      } catch {}

      if (menu.path) {
        history.push(menu.path, { _t: Date.now() });
      } else if (menu.children?.length) {
        // 递归查找第一个有 path 的子菜单
        const firstPathMenu = findFirstChildWithPath(menu);
        if (firstPathMenu) {
          // http开头的路径，直接打开
          if (firstPathMenu.path?.includes('http')) {
            handleOpenUrl(firstPathMenu.path, firstPathMenu?.openType);
            return;
          }
          // 其他路径，跳转路由
          history.push(firstPathMenu.path, { _t: Date.now() });
        }
      }
    },
    [
      handleCloseMobileMenu,
      findFirstChildWithPath,
      handleRefreshEditAndCollect,
      handlerClick,
      handleNewConversation,
    ],
  );

  /**
   * 用户区域操作
   */
  const handleUserClick = useCallback(
    (menu: MenuItemDto) => {
      const code = menu.code;
      switch (code) {
        case 'documents':
          handleOpenUrl(menu.path || SITE_DOCUMENT_URL, menu?.openType);
          break;
        case 'notification':
          setOpenMessage(true);
          break;
        case 'my_computer':
          {
            setActiveTab(code || '');
            history.push('/my-computer-manage', { _t: Date.now() });
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
      return '新对话';
    }
    if (activeTab === 'my_computer') {
      return '主页';
    }
    const current = firstLevelMenus.find(
      (m: MenuItemDto) => m.code === activeTab,
    );
    return current?.name;
  }, [activeTab, firstLevelMenus, isClickNewConversation]);

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
      activeTab === 'homepage' ||
      activeTab === 'new_conversation' ||
      activeTab === 'my_computer'
    ) {
      return <HomeSection style={overrideContainerStyle} />;
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

    // 生态市场
    if (activeTab === 'eco_market') {
      return <EcosystemMarketSection style={overrideContainerStyle} />;
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
        <UserOperateArea onClick={handleUserClick} menus={otherMenus} />
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
      </div>

      {/* 收起/展开按钮 */}
      <CollapseButton />
    </div>
  );
};

export default DynamicMenusLayout;
