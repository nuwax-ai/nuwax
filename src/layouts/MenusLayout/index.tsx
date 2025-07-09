import { DOCUMENT_URL, SITE_DOCUMENT_URL } from '@/constants/common.constants';
import useCategory from '@/hooks/useCategory';
import SystemSection from '@/layouts/MenusLayout/SystemSection';
import { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
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
}> = ({ overrideContainerStyle }) => {
  const location = useLocation();
  const { setOpenMessage } = useModel('layout');
  const [tabType, setTabType] = useState<TabsEnum>();
  const { asyncSpaceListFun } = useModel('spaceModel');
  const { runTenantConfig } = useModel('tenantConfigInfo');
  const { runEdit, runDevCollect } = useModel('devCollectAgent');
  const { runHistory, runUsed } = useModel('conversationHistory');
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');
  const { runQueryCategory } = useCategory();

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
  const handleTabsClick = useCallback(async (type: TabsEnum) => {
    // 关闭移动端菜单
    handleCloseMobileMenu();

    switch (type) {
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
        history.push('/ecosystem/plugin');
        break;
      case TabsEnum.Course_System:
        window.open(DOCUMENT_URL);
        break;
    }
  }, []);

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

  return (
    <div className={cx(styles.container, 'flex')}>
      {/*一级导航菜单栏*/}
      <div
        className={cx(
          styles['first-menus'],
          'flex',
          'flex-col',
          'items-center',
          'py-16',
        )}
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
      <div className={cx(styles['nav-menus'], 'overflow-y')}>
        <Content />
      </div>
    </div>
  );
};

export default MenusLayout;
