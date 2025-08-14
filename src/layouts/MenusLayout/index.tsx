import ConditionRender from '@/components/ConditionRender';
import HoverScrollbar from '@/components/base/HoverScrollbar';
import { DOCUMENT_URL, SITE_DOCUMENT_URL } from '@/constants/common.constants';
import useCategory from '@/hooks/useCategory';
import useConversation from '@/hooks/useConversation';
import SystemSection from '@/layouts/MenusLayout/SystemSection';
import { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
import { FIRST_MENU_WIDTH, SECOND_MENU_WIDTH } from '../layout.constants';
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
  // 创建智能体会话
  const { handleCreateConversation } = useConversation();
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  const handleCreateChat = async () => {
    if (tenantConfigInfo) {
      // 创建智能体会话
      await handleCreateConversation(tenantConfigInfo.defaultAgentId);
    }
  };
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
  return (
    <div className={cx(styles.container, 'flex')}>
      {/*一级导航菜单栏*/}
      <div
        className={cx(
          styles['first-menus'],
          'flex',
          'flex-col',
          'items-center',
        )}
        style={{
          width: FIRST_MENU_WIDTH,
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
      <HoverScrollbar
        className={cx(styles['nav-menus'])}
        bodyWidth={SECOND_MENU_WIDTH - 16 * 2}
        style={{
          width: SECOND_MENU_WIDTH,
          marginLeft: 16,
          padding: '12px 0',
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
            <div style={{ padding: '22px 12px' }}>
              <Typography.Title level={4} style={{ marginBottom: 0 }}>
                {title}
              </Typography.Title>
            </div>
          </ConditionRender>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Content />
          </div>
        </div>
      </HoverScrollbar>
    </div>
  );
};

export default MenusLayout;
