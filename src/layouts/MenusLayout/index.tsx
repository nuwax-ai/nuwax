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
  const { runSpace } = useModel('spaceModel');
  const { setAgentInfoList, setPluginInfoList } = useModel('squareModel');
  const [tabType, setTabType] = useState<TabsEnum>();

  // 切换tab
  const handleTabsClick = useCallback((type: TabsEnum) => {
    // setTabType(type);
    switch (type) {
      case TabsEnum.Home:
        history.push('/');
        break;
      case TabsEnum.Space:
        {
          const spaceId = localStorage.getItem(SPACE_ID);
          history.push(`/space/${spaceId}/develop`);
        }
        break;
      case TabsEnum.Square:
        history.push(`/square?cate_type=${SquareAgentTypeEnum.Agent}`);
        break;
      case TabsEnum.System_Manage:
        history.push('/system/user/manage');
        break;
    }
  }, []);

  useEffect(() => {
    runSpace();
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

  // 广场分类列表信息
  const handleCategoryList = (result: SquareCategoryInfo[]) => {
    let _agentInfoList: SquareAgentInfo[] = [];
    let _pluginInfoList: SquareAgentInfo[] = [];
    result.forEach((info) => {
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

  useEffect(() => {
    // 查询广场menus列表
    run();
  }, []);

  // 用户区域操作
  const handleUserClick = useCallback((type: UserOperatorAreaEnum) => {
    switch (type) {
      case UserOperatorAreaEnum.Document:
        // todo 打开文档链接
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
        <Tabs onClick={handleTabsClick} />
        <UserOperateArea onClick={handleUserClick} />
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
