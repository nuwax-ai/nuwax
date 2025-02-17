import { SPACE_ID } from '@/constants/home.constants';
import { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
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
  const { setOpenHistoryModal, setOpenMessage } = useModel('layout');
  const location = useLocation();
  const [tabType, setTabType] = useState<TabsEnum>();
  const { runSpace } = useModel('spaceModel');
  // 切换tab
  const handleTabsClick = (type: TabsEnum) => {
    setTabType(type);
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
        history.push('/square');
        break;
    }
  };

  useEffect(() => {
    runSpace();
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/space')) {
      setTabType(TabsEnum.Space);
    } else if (location.pathname.includes('/square')) {
      setTabType(TabsEnum.Square);
    } else {
      setTabType(TabsEnum.Home);
    }
  }, []);

  // 用户区域操作
  const handleUserClick = (type: UserOperatorAreaEnum) => {
    console.log(type);
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
  };

  const Content: React.FC = () => {
    switch (tabType) {
      case TabsEnum.Home:
        return <HomeSection />;
      case TabsEnum.Space:
        return <SpaceSection />;
      case TabsEnum.Square:
        return <SquareSection />;
    }
  };

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
