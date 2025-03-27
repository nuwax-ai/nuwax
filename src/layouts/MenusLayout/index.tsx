import { DOCUMENT_URL } from '@/constants/common.constants';
import { SPACE_ID } from '@/constants/home.constants';
import SystemSection from '@/layouts/MenusLayout/SystemSection';
import { apiPublishedCategoryList } from '@/services/square';
import { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type {
  SquareAgentInfo,
  SquareCategoryInfo,
} from '@/types/interfaces/square';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { history, useLocation, useModel, useRequest } from 'umi';
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
const MenusLayout: React.FC = () => {
  const location = useLocation();
  const { setOpenHistoryModal, setOpenMessage } = useModel('layout');
  const { currentSpaceInfo, runSpace } = useModel('spaceModel');
  const { setAgentInfoList, setPluginInfoList } = useModel('squareModel');
  const { runTenantConfig } = useModel('tenantConfigInfo');
  const [tabType, setTabType] = useState<TabsEnum>();

  // 广场分类列表信息
  const handleCategoryList = (result: SquareCategoryInfo[]) => {
    let _agentInfoList: SquareAgentInfo[] = [];
    let _pluginInfoList: SquareAgentInfo[] = [];
    result?.forEach((info) => {
      if (info.type === SquareAgentTypeEnum.Agent) {
        _agentInfoList = info?.children?.map((item) => {
          return {
            name: item.key,
            description: item.label,
          };
        }) as SquareAgentInfo[];
      }

      if (info.type === SquareAgentTypeEnum.Plugin) {
        _pluginInfoList = info.children?.map((item) => {
          return {
            name: item.key,
            description: item.label,
          };
        }) as SquareAgentInfo[];
      }
    });
    setAgentInfoList(_agentInfoList);
    setPluginInfoList(_pluginInfoList);
  };

  // 广场-智能体与插件分类
  const { run } = useRequest(apiPublishedCategoryList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: SquareCategoryInfo[]) => {
      handleCategoryList(result);
    },
  });

  // 切换tab
  const handleTabsClick = useCallback((type: TabsEnum) => {
    switch (type) {
      case TabsEnum.Home:
        history.push('/');
        break;
      case TabsEnum.Space:
        {
          const spaceId =
            localStorage.getItem(SPACE_ID) ?? currentSpaceInfo?.id;
          history.push(`/space/${spaceId}/develop`);
        }
        break;
      case TabsEnum.Square:
        history.push(`/square?cate_type=${SquareAgentTypeEnum.Agent}`);
        break;
      case TabsEnum.System_Manage:
        history.push('/system/user/manage');
        break;
      case TabsEnum.Course_System:
        window.open(DOCUMENT_URL);
        break;
    }
  }, []);

  useEffect(() => {
    // 查询空间列表
    runSpace();
    // 查询广场menus列表
    run();
    // 租户配置信息查询接口
    runTenantConfig();
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/space')) {
      setTabType(TabsEnum.Space);
    } else if (location.pathname.includes('/square')) {
      setTabType(TabsEnum.Square);
    } else if (location.pathname.includes('/system')) {
      setTabType(TabsEnum.System_Manage);
    } else {
      setTabType(TabsEnum.Home);
    }
  }, [location.pathname]);

  // 用户区域操作
  const handleUserClick = useCallback((type: UserOperatorAreaEnum) => {
    switch (type) {
      case UserOperatorAreaEnum.Document:
        window.open(DOCUMENT_URL);
        break;
      // 会话记录
      case UserOperatorAreaEnum.History_Conversation:
        setOpenHistoryModal(true);
        break;
      case UserOperatorAreaEnum.Message:
        setOpenMessage(true);
        break;
    }
  }, []);

  const Content: React.FC = useCallback(() => {
    switch (tabType) {
      case TabsEnum.Home:
        return <HomeSection />;
      case TabsEnum.Space:
        return <SpaceSection />;
      case TabsEnum.Square:
        return <SquareSection />;
      case TabsEnum.System_Manage:
        return <SystemSection />;
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
          'px-6',
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
      <div className={cx(styles['nav-menus'])}>
        <Content />
      </div>
    </div>
  );
};

export default MenusLayout;
