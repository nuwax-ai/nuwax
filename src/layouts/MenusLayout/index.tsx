import ConditionRender from '@/components/ConditionRender';
import HoverScrollbar from '@/components/base/HoverScrollbar';
import { DOCUMENT_URL, SITE_DOCUMENT_URL } from '@/constants/common.constants';
import { NAVIGATION_LAYOUT_SIZES } from '@/constants/layout.constants';
import useCategory from '@/hooks/useCategory';
import useConversation from '@/hooks/useConversation';
import { useLayoutStyle } from '@/hooks/useLayoutStyle';
import SystemSection from '@/layouts/MenusLayout/SystemSection';
import { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { theme, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
import CollapseButton from './CollapseButton';
import EcosystemMarketSection from './EcosystemMarketSection';
import Header from './Header';
import HomeSection from './HomeSection';
import SpaceSection from './SpaceSection';
import SquareSection from './SquareSection';
import Tabs from './Tabs';
import User from './User';
import UserOperateArea from './UserOperateArea';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 菜单布局组件
 */
const MenusLayout: React.FC<{
  overrideContainerStyle?: React.CSSProperties;
  isMobile?: boolean;
}> = ({ overrideContainerStyle, isMobile = false }) => {
  const location = useLocation();
  const { setOpenMessage, isSecondMenuCollapsed } = useModel('layout');
  const [tabType, setTabType] = useState<TabsEnum>();
  const { asyncSpaceListFun } = useModel('spaceModel');
  const { runTenantConfig, tenantConfigInfo } = useModel('tenantConfigInfo');
  const { runEdit, runDevCollect } = useModel('devCollectAgent');
  const { runHistory, runUsed } = useModel('conversationHistory');
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');
  const { runQueryCategory } = useCategory();
  const { token } = theme.useToken();
  // 创建智能体会话
  const { handleCreateConversation } = useConversation();
  // 导航风格管理（使用独立的布局风格系统）
  const { navigationStyle, layoutStyle } = useLayoutStyle();

  const handleCreateChat = useCallback(async () => {
    if (tenantConfigInfo) {
      // 创建智能体会话
      await handleCreateConversation(tenantConfigInfo.defaultAgentId);
    }
  }, [tenantConfigInfo]);
  // 点击主页
  const handleClickHome = () => {
    // 最近使用
    runUsed({
      size: 8,
    });
    // 会话记录
    runHistory({
      agentId: null,
    });
    history.push('/');
  };

  // 点击工作空间
  const handleClickSpace = async () => {
    // 最近编辑
    runEdit({
      size: 8,
    });
    // 开发收藏
    runDevCollect({
      page: 1,
      size: 8,
    });
    history.push('/space');
  };

  // 切换tab
  const handleTabsClick = useCallback(
    async (type: TabsEnum) => {
      // 关闭移动端菜单
      handleCloseMobileMenu();

      switch (type) {
        case TabsEnum.NewChat:
          handleCreateChat();
          break;
        case TabsEnum.Home:
          handleClickHome();
          break;
        case TabsEnum.Space:
          await handleClickSpace();
          break;
        case TabsEnum.Square:
          history.push(`/square?cate_type=${SquareAgentTypeEnum.Agent}`);
          break;
        case TabsEnum.System_Manage:
          history.push('/system/user/manage');
          break;
        case TabsEnum.Ecosystem_Market:
          history.push('/ecosystem');
          break;
        case TabsEnum.Course_System:
          window.open(DOCUMENT_URL);
          break;
      }
    },
    [handleCreateChat],
  );

  useEffect(() => {
    // 查询广场menus列表
    runQueryCategory();
    // 租户配置信息查询接口
    runTenantConfig();
    // 工作空间列表查询接口
    asyncSpaceListFun();
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/space')) {
      setTabType(TabsEnum.Space);
    } else if (location.pathname.includes('/square')) {
      setTabType(TabsEnum.Square);
    } else if (location.pathname.includes('/system')) {
      setTabType(TabsEnum.System_Manage);
    } else if (location.pathname.includes('/ecosystem')) {
      setTabType(TabsEnum.Ecosystem_Market);
    } else {
      setTabType(TabsEnum.Home);
    }
  }, [location.pathname]);

  // 用户区域操作
  const handleUserClick = useCallback((type: UserOperatorAreaEnum) => {
    switch (type) {
      case UserOperatorAreaEnum.Document:
        window.open(SITE_DOCUMENT_URL);
        break;
      case UserOperatorAreaEnum.Message:
        setOpenMessage(true);
        break;
    }
  }, []);

  // 内容区域
  const Content: React.FC = useCallback(() => {
    switch (tabType) {
      case TabsEnum.Home:
        return <HomeSection style={overrideContainerStyle} />;
      case TabsEnum.Space:
        return <SpaceSection style={overrideContainerStyle} />;
      case TabsEnum.Square:
        return <SquareSection style={overrideContainerStyle} />;
      case TabsEnum.System_Manage:
        return <SystemSection style={overrideContainerStyle} />;
      case TabsEnum.Ecosystem_Market:
        return <EcosystemMarketSection style={overrideContainerStyle} />;
    }
  }, [tabType]);
  const title = useMemo(() => {
    switch (tabType) {
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
    }
  }, [tabType]);
  const isShowTitle = useMemo(() => {
    if (tabType === TabsEnum.Space) {
      return false;
    }
    return true;
  }, [tabType]);
  // 计算导航宽度（基于导航风格）
  const firstMenuWidth = useMemo(() => {
    if (isMobile) {
      return NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1; // 移动端保持固定宽度
    }
    const width =
      navigationStyle === 'style2'
        ? NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE2
        : NAVIGATION_LAYOUT_SIZES.FIRST_MENU_WIDTH.STYLE1; // 风格2展开模式88px，风格1紧凑模式60px

    // 开发环境下添加日志
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'MenusLayout - 导航风格:',
        navigationStyle,
        '-> 宽度:',
        width,
      );
    }

    return width;
  }, [navigationStyle, isMobile]);

  const backgroundColor = useMemo(() => {
    if (isMobile) {
      return token.colorBgContainer;
    }
    return 'transparent';
  }, [isMobile]);
  const secondaryBackgroundColor = useMemo(() => {
    if (isMobile) {
      return token.colorBgContainer;
    }
    return navigationStyle === 'style2'
      ? 'var(--xagi-layout-bg-container, rgba(255, 255, 255, 0.95))'
      : 'transparent';
  }, [isMobile, navigationStyle]);

  // 导航容器样式类名（使用独立的布局风格类）
  const navigationClassName = useMemo(() => {
    return cx(
      styles.container,
      'flex',
      `xagi-layout-${layoutStyle}`, // 布局风格类（独立于Ant Design）
      `xagi-nav-${navigationStyle}`, // 导航风格类
    );
  }, [layoutStyle, navigationStyle]);
  return (
    <div className={navigationClassName}>
      {/*一级导航菜单栏*/}
      <div
        className={cx(
          styles['first-menus'],
          'flex',
          'flex-col',
          'items-center',
        )}
        style={{
          width: firstMenuWidth,
          backgroundColor,
        }}
      >
        <Header />
        {/*中间内容区域：主页、工作空间、广场等*/}
        <Tabs onClick={handleTabsClick} />
        {/*用户操作区域： 文档、历史会话、消息*/}
        <UserOperateArea onClick={handleUserClick} />
        {/*用户头像区域*/}
        <User />
      </div>
      {/*二级导航菜单栏*/}
      <div
        className={cx(styles['nav-menus'])}
        style={{
          width: isSecondMenuCollapsed
            ? 0
            : NAVIGATION_LAYOUT_SIZES.SECOND_MENU_WIDTH,
          paddingLeft: isSecondMenuCollapsed ? 0 : token.padding,
          opacity: isSecondMenuCollapsed ? 0 : 1,
          backgroundColor: secondaryBackgroundColor,
        }}
      >
        {!isSecondMenuCollapsed && (
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
              <ConditionRender condition={isShowTitle}>
                <div style={{ padding: '14px 12px 22px 12px' }}>
                  <Typography.Title
                    level={5}
                    style={{ marginBottom: 0 }}
                    className={cx(styles['menu-title'])}
                  >
                    {title}
                  </Typography.Title>
                </div>
              </ConditionRender>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Content />
              </div>
            </div>
          </HoverScrollbar>
        )}
      </div>
      {/* 收起/展开按钮 */}
      <CollapseButton />
    </div>
  );
};

export default MenusLayout;
